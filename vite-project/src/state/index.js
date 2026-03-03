// src/state/index.js
// Single import surface for UI.

export { config } from "../engine/index.js";

export { appState } from "./store.js";
export { selectRecipesForGrid, selectWeeklyTotals } from "./selectors.js";