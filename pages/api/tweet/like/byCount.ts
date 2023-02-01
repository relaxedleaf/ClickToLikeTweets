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
const MAX_RESULT_MIN = 10; //The `max_results` query parameter value has to be greater tor equal to 10

export default withIronSessionApiRoute(
	async function likeByCount(
		req: NextApiRequest,
		res: NextApiResponse<LikedTweets | ErrorResponse | TooManyRequestError>
	) {
		try {
			if (req.method !== 'POST') {
				res.status(400).json({ message: 'POST route' });
			}

			let { query, count, nextToken } = req.body;

			if (!query) {
				return res
					.status(400)
					.json({ message: 'Search word is missing' });
			}

			count = +count;
			if (!count || Number.isNaN(count) || count > LIKE_API_LIMIT) {
				return res
					.status(400)
					.json({ message: 'Incorrect format for count' });
			}

			/* @ts-ignore */
			const client = new TwitterApi(req.session.accessToken);
			const me = (await client.currentUserV2()).data;
			const max_results = (() => {
				if (count <= MAX_RESULT_MIN) {
					return MAX_RESULT_MIN;
				}

				return count;
			})();
			const tweetResults = await client.v2.search({
				query,
				sort_order: 'recency',
				next_token: nextToken,
				max_results,
			});

			const data = {
				tweets: [],
				nextToken: undefined,
				query,
				leftoverTweetIds: [],
			} as LikedTweets;
			data.nextToken = tweetResults.meta.next_token;

			const tweets = tweetResults.tweets.slice(0, count);

			if (!tweets.length) {
				console.log('No tweet was returned');
				return res.json(data);
			}

			if (tweetResults.tweets.length > count) {
				data.leftoverTweetIds = tweetResults.tweets
					.slice(count, tweetResults.tweets.length)
					.map((t) => t.id);
			}

			const promises = [] as Array<Promise<LikedTweet>>;

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
