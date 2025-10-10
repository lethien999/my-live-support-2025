import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: string[];
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, roles }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
