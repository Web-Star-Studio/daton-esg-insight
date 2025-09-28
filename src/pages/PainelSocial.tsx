import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to SocialESG page for compatibility
export default function PainelSocial() {
  return <Navigate to="/social-esg" replace />;
}