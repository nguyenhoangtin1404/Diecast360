import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { transitionPreorderStatus } from '../api/preorders';
import type { PreOrderStatus } from '../types/preorder';
import { messageFromPreorderTransitionError } from '../utils/preorderApiError';

export function usePreorderTransition(onSuccess: () => void) {
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PreOrderStatus }) =>
      transitionPreorderStatus(id, status),
    onMutate: () => {
      setTransitionError(null);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => {
      setTransitionError(messageFromPreorderTransitionError(err));
    },
  });

  return { transitionMutation, transitionError };
}
