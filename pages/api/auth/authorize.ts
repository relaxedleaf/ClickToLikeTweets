import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApi } from 'twitter-api-v2';

export default withIronSessionApiRoute(
	async function authorize(req: NextApiRequest, res: NextApiResponse) {
		const client = new TwitterApi({
			clientId: process.env.CLIENT_ID!,
			clientSecret: process.env.CLIENT_ID!,
		});

		// Don't forget to specify 'offline.access' in scope list if you want to refresh your token later
		const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
			process.env.CALLBACK_URL!,
			{
				scope: [
					'tweet.read',
					'users.read',
					'like.read',
					'like.write'
				],
			}
		);

		//@ts-ignore
		req.session.codeVerifier = codeVerifier;
		//@ts-ignore
		req.session.state = state;

		await req.session.save();

		res.redirect(url);
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
