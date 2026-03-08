// src/state/selectors.js
// Read-only selectors. UI must not compute cost math.

import { computeWeeklySavingsEngineV1, ingredientMaster } from "../engine/index.js";

export function selectRecipesForGrid(state) {
  return state?.recipesForGrid ?? [];
}

export function selectWeeklyTotals(state) {
  const mealPlan = state?.mealPlan ?? {};
  const allRecipes = state?.recipes ?? [];

  // 1) Selected recipes from mealPlan
  const selectedIds = Object.values(mealPlan).filter(Boolean);
  const selectedRecipes = selectedIds
    .map((id) => allRecipes.find((r) => r?.id === id))
    .filter(Boolean);

  // If nothing selected, return zeros
  if (!selectedRecipes.length) {
    return { restaurantTotal: 0, homeTotal: 0, savingsTotal: 0 };
  }

  // 2) Adapt recipes into engine contract (real ingredientMaster + known ids only)
  const engineRecipes = selectedRecipes.map((r) => {
    const ingredients = (r.ingredients ?? [])
      .map((line) => {
        const ingredient_id = String(line.ingredient_id ?? line.key ?? "")
          .trim()
          .toLowerCase();

        if (!ingredient_id) return null;
        if (!ingredientMaster[ingredient_id]) return null;

        return {
          ingredient_id,
          qty: 1,
          unit: ingredientMaster[ingredient_id].base_unit,
        };
      })
      .filter(Boolean);

    return {
      id: r.id,
      ingredients,
      restaurant_price_estimate: Number(r.restaurantPrice ?? 0),
    };
  });

  // 3) TEMP pantryItems (next step maps pantryItems -> ingredient_id + qty + unit)
  const pantryItems = [];

  const result = computeWeeklySavingsEngineV1({
    recipes: engineRecipes,
    ingredientMaster,
    pantryItems,
  });

  const weekly = result?.weeklyTotals ?? {};

  return {
    restaurantTotal: weekly.restaurant_total ?? 0,
    homeTotal: weekly.home_total_out_of_pocket ?? 0,
    savingsTotal: weekly.weekly_savings_total ?? 0,
  };
}

export function selectWeeklyEngineDebug(state) {
  const mealPlan = state?.mealPlan ?? {};
  const allRecipes = state?.recipes ?? [];

  const selectedIds = Object.values(mealPlan).filter(Boolean);
  const selectedRecipes = selectedIds
    .map((id) => allRecipes.find((r) => r?.id === id))
    .filter(Boolean);

  if (!selectedRecipes.length) return null;

  const engineRecipes = selectedRecipes.map((r) => {
    const ingredients = (r.ingredients ?? [])
      .map((line) => {
        const ingredient_id = String(line.ingredient_id ?? line.key ?? "")
          .trim()
          .toLowerCase();

        if (!ingredient_id) return null;
        if (!ingredientMaster[ingredient_id]) return null;

        return {
          ingredient_id,
          qty: 1,
          unit: ingredientMaster[ingredient_id].base_unit,
        };
      })
      .filter(Boolean);

    return {
      id: r.id,
      ingredients,
      restaurant_price_estimate: Number(r.restaurantPrice ?? 0),
    };
  });

  const pantryItems = [];

  return computeWeeklySavingsEngineV1({
    recipes: engineRecipes,
    ingredientMaster,
    pantryItems,
  });
}