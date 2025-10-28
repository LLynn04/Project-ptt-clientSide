// src/components/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const roleStr = localStorage.getItem('role');

  console.log('=== ProtectedRoute Check ===');
  console.log('Token exists:', !!token);
  console.log('Role from localStorage:', roleStr);
  console.log('Allowed roles:', allowedRoles);

  if (!token) {
    console.log('No token, redirecting to /');
    return <Navigate to="/" replace />;
  }

  // Check role from localStorage first
  if (roleStr && allowedRoles.includes(roleStr)) {
    console.log('Access granted via role');
    return <>{children}</>;
  }

  // Fallback: check user object for roles
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('User object:', user);
      console.log('User roles:', user.roles);

      // Check if user has role id 3 (admin)
      const hasAdminRole = user.roles && 
                          Array.isArray(user.roles) && 
                          user.roles.some((role: any) => role.id === 3);

      // Check other admin indicators
      const isAdmin = hasAdminRole || 
                     user.role === 'admin' || 
                     user.is_admin === true ||
                     user.is_admin === 1;

      console.log('Is admin?', isAdmin);

      if (isAdmin && allowedRoles.includes('admin')) {
        // Store role for next time
        localStorage.setItem('role', 'admin');
        console.log('Access granted via user object');
        return <>{children}</>;
      }
    } catch (error) {
      console.error('Error parsing user:', error);
    }
  }

  console.log('Access denied, redirecting to /');
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;