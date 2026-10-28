import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wrap any page that should only be visible to a specific logged-in role.
export default function ProtectedRoute({ role, children }) {
  const { auth } = useAuth();

  if (!auth || auth.role !== role) {
    const redirectMap = { admin: '/admin/login', org: '/org/login', user: '/login' };
    return <Navigate to={redirectMap[role] || '/'} replace />;
  }
  return children;
}
