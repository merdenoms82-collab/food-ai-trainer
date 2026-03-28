// src/state/selectors.js
// Read-only selectors. UI must not compute cost math.

import { computeWeeklySavingsEngineV1, ingredientMaster } from "../engine/index.js";
import { recipePresentationById } from "./recipePresentation.js";

const DEFAULT_PORTIONS = 2;

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

const WEIGHT_UNITS = new Set([
  "lb",
  "lbs",
  "pound",
  "pounds",
  "oz",
]);

const VOLUME_MEASURE_UNITS = new Set([
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "pint",
  "pints",
  "quart",
  "quarts",
  "gallon",
  "gallons",
  "ml",
  "milliliter",
  "milliliters",
  "l",
  "liter",
  "liters",
]);

const CHEF_MAYA_SUBSTITUTIONS = {
  "chicken breast": {
    label: "Chicken Breast",
    guidance:
      "Boneless chicken thighs are the safest swap. Keep the pieces similar in size and cook until fully done before slicing.",
  },
  pasta: {
    label: "Pasta",
    guidance:
      "Use any similar pasta shape you already have. Check the package time and stop at al dente so it finishes well in the sauce.",
  },
  parmesan: {
    label: "Parmesan",
    guidance:
      "Romano or an Italian hard-cheese blend works well. Add a little at a time because saltier cheeses can tighten the sauce faster.",
  },
  "heavy cream": {
    label: "Heavy Cream",
    guidance:
      "Half-and-half is a safe lighter swap. The sauce will be thinner, so keep the heat gentle and simmer a little longer.",
  },
  garlic: {
    label: "Garlic",
    guidance:
      "Garlic powder works in a pinch. Add a small amount first and taste near the end rather than overdoing it early.",
  },
  "ground beef": {
    label: "Ground Beef",
    guidance:
      "Ground turkey is the safest lean swap. Brown it fully, then season a little more assertively because it is milder than beef.",
  },
  rice: {
    label: "Rice",
    guidance:
      "Any white rice works cleanly. If using brown rice, start it earlier because the cook time is longer.",
  },
  beans: {
    label: "Beans",
    guidance:
      "Black beans or pinto beans are both safe here. Drain and warm them gently so they do not break down.",
  },
  cheese: {
    label: "Cheese",
    guidance:
      "Use any mild melting cheese you already have. Add it near the end so it softens without turning oily.",
  },
  salsa: {
    label: "Salsa",
    guidance:
      "Diced tomatoes with a pinch of salt and seasoning can stand in. Keep it simple and add moisture a little at a time.",
  },
  salmon: {
    label: "Salmon",
    guidance:
      "A firm white fish is the safest swap. Keep the fillets similar in thickness so the timing stays close.",
  },
  broccoli: {
    label: "Broccoli",
    guidance:
      "Cauliflower, green beans, or asparagus will all work. Roast until just tender so the vegetables still hold texture.",
  },
  "olive oil": {
    label: "Olive Oil",
    guidance:
      "Any neutral cooking oil will work. Keep the amount modest so the pan coats evenly without getting heavy.",
  },
  lemon: {
    label: "Lemon",
    guidance:
      "A small splash of vinegar can replace brightness at the finish. Add it lightly and taste before adding more.",
  },
};

const SHOPPING_LABELS = {
  chicken: "Chicken",
  pasta: "Pasta",
  parmesan: "Parmesan",
  "heavy cream": "Heavy Cream",
  garlic: "Garlic",
  spice: "Spices",
  "ground beef": "Ground Beef",
  rice: "Rice",
  beans: "Beans",
  cheese: "Cheese",
  salsa: "Salsa",
  salmon: "Salmon",
  broccoli: "Broccoli",
  "olive oil": "Olive Oil",
  lemon: "Lemon",
};

function formatIngredientLabelForShopping(ingredientId) {
  return SHOPPING_LABELS[ingredientId] || ingredientId;
}

function formatBaseQtyForShopping(qty) {
  const n = Number(qty ?? 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n)
    ? String(n)
    : String(Math.round((n + Number.EPSILON) * 100) / 100);
}

