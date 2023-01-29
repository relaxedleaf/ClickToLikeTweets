import { AppState, useAppSelector } from '../store';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type QueryStatesKey = {
	nextToken?: string | undefined;
	leftoverTweetIds: Array<string>;
};

type QueryStates = Record<string, QueryStatesKey>;
export interface TweetLikingState {
	nextReset: number | undefined;
	queryStates: QueryStates;
}

const initialState: TweetLikingState = {
	nextReset: undefined,
	queryStates: {} as QueryStates,
};

export const tweetLikingSlice = createSlice({
	name: 'tweetLiking',
	initialState,
	reducers: {
		updateQueryState: (
			state,
			action: PayloadAction<{
				query: string;
				nextToken?: string | undefined;
				leftoverTweetIds: Array<string>;
			}>
		) => {
			const { query, nextToken, leftoverTweetIds } = action.payload;
			state.queryStates[query] = {
				nextToken,
				leftoverTweetIds,
			};
		},
		updateLeftoverTweetIdsByCount: (
			state,
			action: PayloadAction<{
				count: number;
				query: string;
			}>
		) => {
			const { count, query } = action.payload;
			const sliced = state.queryStates[query].leftoverTweetIds.slice(
				count,
				state.queryStates[query].leftoverTweetIds.length
			);

			state.queryStates[query].leftoverTweetIds = sliced;
		},

		updateNextReset: (state, action: PayloadAction<number | undefined>) => {
			state.nextReset = action.payload;
		},
	},
});

export const { updateQueryState, updateLeftoverTweetIdsByCount, updateNextReset } =
	tweetLikingSlice.actions;

export const useQueryState = (query: string) => {
	return useAppSelector(
		(state: AppState) => state.tweetLiking.queryStates[query]
	);
};

export const useNextReset = () => {
	return useAppSelector((state: AppState) => state.tweetLiking.nextReset);
};

export default tweetLikingSlice.reducer;
