import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../services/api';

/**
 * Componente de guarda de rota para administradores.
 * Redireciona para /login se não autenticado, ou /dashboard se não for admin.
 */
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default AdminRoute;
