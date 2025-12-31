import { Navigate, useLocation } from "react-router-dom";

// Protected route for admin users
export default function AdminProtectedRoute({ children }) {
  const isAdminLoggedIn = localStorage.getItem("adminToken");
  const location = useLocation();

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

