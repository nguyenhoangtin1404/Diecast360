const rawMaxFrames =
  (
    import.meta as {
      env?: Record<string, string | undefined>;
    }
  ).env?.VITE_MAX_SPINNER_FRAMES ?? '48';

const parsed = Number.parseInt(rawMaxFrames, 10);

export const MAX_SPINNER_FRAMES = Number.isFinite(parsed) && parsed > 0 ? parsed : 48;
