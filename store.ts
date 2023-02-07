import authReducer from './slices/Auth/AuthSlice';
import tweetLikingReducer from './slices/TweetLikingSlice';
import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';


export function makeStore() {
	return configureStore({
		reducer: { tweetLiking: tweetLikingReducer, auth: authReducer },
	});
}

const store = makeStore();

export type AppState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	AppState,
	unknown,
	Action<string>
>;


export default store;
