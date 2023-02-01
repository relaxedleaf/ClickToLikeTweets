import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApi } from 'twitter-api-v2';

const link = async (req: NextApiRequest, res: NextApiResponse) => {
	const client = new TwitterApi({
		clientId: process.env.CLIENT_ID!,
		clientSecret: process.env.CLIENT_ID!,
	});

	// Don't forget to specify 'offline.access' in scope list if you want to refresh your token later
	const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
		process.env.CALLBACK_URL!,
		{ scope: ['like.write'] }
	);


    return res.json({
        url
    })
};

export default link;
