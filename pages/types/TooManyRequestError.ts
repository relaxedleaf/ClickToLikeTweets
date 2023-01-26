import ErrorResponse from "./ErrorResponse";

interface TooManyRequestError extends ErrorResponse {
	reset: number
};

export default TooManyRequestError;