// src/state/selectors.js
// Read-only selectors. UI must not compute cost math.

import { computeWeeklySavingsEngineV1, ingredientMaster } from "../engine/index.js";
import { recipePresentationById } from "./recipePresentation.js";

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function computeReadinessPct(recipe, state) {
  const pantryItems = state?.pantryItems ?? [];
  const overrides = state?.ingredientAvailabilityOverrides ?? {};

  const pantrySet = new Set(
    pantryItems.map((item) => normalizeKey(item?.name))
  );

  const ingredients = recipe?.ingredients ?? [];
  if (!ingredients.length) return 0;

  let availableCount = 0;

  for (const line of ingredients) {
    const ingredientKey = normalizeKey(line?.key ?? line?.name);
    const overrideKey = `${recipe.id}|${ingredientKey}`;
    const override = overrides[overrideKey];
    const inPantry = pantrySet.has(ingredientKey);

    const available = override === undefined ? inPantry : !!override;
    if (available) availableCount += 1;
  }

  return Math.round((availableCount / ingredients.length) * 100);
}

function adaptRecipeForSelectionCard(recipe, state) {
  const presentation = recipePresentationById[recipe?.id] ?? {};

  const restaurantPrice = Number(
    presentation.restaurant_price ?? recipe?.restaurantPrice ?? 0
  );
  const homeCost = Number(
    presentation.home_cost ?? recipe?.homeCost ?? 0
  );
  const computedSavings = Math.max(0, restaurantPrice - homeCost);

  return {
    id: recipe?.id ?? "",
    name: presentation.title ?? recipe?.name ?? "",
    image_url: presentation.image_url ?? recipe?.image ?? "",
    restaurant_price: restaurantPrice,
    home_cost: homeCost,
    savings: computedSavings,
    readiness_pct: computeReadinessPct(recipe, state),
  };
}

export function selectRecipesForGrid(state) {
  const realRecipes = state?.recipes ?? [];

  return realRecipes.map((recipe) =>
    adaptRecipeForSelectionCard(recipe, state)
  );
}

export function selectWeeklyTotals(state) {
  const mealPlan = state?.mealPlan ?? {};
  const allRecipes = state?.recipes ?? [];

  const selectedIds = Object.values(mealPlan).filter(Boolean);
  const selectedRecipes = selectedIds
    .map((id) => allRecipes.find((r) => r?.id === id))
    .filter(Boolean);

  if (!selectedRecipes.length) {
    return { restaurantTotal: 0, homeTotal: 0, savingsTotal: 0 };
  }

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