import { getMe } from '../lib/frontend/apis';
import { ReactNode, useCallback, useEffect } from 'react';
import { updateUser } from '../slices/Auth/AuthSlice';
import useAppDispatch from '../hooks/useAppDispatch';


const Layout = ({ children }: { children: ReactNode }) => {
	const dispatch = useAppDispatch();

	const autoLogin = useCallback(async () => {
		try {
			const me = await getMe();
			dispatch(updateUser(me));
		} catch (err) {
			console.log(err);
			dispatch(updateUser(undefined));
		}
	}, [dispatch]);

	useEffect(() => {
		autoLogin();
	}, []);

	return <>{children}</>;
};

export default Layout;
