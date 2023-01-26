import { LikedTweet, LikedTweets } from '../../types/LikedTweet';
import { NextApiRequest, NextApiResponse } from 'next';
import Twitter, {
	TweetV2LikeResult,
	TweetV2LikedByResult,
} from 'twitter-api-v2';

import ErrorResponse from '../../types/ErrorResponse';

const twitterClient = new Twitter({
	appKey: process.env.CONSUMER_KEY!,
	appSecret: process.env.CONSUMER_SECRET!,
	accessToken: process.env.ACCESS_TOKEN!,
	accessSecret: process.env.ACCESS_TOKEN_SECRET!,
}).readWrite;

const LIKE_API_LIMIT = 50;
const MAX_RESULT_MIN = 10; //The `max_results` query parameter value has to be greater tor equal to 10

const like = async (
	req: NextApiRequest,
	res: NextApiResponse<LikedTweets | ErrorResponse>
) => {
	try {
		if (req.method !== 'POST') {
			res.status(400).json({ message: 'POST route' });
		}

		let { query, count, nextToken } = req.body;

		if (!query) {
			return res.status(400).json({ message: 'Search word is missing' });
		}

		count = +count;
		if (!count || Number.isNaN(count)) {
			return res
				.status(400)
				.json({ message: 'Incorrect format for count' });
		}

		const me = await twitterClient.currentUser();
		const tweetResults = await twitterClient.v2.search({
			query,
			sort_order: 'recency',
			next_token: nextToken,
			max_results: (() => {
				if(count <=  MAX_RESULT_MIN){
					return MAX_RESULT_MIN;
				}

				return count > LIKE_API_LIMIT ? LIKE_API_LIMIT : count;
			})(),
		});

		const data = {
			tweets: [],
			nextToken: undefined,
		} as LikedTweets;
		data.nextToken = tweetResults.meta.next_token;

		const tweets = tweetResults.tweets.slice(0, count);

		if (!tweets.length) {
			console.log('No tweet was returned');
			return res.json(data);
		}

		const promises = [] as Array<Promise<LikedTweet>>;

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
								likedByResult.meta.result_count += 1;
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
		const errMsg = 'Failed to like tweet';
		console.error(errMsg, err);
		res.status(500).json({ message: errMsg });
	}
};

export default like;
