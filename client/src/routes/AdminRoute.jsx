import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ❌ Not admin
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return <Outlet />;
};

export default AdminRoute;