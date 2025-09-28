import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to GovernancaESG page for compatibility
export default function PainelGovernanca() {
  return <Navigate to="/governanca-esg" replace />;
}