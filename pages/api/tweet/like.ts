import { NextApiRequest, NextApiResponse } from 'next';
import Twitter, {
	TweetV2LikeResult,
	TweetV2LikedByResult,
} from 'twitter-api-v2';

import ErrorResponse from '../../types/ErrorResponse';
import LikedTweet from '../../types/LikedTweet';

const twitterClient = new Twitter({
	appKey: process.env.CONSUMER_KEY!,
	appSecret: process.env.CONSUMER_SECRET!,
	accessToken: process.env.ACCESS_TOKEN!,
	accessSecret: process.env.ACCESS_TOKEN_SECRET!,
}).readWrite;

const like = async (
	req: NextApiRequest,
	res: NextApiResponse<LikedTweet | ErrorResponse>
) => {
	try {
		if (req.method !== 'POST') {
			res.status(400).json({ message: 'POST route' });
		}

		const { query } = req.body;

		if (!query) {
			return res.status(400).json({ message: 'Search work is missing' });
		}

		const me = await twitterClient.currentUser();
		const tweetResults = await twitterClient.v2.search({
			query,
			sort_order: 'recency',
		});

		console.log({tweetData: tweetResults.data})
		console.log({tweetDataData: tweetResults.data.data})
		console.log({tweetDataMeta: tweetResults.data.meta})
		console.log({tweetResults: tweetResults.meta});

		const tweets = tweetResults.tweets;

		if (!tweets.length) {
			console.log('No tweet was returned');
		}

		const tweet = tweets[0];

		const promises = [
			twitterClient.v2.like(me.id_str, tweet.id),
			twitterClient.v2.tweetLikedBy(tweet.id),
			twitterClient.v2.tweetRetweetedBy(tweet.id),
		] as [
			Promise<TweetV2LikeResult>,
			Promise<TweetV2LikedByResult>,
			Promise<TweetV2LikedByResult>
		];

		const [likeResult, likedByResult, retweetedByResult] =
			await Promise.all(promises);

		const {
			data: { liked },
		} = likeResult;

		if (liked) {
			if (likedByResult.data) {
				const found = likedByResult.data.find((user) => {
					return user.id === me.id_str;
				});

				if (!found) {
					likedByResult.data.push({
						id: me.id_str,
						name: me.name,
						username: me.screen_name,
					});
                    likedByResult.meta.result_count += 1;
				}
			} else {
				likedByResult.data = [
					{
						id: me.id_str,
						name: me.name,
						username: me.screen_name,
					},
				];
                likedByResult.meta.result_count += 1;
			}

			return res.json({
				...tweet,
				liked_by: likedByResult,
				retweeted_by: retweetedByResult,
			});
		}
		res.status(500).json({ message: 'Failed to like tweet' });
	} catch (err) {
		const errMsg = 'Failed to like tweet';
		console.error(errMsg, err);
		res.status(500).json({ message: errMsg });
	}
};

export default like;
