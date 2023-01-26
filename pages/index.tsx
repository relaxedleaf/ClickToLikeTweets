import {
	Box,
	Button,
	Card,
	CardBody,
	Container,
	Flex,
	FormControl,
	Select,
	Stack,
	StackDivider,
	Text,
} from '@chakra-ui/react';
import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiOutlineHeart } from 'react-icons/ai';
import Head from 'next/head';
import { Icon } from '@chakra-ui/react';
import LikedTweet from './types/LikedTweet';
import Link from 'next/link';
import axios from 'axios';
import searchWords from '../constants/searchWords';
import styles from '../styles/Home.module.css';

const defaultSelectValue = searchWords[0];

const Home = () => {
	const [likedTweets, setLikedTweets] = useState<Array<LikedTweet>>([]);
	const btnRef = useRef<HTMLButtonElement>(null);
	const [query, setQuery] = useState(defaultSelectValue);

	const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = useCallback((evt) => {
		setQuery(evt.target.value)
	}, []);

	const handleLike = useCallback(async () => {
		const cloned = structuredClone(likedTweets);

		const res = await axios.post('/api/tweet/like', {
			query,
		});

		const tweet = res.data as LikedTweet;

		const found = cloned.find((_t) => {
			return _t.id === tweet.id;
		});

		if (!found) {
			setLikedTweets([...cloned, tweet]);
		}
	}, [likedTweets, query]);

	useEffect(() => {
		if (btnRef.current) {
			btnRef.current.scrollIntoView();
		}
	}, [likedTweets]);

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
				<Box padding='4'>
					<Flex
						direction='column'
						justifyContent='center'
						alignItems='center'
						gap={5}
					>
						{likedTweets.map((tweet) => {
							return (
								<Flex key={tweet.id}>
									<TweetCard tweet={tweet} />
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
								<Select defaultValue={defaultSelectValue} onChange={handleSelectChange}>
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
								Like
							</Button>
						</Flex>
					</Flex>
				</Box>
			</Container>
		</>
	);
};

const TweetCard = ({ tweet }: { tweet: LikedTweet }) => {
	return (
		<Card maxW='sm' minW={{ sm: '280px', md: 'sm' }}>
			<CardBody>
				<Stack divider={<StackDivider />} spacing='4'>
					<Box>
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
