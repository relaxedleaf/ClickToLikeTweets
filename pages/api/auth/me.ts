import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponseError, TwitterApi } from 'twitter-api-v2';
import { withIronSessionApiRoute } from 'iron-session/next';

export default withIronSessionApiRoute(
	async function me(req: NextApiRequest, res: NextApiResponse) {
		try {
			/* @ts-ignore */
			const client = new TwitterApi(req.session.accessToken);
			const me = (
				await client.v2.me({
					'user.fields': [
						'description',
						'id',
						'name',
						'profile_image_url',
						'url',
						'username',
					],
				})
			).data;

			me.profile_image_url = me.profile_image_url?.replace('_normal', '');

			return res.json(me);
		} catch (err) {
            console.log(err);
            if(err instanceof ApiResponseError){
                return res.status(err.code).json({msg: err.message});
            }

            return res.status(500).json({msg: 'Server error'});
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
