import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, timestamp, answers, journeyMap, whyNot } = req.body;

    if (!id || !answers) {
      return res.status(400).json({ error: 'Missing required fields: id, answers' });
    }

    const sessionData = {
      id,
      timestamp: timestamp || new Date().toISOString(),
      answers,
      journeyMap: journeyMap || null,
      whyNot: whyNot || [],
      savedAt: new Date().toISOString(),
    };

    // Store as JSON blob — organized by date for easy browsing
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const pathname = `sessions/${date}/${id}.json`;

    const blob = await put(pathname, JSON.stringify(sessionData, null, 2), {
      contentType: 'application/json',
      access: 'private',
    });

    return res.status(200).json({ success: true, url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error('Failed to save session to blob:', error);
    return res.status(500).json({ error: 'Failed to save session' });
  }
}
