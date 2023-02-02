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
	FormLabel,
	Input,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Select,
	Stack,
	StackDivider,
	Switch,
	Tag,
	Text,
} from '@chakra-ui/react';
import {
	ChangeEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { likeByCount, likeByTweetIds } from '../lib/frontend/apis';
import {
	updateNextReset,
	updateQueryState,
	useNextReset,
	useQueryState,
} from '../slices/TweetLikingSlice';

import { AiOutlineHeart } from 'react-icons/ai';
import { AxiosError } from 'axios';
import Head from 'next/head';
import { Icon } from '@chakra-ui/react';
import { LikedTweet } from '../types/LikedTweet';
import Link from 'next/link';
import { format } from 'date-fns';
import searchWords from '../constants/searchWords';
import useDebounce from '../hooks/useDebounce';
import useMountedEffect from '../hooks/useMountedEffect';
import useToast from '../hooks/useToast';
import useAppDispatch from '../hooks/useAppDispatch';

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

	const toast = useToast();
	const [clickMode, setClickMode] = useState<boolean>(true);
	const [bulkLikeCount, setBulkLikeCount] = useState(10);

	//Redux
	const reset = useNextReset();
	const queryState = useQueryState(query);
	const dispatch = useAppDispatch();

	const handleLikeModeToggle = useCallback(() => {
		setClickMode(!clickMode);
	}, [clickMode]);

	const handleSelectChange: ChangeEventHandler<HTMLSelectElement> =
		useCallback((evt) => {
			setQuery(evt.target.value);
		}, []);

	useEffect(() => {
		if (btnRef.current) {
			btnRef.current.scrollIntoView();
		}
	}, [likedTweets]);

	const handleLikeApiCallByCount = useCallback(
		({ count }: { count: number }) => {
			return likeByCount({
				query,
				count,
				nextToken: queryState?.nextToken,
			}).catch((err: AxiosError) => {
				const data = err.response?.data as any;
				toast({
					status: 'error',
					title: 'Error',
					description: data.message || err.message,
				});
				if (data.reset) {
					dispatch(updateNextReset(data.reset));
				}
				console.log(err);
			});
		},
		[likedTweets, query, queryState, dispatch, updateNextReset]
	);

	const handleLikeApiCallByTweetIds = useCallback(
		async ({ tweetIdsToLike }: { tweetIdsToLike: Array<string> }) => {
			return likeByTweetIds({
				query,
				tweetIds: tweetIdsToLike,
			}).catch((err: AxiosError) => {
				const data = err.response?.data as any;
				toast({
					status: 'error',
					title: 'Error',
					description: data.message || err.message,
				});
				if (data.reset) {
					dispatch(updateNextReset(data.reset));
				}
				console.log(err);
			});
		},
		[query, dispatch, updateNextReset]
	);

	const masterFunction = useCallback(
		async (count: number) => {
			if (!queryState?.leftoverTweetIds?.length) {
				const tweetsResponse = await handleLikeApiCallByCount({
					count,
				});
				if (tweetsResponse) {
					dispatch(
						updateQueryState({
							query,
							nextToken: tweetsResponse.nextToken,
							leftoverTweetIds: tweetsResponse.leftoverTweetIds,
						})
					);
					setLikedTweets([...likedTweets, ...tweetsResponse.tweets]);
				}
				return;
			}

			if (queryState?.leftoverTweetIds.length >= count) {
				const tweetsResponse = await handleLikeApiCallByTweetIds({
					tweetIdsToLike: queryState.leftoverTweetIds.slice(0, count),
				});
				if (tweetsResponse) {
					dispatch(
						updateQueryState({
							query: tweetsResponse.query,
							nextToken: queryState?.nextToken,
							leftoverTweetIds:
								queryState.leftoverTweetIds.filter((id) => {
									return !tweetsResponse.tweets.find((t) => {
										return t.id === id;
									});
								}),
						})
					);

					setLikedTweets([...likedTweets, ...tweetsResponse.tweets]);
				}
				return;
			}
			// Specify
			const byTweetIdResponse = await handleLikeApiCallByTweetIds({
				tweetIdsToLike: queryState.leftoverTweetIds.slice(),
			});
			const byTweetCountResponse = await handleLikeApiCallByCount({
				count: count - queryState.leftoverTweetIds.length,
			});

			if (byTweetIdResponse && byTweetCountResponse) {
				dispatch(
					updateQueryState({
						query,
						nextToken: byTweetCountResponse.nextToken,
						leftoverTweetIds: byTweetCountResponse.leftoverTweetIds,
					})
				);
				setLikedTweets([
					...likedTweets,
					...byTweetIdResponse.tweets,
					...byTweetCountResponse.tweets,
				]);
			} else if (byTweetIdResponse) {
				dispatch(
					updateQueryState({
						query: byTweetIdResponse.query,
						nextToken: queryState?.nextToken,
						leftoverTweetIds: queryState.leftoverTweetIds.filter(
							(id) => {
								return !byTweetIdResponse.tweets.find((t) => {
									return t.id === id;
								});
							}
						),
					})
				);

				setLikedTweets([...likedTweets, ...byTweetIdResponse.tweets]);
			} else if (byTweetCountResponse) {
				dispatch(
					updateQueryState({
						query: byTweetCountResponse.query,
						nextToken: queryState?.nextToken,
						leftoverTweetIds: queryState.leftoverTweetIds.filter(
							(id) => {
								return !byTweetCountResponse.tweets.find(
									(t) => {
										return t.id === id;
									}
								);
							}
						),
					})
				);

				setLikedTweets([
					...likedTweets,
					...byTweetCountResponse.tweets,
				]);
			}
		},
		[
			queryState,
			query,
			handleLikeApiCallByCount,
			handleLikeApiCallByTweetIds,
			dispatch,
			updateQueryState,
		]
	);

	const handleLikeBtnClick = useCallback(() => {
		if (clickMode) {
			setLikeCount(likeCount + 1);
		} else {
			masterFunction(bulkLikeCount);
		}
	}, [likeCount, bulkLikeCount, clickMode, masterFunction, setLikeCount]);

	useMountedEffect(() => {
		if (query !== prevQuery.current) {
			prevQuery.current = query;
			return;
		}
		const count = debouncedLikeCount - prevLikeCount.current;
		if (count <= 0) {
			return;
		}

		masterFunction(count);

		//Save prev like count
		prevLikeCount.current = debouncedLikeCount;
	}, [debouncedLikeCount, query, masterFunction]);

	const formattedDate = useMemo(() => {
		if (reset) {
			return format(new Date(reset * 1000), 'M/d/yyyy hh:mm a');
		}
	}, [reset]);

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
				{formattedDate && (
					<Box position={'fixed'} left={0} zIndex={1}>
						<Container mt={5}>
							<Box>
								<Tag colorScheme='telegram'>
									Reset: {formattedDate}
								</Tag>
							</Box>
						</Container>
					</Box>
				)}
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
								<Flex gap={3}>
									<Flex>
										<Select
											defaultValue={defaultSelectValue}
											onChange={handleSelectChange}
										>
											{searchWords.map((word, idx) => {
												return (
													<option key={idx}>
														{word}
													</option>
												);
											})}
										</Select>
									</Flex>

									{!clickMode && (
										<Flex gap={1}>
											<Flex alignSelf='flex-end'>x</Flex>
											<Flex>
												<NumberInput
													defaultValue={bulkLikeCount}
													value={bulkLikeCount}
													min={1}
													max={50}
													width='80px'
													onChange={(
														valString,
														valNumber
													) => {
														setBulkLikeCount(
															valNumber
														);
													}}
												>
													<NumberInputField />
													<NumberInputStepper>
														<NumberIncrementStepper />
														<NumberDecrementStepper />
													</NumberInputStepper>
												</NumberInput>
											</Flex>
										</Flex>
									)}
								</Flex>
							</FormControl>
						</Flex>
						<Flex mt={2}>
							<Button
								onClick={handleLikeBtnClick}
								variant='solid'
								leftIcon={<Icon as={AiOutlineHeart} />}
								ref={btnRef}
							>
								Like{' '}
								{clickMode && (
									<>+{likeCount - prevLikeCount.current}</>
								)}
							</Button>
						</Flex>
					</Flex>
				</Box>
				<Box position={'fixed'} bottom={0} right={0} zIndex={1}>
					<Container mb={5}>
						<FormControl display='flex' alignItems='center'>
							<Switch
								checked={clickMode}
								onChange={handleLikeModeToggle}
							/>
						</FormControl>
					</Container>
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
