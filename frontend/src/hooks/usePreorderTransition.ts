import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { transitionPreorderStatus } from '../api/preorders';
import type { PreOrderStatus } from '../types/preorder';

const TRANSITION_ERROR_MESSAGE = 'Chuyển trạng thái thất bại. Vui lòng thử lại.';

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
    onError: () => {
      setTransitionError(TRANSITION_ERROR_MESSAGE);
    },
  });

  return { transitionMutation, transitionError };
}
