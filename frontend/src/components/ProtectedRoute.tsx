import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAppSelector } from "../store/hooks";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles: UserRole[];
  children: ReactNode;
}

export const ProtectedRoute = ({ roles, children }: ProtectedRouteProps) => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={ROUTES.VACANCIES} replace />;
  }

  return children;
};
