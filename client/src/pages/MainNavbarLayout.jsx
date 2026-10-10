// Layout.js
import React, { useSyncExternalStore } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { isAuthenticated, logout, subscribeAuth } from '../auth';

function NavBar() {
  const authed = useSyncExternalStore(subscribeAuth, isAuthenticated, isAuthenticated);
  const handleLogout = () => {
    logout();
  };
  if (!authed) return null;
  return (
    <nav className="top-nav">
      <Link to="/">Bills</Link>
      <Link to="/vendors">Vendors</Link>
      <Link to="/products">Products</Link>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </nav>
  );
}

const MainLayout = () => {
  return (
    <>
      <NavBar />
      <main>
        <Outlet /> {/* This will render the child routes */}
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default MainLayout;