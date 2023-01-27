import { LikedTweets } from '../types/LikedTweet';
import axios from 'axios';

export const like = async ({
	query,
	count,
	nextToken,
}: {
	query: string;
	count: number;
	nextToken: string | undefined;
}) => {
	const res = await axios.post('/api/tweet/like', {
		query,
		count,
		nextToken,
	});

	return res.data as LikedTweets;
};
