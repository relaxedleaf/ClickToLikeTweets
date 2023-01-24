import { TweetV2, TweetV2LikedByResult, TweetV2RetweetedByResult } from "twitter-api-v2";

type LikedTweet = TweetV2 & {
	liked_by: TweetV2LikedByResult;
	retweeted_by: TweetV2RetweetedByResult;
};

export default LikedTweet;