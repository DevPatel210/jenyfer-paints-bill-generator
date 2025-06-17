import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import BillFormPage from './pages/BillFormPage';
import BillsListPage from './pages/BillsListPage';
import VendorsPage from './pages/VendorsPage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import BillHtmlPage from './pages/BillHtmlPage';
import BillHtmlPageGemini from './pages/BillHtmlPageGemini';
import MainLayout from './pages/MainNavbarLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
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
