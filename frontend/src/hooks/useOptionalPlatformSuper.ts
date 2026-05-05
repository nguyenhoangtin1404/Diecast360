import { useContext } from 'react';
import { AuthContext, isPlatformSuper } from '../contexts/AuthContext';

/** Platform super check when AuthProvider may be absent (unit tests). */
export function useOptionalPlatformSuper(): boolean {
  const ctx = useContext(AuthContext);
  return isPlatformSuper(ctx?.user ?? null);
}
