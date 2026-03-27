import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const UserRoute = () => {
  // 🔥 Replace this with your real auth logic
  const user = localStorage.getItem("user"); 

  return user ? <Outlet /> : <Navigate to="/" />;
};

export default UserRoute;