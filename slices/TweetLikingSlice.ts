import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '../store';

export interface TweetLikingState {
	nextToken: string | undefined;
	nextReset: number | undefined;
}

const initialState: TweetLikingState = {
	nextToken: undefined,
	nextReset: undefined,
};

export const tweetLikingSlice = createSlice({
	name: 'tweetLiking',
	initialState,
	reducers: {
		setNextToken: (state, action: PayloadAction<string | undefined>) => {
			state.nextToken = action.payload;
		},
		setNextReset: (state, action: PayloadAction<number | undefined>) => {
			state.nextReset = action.payload;
		},
	},
});

export const { setNextToken, setNextReset } = tweetLikingSlice.actions;


export const selectNextToken = (state: AppState) => state.tweetLiking.nextToken;
export const selectNextReset = (state: AppState) => state.tweetLiking.nextReset;

export default tweetLikingSlice.reducer;
