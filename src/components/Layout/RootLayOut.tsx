// import React from 'react'
import Navbar from "../Navbar";
import Footer from "../Footer";
import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <main className="min-h-screen">
          <div className="max-w-[1280px] mx-auto py-8">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default RootLayout;
