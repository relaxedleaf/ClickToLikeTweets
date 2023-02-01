import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApi } from 'twitter-api-v2';

const callback = async (
	req: NextApiRequest,
	res: NextApiResponse
) => {
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
		.then(
			async ({
				client: loggedClient,
				accessToken,
				refreshToken,
				expiresIn,
			}) => {
				// {loggedClient} is an authenticated client in behalf of some user
				// Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
				// If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)

				// Example request
				const { data: userObject } = await loggedClient.v2.me();
                console.log(userObject);
			}
		)
		.catch(() =>
			res.status(403).send('Invalid verifier or access tokens!')
		);
};


export default callback;