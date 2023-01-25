import '../styles/globals.css';

import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import localFont from '@next/font/local';

const ibmPlexSans = localFont({
	src: [
		{
			path: '../public/fonts/IBMPlexSans-Regular.ttf',
			style: 'normal',
			weight: '500',
		},
		{
			path: '../public/fonts/IBMPlexSans-SemiBold.ttf',
			style: 'normal',
			weight: '600',
		},
		{
			path: '../public/fonts/IBMPlexSans-Bold.ttf',
			style: 'normal',
			weight: '700',
		},
	],
});

const colors = {
	brand: {
		900: '#1a365d',
		800: '#153e75',
		700: '#2a69ac',
	},
};

const theme = extendTheme({ colors });

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ChakraProvider theme={theme}>
			<main className={ibmPlexSans.className}>
				<Component {...pageProps} />
			</main>
		</ChakraProvider>
	);
}
