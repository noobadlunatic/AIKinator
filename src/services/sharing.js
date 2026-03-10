export function encodeAssessmentForSharing(answers) {
  try {
    const json = JSON.stringify(answers);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return null;
  }
}

export function decodeSharedAssessment(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const answers = JSON.parse(json);
    // Validate required fields exist
    if (!answers.industry || !answers.problemDescription) {
      return null;
    }
    return answers;
  } catch {
    return null;
  }
}

export function generateShareUrl(answers) {
  const encoded = encodeAssessmentForSharing(answers);
  if (!encoded) return null;
  const base = window.location.origin + window.location.pathname;
  return `${base}#shared=${encoded}`;
}

export function getSharedDataFromUrl() {
  const hash = window.location.hash;
  if (!hash.startsWith('#shared=')) return null;
  const encoded = hash.slice('#shared='.length);
  return decodeSharedAssessment(encoded);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
