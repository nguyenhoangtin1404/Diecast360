import { useState, useRef, useEffect, useCallback } from 'react';

interface Frame {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  frame_index: number;
}

interface Spinner360Props {
  frames: Frame[];
  autoplay?: boolean;
  autoplaySpeed?: number;
  width?: number;
  height?: number;
}

export const Spinner360: React.FC<Spinner360Props> = ({
  frames,
  autoplay = false,
  autoplaySpeed = 100,
  width = 600,
  height = 600,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(autoplay);
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalFrames = frames.length;

  // Reset current frame and loaded set when frames change to avoid stale indexes
  useEffect(() => {
    if (totalFrames === 0) return;
    setCurrentFrame((prev) => (prev >= totalFrames ? 0 : prev));
    setLoadedFrames(new Set([0]));
  }, [totalFrames]);

  // Preload next frames
  useEffect(() => {
    const preloadRange = 3;
    const framesToLoad = new Set<number>();

    for (let i = -preloadRange; i <= preloadRange; i++) {
      const index = (currentFrame + i + totalFrames) % totalFrames;
      framesToLoad.add(index);
    }

    framesToLoad.forEach((index) => {
      if (!loadedFrames.has(index) && frames[index]) {
        const img = new Image();
        img.src = frames[index].image_url;
        img.onload = () => {
          setLoadedFrames((prev) => new Set(prev).add(index));
        };
      }
    });
  }, [currentFrame, totalFrames, loadedFrames, frames]);

  // Autoplay logic
  useEffect(() => {
    if (isAutoplaying && !isDragging) {
      autoplayRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % totalFrames);
      }, autoplaySpeed);
    } else {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isAutoplaying, isDragging, totalFrames, autoplaySpeed]);

  const getFrameImage = useCallback(
    (index: number) => {
      const frame = frames[index];
      if (!frame) return '';
      if (loadedFrames.has(index)) {
        return frame.image_url;
      }
      return frame.thumbnail_url || frame.image_url;
    },
    [frames, loadedFrames],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setIsAutoplaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const delta = e.clientX - dragStart;
    const frameDelta = Math.round((delta / width) * totalFrames * 0.5);
    const newFrame = (currentFrame - frameDelta + totalFrames) % totalFrames;
    setCurrentFrame(newFrame);
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
    setIsAutoplaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const delta = e.touches[0].clientX - dragStart;
    const frameDelta = Math.round((delta / width) * totalFrames * 0.5);
    const newFrame = (currentFrame - frameDelta + totalFrames) % totalFrames;
    setCurrentFrame(newFrame);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const toggleAutoplay = () => {
    setIsAutoplaying(!isAutoplaying);
  };

  if (frames.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={getFrameImage(currentFrame)}
          alt={`Frame ${currentFrame + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button onClick={toggleAutoplay}>
          {isAutoplaying ? 'Pause' : 'Play'}
        </button>
        <span style={{ margin: '0 10px' }}>
          {currentFrame + 1} / {totalFrames}
        </span>
      </div>
    </div>
  );
};

