const STORAGE_KEY = 'aiux-compass-assessments';
const MAX_ASSESSMENTS = 20;

export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function getAssessments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAssessmentById(id) {
  const assessments = getAssessments();
  return assessments.find(a => a.id === id) || null;
}

export function saveAssessment(assessment) {
  const assessments = getAssessments();
  const existingIndex = assessments.findIndex(a => a.id === assessment.id);
  let evicted = false;

  if (existingIndex >= 0) {
    assessments[existingIndex] = assessment;
  } else {
    if (assessments.length >= MAX_ASSESSMENTS) {
      assessments.shift(); // Remove oldest (FIFO)
      evicted = true;
    }
    assessments.push(assessment);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
    return { saved: true, evicted };
  } catch {
    return { saved: false, evicted: false, error: 'Storage full or unavailable' };
  }
}

export function deleteAssessment(id) {
  const assessments = getAssessments().filter(a => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
    return true;
  } catch {
    return false;
  }
}
