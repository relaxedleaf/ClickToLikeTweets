import Head from 'next/head';
import { useRouter } from 'next/router';

const Anything = () => {
	const router = useRouter();

	return (
		<>
			<Head>
				<title>{router.query.id}</title>
			</Head>
			<div>Page {router.query.id}</div>
		</>
	);
};

export default Anything;
