import ErrorResponse from '../../../../types/ErrorResponse';
import TooManyRequestError from '../../../../types/TooManyRequestError';
import { LikedTweet, LikedTweets } from '../../../../types/LikedTweet';
import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import {
	ApiResponseError,
	TweetV2LikeResult,
	TweetV2LikedByResult,
	TwitterApi,
} from 'twitter-api-v2';

const LIKE_API_LIMIT = 50;

export default withIronSessionApiRoute(
	async function likeByCount(
		req: NextApiRequest,
		res: NextApiResponse<LikedTweets | ErrorResponse | TooManyRequestError>
	) {
		try {
			if (req.method !== 'POST') {
				res.status(400).json({ message: 'POST route' });
			}

			let { query, tweetIds } = req.body;

			if (!query) {
				return res
					.status(400)
					.json({ message: 'Search word is missing' });
			}

			if (!Array.isArray(tweetIds) || tweetIds.length <= 0) {
				return res
					.status(400)
					.json({ message: 'Tweet IDs are formatted incorrectly' });
			}

			if (tweetIds.length > LIKE_API_LIMIT) {
				return res
					.status(400)
					.json({ message: 'Tweet IDs exceeded limit' });
			}

			/* @ts-ignore */
			const client = new TwitterApi(req.session.accessToken);
			const me = (await client.currentUserV2()).data;

			const data = {
				tweets: [],
				nextToken: undefined,
				query,
				leftoverTweetIds: [],
			} as LikedTweets;

			const promises = [] as Array<Promise<LikedTweet>>;

			const tweets = (await client.v2.tweets(tweetIds)).data;

			for (let tweet of tweets) {
				const subPromises = [
					client.v2.like(me.id, tweet.id),
					client.v2.tweetLikedBy(tweet.id),
					client.v2.tweetRetweetedBy(tweet.id),
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
											return user.id === me.id;
										}
									);
									if (!found) {
										likedByResult.data.push({
											id: me.id,
											name: me.name,
											username: me.username,
										});
										likedByResult.meta.result_count += 1;
									}
								} else {
									likedByResult.data = [
										{
											id: me.id,
											name: me.name,
											username: me.username,
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
	},
	{
		cookieName: 'auth',
		password: process.env.PASSWORD!,
		// secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
		cookieOptions: {
			secure: process.env.NODE_ENV === 'production',
		},
	}
);
