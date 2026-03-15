import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'sessions/' });

    const sessions = blobs.map(blob => ({
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));

    return res.status(200).json({ sessions, count: sessions.length });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return res.status(500).json({ error: 'Failed to list sessions' });
  }
}
