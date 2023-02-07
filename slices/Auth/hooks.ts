import useAppSelector from "../../hooks/useAppSelector";
import { AppState } from "../../store";

export const useUser = () => {
	return useAppSelector((state: AppState) => state.auth.user);
};
