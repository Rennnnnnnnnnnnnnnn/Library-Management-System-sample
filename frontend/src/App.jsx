import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import Resources from "./pages/Resources";
import Accounts from "./pages/Accounts";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Activities from "./pages/Activities";
import ToastNotification from "./components/ToastNotification";
import Transactions from "./pages/Transactions";
import Login from "./auth/Login";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* Protected layout */}
          <Route element={<ProtectedLayout  />}>
            <Route path="/home" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <ToastNotification />
    </>
  );
}

export default App;
