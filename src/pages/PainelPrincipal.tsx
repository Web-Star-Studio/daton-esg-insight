import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to Index page for compatibility
export default function PainelPrincipal() {
  return <Navigate to="/dashboard" replace />;
}