function coerceSlot(slotValue) {
  if (!slotValue || typeof slotValue !== "object" || Array.isArray(slotValue)) {
    return { recipeId: null, portions: DEFAULT_PORTIONS };
  }

  const recipeId = slotValue.recipeId ?? null;
  const parsedPortions = Number(slotValue.portions);
  const portions =
    Number.isFinite(parsedPortions) && parsedPortions > 0
      ? parsedPortions
      : DEFAULT_PORTIONS;

  return {
    recipeId,
    portions,
  };
}

function parseNumericQty(rawQty) {
  const normalized = normalizeKey(rawQty);

  if (!normalized) {
    return { ok: false, reason: "missing_quantity" };
  }

  if (UNSUPPORTED_NON_QUANTITATIVE_QTY.has(normalized)) {
    return {
      ok: false,
      reason: "unsupported_non_quantitative_recipe_input",
      raw_qty: normalized,
    };
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) {
    return {
      ok: false,
      reason: "unsupported_quantity_format",
      raw_qty: normalized,
    };
  }

  const qty = Number.parseFloat(match[1]);
  const unitPart = (match[2] ?? "").trim();

  if (!Number.isFinite(qty) || qty <= 0) {
    return {
      ok: false,
      reason: "invalid_numeric_quantity",
      raw_qty: normalized,
    };
  }

  return {
    ok: true,
    qty,
    unitPart,
    raw_qty: normalized,
  };
}

function scaleIngredientLine(line, factor) {
  const parsed = parseNumericQty(line?.qty ?? "");

  if (!parsed.ok) {
    return { ...line };
  }

  const scaledQty = Math.round((parsed.qty * factor + Number.EPSILON) * 100) / 100;
  const qtyText = Number.isInteger(scaledQty) ? String(scaledQty) : String(scaledQty);

  return {
    ...line,
    qty: parsed.unitPart ? `${qtyText} ${parsed.unitPart}`.trim() : qtyText,
  };
}

function scaleRecipeForEngine(recipe, portions) {
  const safePortions =
    Number.isFinite(Number(portions)) && Number(portions) > 0
      ? Number(portions)
      : DEFAULT_PORTIONS;

  const factor = safePortions / DEFAULT_PORTIONS;

  return {
    ...recipe,
    restaurantPrice: Number(recipe?.restaurantPrice ?? 0) * factor,
    homeCost: Number(recipe?.homeCost ?? 0) * factor,
    ingredients: (recipe?.ingredients ?? []).map((line) =>
      scaleIngredientLine(line, factor)
    ),
  };
}

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

    if (
      WEIGHT_UNITS.has(rawUnit) &&
      VOLUME_MEASURE_UNITS.has(baseUnit)
    ) {
      return {
        accepted: false,
        reason: "unsupported pantry weight-to-volume mismatch",
        rejection_class: "unsupported_pantry_weight_to_volume_mismatch",
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

  const presentationTitle = String(presentation.title ?? "").trim();
  const recipeName = String(recipe?.name ?? "").trim();

  const presentationImageUrl = String(presentation.image_url ?? "").trim();
  const recipeImage = String(recipe?.image ?? "").trim();

  const restaurantPrice = Number(
    presentation.restaurant_price ?? recipe?.restaurantPrice ?? 0
  );
  const homeCost = Number(
    presentation.home_cost ?? recipe?.homeCost ?? 0
  );
  const computedSavings = Math.max(0, restaurantPrice - homeCost);

  return {
    id: recipe?.id ?? "",
    name: presentationTitle || recipeName || "Untitled Recipe",
    image_url: presentationImageUrl || recipeImage,
    restaurant_price: restaurantPrice,
    home_cost: homeCost,
    savings: computedSavings,
    readiness_pct: computeReadinessPct(recipe, state),
  };
}

function collectSelectedRecipesFromMealPlan(state) {
  const mealPlan = state?.mealPlan ?? {};
  const allRecipes = state?.recipes ?? [];
  const scaledRecipes = [];

  for (const dayPlan of Object.values(mealPlan)) {
    if (!dayPlan || typeof dayPlan !== "object") continue;

    for (const slotKey of ["breakfast", "lunch", "dinner"]) {
      const slot = coerceSlot(dayPlan[slotKey]);
      if (!slot.recipeId) continue;

      const recipe = allRecipes.find((r) => r?.id === slot.recipeId);
      if (!recipe) continue;

      scaledRecipes.push(scaleRecipeForEngine(recipe, slot.portions));
    }
  }

  return scaledRecipes;
}

function getChefMayaStepGuidance(stepText, stepIndex) {
  const normalized = normalizeKey(stepText);

  if (normalized.includes("boil") || normalized.includes("al dente")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Bring the water to a steady boil first, salt it if you like, and start checking a minute or two before the box time so the pasta keeps some bite.",
    };
  }

  if (normalized.includes("season") || normalized.includes("cook chicken")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Pat the chicken dry, season the surface, and leave it in place long enough to brown before turning. Slice it after a short rest so it stays juicy.",
    };
  }

  if (normalized.includes("simmer") || normalized.includes("cream") || normalized.includes("sauce")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Keep this part at a gentle simmer, not a hard boil. Add the cheese gradually and stir until smooth so the sauce stays creamy.",
    };
  }

  if (normalized.includes("toss")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Add the pasta while it is still warm and toss until the sauce coats it evenly. If it looks tight, loosen it with a small splash of cooking liquid.",
    };
  }

  if (normalized.includes("cook rice")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Start the rice early because it sets the pace for the whole meal. Keep the lid on while it cooks and let it rest briefly before fluffing.",
    };
  }

  if (normalized.includes("brown beef")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Use a hot pan, break the meat into pieces, and let the moisture cook off so it browns instead of steaming.",
    };
  }

  if (normalized.includes("warm beans") || normalized.includes("assemble bowls")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Warm the beans gently and build the bowls just before serving so the textures stay distinct and the rice does not turn gummy.",
    };
  }

  if (normalized.includes("roast broccoli")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Spread the broccoli out so the heat can reach each piece. Crowding the pan traps steam and softens the edges too quickly.",
    };
  }

  if (normalized.includes("pan-sear salmon")) {
    return {
      title: `Step ${stepIndex + 1} clarification`,
      detail:
        "Let the pan heat first, then place the salmon down and leave it mostly undisturbed so it can release cleanly when it is ready to turn.",
    };
  }

  return {
    title: `Step ${stepIndex + 1} clarification`,
    detail:
      "Read this step through once before starting, set out what you need, and keep the heat moderate unless the pan clearly needs stronger browning.",
  };
}

