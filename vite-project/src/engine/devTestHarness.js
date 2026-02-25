// src/engine/devTestHarness.js
// DarsNest Savings Engine v1 — Dev-Only Stress Test Harness
// Constraints: NO UI imports. NO Supabase. Pure engine only.
// Run: `node src/engine/devTestHarness.js` (or wire `npm run dev:test`)

//////////////////////////////////////////////////////////////
// IMPORT YOUR PURE ENGINE HERE
//////////////////////////////////////////////////////////////

// EXPECTED EXPORT (pick ONE and make it real in your engine):
//   export function computeWeeklySavingsEngineV1(input) { ... }
//
// EXPECTED INPUT SHAPE:
// {
//   recipes: Recipe[],
//   ingredientMaster: Record<ingredient_id, IngredientMaster>,
//   pantryItems: PantryItem[],
// }
//
// EXPECTED OUTPUT SHAPE (minimum):
// {
//   weeklyTotals: { restaurant_total, home_total_out_of_pocket, weekly_savings_total },
//   cart: { cart_total_cost, cost_by_ingredient, packages_to_buy?, net_required_base? },
//   perRecipe: { [recipeId]: { home_cost_allocated, restaurant_price, savings } },
//   debug?: { net_required_base?, packages_to_buy?, ... } // optional but helpful
// }
//
// NOTE: If your actual names differ, fix the import + adapter below.

import { computeWeeklySavingsEngineV1 as ENGINE } from "./index.js";

//////////////////////////////////////////////////////////////
// SMALL TEST UTILITIES (NO LIBS)
//////////////////////////////////////////////////////////////

const EPS = 0.01;

