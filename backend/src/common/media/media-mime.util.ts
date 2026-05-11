/**
 * Maps common image extensions to MIME types. Uses the last path segment
 * (e.g. `spinner/thumbnails/x.jpg` → extension `jpg`).
 */
export function imageMimeAndExtForPath(fileNameOrPath: string): { mime: string; ext: string } {
  const base = fileNameOrPath.split(/[/\\]/).pop() || fileNameOrPath;
  const ext = base.toLowerCase().split('.').pop() || '';
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'application/octet-stream';
  return { mime, ext };
}
