// src/state/selectors.js
// Read-only selectors. UI must not compute cost math.

import { computeWeeklySavingsEngineV1, ingredientMaster } from "../engine/index.js";
import { recipePresentationById } from "./recipePresentation.js";

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function singularizeUnit(unit) {
  const normalized = normalizeKey(unit);
  if (!normalized) return "";
  if (normalized === "cloves") return "clove";
  if (normalized === "heads") return "head";
  if (normalized === "whole") return "whole";
  if (normalized.endsWith("s")) return normalized.slice(0, -1);
  return normalized;
}

function getRecipeIngredientId(line) {
  const rawKey = normalizeKey(line?.ingredient_id ?? line?.key ?? "");

  if (!rawKey) return null;
  if (rawKey === "chicken breast") return "chicken";
  if (rawKey === "salt") return "spice";
  if (rawKey === "black pepper") return "spice";
  return rawKey;
}

const UNSUPPORTED_NON_QUANTITATIVE_QTY = new Set([
  "to taste",
  "pinch",
  "dash",
  "as needed",
]);

const PACKAGE_CONTAINER_BASE_UNITS = new Set([
  "jar",
]);

const PANTRY_PACKAGE_CONTAINER_UNITS = new Set([
  "bottle",
  "container",
]);

function adaptRecipeLineForEngine(line) {
  const source_key = normalizeKey(line?.ingredient_id ?? line?.key ?? "");
  const mapped_ingredient_id = getRecipeIngredientId(line);

  if (!source_key) {
    return {
      accepted: false,
      reason: "missing ingredient key",
      rejection_class: "missing_ingredient_key",
      source_key,
    };
  }

  if (!mapped_ingredient_id) {
    return {
      accepted: false,
      reason: "unmapped ingredient id",
      rejection_class: "unmapped_ingredient_id",
      source_key,
    };
  }

  const ingredient = ingredientMaster[mapped_ingredient_id];
  if (!ingredient) {
    return {
      accepted: false,
      reason: "ingredient id missing from ingredientMaster",
      rejection_class: "ingredient_id_missing_from_ingredient_master",
      source_key,
      mapped_ingredient_id,
    };
  }

  const rawQty = normalizeKey(line?.qty ?? "");
  if (!rawQty) {
    return {
      accepted: false,
      reason: "missing quantity",
      rejection_class: "missing_quantity",
      source_key,
      mapped_ingredient_id,
      raw_qty: rawQty,
    };
  }

  if (UNSUPPORTED_NON_QUANTITATIVE_QTY.has(rawQty)) {
    return {
      accepted: false,
      reason: "unsupported non-quantitative recipe input",
      rejection_class: "unsupported_non_quantitative_recipe_input",
      source_key,
      mapped_ingredient_id,
      raw_qty: rawQty,
    };
  }

  const baseUnit = singularizeUnit(ingredient.base_unit);

  const unitMatch = rawQty.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/);
  if (unitMatch) {
    const qty = Number.parseFloat(unitMatch[1]);
    const unit = singularizeUnit(unitMatch[2]);

    if (!Number.isFinite(qty) || qty <= 0) {
      return {
        accepted: false,
        reason: "invalid numeric quantity",
        rejection_class: "invalid_numeric_quantity",
        source_key,
        mapped_ingredient_id,
        raw_qty: rawQty,
      };
    }

    if (unit !== baseUnit) {
      if (PACKAGE_CONTAINER_BASE_UNITS.has(baseUnit)) {
        return {
          accepted: false,
          reason: "unsupported recipe package/container-base mismatch",
          rejection_class: "unsupported_recipe_package_container_base_mismatch",
          source_key,
          mapped_ingredient_id,
          raw_qty: rawQty,
          parsed_unit: unit,
          base_unit: ingredient.base_unit,
        };
      }

      return {
        accepted: false,
        reason: "unit does not match base unit",
        rejection_class: "unit_does_not_match_base_unit",
        source_key,
        mapped_ingredient_id,
        raw_qty: rawQty,
        parsed_unit: unit,
        base_unit: ingredient.base_unit,
      };
    }

    return {
      accepted: true,
      category: "exact quantity+unit match",
      source_key,
      ingredient_id: mapped_ingredient_id,
      qty,
      unit: ingredient.base_unit,
    };
  }

  const bareNumberMatch = rawQty.match(/^(\d+(?:\.\d+)?)$/);
  if (bareNumberMatch && baseUnit === "whole") {
    const qty = Number.parseFloat(bareNumberMatch[1]);

    if (!Number.isFinite(qty) || qty <= 0) {
      return {
        accepted: false,
        reason: "invalid numeric quantity",
        rejection_class: "invalid_numeric_quantity",
        source_key,
        mapped_ingredient_id,
        raw_qty: rawQty,
      };
    }

    return {
      accepted: true,
      category: 'bare number accepted for base unit "whole"',
      source_key,
      ingredient_id: mapped_ingredient_id,
      qty,
      unit: ingredient.base_unit,
    };
  }

  return {
    accepted: false,
    reason: "unsupported quantity format",
    rejection_class: "unsupported_quantity_format",
    source_key,
    mapped_ingredient_id,
    raw_qty: rawQty,
    base_unit: ingredient.base_unit,
  };
}

