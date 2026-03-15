import { v4 as uuidv4 } from 'uuid';

/**
 * Save a completed assessment session to Vercel Blob storage.
 * Fires and forgets — failures are logged but don't block the user.
 *
 * @param {Object} answers - The 6 questionnaire answers
 * @param {Object} journeyMap - The AI-generated journey map (nodes + edges)
 * @param {Array} whyNot - The "why not" excluded types
 */
export async function saveSessionToBlob(answers, journeyMap, whyNot) {
  try {
    const sessionId = uuidv4();

    const response = await fetch('/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        timestamp: new Date().toISOString(),
        answers,
        journeyMap,
        whyNot,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Blob save failed:', response.status, errorData);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // Silent fail — blob storage is non-critical
    console.warn('Blob save error (non-critical):', error.message);
    return null;
  }
}
