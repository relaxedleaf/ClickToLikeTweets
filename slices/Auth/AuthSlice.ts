import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import useAppSelector from '../../hooks/useAppSelector';
import User from '../../types/User';

export interface AuthState {
	user: User | undefined;
}

const initialState: AuthState = {
	user: undefined,
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		updateUser: (state, action: PayloadAction<User | undefined>) => {
			state.user = action.payload;
		},
	},
});

export const { updateUser } = authSlice.actions;

export default authSlice.reducer;
