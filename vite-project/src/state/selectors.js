// src/state/selectors.js
// Read-only selectors. UI must not compute cost math.

import { computeWeeklySavingsEngineV1 } from "../engine/index.js";

export function selectRecipesForGrid(state) {
  return state?.recipesForGrid ?? [];
}

export function selectWeeklyTotals(state) {
  // Defensive defaults so UI never crashes during boot.
  const recipes = state?.selectedRecipes ?? [];
  const pantry = state?.pantry ?? {};
  const availability = state?.availability ?? {};
  const portions = state?.portions ?? {};

  const result = computeWeeklySavingsEngineV1({
    recipes,
    pantry,
    availability,
    portions,
  });

  return {
    restaurantTotal: result?.restaurant_total ?? 0,
    homeTotal: result?.home_total ?? 0,
    savingsTotal: result?.savings_total ?? 0,
  };
}