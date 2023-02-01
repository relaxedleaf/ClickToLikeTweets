import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApi } from 'twitter-api-v2';

export default withIronSessionApiRoute(
	async function callback(req: NextApiRequest, res: NextApiResponse) {
		// Extract state and code from query string
		const { state, code } = req.query;
		// Get the saved codeVerifier from session
		//@ts-ignore
		const { codeVerifier, state: sessionState } = req.session;
		console.log({
			state,
			code,
			codeVerifier,
			sessionState,
		});

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
				const {
					client: loggedClient,
					accessToken,
					refreshToken,
					expiresIn,
				} = response;

				console.log({
					loggedClient,
					accessToken,
					refreshToken,
					expiresIn,
				})

				const user = await loggedClient.currentUserV2();
				console.log(user);

				return res.redirect('http://localhost:3000');
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
