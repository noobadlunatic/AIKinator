import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'sessions/' });

    if (blobs.length === 0) {
      return res.status(200).json({ sessions: [], count: 0 });
    }

    // Fetch each blob's JSON content in parallel
    const sessions = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url);
          if (!response.ok) return null;
          const data = await response.json();
          return data;
        } catch {
          return null;
        }
      })
    );

    // Filter nulls, sort newest first
    const sorted = sessions
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp));

    return res.status(200).json({ sessions: sorted, count: sorted.length });
  } catch (error) {
    console.error('Failed to fetch sessions data:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions data' });
  }
}
