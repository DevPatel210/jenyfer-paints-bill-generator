import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import BillFormPage from './pages/BillFormPage';
import BillsListPage from './pages/BillsListPage';
import VendorsPage from './pages/VendorsPage';
import ProductsPage from './pages/ProductsPage';
import BillHtmlPageGemini from './pages/BillHtmlPageGemini';
import MainLayout from './pages/MainNavbarLayout';
import { SESSION_EXPIRED_MESSAGE, getToken, isAuthenticated, logout } from './auth';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function PrivateRoute({ children }) {
  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed && getToken()) logout(SESSION_EXPIRED_MESSAGE);
  }, [authed]);

  if (authed) return children;
  return <Navigate to="/login" replace />;
}


function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/bill/:id/html" element={<PrivateRoute><BillHtmlPage /></PrivateRoute>} /> */}
        <Route path="/bill/:id/html" element={<PrivateRoute><BillHtmlPageGemini /></PrivateRoute>} />
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          <Route path="/" element={<PrivateRoute><BillsListPage /></PrivateRoute>} />
          <Route path="/bill/new" element={<PrivateRoute><BillFormPage /></PrivateRoute>} />
          <Route path="/vendors" element={<PrivateRoute><VendorsPage /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
