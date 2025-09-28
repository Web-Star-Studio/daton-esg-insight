import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to InventarioGEE page for compatibility
export default function EmissoesGEE() {
  return <Navigate to="/inventario-gee" replace />;
}