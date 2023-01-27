import {
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Container,
	Divider,
	Flex,
	FormControl,
	Select,
	Stack,
	StackDivider,
	Tag,
	Text,
} from '@chakra-ui/react';
import {
	ChangeEventHandler,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { AiOutlineHeart } from 'react-icons/ai';
import { AxiosError } from 'axios';
import Head from 'next/head';
import { Icon } from '@chakra-ui/react';
import { LikedTweet } from './types/LikedTweet';
import Link from 'next/link';
import { like } from '../lib/apis';
import searchWords from '../constants/searchWords';
import useDebounce from '../hooks/useDebounce';
import useMountedEffect from '../hooks/useMountedEffect';
import useToast from '../hooks/useToast';

const defaultSelectValue = searchWords[0];

const Home = () => {
	const [likedTweets, setLikedTweets] = useState<Array<LikedTweet>>([]);
	const btnRef = useRef<HTMLButtonElement>(null);
	const [query, setQuery] = useState(defaultSelectValue);
	const prevQuery = useRef(query);
	const [likeCount, setLikeCount] = useState(0);
	const prevLikeCount = useRef(likeCount);
	const debouncedLikeCount = useDebounce({
		value: likeCount,
		delay: 1000,
	});
	const [nextToken, setNextToken] = useState<string | undefined>();
	const [reset, setNextReset] = useState<number | undefined>();
	const prevNextToken = useRef(nextToken);
	const toast = useToast();

	const handleSelectChange: ChangeEventHandler<HTMLSelectElement> =
		useCallback((evt) => {
			setQuery(evt.target.value);
		}, []);

	const handleLike = useCallback(() => {
		setLikeCount(likeCount + 1);
	}, [likeCount]);

	useEffect(() => {
		if (btnRef.current) {
			btnRef.current.scrollIntoView();
		}
	}, [likedTweets]);

	useMountedEffect(() => {
		if (
			query !== prevQuery.current ||
			nextToken !== prevNextToken.current
		) {
			prevQuery.current = query;
			prevNextToken.current = nextToken;
			return;
		}

		const count = debouncedLikeCount - prevLikeCount.current;
		if (count <= 0) {
			return;
		}

		const cloned = structuredClone(likedTweets);

		let mounted = true;

		//Make API Call
		like({
			query,
			count,
			nextToken,
		})
			.then((tweetsResponse) => {
				if (mounted) {
					setNextToken(tweetsResponse.nextToken);

					//TODO: Maybe need to deal with duplicates idk
					setLikedTweets([...cloned, ...tweetsResponse.tweets]);
				}
			})
			.catch((err: AxiosError) => {
				const data = err.response?.data as any;
				toast({
					status: 'error',
					title: 'Error',
					description: data.message || err.message,
				});
				if (data.reset) {
					setNextReset(data.reset);
				}
				console.log(err);
			});

		//Save prev like count
		prevLikeCount.current = debouncedLikeCount;

		return () => {
			mounted = false;
		};
	}, [debouncedLikeCount, query, nextToken]);

	return (
		<>
			<Head>
				<title>Like Tweets</title>
				<meta
					name='description'
					content='A website that allows you like random tweets'
				/>
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>
				<link rel='icon' href='/favicon.ico' />
			</Head>

			<Container>
				<Flex position={"fixed"} left={0} zIndex={1}>
					<Container mt={5}>
						<Box>
							<Tag colorScheme='telegram'>
								Reset: 1/26/2023 7:00 PM
							</Tag>
						</Box>
					</Container>
				</Flex>
				<Box padding='4'>
					<Flex
						direction='column'
						justifyContent='center'
						alignItems='center'
						gap={5}
					>
						{likedTweets.map((tweet, idx) => {
							return (
								<Flex key={tweet.id}>
									<TweetCard tweet={tweet} index={idx + 1} />
								</Flex>
							);
						})}
					</Flex>
					<Flex
						direction='column'
						justifyContent='center'
						alignItems='center'
						pt={5}
					>
						<Flex>
							<FormControl>
								<Select
									defaultValue={defaultSelectValue}
									onChange={handleSelectChange}
								>
									{searchWords.map((word, idx) => {
										return (
											<option key={idx}>{word}</option>
										);
									})}
								</Select>
							</FormControl>
						</Flex>
						<Flex mt={2}>
							<Button
								onClick={handleLike}
								variant='solid'
								leftIcon={<Icon as={AiOutlineHeart} />}
								ref={btnRef}
							>
								Like +{likeCount - prevLikeCount.current}
							</Button>
						</Flex>
					</Flex>
				</Box>
			</Container>
		</>
	);
};

const TweetCard = ({ tweet, index }: { tweet: LikedTweet; index: number }) => {
	return (
		<Card width={['250px', '280px', '350px', '400px']}>
			<CardBody>
				<Stack divider={<StackDivider />} spacing='4'>
					<Box>
						<Flex justifyContent='end'>
							<Box>#{index}</Box>
						</Flex>
						<Link
							href={`https://twitter.com/relaxed_leaf/status/${tweet.id}`}
							target='_blank'
						>
							<Text fontSize='md'>{tweet.text}</Text>
						</Link>
					</Box>
					<Box>
						<Text fontSize='sm'>
							Liked: {tweet.liked_by.meta.result_count}
						</Text>
						<Text pt='2' fontSize='sm'>
							Retweeted: {tweet.retweeted_by.meta.result_count}
						</Text>
					</Box>
				</Stack>
			</CardBody>
		</Card>
	);
};

export default Home;
