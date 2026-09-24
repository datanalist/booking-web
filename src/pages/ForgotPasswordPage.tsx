import { Navigate } from "react-router-dom";

export function ForgotPasswordPage() {
  return <Navigate to="/login" replace state={{ forgot: true }} />;
}
