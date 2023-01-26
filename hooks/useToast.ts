import { UseToastOptions, useToast as useChakraToast } from '@chakra-ui/react';

const useToast = () => {
	const toast = useChakraToast({
		position: 'top-right',
		duration: 5000,
		isClosable: true,
	});

	return toast;
};

export default useToast;
