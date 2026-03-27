import React from "react";
import { Outlet } from "react-router-dom";
import NAVBAR from "../components/Navbar";
import Footer from "../components/Footer";

function PublicLayout() {
  return (
    <>
      <NAVBAR />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default PublicLayout;