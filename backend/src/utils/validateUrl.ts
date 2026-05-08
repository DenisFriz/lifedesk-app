import dns from 'node:dns/promises';

export async function validateUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname;

  if (hostname === 'localhost' || hostname === '0.0.0.0') {
    throw new Error('URL resolves to a blocked address');
  }

  const { address, family } = await dns.lookup(hostname, { family: 0 });

  if (family === 4) {
    const parts = address.split('.').map(Number);
    const [a, b] = parts;
    if (
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      throw new Error('URL resolves to a blocked address');
    }
  }

  if (family === 6) {
    if (
      address === '::1' ||
      address.toLowerCase().startsWith('fe80') ||
      address.toLowerCase().startsWith('fc') ||
      address.toLowerCase().startsWith('fd')
    ) {
      throw new Error('URL resolves to a blocked address');
    }
  }
}
