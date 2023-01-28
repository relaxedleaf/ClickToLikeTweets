import  {
	ApiResponseError,
	TweetV2LikeResult,
	TweetV2LikedByResult,
} from 'twitter-api-v2';
import { LikedTweet, LikedTweets } from '../../../../types/LikedTweet';
import { NextApiRequest, NextApiResponse } from 'next';

import ErrorResponse from '../../../../types/ErrorResponse';
import TooManyRequestError from '../../../../types/TooManyRequestError';
import twitterClient from '../../../../lib/backend/twitterClient';

const LIKE_API_LIMIT = 50;

const likeByCount = async (
	req: NextApiRequest,
	res: NextApiResponse<LikedTweets | ErrorResponse | TooManyRequestError>
) => {
	try {
		if (req.method !== 'POST') {
			res.status(400).json({ message: 'POST route' });
		}

		let { query, tweetIds } = req.body;

		if (!query) {
			return res.status(400).json({ message: 'Search word is missing' });
		}

        if (!Array.isArray(tweetIds) || tweetIds.length <= 0) {
			return res.status(400).json({ message: 'Tweet IDs are formatted incorrectly' });
		}

		if (tweetIds.length > LIKE_API_LIMIT) {
			return res
				.status(400)
				.json({ message: 'Tweet IDs exceeded limit' });
		}

		const me = await twitterClient.currentUser();

		const data = {
			tweets: [],
			nextToken: undefined,
			query,
			leftoverTweetIds: [],
		} as LikedTweets;

		const promises = [] as Array<Promise<LikedTweet>>;

        const tweets = (await twitterClient.v2.tweets(tweetIds)).data;

		for (let tweet of tweets) {
			const subPromises = [
				twitterClient.v2.like(me.id_str, tweet.id),
				twitterClient.v2.tweetLikedBy(tweet.id),
				twitterClient.v2.tweetRetweetedBy(tweet.id),
			] as [
				Promise<TweetV2LikeResult>,
				Promise<TweetV2LikedByResult>,
				Promise<TweetV2LikedByResult>
			];

			promises.push(
				Promise.all(subPromises).then(
					([likeResult, likedByResult, retweetedByResult]) => {
						const {
							data: { liked },
						} = likeResult;

						if (liked) {
							if (likedByResult.data) {
								const found = likedByResult.data.find(
									(user) => {
										return user.id === me.id_str;
									}
								);
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
								likedByResult.meta = {
									result_count: 1,
								};
							}

							return {
								...tweet,
								liked_by: likedByResult,
								retweeted_by: retweetedByResult,
							};
						}
						throw new Error('Failed to like tweet');
					}
				)
			);
		}

		const results = await Promise.all(promises);
		data.tweets = results;

		return res.json(data);
	} catch (err) {
		let errMsg = 'Failed to like tweet';

		if (
			err instanceof ApiResponseError &&
			err.code === 429 &&
			err.data.detail === 'Too Many Requests'
		) {
			console.error(err);
			return res.status(500).json({
				message: err.data.detail,
				reset: err.rateLimit?.reset,
			});
		}
		console.error(errMsg, err);
		res.status(500).json({ message: errMsg });
	}
};

export default likeByCount;
