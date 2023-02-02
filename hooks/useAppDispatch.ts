import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
const useAppDispatch = () => useDispatch<AppDispatch>();

export default useAppDispatch;