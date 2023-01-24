import { useCallback, useMemo, useState } from 'react';

import Head from 'next/head';
import LikedTweet from './types/LikedTweet';
import axios from 'axios';
import searchWords from '../constants/searchWords';
import styles from '../styles/Home.module.css';

const TweetCard = ({ tweet }: { tweet: LikedTweet }) => {
	return (
		<div>
			<h6>{tweet.text}</h6>
			<p>Liked Count: {tweet.liked_by.meta.result_count}</p>
			<p>Retweeted Count: {tweet.retweeted_by.meta.result_count}</p>
		</div>
	);
};

const Home = () => {
	const [index, setIndex] = useState(0);
	const [likedTweets, setLikedTweets] = useState<Array<LikedTweet>>([]);

	const query = useMemo(() => {
		return searchWords[index];
	}, [index])

	const handleLick = useCallback(async () => {
		const cloned = structuredClone(likedTweets);

		const res = await axios.post('/api/tweet/like', {
			query,
		});

		const tweet = res.data as LikedTweet;

		const found = cloned.find(_t => {
			return _t.id === tweet.id;
		})

		if(!found){
			setLikedTweets([...cloned, tweet])
		}

		const nextIndex = index + 1;
		setIndex(nextIndex >= searchWords.length? 0 : nextIndex);
	}, [likedTweets, query]);

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
			<main className={styles.main}>
				<div>
					{
						likedTweets.map((tweet) => {
							return <TweetCard key={tweet.id} tweet={tweet} />
						})
					}
				</div>
				<button onClick={handleLick}>Like</button>
				<div>{query}</div>
			</main>
		</>
	);
};

export default Home;
