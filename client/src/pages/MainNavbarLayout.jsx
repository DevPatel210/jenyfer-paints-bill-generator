// Layout.js
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Or your toast library

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  if (!token) return null;
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