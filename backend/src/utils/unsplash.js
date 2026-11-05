import { env } from '../config/env.js';

const photoCache = new Map();

/**
 * Fetch a high-resolution photo from Unsplash by city or keyword
 */
export const getUnsplashPhoto = async (query) => {
  if (!env.UNSPLASH_API_KEY) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
  }

  const cleanQuery = (query || 'hotel resort').toLowerCase().trim();
  if (photoCache.has(cleanQuery)) {
    return photoCache.get(cleanQuery);
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${cleanQuery} hotel resort`)}&per_page=1`;
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${env.UNSPLASH_API_KEY}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const photoUrl = data.results[0].urls?.regular || data.results[0].urls?.full;
        photoCache.set(cleanQuery, photoUrl);
        return photoUrl;
      }
    }
  } catch {
    // Fallback to default
  }

  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
};

export const clearUnsplashCache = () => {
  photoCache.clear();
};
