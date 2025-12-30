import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("token");
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to auth page and remember where they wanted to go
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return children;
}

