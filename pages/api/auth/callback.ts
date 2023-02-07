import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApi } from 'twitter-api-v2';
import { withIronSessionApiRoute } from 'iron-session/next';

export default withIronSessionApiRoute(
	async function callback(req: NextApiRequest, res: NextApiResponse) {
		// Extract state and code from query string
		const { state, code } = req.query;
		// Get the saved codeVerifier from session
		//@ts-ignore
		const { codeVerifier, state: sessionState } = req.session;

		if (!codeVerifier || !state || !sessionState || !code) {
			return res
				.status(400)
				.send('You denied the app or your session expired!');
		}
		if (state !== sessionState) {
			return res.status(400).send('Stored tokens didnt match!');
		}

		// Obtain access token
		const client = new TwitterApi({
			clientId: process.env.CLIENT_ID!,
			clientSecret: process.env.CLIENT_SECRET!,
		});

		client
			.loginWithOAuth2({
				//@ts-ignore
				code,
				codeVerifier,
				redirectUri: process.env.CALLBACK_URL!,
			})
			.then(async (response) => {
				const { accessToken, refreshToken, expiresIn } = response;

				/* @ts-ignore */
				req.session.accessToken = accessToken;
				/* @ts-ignore */
				req.session.refreshToken = refreshToken;
				/* @ts-ignore */
				req.session.expiresIn = expiresIn;
				await req.session.save();

				return res.redirect(process.env.DOMAIN!);
			})
			.catch((err) => {
				console.log(err);
				return res
					.status(400)
					.send('Invalid verifier or access tokens!');
			});
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
