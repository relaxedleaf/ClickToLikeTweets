import { LikedTweets } from '../../types/LikedTweet';
import axios from 'axios';
import User from '../../types/User';

export const likeByCount = async ({
	query,
	count,
	nextToken,
}: {
	query: string;
	count: number;
	nextToken: string | undefined;
}) => {
	const res = await axios.post('/api/tweet/like/byCount', {
		query,
		count,
		nextToken,
	});

	return res.data as LikedTweets;
};

export const likeByTweetIds = async ({
	query,
	tweetIds,
}: {
	query: string;
	tweetIds: Array<string>;
}) => {
	const res = await axios.post('/api/tweet/like/byTweetIds', {
		query,
		tweetIds,
	});

	return res.data as LikedTweets;
};

export const getMe = async () => {
	const res = await axios.get('/api/auth/me');

	return res.data as User;
};

export const logout = async () => {
	const res = await axios.delete('/api/auth/logout');

	return res.data;
};
