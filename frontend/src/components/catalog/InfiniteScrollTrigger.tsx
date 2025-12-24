import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteScrollTrigger = ({
  onIntersect,
  hasMore,
  isLoading,
}: InfiniteScrollTriggerProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onIntersect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    const currentRef = triggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, onIntersect]);

  if (!hasMore) {
    return null;
  }

  return (
    <div ref={triggerRef} className="h-20 flex items-center justify-center">
      {isLoading && <div className="text-gray-500">Đang tải...</div>}
    </div>
  );
};

