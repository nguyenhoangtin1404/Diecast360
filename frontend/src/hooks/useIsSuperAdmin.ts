import { useMemo } from 'react';
import { useAuth } from './useAuth';

export const useIsSuperAdmin = (): boolean => {
  const { user } = useAuth();

  return useMemo(
    () =>
      Boolean(
        user?.role === 'super_admin' ||
          user?.shop_roles?.some((shopRole) => shopRole.role === 'super_admin'),
      ),
    [user],
  );
};

