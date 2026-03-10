const rawMaxFrames = import.meta.env?.VITE_MAX_SPINNER_FRAMES ?? '48';

const parsed = Number.parseInt(rawMaxFrames, 10);

export const MAX_SPINNER_FRAMES = Number.isFinite(parsed) && parsed > 0 ? parsed : 48;