function money(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertClose(a, b, eps, msg) {
  if (Math.abs(a - b) > eps) throw new Error(`${msg} | got=${a} expected=${b}`);
}

function sum(obj) {
  let s = 0;
  for (const k of Object.keys(obj)) s += obj[k];
  return s;
}

function printScenarioHeader(name) {
  console.log("\n" + "═".repeat(72));
  console.log(`SCENARIO: ${name}`);
  console.log("═".repeat(72));
}

function printTotals(totals) {
  console.log(
    `restaurant_total=$${money(totals.restaurant_total)}  ` +
      `home_total=$${money(totals.home_total_out_of_pocket)}  ` +
      `savings_total=$${money(totals.weekly_savings_total)}`
  );
}

//////////////////////////////////////////////////////////////
// FIXED TEST DATA (BASE UNITS MATCH INPUT UNITS TO AVOID
// CONVERSION NOISE INSIDE THE HARNESS)
//////////////////////////////////////////////////////////////

// Base units here are intentionally simple for deterministic tests.
const ingredientMaster = {
  rice:   { id: "rice",   base_unit: "cup",  package_size: 10, package_price: 4.00 },
  chicken:{ id: "chicken",base_unit: "lb",   package_size: 1,  package_price: 5.00 },
  salsa:  { id: "salsa",  base_unit: "jar",  package_size: 1,  package_price: 3.50 },
  spice:  { id: "spice",  base_unit: "tbsp", package_size: 5,  package_price: 3.00 },
};

// Helper recipe factory.
// IMPORTANT: ingredient qty are assumed already scaled to current servings for engine v1.
function recipe(id, restaurantPrice, ingredients) {
  return {
    id,
    restaurant_price_estimate: restaurantPrice,
    servings_default: 2,
    servings_current: 2,
    ingredients: ingredients.map((x) => ({
      ingredient_id: x.ingredient_id,
      qty: x.qty,
      unit: x.unit,
      // optional base_qty (for engines that scale internally)
      base_qty: x.base_qty ?? x.qty,
    })),
  };
}

// Optional scaling helper for scenarios (if your engine expects pre-scaled inputs).
function scaleRecipeLinear(r, newServings) {
  const factor = newServings / r.servings_current;
  return {
    ...r,
    servings_current: newServings,
    restaurant_price_estimate: r.restaurant_price_estimate * factor,
    ingredients: r.ingredients.map((line) => ({
      ...line,
      qty: line.qty * factor,
    })),
  };
}

//////////////////////////////////////////////////////////////
// ADAPTER (VALIDATE ENGINE OUTPUT SHAPE)
//////////////////////////////////////////////////////////////

function runEngine({ recipes, pantryItems }) {
  const out = ENGINE({
    recipes,
    ingredientMaster,
    pantryItems,
  });

  assert(out && typeof out === "object", "Engine returned null/invalid output");
  assert(out.weeklyTotals, "Engine output missing weeklyTotals");
  assert(out.cart, "Engine output missing cart");
  assert(out.perRecipe, "Engine output missing perRecipe");

  const t = out.weeklyTotals;
  assert(
    typeof t.restaurant_total === "number" &&
      typeof t.home_total_out_of_pocket === "number" &&
      typeof t.weekly_savings_total === "number",
    "weeklyTotals missing required numeric fields"
  );

  return out;
}

//////////////////////////////////////////////////////////////
// REQUIRED VALIDATIONS (ALL SCENARIOS)
//////////////////////////////////////////////////////////////

function validateCommon(name, out) {
  const { weeklyTotals, cart, perRecipe } = out;

  // Output required print line
  printTotals(weeklyTotals);

  // Allocation check: sum(recipe_home_costs) === home_total (within 1 cent)
  const recipeHomeCosts = {};
  for (const [rid, fin] of Object.entries(perRecipe)) {
    assert(typeof fin.home_cost_allocated === "number", `perRecipe[${rid}].home_cost_allocated missing`);
    recipeHomeCosts[rid] = fin.home_cost_allocated;
  }
  const allocSum = sum(recipeHomeCosts);
  assertClose(
    money(allocSum),
    money(weeklyTotals.home_total_out_of_pocket),
    EPS,
    `[${name}] Allocation sum must equal home_total_out_of_pocket (±$0.01)`
  );

  // Shopping list quantities never negative (if provided by engine)
  const net = cart.net_required_base ?? out.debug?.net_required_base;
  if (net) {
    for (const [iid, qty] of Object.entries(net)) {
      assert(qty >= -1e-9, `[${name}] net_required_base negative for ${iid}: ${qty}`);
    }
  }

  // Packages never negative (if provided by engine)
  const pkgs = cart.packages_to_buy ?? out.debug?.packages_to_buy;
  if (pkgs) {
    for (const [iid, n] of Object.entries(pkgs)) {
      assert(Number.isInteger(n) && n >= 0, `[${name}] packages_to_buy invalid for ${iid}: ${n}`);
    }
  }
}

//////////////////////////////////////////////////////////////
// SCENARIOS (6–8) — REQUIRED MINIMUMS INCLUDED
//////////////////////////////////////////////////////////////

function scenario1_singleRecipe_noPantry() {
  const name = "1) Single recipe, no pantry";
  printScenarioHeader(name);

  const recipes = [
    recipe("A", 22.00, [
      { ingredient_id: "rice", qty: 3, unit: "cup" },     // 3 cups
      { ingredient_id: "chicken", qty: 1, unit: "lb" },   // 1 lb
    ]),
  ];
  const pantryItems = [];

  const out = runEngine({ recipes, pantryItems });
  validateCommon(name, out);

  // Expected: rice 3 cups => 1 bag ($4), chicken 1 lb => 1 pkg ($5) => cart $9
  assertClose(money(out.weeklyTotals.home_total_out_of_pocket), 9.00, EPS, `[${name}] home_total`);
}

function scenario2_twoRecipes_sharedIngredient_poolingAndRounding() {
  const name = "2) Two recipes sharing 1 ingredient (pooling + rounding)";
  printScenarioHeader(name);

  const recipes = [
    recipe("A", 20.00, [{ ingredient_id: "rice", qty: 6, unit: "cup" }]), // 6 cups
    recipe("B", 24.00, [{ ingredient_id: "rice", qty: 5, unit: "cup" }]), // 5 cups
  ];
  const pantryItems = [];

  const out = runEngine({ recipes, pantryItems });
  validateCommon(name, out);

  // Total rice=11 cups => ceil(11/10)=2 bags => $8
  assertClose(money(out.weeklyTotals.home_total_out_of_pocket), 8.00, EPS, `[${name}] home_total should be 2 rice bags`);
}

function scenario3_pantryPartiallyCoversSharedIngredient() {
  const name = "3) Pantry partially covers shared ingredient";
  printScenarioHeader(name);

  const recipes = [
    recipe("A", 20.00, [{ ingredient_id: "rice", qty: 6, unit: "cup" }]),
    recipe("B", 24.00, [{ ingredient_id: "rice", qty: 5, unit: "cup" }]),
  ];

  // Pantry has 1 cup rice => net = 10 cups => 1 bag => $4
  const pantryItems = [{ ingredient_id: "rice", qty: 1, unit: "cup" }];

  const out = runEngine({ recipes, pantryItems });
  validateCommon(name, out);

  assertClose(money(out.weeklyTotals.home_total_out_of_pocket), 4.00, EPS, `[${name}] home_total should drop to 1 rice bag`);
}

function scenario4_pantryFullyCoversIngredient_costZero() {
  const name = "4) Pantry fully covers an ingredient (cost must be $0)";
  printScenarioHeader(name);

  const recipes = [
    recipe("A", 18.00, [
      { ingredient_id: "spice", qty: 2, unit: "tbsp" }, // needs 2 tbsp
    ]),
  ];

  // Pantry has 10 tbsp spice => fully covers (net 0)
  const pantryItems = [{ ingredient_id: "spice", qty: 10, unit: "tbsp" }];

  const out = runEngine({ recipes, pantryItems });
  validateCommon(name, out);

  assertClose(money(out.weeklyTotals.home_total_out_of_pocket), 0.00, EPS, `[${name}] home_total must be $0`);
}

function scenario5_portionScalingChangesTotals_fullCascade() {
  const name = "5) Portion scaling changes totals (full recalc changes dependent outputs)";
  printScenarioHeader(name);

  const base = recipe("A", 22.00, [
    { ingredient_id: "rice", qty: 3, unit: "cup" },    // base at servings_current=2
    { ingredient_id: "chicken", qty: 1, unit: "lb" },
  ]);

  const pantryItems = [];

  const out1 = runEngine({ recipes: [base], pantryItems });
  validateCommon(name + " — baseline", out1);

  const scaled = scaleRecipeLinear(base, 4); // double servings -> double ingredients + restaurant estimate
  const out2 = runEngine({ recipes: [scaled], pantryItems });
  validateCommon(name + " — scaled x2", out2);

  // Must change totals
  assert(money(out1.weeklyTotals.home_total_out_of_pocket) !== money(out2.weeklyTotals.home_total_out_of_pocket),
    `[${name}] home_total should change after scaling`);
  assert(money(out1.weeklyTotals.restaurant_total) !== money(out2.weeklyTotals.restaurant_total),
    `[${name}] restaurant_total should change after scaling`);
  assert(money(out1.weeklyTotals.weekly_savings_total) !== money(out2.weeklyTotals.weekly_savings_total),
    `[${name}] savings_total should change after scaling`);
}

function scenario6_roundingExtraPurchase_allocationStillSumsToCart() {
  const name = "6) Edge: rounding causes extra purchase; allocation still sums exactly to cart cost";
  printScenarioHeader(name);

  // Same as scenario2, but explicitly assert allocation per recipe matches proportional math.
  const recipes = [
    recipe("A", 20.00, [{ ingredient_id: "rice", qty: 1, unit: "cup" }]),
    recipe("B", 24.00, [{ ingredient_id: "rice", qty: 9, unit: "cup" }]),
  ];
  // Total=10 => 1 bag => $4 (no extra)
  // To force extra purchase: make total=11 => 2 bags => $8
  recipes[1].ingredients[0].qty = 10; // A=1, B=10 => total=11 => 2 bags ($8)

  const out = runEngine({ recipes, pantryItems: [] });
  validateCommon(name, out);

  // Cart is $8; allocations should be:
  // A share = 1/11 * 8 = 0.7272...
  // B share = 10/11 * 8 = 7.2727...
  const a = out.perRecipe["A"].home_cost_allocated;
  const b = out.perRecipe["B"].home_cost_allocated;

  assertClose(money(a + b), 8.00, EPS, `[${name}] allocations must sum to cart`);
  assertClose(money(a), money((8 * 1) / 11), 0.02, `[${name}] recipe A allocation proportional`); // slightly looser for rounding
  assertClose(money(b), money((8 * 10) / 11), 0.02, `[${name}] recipe B allocation proportional`);
}

function scenario7_removeRecipeAfterPooling_recalcIntegrity() {
  const name = "7) Remove a recipe after pooling (recalc integrity)";
  printScenarioHeader(name);

  const A = recipe("A", 20.00, [{ ingredient_id: "rice", qty: 6, unit: "cup" }]);
  const B = recipe("B", 24.00, [{ ingredient_id: "rice", qty: 5, unit: "cup" }]);

  const outBoth = runEngine({ recipes: [A, B], pantryItems: [] });
  validateCommon(name + " — both", outBoth);

  const outOnlyA = runEngine({ recipes: [A], pantryItems: [] });
  validateCommon(name + " — only A", outOnlyA);

  // With both: 11 cups => 2 bags => $8
  // Only A: 6 cups => 1 bag => $4
  assertClose(money(outBoth.weeklyTotals.home_total_out_of_pocket), 8.00, EPS, `[${name}] both home_total`);
  assertClose(money(outOnlyA.weeklyTotals.home_total_out_of_pocket), 4.00, EPS, `[${name}] onlyA home_total`);

  assert(outOnlyA.weeklyTotals.home_total_out_of_pocket < outBoth.weeklyTotals.home_total_out_of_pocket,
    `[${name}] home_total should drop after removing recipe`);
}

function scenario8_toggleIngredientAvailability_simulated() {
  const name = "8) Toggle ingredient availability (simulated) affects shopping list + totals";
  printScenarioHeader(name);

  // Two-ingredient recipe
  const recipes = [
    recipe("A", 22.00, [
      { ingredient_id: "rice", qty: 3, unit: "cup" },
      { ingredient_id: "salsa", qty: 1, unit: "jar" },
    ]),
  ];

  // Baseline: rice 3 cups => 1 bag $4; salsa 1 jar => 1 $3.50 => $7.50
  const outBaseline = runEngine({ recipes, pantryItems: [] });
  validateCommon(name + " — baseline", outBaseline);
  assertClose(money(outBaseline.weeklyTotals.home_total_out_of_pocket), 7.50, EPS, `[${name}] baseline home_total`);

  // Simulated toggle: user marks salsa "available" for this plan
  // Model it as pantry addition for this calc only (cash flow model).
  const outToggled = runEngine({
    recipes,
    pantryItems: [{ ingredient_id: "salsa", qty: 1, unit: "jar" }],
  });
  validateCommon(name + " — salsa toggled available", outToggled);

  // Now salsa cost should be $0; total becomes just rice bag $4
  assertClose(money(outToggled.weeklyTotals.home_total_out_of_pocket), 4.00, EPS, `[${name}] toggled home_total should drop`);
}

//////////////////////////////////////////////////////////////
// HARNESS RUNNER
//////////////////////////////////////////////////////////////

function runScenario(fn, scenarioName) {
  try {
    fn();
    console.log(`✅ PASS — ${scenarioName}`);
  } catch (err) {
    console.error(`❌ FAIL — ${scenarioName}`);
    throw err; // requirement: throw with scenario name
  }
}

function main() {
  console.log("DarsNest Savings Engine v1 — Dev Test Harness");
  console.log("Rules validated: pooling → pantry → package rounding → cart → allocation → totals");

  runScenario(scenario1_singleRecipe_noPantry, "Scenario 1");
  runScenario(scenario2_twoRecipes_sharedIngredient_poolingAndRounding, "Scenario 2");
  runScenario(scenario3_pantryPartiallyCoversSharedIngredient, "Scenario 3");
  runScenario(scenario4_pantryFullyCoversIngredient_costZero, "Scenario 4");
  runScenario(scenario5_portionScalingChangesTotals_fullCascade, "Scenario 5");
  runScenario(scenario6_roundingExtraPurchase_allocationStillSumsToCart, "Scenario 6");
  runScenario(scenario7_removeRecipeAfterPooling_recalcIntegrity, "Scenario 7");
  runScenario(scenario8_toggleIngredientAvailability_simulated, "Scenario 8");

  console.log("\n🎯 ALL SCENARIOS PASSED");
}

main();