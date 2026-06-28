// src/state/persistence.js
// Single source of truth for app-state persistence.
// Swap the bodies of save() and load() to target Supabase — callers never change.

const STORAGE_KEY    = 'darsnest_app_state';
const SCHEMA_VERSION = 1;

// Fields from appState that survive a reload. Everything else is ephemeral.
const PERSISTED_KEYS = [
  'mealPlan',
  'selectedStaples',
  'ingredientAvailabilityOverrides',
  '_previewRecipePortionsById',
  'currentPage',
  'currentRecipeTab',
  'currentRecipeGenre',
];

export function save(state) {
  try {
    const snapshot = { v: SCHEMA_VERSION };
    for (const key of PERSISTED_KEYS) {
      snapshot[key] = state[key];
    }
    // Set is not JSON-serializable — store as array
    snapshot.selectedStaples = state.selectedStaples instanceof Set
      ? [...state.selectedStaples]
      : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('[persistence] save failed:', e);
  }
}

// Returns an object with persisted fields restored, or null on first visit / bad data.
// Callers should treat null as "start from defaults."
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SCHEMA_VERSION) {
      // Schema changed or corrupt — discard and start fresh
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Restore Set from array
    parsed.selectedStaples = new Set(
      Array.isArray(parsed.selectedStaples) ? parsed.selectedStaples : []
    );
    return parsed;
  } catch (e) {
    console.warn('[persistence] load failed, starting fresh:', e);
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    return null;
  }
}