function buildChefMayaStepClarifications(recipe) {
  const steps = recipe?.steps ?? [];
  return steps.slice(0, 4).map((stepText, index) => getChefMayaStepGuidance(stepText, index));
}

function buildChefMayaSubstitutions(recipe) {
  const seen = new Set();
  const substitutions = [];

  for (const line of recipe?.ingredients ?? []) {
    const key = normalizeKey(line?.key ?? line?.name);
    if (!key || seen.has(key)) continue;

    const entry = CHEF_MAYA_SUBSTITUTIONS[key];
    if (!entry) continue;

    seen.add(key);
    substitutions.push({
      ingredient: entry.label,
      guidance: entry.guidance,
    });
  }

  return substitutions.slice(0, 4);
}

function buildChefMayaTimingAndTechnique(recipe, { portions = DEFAULT_PORTIONS, readinessPct = 0 } = {}) {
  const ingredients = (recipe?.ingredients ?? []).map((line) =>
    normalizeKey(line?.key ?? line?.name)
  );
  const ingredientSet = new Set(ingredients);
  const notes = [];

  notes.push({
    title: "Before you start",
    detail:
      readinessPct < 100
        ? "Set out the ingredients you still need first, then read the steps once from top to bottom so the cook flow stays calm."
        : "Set out your ingredients and read the steps once before turning on the heat so the cook flow stays calm."
  });

  if (ingredientSet.has("rice") || ingredientSet.has("pasta")) {
    notes.push({
      title: "Start the base first",
      detail:
        "Begin the rice or pasta early because it usually takes the longest and gives you a smoother rhythm for the rest of the recipe.",
    });
  }

  if (ingredientSet.has("chicken breast") || ingredientSet.has("ground beef") || ingredientSet.has("salmon")) {
    notes.push({
      title: "Protein handling",
      detail:
        "Preheat the pan first and avoid moving the protein too soon. Better contact gives you cleaner browning and simpler timing.",
    });
  }

  if (ingredientSet.has("heavy cream") || ingredientSet.has("parmesan")) {
    notes.push({
      title: "Sauce control",
      detail:
        "Use gentle heat once dairy and cheese are involved. Fast boiling can make the sauce separate or tighten more than you want.",
    });
  }

  if (ingredientSet.has("broccoli") || ingredientSet.has("beans")) {
    notes.push({
      title: "Vegetable timing",
      detail:
        "Cook vegetables just until tender. Stopping a little early usually gives the final plate a better texture.",
    });
  }

  if (Number(portions) > DEFAULT_PORTIONS) {
    notes.push({
      title: "Larger batch note",
      detail:
        "With bigger portions, give the pan a little more time to recover its heat between additions so the food browns instead of steaming.",
    });
  }

  return notes.slice(0, 4);
}

