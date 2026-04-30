import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { isPlatformSuper } from '../contexts/AuthContext';

/**
 * Returns true if the current user has platform operator access.
 * After Phase 15, this is based on `platform_role === 'platform_super'`.
 */
export const useIsSuperAdmin = (): boolean => {
  const { user } = useAuth();
  return useMemo(() => isPlatformSuper(user), [user]);
};
