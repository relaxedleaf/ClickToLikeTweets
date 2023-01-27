import '../styles/globals.css';

import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import store from '../store';

export default function App({ Component, pageProps }: AppProps) {
	return (
		<Provider store={store}>
			<ChakraProvider>
				<main>
					<Component {...pageProps} />
				</main>
			</ChakraProvider>
		</Provider>
	);
}
