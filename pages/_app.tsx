import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import store from '../store';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import '../styles/globals.css';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
	return (
		<Provider store={store}>
			<ChakraProvider>
				<Layout>
					<Navbar />
					<main>
						<Component {...pageProps} />
					</main>
				</Layout>
			</ChakraProvider>
		</Provider>
	);
}
