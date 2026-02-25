/**
 * DarsNest Savings Engine v1 — PURE
 * No UI. No Supabase. No side effects.
 *
 * Implements:
 * 1) Pool ingredients across recipes
 * 2) Pantry subtraction (cash-flow model: pantry treated as $0)
 * 3) Package rounding (minimum purchase)
 * 4) Cart-level cost
 * 5) Proportional allocation back to recipes
 * 6) Weekly totals
 */

function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function ceilDiv(n, d) {
  return Math.ceil(n / d);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/**
 * Convert qty in `unit` to ingredient master base_unit.
 * v1 harness uses base units already; this converter is strict:
 * - If unit === base_unit => pass through
 * - Else throw (so we don't silently lie)
 */
export function convertToBaseUnit(ingredientId, qty, unit, baseUnit) {
  if (unit === baseUnit) return qty;
  throw new Error(
    `Unit conversion missing for ingredient=${ingredientId}: ${qty} ${unit} -> base_unit=${baseUnit}`
  );
}

/**
 * Primary entrypoint expected by devTestHarness.js
 */
export function computeWeeklySavingsEngineV1({ recipes, ingredientMaster, pantryItems }) {
  assert(Array.isArray(recipes), "recipes must be an array");
  assert(ingredientMaster && typeof ingredientMaster === "object", "ingredientMaster required");
  assert(Array.isArray(pantryItems), "pantryItems must be an array");

  // ---------------------------
  // STEP 1 — POOL USAGE (BASE)
  // ---------------------------
  const pooled_required_base = {}; // ingredientId -> total qty in base
  const total_usage_by_ingredient = {}; // ingredientId -> total qty in base (same as pooled)
  const usage_by_recipe_and_ingredient = {}; // `${recipeId}::${ingredientId}` -> qty in base

  for (const r of recipes) {
    assert(r && r.id, "recipe missing id");
    assert(Array.isArray(r.ingredients), `recipe ${r.id} missing ingredients array`);

    for (const line of r.ingredients) {
      const iid = line.ingredient_id;
      const master = ingredientMaster[iid];
      assert(master, `ingredientMaster missing ${iid}`);
      assert(typeof master.package_size === "number", `ingredientMaster.${iid}.package_size missing`);
      assert(typeof master.package_price === "number", `ingredientMaster.${iid}.package_price missing`);

      const baseQty = convertToBaseUnit(iid, line.qty, line.unit, master.base_unit);

      pooled_required_base[iid] = (pooled_required_base[iid] ?? 0) + baseQty;
      total_usage_by_ingredient[iid] = (total_usage_by_ingredient[iid] ?? 0) + baseQty;

      const key = `${r.id}::${iid}`;
      usage_by_recipe_and_ingredient[key] = (usage_by_recipe_and_ingredient[key] ?? 0) + baseQty;
    }
  }

  // -----------------------------------------
  // STEP 2 — PANTRY SUBTRACTION (CASH-FLOW)
  // -----------------------------------------
  const pantry_available_base = {}; // ingredientId -> qty in base
  for (const p of pantryItems) {
    const iid = p.ingredient_id;
    const master = ingredientMaster[iid];
    assert(master, `ingredientMaster missing ${iid} (pantry)`);
    const baseQty = convertToBaseUnit(iid, p.qty, p.unit, master.base_unit);
    pantry_available_base[iid] = (pantry_available_base[iid] ?? 0) + baseQty;
  }

  const net_required_base = {}; // ingredientId -> max(0, pooled - pantry)
  for (const iid of Object.keys(pooled_required_base)) {
    const required = pooled_required_base[iid];
    const avail = pantry_available_base[iid] ?? 0;
    const net = required - avail;
    net_required_base[iid] = net > 0 ? net : 0;

    // guard: never negative
    assert(net_required_base[iid] >= 0, `net_required_base negative for ${iid}`);
  }

  // -------------------------------------------------
  // STEP 3 — PACKAGE ROUNDING (MINIMUM PURCHASE)
  // -------------------------------------------------
  const packages_to_buy = {}; // ingredientId -> integer
  const purchased_base_quantity = {}; // ingredientId -> packages * package_size
  const purchased_cost = {}; // ingredientId -> packages * package_price

  for (const iid of Object.keys(pooled_required_base)) {
    const master = ingredientMaster[iid];
    const net = net_required_base[iid];

    const pkgSize = master.package_size;
    const pkgPrice = master.package_price;

    assert(pkgSize > 0, `package_size must be > 0 for ${iid}`);
    assert(pkgPrice >= 0, `package_price must be >= 0 for ${iid}`);

    const pkgs = net <= 0 ? 0 : ceilDiv(net, pkgSize);

    packages_to_buy[iid] = pkgs;
    purchased_base_quantity[iid] = pkgs * pkgSize;
    purchased_cost[iid] = roundMoney(pkgs * pkgPrice);

    assert(packages_to_buy[iid] >= 0, `packages_to_buy negative for ${iid}`);
  }

  // -----------------------------------------
  // STEP 4 — CART-LEVEL COST (SHOPPING LIST)
  // -----------------------------------------
  const cost_by_ingredient = {};
  let cart_total_cost = 0;

  for (const iid of Object.keys(purchased_cost)) {
    const c = purchased_cost[iid] ?? 0;
    cost_by_ingredient[iid] = c;
    cart_total_cost += c;
  }
  cart_total_cost = roundMoney(cart_total_cost);

  // ---------------------------------------------------
  // STEP 5 — PROPORTIONAL ALLOCATION BACK TO RECIPES
  // ---------------------------------------------------
  const perRecipe = {}; // recipeId -> { home_cost_allocated, restaurant_price, savings }
  for (const r of recipes) {
    perRecipe[r.id] = {
      home_cost_allocated: 0,
      restaurant_price: Number(r.restaurant_price_estimate ?? 0),
      savings: 0,
    };
  }

  // allocate each ingredient cost to recipes by usage share
  for (const iid of Object.keys(cost_by_ingredient)) {
    const totalCost = cost_by_ingredient[iid];
    const denomUsage = total_usage_by_ingredient[iid] ?? 0;

    if (totalCost <= 0 || denomUsage <= 0) continue;

    for (const r of recipes) {
      const numer = usage_by_recipe_and_ingredient[`${r.id}::${iid}`] ?? 0;
      if (numer <= 0) continue;

      const allocated = (totalCost * numer) / denomUsage;
      perRecipe[r.id].home_cost_allocated += allocated;
    }
  }

  // round recipe costs and compute savings
  for (const r of recipes) {
    perRecipe[r.id].home_cost_allocated = roundMoney(perRecipe[r.id].home_cost_allocated);
    perRecipe[r.id].savings = roundMoney(perRecipe[r.id].restaurant_price - perRecipe[r.id].home_cost_allocated);
  }

  // Small correction pass: make sure allocations sum to cart total within 1 cent
  // (distribute rounding error to the recipe with the largest allocated cost)
  const recipeIds = Object.keys(perRecipe);
  const allocSum = roundMoney(recipeIds.reduce((s, rid) => s + perRecipe[rid].home_cost_allocated, 0));
  const delta = roundMoney(cart_total_cost - allocSum);

  if (Math.abs(delta) >= 0.01 && recipeIds.length > 0) {
    // find recipe with max allocated to absorb delta
    let maxRid = recipeIds[0];
    for (const rid of recipeIds) {
      if (perRecipe[rid].home_cost_allocated > perRecipe[maxRid].home_cost_allocated) maxRid = rid;
    }
    perRecipe[maxRid].home_cost_allocated = roundMoney(perRecipe[maxRid].home_cost_allocated + delta);
    perRecipe[maxRid].savings = roundMoney(perRecipe[maxRid].restaurant_price - perRecipe[maxRid].home_cost_allocated);
  }

  // -----------------------------------------
  // STEP 6 — WEEKLY TOTALS
  // -----------------------------------------
  let restaurant_total = 0;
  for (const r of recipes) restaurant_total += Number(r.restaurant_price_estimate ?? 0);
  restaurant_total = roundMoney(restaurant_total);

  const home_total_out_of_pocket = cart_total_cost; // cash-flow truth
  const weekly_savings_total = roundMoney(restaurant_total - home_total_out_of_pocket);

  const weeklyTotals = {
    restaurant_total,
    home_total_out_of_pocket,
    weekly_savings_total,
  };

  // Return debug fields harness checks (never negative; packages int)
  const cart = {
    cart_total_cost,
    cost_by_ingredient,
    net_required_base,
    packages_to_buy,
    purchased_base_quantity,
  };

  return { weeklyTotals, cart, perRecipe };
}