function adaptRecipesForWeeklyEngine(selectedRecipes) {
  const acceptedRecipes = [];
  const report = {
    accepted_recipe_lines: [],
    rejected_recipe_lines: [],
  };

  for (const r of selectedRecipes) {
    const acceptedIngredients = [];

    for (const line of r.ingredients ?? []) {
      const adapted = adaptRecipeLineForEngine(line);

      if (adapted.accepted) {
        acceptedIngredients.push({
          ingredient_id: adapted.ingredient_id,
          qty: adapted.qty,
          unit: adapted.unit,
        });

        report.accepted_recipe_lines.push({
          recipe_id: r.id,
          recipe_name: r.name ?? null,
          source_key: adapted.source_key,
          ingredient_id: adapted.ingredient_id,
          qty: adapted.qty,
          unit: adapted.unit,
          category: adapted.category,
        });
      } else {
        report.rejected_recipe_lines.push({
          recipe_id: r.id,
          recipe_name: r.name ?? null,
          source_key: adapted.source_key ?? null,
          raw_qty: adapted.raw_qty ?? null,
          mapped_ingredient_id: adapted.mapped_ingredient_id ?? null,
          base_unit: adapted.base_unit ?? null,
          parsed_unit: adapted.parsed_unit ?? null,
          reason: adapted.reason,
          rejection_class: adapted.rejection_class ?? null,
        });
      }
    }

    acceptedRecipes.push({
      id: r.id,
      ingredients: acceptedIngredients,
      restaurant_price_estimate: Number(r.restaurantPrice ?? 0),
    });
  }

  return {
    recipes: acceptedRecipes,
    report,
  };
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

function adaptPantryRowForEngine(item) {
  const rawName = normalizeKey(item?.name);
  const rawQty = Number.parseFloat(item?.quantity ?? "");
  const rawUnit = singularizeUnit(item?.unit);

  const explicitNameToIngredientId = {
    rice: "rice",
    chicken: "chicken",
    salsa: "salsa",
    salt: "spice",
    "black pepper": "spice",
    pepper: "spice",
    "garlic powder": "spice",
    "onion powder": "spice",
    spice: "spice",
    "olive oil": "olive oil",
    pasta: "pasta",
    broccoli: "broccoli",
    cheese: "cheese",
  };

  if (!rawName) {
    return {
      accepted: false,
      reason: "missing pantry name",
      rejection_class: "missing_pantry_name",
      raw_name: rawName,
    };
  }

  if (!Number.isFinite(rawQty) || rawQty <= 0) {
    return {
      accepted: false,
      reason: "invalid numeric quantity",
      rejection_class: "invalid_numeric_quantity",
      raw_name: rawName,
      raw_qty: item?.quantity ?? null,
      raw_unit: item?.unit ?? null,
    };
  }

  let ingredient_id = explicitNameToIngredientId[rawName] ?? null;

  if (!ingredient_id) {
    if (rawName.includes("rice")) ingredient_id = "rice";
    else if (rawName.includes("chicken")) ingredient_id = "chicken";
    else if (rawName.includes("salsa")) ingredient_id = "salsa";
  }

  if (!ingredient_id) {
    return {
      accepted: false,
      reason: "unmapped ingredient id",
      rejection_class: "unmapped_ingredient_id",
      raw_name: rawName,
      raw_qty: rawQty,
      raw_unit: item?.unit ?? null,
    };
  }

  if (!ingredientMaster[ingredient_id]) {
    return {
      accepted: false,
      reason: "ingredient id missing from ingredientMaster",
      rejection_class: "ingredient_id_missing_from_ingredient_master",
      raw_name: rawName,
      raw_qty: rawQty,
      raw_unit: item?.unit ?? null,
      ingredient_id,
    };
  }

  const baseUnit = singularizeUnit(ingredientMaster[ingredient_id].base_unit);

  if (rawUnit !== baseUnit) {
    if (
      PANTRY_PACKAGE_CONTAINER_UNITS.has(rawUnit) &&
      baseUnit === "tbsp"
    ) {
      return {
        accepted: false,
        reason: "unsupported pantry package/container-to-measure mismatch",
        rejection_class: "unsupported_pantry_package_container_to_measure_mismatch",
        raw_name: rawName,
        raw_qty: rawQty,
        raw_unit: item?.unit ?? null,
        ingredient_id,
        base_unit: ingredientMaster[ingredient_id].base_unit,
      };
    }

    return {
      accepted: false,
      reason: "unsupported pantry unit",
      rejection_class: "unsupported_pantry_unit",
      raw_name: rawName,
      raw_qty: rawQty,
      raw_unit: item?.unit ?? null,
      ingredient_id,
      base_unit: ingredientMaster[ingredient_id].base_unit,
    };
  }

  return {
    accepted: true,
    category: "pantry unit matches base unit",
    raw_name: rawName,
    ingredient_id,
    qty: rawQty,
    unit: ingredientMaster[ingredient_id].base_unit,
  };
}

function adaptPantryItemsForEngine(state) {
  const pantryItems = state?.pantryItems ?? [];
  const acceptedPantryItems = [];
  const report = {
    accepted_pantry_rows: [],
    rejected_pantry_rows: [],
  };

  for (const item of pantryItems) {
    const adapted = adaptPantryRowForEngine(item);

    if (adapted.accepted) {
      acceptedPantryItems.push({
        ingredient_id: adapted.ingredient_id,
        qty: adapted.qty,
        unit: adapted.unit,
      });

      report.accepted_pantry_rows.push({
        raw_name: adapted.raw_name,
        ingredient_id: adapted.ingredient_id,
        qty: adapted.qty,
        unit: adapted.unit,
        category: adapted.category,
      });
    } else {
      report.rejected_pantry_rows.push({
        raw_name: adapted.raw_name ?? null,
        raw_qty: adapted.raw_qty ?? null,
        raw_unit: adapted.raw_unit ?? null,
        ingredient_id: adapted.ingredient_id ?? null,
        base_unit: adapted.base_unit ?? null,
        reason: adapted.reason,
        rejection_class: adapted.rejection_class ?? null,
      });
    }
  }

  return {
    pantryItems: acceptedPantryItems,
    report,
  };
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

  const adaptedRecipes = adaptRecipesForWeeklyEngine(selectedRecipes);
  const adaptedPantry = adaptPantryItemsForEngine(state);

  const result = computeWeeklySavingsEngineV1({
    recipes: adaptedRecipes.recipes,
    ingredientMaster,
    pantryItems: adaptedPantry.pantryItems,
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

  const adaptedRecipes = adaptRecipesForWeeklyEngine(selectedRecipes);
  const adaptedPantry = adaptPantryItemsForEngine(state);

  const engineResult = computeWeeklySavingsEngineV1({
    recipes: adaptedRecipes.recipes,
    ingredientMaster,
    pantryItems: adaptedPantry.pantryItems,
  });

  return {
    ...engineResult,
    selectorReport: {
      accepted_recipe_lines: adaptedRecipes.report.accepted_recipe_lines,
      rejected_recipe_lines: adaptedRecipes.report.rejected_recipe_lines,
      accepted_pantry_rows: adaptedPantry.report.accepted_pantry_rows,
      rejected_pantry_rows: adaptedPantry.report.rejected_pantry_rows,
    },
  };
}