import {
	Box,
	Button,
	Card,
	CardBody,
	Container,
	Flex,
	Stack,
	StackDivider,
	Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiOutlineHeart } from 'react-icons/ai';
import Head from 'next/head';
import { Icon } from '@chakra-ui/react';
import LikedTweet from './types/LikedTweet';
import Link from 'next/link';
import axios from 'axios';
import searchWords from '../constants/searchWords';
import styles from '../styles/Home.module.css';

const TweetCard = ({ tweet }: { tweet: LikedTweet }) => {
	return (
		<Card maxW='sm' minW='280px'>
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

const Home = () => {
	const [index, setIndex] = useState(0);
	const [likedTweets, setLikedTweets] = useState<Array<LikedTweet>>([]);
	const btnRef = useRef<HTMLButtonElement>(null);

	const query = useMemo(() => {
		return searchWords[index];
	}, [index]);

	const handleLick = useCallback(async () => {
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

		const nextIndex = index + 1;
		setIndex(nextIndex >= searchWords.length ? 0 : nextIndex);
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
							<Text>{query}</Text>
						</Flex>
						<Flex mt={2}>
							<Button
								onClick={handleLick}
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

export default Home;
