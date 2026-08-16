export function extractCloudinaryInfo(
  url: string,
): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
    if (!match) return null;
    const resourceType = match[1] as 'image' | 'video' | 'raw';
    let publicId = match[2];
    if (resourceType !== 'raw') {
      publicId = publicId.replace(/\.[^/.]+$/, ''); // strip extension for image/video
    }
    return { publicId, resourceType };
  } catch {
    return null;
  }
}
