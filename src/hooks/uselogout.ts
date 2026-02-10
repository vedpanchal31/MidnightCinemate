import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";


const useLogout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();

  // Safely accessing token from auth state
  const token = useSelector((state: RootState) => state.auth.token);

  const handleLogout = (toastMessage?: string, toastType?: "error" | "warning") => {
    dispatch(logout());
    if (token) {
      if (toastType === "error") {
        toast.error(t(toastMessage ?? "COMMON.LOGOUT.ERROR"));
      } else if (toastType === "warning") {
        toast(t(toastMessage ?? "COMMON.LOGOUT.WARNING"), {
          icon: '⚠️',
        });
      } else {
        toast.success(t(toastMessage ?? "COMMON.LOGOUT.SUCCESSFUL"));
      }
    }
    
    router.push("/login");
  };

  return {
    logout: handleLogout,
  };
};

export default useLogout;