export function selectChefMayaHelp(recipe, options = {}) {
  const safeRecipe = recipe ?? {};
  const safePortions =
    Number.isFinite(Number(options?.portions)) && Number(options.portions) > 0
      ? Number(options.portions)
      : DEFAULT_PORTIONS;

  const readinessPct =
    Number.isFinite(Number(options?.readinessPct)) && Number(options.readinessPct) >= 0
      ? Number(options.readinessPct)
      : 0;

  return {
    intro:
      "Chef Maya keeps the cooking flow simple here: clear step guidance, safe substitutions, and steady technique reminders.",
    stepClarifications: buildChefMayaStepClarifications(safeRecipe),
    substitutions: buildChefMayaSubstitutions(safeRecipe),
    timingAndTechnique: buildChefMayaTimingAndTechnique(safeRecipe, {
      portions: safePortions,
      readinessPct,
    }),
  };
}

export function selectRecipesForGrid(state) {
  const realRecipes = state?.recipes ?? [];

  return realRecipes.map((recipe) =>
    adaptRecipeForSelectionCard(recipe, state)
  );
}

export function selectWeeklyTotals(state) {
  const selectedRecipes = collectSelectedRecipesFromMealPlan(state);

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
  const selectedRecipes = collectSelectedRecipesFromMealPlan(state);

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

export function selectShoppingList(state) {
  const selectedRecipes = collectSelectedRecipesFromMealPlan(state);

  if (!selectedRecipes.length) {
    return {
      hasMeals: false,
      cartTotal: 0,
      items: [],
    };
  }

  const adaptedRecipes = adaptRecipesForWeeklyEngine(selectedRecipes);
  const adaptedPantry = adaptPantryItemsForEngine(state);

  const engineResult = computeWeeklySavingsEngineV1({
    recipes: adaptedRecipes.recipes,
    ingredientMaster,
    pantryItems: adaptedPantry.pantryItems,
  });

  const cart = engineResult?.cart ?? {};
  const netRequired = cart.net_required_base ?? {};
  const packagesToBuy = cart.packages_to_buy ?? {};
  const costByIngredient = cart.cost_by_ingredient ?? {};

  const ingredientIds = Array.from(
    new Set([
      ...Object.keys(netRequired),
      ...Object.keys(packagesToBuy),
      ...Object.keys(costByIngredient),
    ])
  ).filter((ingredientId) => {
    const needQty = Number(netRequired[ingredientId] ?? 0);
    const packages = Number(packagesToBuy[ingredientId] ?? 0);
    const cost = Number(costByIngredient[ingredientId] ?? 0);

    return needQty > 0 || packages > 0 || cost > 0;
  });

  const items = ingredientIds
    .map((ingredientId) => {
      const unit = ingredientMaster[ingredientId]?.base_unit ?? "";
      const needQty = Number(netRequired[ingredientId] ?? 0);
      const packages = Number(packagesToBuy[ingredientId] ?? 0);
      const cost = Number(costByIngredient[ingredientId] ?? 0);

      return {
        ingredientId,
        label: formatIngredientLabelForShopping(ingredientId),
        needQty,
        needQtyText: formatBaseQtyForShopping(needQty),
        unit,
        packages,
        cost,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    hasMeals: true,
    cartTotal: Number(cart.cart_total_cost ?? 0),
    items,
  };
}