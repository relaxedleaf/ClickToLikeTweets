import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';

export default withIronSessionApiRoute(
	async function logout(req: NextApiRequest, res: NextApiResponse) {
		if (req.method !== 'DELETE') {
			res.status(400).json({ message: 'DELETE route' });
		}

		req.session.destroy();

		res.json({
			msg: 'success',
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
