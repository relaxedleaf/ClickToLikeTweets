import Twitter, { TwitterApi } from 'twitter-api-v2';

const twitterClient = new Twitter({
	appKey: process.env.CONSUMER_KEY!,
	appSecret: process.env.CONSUMER_SECRET!,
	accessToken: process.env.ACCESS_TOKEN!,
	accessSecret: process.env.ACCESS_TOKEN_SECRET!,
}).readWrite;

const twitterApiClient = new TwitterApi({
	clientId: process.env.CLIENT_ID!,
	clientSecret: process.env.CLIENT_SECRET!,
});



export { twitterClient, twitterApiClient };
