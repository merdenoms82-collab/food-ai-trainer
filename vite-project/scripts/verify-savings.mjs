/**
 * Savings proration verification script.
 * Run: node scripts/verify-savings.mjs
 *
 * Computes before (whole-package, no staples in preview) vs after
 * (per-unit, staples $0) for every recipe in the catalog.
 */

// ── Ingredient master (copied from src/engine/ingredientMaster.js) ────────────
const ingredientMaster = {
  rice:            { base_unit: "cup",   package_size: 10,  package_price: 4.00 },
  chicken:         { base_unit: "lb",    package_size: 1,   package_price: 5.00 },
  salsa:           { base_unit: "cup",   package_size: 2,   package_price: 3.50 },
  spice:           { base_unit: "tsp",   package_size: 15,  package_price: 3.00 },
  pasta:           { base_unit: "box",   package_size: 1,   package_price: 1.75 },
  parmesan:        { base_unit: "oz",    package_size: 8,   package_price: 4.50 },
  "heavy cream":   { base_unit: "cup",   package_size: 2,   package_price: 3.50 },
  garlic:          { base_unit: "clove", package_size: 10,  package_price: 0.75 },
  "ground beef":   { base_unit: "lb",    package_size: 1,   package_price: 5.50 },
  beans:           { base_unit: "can",   package_size: 1,   package_price: 1.25 },
  cheese:          { base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  salmon:          { base_unit: "lb",    package_size: 1,   package_price: 9.00 },
  broccoli:        { base_unit: "head",  package_size: 1,   package_price: 2.00 },
  "olive oil":     { base_unit: "tbsp",  package_size: 25,  package_price: 8.00 },
  lemon:           { base_unit: "whole", package_size: 1,   package_price: 0.75 },
  eggs:            { base_unit: "whole", package_size: 12,  package_price: 4.00 },
  "egg yolks":     { base_unit: "whole", package_size: 12,  package_price: 4.00 },
  bacon:           { base_unit: "pack",  package_size: 1,   package_price: 6.00 },
  sausage:         { base_unit: "lb",    package_size: 1,   package_price: 4.50 },
  "beef sirloin":  { base_unit: "lb",    package_size: 1,   package_price: 8.00 },
  "beef stew meat":{ base_unit: "lb",    package_size: 1,   package_price: 6.00 },
  ham:             { base_unit: "lb",    package_size: 1,   package_price: 5.00 },
  onion:           { base_unit: "whole", package_size: 1,   package_price: 0.75 },
  tomatoes:        { base_unit: "whole", package_size: 1,   package_price: 1.00 },
  lettuce:         { base_unit: "head",  package_size: 1,   package_price: 2.50 },
  "bell peppers":  { base_unit: "whole", package_size: 1,   package_price: 1.25 },
  potatoes:        { base_unit: "lb",    package_size: 1,   package_price: 1.00 },
  "russet potatoes":{ base_unit: "whole",package_size: 1,   package_price: 0.75 },
  carrots:         { base_unit: "lb",    package_size: 1,   package_price: 1.50 },
  celery:          { base_unit: "stalk", package_size: 1,   package_price: 0.30 },
  "green onions":  { base_unit: "bunch", package_size: 1,   package_price: 1.25 },
  shallot:         { base_unit: "whole", package_size: 1,   package_price: 0.75 },
  cucumber:        { base_unit: "whole", package_size: 1,   package_price: 1.25 },
  ginger:          { base_unit: "whole", package_size: 1,   package_price: 2.00 },
  lime:            { base_unit: "whole", package_size: 1,   package_price: 0.50 },
  basil:           { base_unit: "tbsp",  package_size: 6,   package_price: 3.00 },
  parsley:         { base_unit: "tbsp",  package_size: 8,   package_price: 2.50 },
  dill:            { base_unit: "tbsp",  package_size: 8,   package_price: 2.50 },
  milk:            { base_unit: "cup",   package_size: 8,   package_price: 3.00 },
  butter:          { base_unit: "tbsp",  package_size: 32,  package_price: 5.00 },
  mozzarella:      { base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  ricotta:         { base_unit: "oz",    package_size: 15,  package_price: 4.00 },
  "cheddar cheese":{ base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  "sour cream":    { base_unit: "oz",    package_size: 16,  package_price: 3.00 },
  "swiss cheese":  { base_unit: "oz",    package_size: 8,   package_price: 4.00 },
  "blue cheese":   { base_unit: "oz",    package_size: 5,   package_price: 4.50 },
  "greek yogurt":  { base_unit: "cup",   package_size: 2,   package_price: 3.50 },
  flour:           { base_unit: "tbsp",  package_size: 100, package_price: 2.50 },
  sugar:           { base_unit: "tsp",   package_size: 432, package_price: 3.00 },
  bread:           { base_unit: "loaf",  package_size: 1,   package_price: 3.50 },
  "bread crumbs":  { base_unit: "cup",   package_size: 4,   package_price: 3.00 },
  macaroni:        { base_unit: "box",   package_size: 1,   package_price: 1.75 },
  spaghetti:       { base_unit: "box",   package_size: 1,   package_price: 1.75 },
  "flour tortillas":{ base_unit: "pack", package_size: 1,   package_price: 3.50 },
  "taco shells":   { base_unit: "box",   package_size: 1,   package_price: 3.00 },
  "pancake mix":   { base_unit: "cup",   package_size: 10,  package_price: 3.50 },
  "pie crust":     { base_unit: "box",   package_size: 1,   package_price: 4.50 },
  "dinner rolls":  { base_unit: "pack",  package_size: 1,   package_price: 3.00 },
  "hamburger buns":{ base_unit: "pack",  package_size: 1,   package_price: 3.50 },
  vinegar:         { base_unit: "tbsp",  package_size: 32,  package_price: 3.00 },
  "apple cider vinegar":{ base_unit: "cup", package_size: 2, package_price: 4.00 },
  "pasta sauce":   { base_unit: "jar",   package_size: 1,   package_price: 3.00 },
  "enchilada sauce":{ base_unit: "can",  package_size: 1,   package_price: 2.50 },
  "sloppy joe sauce":{ base_unit: "can", package_size: 1,   package_price: 2.00 },
  "tomato soup":   { base_unit: "can",   package_size: 1,   package_price: 1.50 },
  "crushed tomatoes":{ base_unit: "can", package_size: 1,   package_price: 2.00 },
  "whole peeled tomatoes":{ base_unit: "can", package_size: 1, package_price: 2.50 },
  "diced tomatoes":{ base_unit: "can",   package_size: 1,   package_price: 1.75 },
  "tomato paste":  { base_unit: "tbsp",  package_size: 12,  package_price: 1.50 },
  "black beans":   { base_unit: "can",   package_size: 1,   package_price: 1.25 },
  "kidney beans":  { base_unit: "can",   package_size: 1,   package_price: 1.25 },
  "chicken broth": { base_unit: "cup",   package_size: 4,   package_price: 3.00 },
  "beef broth":    { base_unit: "cup",   package_size: 4,   package_price: 3.50 },
  mayonnaise:      { base_unit: "cup",   package_size: 4,   package_price: 5.50 },
  mustard:         { base_unit: "tbsp",  package_size: 24,  package_price: 2.50 },
  honey:           { base_unit: "tbsp",  package_size: 16,  package_price: 6.00 },
  "maple syrup":   { base_unit: "bottle",package_size: 1,   package_price: 8.00 },
  "bbq sauce":     { base_unit: "bottle",package_size: 1,   package_price: 3.50 },
  pickles:         { base_unit: "jar",   package_size: 1,   package_price: 3.50 },
  "soy sauce":     { base_unit: "tbsp",  package_size: 30,  package_price: 3.50 },
  "teriyaki sauce":{ base_unit: "cup",   package_size: 2,   package_price: 4.00 },
  "adobo sauce":   { base_unit: "tbsp",  package_size: 7,   package_price: 2.50 },
  "chipotle peppers":{ base_unit: "tbsp",package_size: 7,   package_price: 2.50 },
  "prepared horseradish":{ base_unit: "tbsp", package_size: 6, package_price: 3.50 },
  "white wine":    { base_unit: "cup",   package_size: 3,   package_price: 8.00 },
  "frozen french fries":{ base_unit: "bag", package_size: 1, package_price: 4.00 },
  "frozen stir fry mix":{ base_unit: "bag", package_size: 1, package_price: 4.50 },
  "frozen mixed vegetables":{ base_unit: "bag", package_size: 1, package_price: 3.00 },
  "frozen peas":   { base_unit: "cup",   package_size: 4,   package_price: 2.50 },
  "frozen hash browns":{ base_unit: "bag", package_size: 1, package_price: 4.00 },
  "coleslaw mix":  { base_unit: "bag",   package_size: 1,   package_price: 2.50 },
  "garlic powder": { base_unit: "tsp",   package_size: 20,  package_price: 3.00 },
  "onion powder":  { base_unit: "tsp",   package_size: 20,  package_price: 3.00 },
  nutmeg:          { base_unit: "tsp",   package_size: 10,  package_price: 3.50 },
  "cayenne pepper":{ base_unit: "tsp",   package_size: 10,  package_price: 3.00 },
  "red pepper flakes":{ base_unit: "tsp",package_size: 10,  package_price: 3.00 },
  tuna:            { base_unit: "can",   package_size: 1,   package_price: 2.00 },
  turkey:          { base_unit: "lb",    package_size: 1,   package_price: 7.00 },
  avocado:         { base_unit: "whole", package_size: 1,   package_price: 1.50 },
  "feta cheese":   { base_unit: "oz",    package_size: 4,   package_price: 3.00 },
  "rolled oats":   { base_unit: "cup",   package_size: 10,  package_price: 3.50 },
  "frozen berries":{ base_unit: "bag",   package_size: 1,   package_price: 4.50 },
  banana:          { base_unit: "whole", package_size: 1,   package_price: 0.30 },
};

// ── Pantry staples ($0 in after mode) ─────────────────────────────────────────
const STAPLE_IDS = new Set([
  "spice", "olive oil", "butter", "garlic powder", "onion powder",
  "cayenne pepper", "red pepper flakes", "nutmeg", "basil", "parsley",
  "dill", "mustard", "mayonnaise", "vinegar", "apple cider vinegar",
  "soy sauce", "bbq sauce", "tomato paste", "adobo sauce", "chipotle peppers",
  "prepared horseradish", "flour", "sugar", "honey", "bread crumbs",
]);

// Ingredients whose base_unit is a package/container type — recipe must use matching unit.
const PKG_CONTAINER_BASE_UNITS = new Set(["jar"]);
const NON_QUANTITATIVE = new Set(["to taste", "pinch", "dash", "as needed"]);

function normalizeKey(v) { return String(v ?? "").trim().toLowerCase(); }
function singularize(u) {
  const n = normalizeKey(u);
  if (!n) return "";
  if (n === "cloves") return "clove";
  if (n === "heads") return "head";
  if (n === "whole") return "whole";
  if (n.endsWith("s")) return n.slice(0, -1);
  return n;
}
function normalizeFraction(s) {
  return s.replace(/^(\d+)\/(\d+)/, (_, n, d) => {
    const denom = parseInt(d, 10);
    return denom === 0 ? _ : String(parseInt(n, 10) / denom);
  });
}
function mapKey(rawKey) {
  if (rawKey === "chicken breast") return "chicken";
  if (rawKey === "salt") return "spice";
  if (rawKey === "black pepper") return "spice";
  return rawKey;
}

// Returns { accepted: bool, ingredient_id, qty } or { accepted: false }
function parseIngredient(line) {
  const sourceKey = normalizeKey(line.key ?? line.name ?? "");
  const iid = mapKey(sourceKey);
  if (!iid) return { accepted: false, reason: "no key" };
  const master = ingredientMaster[iid];
  if (!master) return { accepted: false, reason: `no master for ${iid}` };

  const rawQty = normalizeKey(line.qty ?? "");
  if (!rawQty || NON_QUANTITATIVE.has(rawQty)) return { accepted: false, reason: "non-quantitative" };

  const baseUnit = singularize(master.base_unit);
  const qtyStr = normalizeFraction(rawQty);

  // Try "number unit"
  const unitMatch = qtyStr.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/);
  if (unitMatch) {
    const qty = parseFloat(unitMatch[1]);
    const unit = singularize(unitMatch[2]);
    if (!isFinite(qty) || qty <= 0) return { accepted: false, reason: "bad qty" };
    if (unit !== baseUnit) return { accepted: false, reason: `unit mismatch: ${unit} vs ${baseUnit}` };
    return { accepted: true, ingredient_id: iid, qty };
  }

  // Try bare number (only if base_unit is "whole")
  const bareMatch = qtyStr.match(/^(\d+(?:\.\d+)?)$/);
  if (bareMatch && baseUnit === "whole") {
    const qty = parseFloat(bareMatch[1]);
    if (!isFinite(qty) || qty <= 0) return { accepted: false, reason: "bad qty" };
    return { accepted: true, ingredient_id: iid, qty };
  }

  return { accepted: false, reason: `unparseable: "${rawQty}" for base_unit=${master.base_unit}` };
}

function roundMoney(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

// Before: whole-package, no staple exemption
function computeBefore(ingredients) {
  let total = 0;
  const details = [];
  for (const line of ingredients) {
    const p = parseIngredient(line);
    if (!p.accepted) { details.push({ key: line.key, reason: p.reason, cost: 0 }); continue; }
    const m = ingredientMaster[p.ingredient_id];
    const pkgs = Math.ceil(p.qty / m.package_size);
    const cost = roundMoney(pkgs * m.package_price);
    total += cost;
    details.push({ key: line.key, iid: p.ingredient_id, qty: p.qty, pkgs, cost });
  }
  return { total: roundMoney(total), details };
}

// After: per-unit, staples $0
function computeAfter(ingredients) {
  let total = 0;
  const details = [];
  for (const line of ingredients) {
    const p = parseIngredient(line);
    if (!p.accepted) { details.push({ key: line.key, reason: p.reason, cost: 0 }); continue; }
    if (STAPLE_IDS.has(p.ingredient_id)) { details.push({ key: line.key, iid: p.ingredient_id, cost: 0, note: "staple" }); continue; }
    const m = ingredientMaster[p.ingredient_id];
    const cost = roundMoney(p.qty * (m.package_price / m.package_size));
    total += cost;
    details.push({ key: line.key, iid: p.ingredient_id, qty: p.qty, cost });
  }
  return { total: roundMoney(total), details };
}

// ── All recipes ────────────────────────────────────────────────────────────────
const recipes = [
  // AMERICAN
  { id: "r_salmon_veg", name: "Salmon + Veg", restaurantPrice: 28, ingredientLines: [
    { key: "salmon", qty: "1.5 lb" }, { key: "broccoli", qty: "1 head" },
    { key: "olive oil", qty: "1 tbsp" }, { key: "salt", qty: "to taste" },
    { key: "black pepper", qty: "to taste" }, { key: "lemon", qty: "1 whole" },
  ]},
  { id: "r_cheeseburgers_fries", name: "Cheeseburgers & Fries", restaurantPrice: 28, ingredientLines: [
    { key: "ground beef", qty: "1.5 lb" }, { key: "hamburger buns", qty: "1 pack" },
    { key: "cheddar cheese", qty: "8 oz" }, { key: "frozen french fries", qty: "1 bag" },
    { key: "lettuce", qty: "1 head" }, { key: "tomatoes", qty: "2 whole" },
  ]},
  { id: "r_sloppy_joes", name: "Sloppy Joes", restaurantPrice: 17, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "hamburger buns", qty: "1 pack" },
    { key: "sloppy joe sauce", qty: "1 can" }, { key: "onion", qty: "1 whole" },
    { key: "frozen french fries", qty: "1 bag" }, { key: "pickles", qty: "1 jar" },
  ]},
  { id: "r_bbq_chicken_sandwiches", name: "BBQ Chicken Sandwiches", restaurantPrice: 21, ingredientLines: [
    { key: "chicken breast", qty: "1.5 lb" }, { key: "bbq sauce", qty: "1 bottle" },
    { key: "hamburger buns", qty: "1 pack" }, { key: "coleslaw mix", qty: "1 bag" },
    { key: "mayonnaise", qty: "1/4 cup" }, { key: "pickles", qty: "1 jar" },
  ]},
  // BREAKFAST
  { id: "r_breakfast_burritos", name: "Breakfast Burritos", restaurantPrice: 26, ingredientLines: [
    { key: "eggs", qty: "6 whole" }, { key: "flour tortillas", qty: "1 pack" },
    { key: "cheddar cheese", qty: "8 oz" }, { key: "sausage", qty: "1 lb" },
    { key: "frozen hash browns", qty: "1 bag" }, { key: "salsa", qty: "1 cup" },
  ]},
  { id: "r_bacon_eggs_toast", name: "Bacon, Eggs & Toast", restaurantPrice: 14, ingredientLines: [
    { key: "eggs", qty: "4 whole" }, { key: "bacon", qty: "1 pack" },
    { key: "bread", qty: "1 loaf" }, { key: "butter", qty: "2 tbsp" },
    { key: "potatoes", qty: "1 lb" }, { key: "salt", qty: "to taste" },
  ]},
  { id: "r_pancakes_bacon", name: "Pancakes & Bacon", restaurantPrice: 26, ingredientLines: [
    { key: "pancake mix", qty: "2 cups" }, { key: "eggs", qty: "2 whole" },
    { key: "milk", qty: "1.5 cups" }, { key: "bacon", qty: "1 pack" },
    { key: "butter", qty: "2 tbsp" }, { key: "maple syrup", qty: "1 bottle" },
  ]},
  { id: "r_overnight_oats", name: "Overnight Oats", restaurantPrice: 12, ingredientLines: [
    { key: "rolled oats", qty: "1 cup" }, { key: "milk", qty: "1 cup" },
    { key: "greek yogurt", qty: "1/2 cup" }, { key: "honey", qty: "2 tbsp" },
  ]},
  { id: "r_avocado_toast_eggs", name: "Avocado Toast with Eggs", restaurantPrice: 14, ingredientLines: [
    { key: "avocado", qty: "2 whole" }, { key: "bread", qty: "1 loaf" },
    { key: "eggs", qty: "4 whole" }, { key: "lemon", qty: "1 whole" },
    { key: "red pepper flakes", qty: "1/4 tsp" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_berry_smoothie", name: "Berry Smoothie", restaurantPrice: 14, ingredientLines: [
    { key: "frozen berries", qty: "1 bag" }, { key: "banana", qty: "1 whole" },
    { key: "greek yogurt", qty: "1 cup" }, { key: "milk", qty: "1 cup" },
    { key: "honey", qty: "2 tbsp" },
  ]},
  { id: "r_egg_veggie_muffins", name: "Egg & Veggie Muffins", restaurantPrice: 10, ingredientLines: [
    { key: "eggs", qty: "6 whole" }, { key: "bell peppers", qty: "1 whole" },
    { key: "onion", qty: "1/2 whole" }, { key: "cheddar cheese", qty: "4 oz" },
    { key: "salt", qty: "1/2 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  // MEXICAN
  { id: "r_taco_bowls", name: "Taco Bowls", restaurantPrice: 18, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "rice", qty: "1 cup" },
    { key: "beans", qty: "1 can" }, { key: "cheese", qty: "8 oz" },
    { key: "salsa", qty: "1 cup" }, { key: "salt", qty: "to taste" },
  ]},
  { id: "r_beef_tacos", name: "Beef Tacos", restaurantPrice: 22, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "taco shells", qty: "1 box" },
    { key: "cheese", qty: "8 oz" }, { key: "lettuce", qty: "1 head" },
    { key: "tomatoes", qty: "2 whole" }, { key: "salsa", qty: "1 cup" },
  ]},
  { id: "r_chicken_quesadillas", name: "Chicken Quesadillas", restaurantPrice: 17, ingredientLines: [
    { key: "chicken breast", qty: "1 lb" }, { key: "flour tortillas", qty: "1 pack" },
    { key: "cheese", qty: "8 oz" }, { key: "salsa", qty: "1 cup" },
    { key: "bell peppers", qty: "2 whole" }, { key: "onion", qty: "1 whole" },
  ]},
  { id: "r_beef_burritos", name: "Beef Burritos", restaurantPrice: 19, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "flour tortillas", qty: "1 pack" },
    { key: "rice", qty: "1 cup" }, { key: "beans", qty: "1 can" },
    { key: "cheese", qty: "8 oz" }, { key: "salsa", qty: "1 cup" },
  ]},
  { id: "r_enchiladas", name: "Chicken Enchiladas", restaurantPrice: 24, ingredientLines: [
    { key: "chicken breast", qty: "1 lb" }, { key: "flour tortillas", qty: "1 pack" },
    { key: "enchilada sauce", qty: "1 can" }, { key: "cheese", qty: "8 oz" },
    { key: "onion", qty: "1 whole" }, { key: "sour cream", qty: "8 oz" },
  ]},
  // COMFORT
  { id: "r_chicken_pot_pie", name: "Chicken Pot Pie", restaurantPrice: 23, ingredientLines: [
    { key: "chicken breast", qty: "1 lb" }, { key: "frozen mixed vegetables", qty: "1 bag" },
    { key: "chicken broth", qty: "2 cups" }, { key: "milk", qty: "1 cup" },
    { key: "pie crust", qty: "1 box" }, { key: "butter", qty: "2 tbsp" },
  ]},
  { id: "r_beef_stew", name: "Beef Stew", restaurantPrice: 24, ingredientLines: [
    { key: "beef stew meat", qty: "1.5 lb" }, { key: "potatoes", qty: "2 lb" },
    { key: "carrots", qty: "1 lb" }, { key: "onion", qty: "1 whole" },
    { key: "beef broth", qty: "4 cups" }, { key: "garlic", qty: "2 cloves" },
  ]},
  { id: "r_chili", name: "Beef Chili", restaurantPrice: 18, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "black beans", qty: "1 can" },
    { key: "kidney beans", qty: "1 can" }, { key: "diced tomatoes", qty: "1 can" },
    { key: "onion", qty: "1 whole" }, { key: "garlic", qty: "2 cloves" },
  ]},
  { id: "r_loaded_baked_potatoes", name: "Loaded Baked Potatoes", restaurantPrice: 16, ingredientLines: [
    { key: "russet potatoes", qty: "4 whole" }, { key: "cheddar cheese", qty: "8 oz" },
    { key: "sour cream", qty: "8 oz" }, { key: "bacon", qty: "1 pack" },
    { key: "green onions", qty: "1 bunch" }, { key: "butter", qty: "4 tbsp" },
  ]},
  { id: "r_grilled_cheese_tomato_soup", name: "Grilled Cheese & Tomato Soup", restaurantPrice: 16, ingredientLines: [
    { key: "bread", qty: "1 loaf" }, { key: "cheddar cheese", qty: "8 oz" },
    { key: "butter", qty: "3 tbsp" }, { key: "tomato soup", qty: "2 cans" },
    { key: "milk", qty: "1 cup" }, { key: "salt", qty: "to taste" },
  ]},
  { id: "r_ham_cheese_sliders", name: "Ham & Cheese Sliders", restaurantPrice: 18, ingredientLines: [
    { key: "ham", qty: "1 lb" }, { key: "swiss cheese", qty: "8 oz" },
    { key: "dinner rolls", qty: "1 pack" }, { key: "butter", qty: "3 tbsp" },
    { key: "mustard", qty: "2 tbsp" }, { key: "dinner rolls", qty: "1 pack" },
  ]},
  { id: "r_sheet_pan_sausage_veg", name: "Sheet Pan Sausage & Veggies", restaurantPrice: 20, ingredientLines: [
    { key: "sausage", qty: "1 lb" }, { key: "potatoes", qty: "2 lb" },
    { key: "bell peppers", qty: "2 whole" }, { key: "onion", qty: "1 whole" },
    { key: "olive oil", qty: "2 tbsp" }, { key: "salt", qty: "to taste" },
  ]},
  // ITALIAN
  { id: "r_chicken_alfredo", name: "Chicken Alfredo", restaurantPrice: 22, ingredientLines: [
    { key: "chicken breast", qty: "1.5 lb" }, { key: "pasta", qty: "1 box" },
    { key: "parmesan", qty: "8 oz" }, { key: "heavy cream", qty: "2 cups" },
    { key: "garlic", qty: "3 cloves" }, { key: "salt", qty: "to taste" },
    { key: "black pepper", qty: "to taste" },
  ]},
  { id: "r_spaghetti_meat_sauce", name: "Spaghetti with Meat Sauce", restaurantPrice: 20, ingredientLines: [
    { key: "ground beef", qty: "1 lb" }, { key: "spaghetti", qty: "1 box" },
    { key: "pasta sauce", qty: "1 jar" }, { key: "onion", qty: "1 whole" },
    { key: "garlic", qty: "2 cloves" }, { key: "parmesan", qty: "4 oz" },
  ]},
  { id: "r_baked_ziti", name: "Baked Ziti", restaurantPrice: 24, ingredientLines: [
    { key: "pasta", qty: "1 box" }, { key: "pasta sauce", qty: "1 jar" },
    { key: "mozzarella", qty: "8 oz" }, { key: "parmesan", qty: "4 oz" },
    { key: "ground beef", qty: "1 lb" }, { key: "ricotta", qty: "8 oz" },
  ]},
  { id: "r_mac_cheese_sausage", name: "Mac & Cheese with Sausage", restaurantPrice: 19, ingredientLines: [
    { key: "macaroni", qty: "1 box" }, { key: "sausage", qty: "1 lb" },
    { key: "cheddar cheese", qty: "8 oz" }, { key: "milk", qty: "2 cups" },
    { key: "butter", qty: "2 tbsp" }, { key: "salt", qty: "to taste" },
  ]},
  { id: "r_chicken_parmesan", name: "Chicken Parmesan", restaurantPrice: 26, ingredientLines: [
    { key: "chicken breast", qty: "1.5 lb" }, { key: "pasta sauce", qty: "1 jar" },
    { key: "mozzarella", qty: "8 oz" }, { key: "parmesan", qty: "4 oz" },
    { key: "bread crumbs", qty: "1 cup" }, { key: "pasta", qty: "1 box" },
  ]},
  // ASIAN
  { id: "r_chicken_stir_fry", name: "Chicken Stir Fry", restaurantPrice: 21, ingredientLines: [
    { key: "chicken breast", qty: "1.5 lb" }, { key: "frozen stir fry mix", qty: "1 bag" },
    { key: "rice", qty: "1 cup" }, { key: "soy sauce", qty: "3 tbsp" },
    { key: "teriyaki sauce", qty: "1/2 cup" }, { key: "garlic", qty: "2 cloves" },
  ]},
  { id: "r_beef_stir_fry", name: "Beef Stir Fry", restaurantPrice: 23, ingredientLines: [
    { key: "beef sirloin", qty: "1 lb" }, { key: "frozen stir fry mix", qty: "1 bag" },
    { key: "rice", qty: "1 cup" }, { key: "soy sauce", qty: "3 tbsp" },
    { key: "garlic", qty: "2 cloves" }, { key: "ginger", qty: "1 whole" },
  ]},
  { id: "r_fried_rice", name: "Chicken Fried Rice", restaurantPrice: 17, ingredientLines: [
    { key: "chicken breast", qty: "1 lb" }, { key: "rice", qty: "2 cups" },
    { key: "eggs", qty: "2 whole" }, { key: "frozen peas", qty: "1 cup" },
    { key: "carrots", qty: "1 cup" }, { key: "soy sauce", qty: "3 tbsp" },
  ]},
  // LUNCH
  { id: "r_chicken_caesar_salad", name: "Chicken Caesar Salad", restaurantPrice: 18, ingredientLines: [
    { key: "chicken breast", qty: "1 lb" }, { key: "lettuce", qty: "1 head" },
    { key: "parmesan", qty: "4 oz" }, { key: "bread crumbs", qty: "1 cup" },
    { key: "mayonnaise", qty: "1/4 cup" }, { key: "garlic", qty: "2 cloves" },
    { key: "lemon", qty: "1 whole" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_tomato_basil_soup", name: "Tomato Basil Soup", restaurantPrice: 12, ingredientLines: [
    { key: "crushed tomatoes", qty: "1 can" }, { key: "onion", qty: "1 whole" },
    { key: "garlic", qty: "3 cloves" }, { key: "chicken broth", qty: "2 cups" },
    { key: "butter", qty: "2 tbsp" }, { key: "heavy cream", qty: "1/2 cup" },
    { key: "basil", qty: "1 tbsp" }, { key: "salt", qty: "1 tsp" },
    { key: "black pepper", qty: "1/2 tsp" },
  ]},
  { id: "r_black_bean_rice_bowl", name: "Black Bean & Rice Bowl", restaurantPrice: 16, ingredientLines: [
    { key: "black beans", qty: "1 can" }, { key: "rice", qty: "1 cup" },
    { key: "bell peppers", qty: "2 whole" }, { key: "onion", qty: "1 whole" },
    { key: "salsa", qty: "1 cup" }, { key: "lime", qty: "1 whole" },
    { key: "olive oil", qty: "2 tbsp" }, { key: "garlic powder", qty: "1 tsp" },
    { key: "salt", qty: "1/2 tsp" },
  ]},
  { id: "r_tuna_salad_sandwich", name: "Tuna Salad Sandwich", restaurantPrice: 13, ingredientLines: [
    { key: "tuna", qty: "2 cans" }, { key: "bread", qty: "1 loaf" },
    { key: "mayonnaise", qty: "1/4 cup" }, { key: "celery", qty: "2 stalks" },
    { key: "onion", qty: "1/2 whole" }, { key: "mustard", qty: "1 tbsp" },
    { key: "lemon", qty: "1 whole" }, { key: "salt", qty: "1/4 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_turkey_avocado_wrap", name: "Turkey Avocado Wrap", restaurantPrice: 19, ingredientLines: [
    { key: "turkey", qty: "1 lb" }, { key: "avocado", qty: "2 whole" },
    { key: "flour tortillas", qty: "1 pack" }, { key: "lettuce", qty: "1 head" },
    { key: "tomatoes", qty: "2 whole" }, { key: "mayonnaise", qty: "1/4 cup" },
    { key: "lime", qty: "1 whole" }, { key: "salt", qty: "1/4 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_greek_salad", name: "Greek Salad", restaurantPrice: 14, ingredientLines: [
    { key: "cucumber", qty: "2 whole" }, { key: "tomatoes", qty: "3 whole" },
    { key: "onion", qty: "1/2 whole" }, { key: "bell peppers", qty: "1 whole" },
    { key: "feta cheese", qty: "4 oz" }, { key: "olive oil", qty: "3 tbsp" },
    { key: "lemon", qty: "1 whole" }, { key: "salt", qty: "1/4 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  // SIDES
  { id: "r_garlic_roasted_broccoli", name: "Garlic Roasted Broccoli", restaurantPrice: 8, ingredientLines: [
    { key: "broccoli", qty: "2 heads" }, { key: "olive oil", qty: "2 tbsp" },
    { key: "garlic", qty: "3 cloves" }, { key: "lemon", qty: "1 whole" },
    { key: "salt", qty: "1/2 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_simple_rice_pilaf", name: "Simple Rice Pilaf", restaurantPrice: 9, ingredientLines: [
    { key: "rice", qty: "1 cup" }, { key: "chicken broth", qty: "2 cups" },
    { key: "butter", qty: "2 tbsp" }, { key: "onion", qty: "1/2 whole" },
    { key: "garlic", qty: "2 cloves" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_creamy_coleslaw", name: "Creamy Coleslaw", restaurantPrice: 6, ingredientLines: [
    { key: "coleslaw mix", qty: "1 bag" }, { key: "mayonnaise", qty: "1/2 cup" },
    { key: "apple cider vinegar", qty: "1/4 cup" }, { key: "sugar", qty: "1 tsp" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  // SAUCES
  { id: "r_bechamel_sauce", name: "Béchamel Sauce", restaurantPrice: 8, ingredientLines: [
    { key: "butter", qty: "4 tbsp" }, { key: "flour", qty: "4 tbsp" },
    { key: "milk", qty: "2 cups" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" }, { key: "nutmeg", qty: "pinch" },
  ]},
  { id: "r_veloute_sauce", name: "Velouté Sauce", restaurantPrice: 8, ingredientLines: [
    { key: "butter", qty: "3 tbsp" }, { key: "flour", qty: "3 tbsp" },
    { key: "chicken broth", qty: "2 cups" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_brown_espagnole_sauce", name: "Brown Sauce (Espagnole)", restaurantPrice: 9, ingredientLines: [
    { key: "butter", qty: "4 tbsp" }, { key: "flour", qty: "4 tbsp" },
    { key: "beef broth", qty: "2 cups" }, { key: "tomato paste", qty: "2 tbsp" },
    { key: "onion", qty: "1/2 whole" }, { key: "carrots", qty: "1 whole" },
    { key: "celery", qty: "1 stalk" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_classic_tomato_sauce", name: "Classic Tomato Sauce", restaurantPrice: 7, ingredientLines: [
    { key: "olive oil", qty: "2 tbsp" }, { key: "onion", qty: "1 whole" },
    { key: "garlic", qty: "3 cloves" }, { key: "crushed tomatoes", qty: "1 can" },
    { key: "tomato paste", qty: "2 tbsp" }, { key: "salt", qty: "1 tsp" },
    { key: "black pepper", qty: "1/2 tsp" }, { key: "sugar", qty: "1 tsp" },
    { key: "basil", qty: "1 tbsp" },
  ]},
  { id: "r_hollandaise_sauce", name: "Hollandaise Sauce", restaurantPrice: 9, ingredientLines: [
    { key: "egg yolks", qty: "3 whole" }, { key: "butter", qty: "8 tbsp" },
    { key: "lemon", qty: "1 whole" }, { key: "salt", qty: "pinch" },
    { key: "cayenne pepper", qty: "pinch" },
  ]},
  { id: "r_alfredo_sauce", name: "Alfredo Sauce", restaurantPrice: 9, ingredientLines: [
    { key: "butter", qty: "4 tbsp" }, { key: "garlic", qty: "2 cloves" },
    { key: "heavy cream", qty: "1 cup" }, { key: "parmesan", qty: "4 oz" },
    { key: "salt", qty: "1/2 tsp" }, { key: "black pepper", qty: "1/2 tsp" },
  ]},
  { id: "r_marinara_sauce", name: "Marinara Sauce", restaurantPrice: 7, ingredientLines: [
    { key: "olive oil", qty: "3 tbsp" }, { key: "garlic", qty: "3 cloves" },
    { key: "whole peeled tomatoes", qty: "1 can" }, { key: "salt", qty: "1 tsp" },
    { key: "black pepper", qty: "1/2 tsp" }, { key: "red pepper flakes", qty: "pinch" },
    { key: "basil", qty: "1 tbsp" },
  ]},
  { id: "r_pan_sauce", name: "Quick Pan Sauce", restaurantPrice: 8, ingredientLines: [
    { key: "butter", qty: "2 tbsp" }, { key: "shallot", qty: "1 whole" },
    { key: "chicken broth", qty: "1/2 cup" }, { key: "white wine", qty: "1/2 cup" },
    { key: "mustard", qty: "1 tsp" }, { key: "lemon", qty: "1/2 whole" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_homestyle_gravy", name: "Homestyle Gravy", restaurantPrice: 7, ingredientLines: [
    { key: "butter", qty: "3 tbsp" }, { key: "flour", qty: "3 tbsp" },
    { key: "chicken broth", qty: "2 cups" }, { key: "salt", qty: "1/2 tsp" },
    { key: "black pepper", qty: "1/2 tsp" },
  ]},
  { id: "r_basic_vinaigrette", name: "Basic Vinaigrette", restaurantPrice: 6, ingredientLines: [
    { key: "olive oil", qty: "3 tbsp" }, { key: "vinegar", qty: "1 tbsp" },
    { key: "mustard", qty: "1 tsp" }, { key: "garlic", qty: "1 clove" },
    { key: "honey", qty: "1 tsp" }, { key: "salt", qty: "1/4 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_tartar_sauce", name: "Tartar Sauce", restaurantPrice: 7, ingredientLines: [
    { key: "mayonnaise", qty: "1 cup" }, { key: "pickles", qty: "2 tbsp" },
    { key: "mustard", qty: "1 tsp" }, { key: "lemon", qty: "1/2 whole" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_ranch_dressing", name: "Ranch Dressing", restaurantPrice: 7, ingredientLines: [
    { key: "mayonnaise", qty: "1 cup" }, { key: "sour cream", qty: "4 oz" },
    { key: "milk", qty: "1/2 cup" }, { key: "garlic powder", qty: "1 tsp" },
    { key: "onion powder", qty: "1 tsp" }, { key: "parsley", qty: "1 tbsp" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_alabama_white_sauce", name: "Alabama White Sauce", restaurantPrice: 8, ingredientLines: [
    { key: "mayonnaise", qty: "1 cup" }, { key: "apple cider vinegar", qty: "1/4 cup" },
    { key: "prepared horseradish", qty: "1 tbsp" }, { key: "mustard", qty: "1 tsp" },
    { key: "lemon", qty: "1/2 whole" }, { key: "black pepper", qty: "1/2 tsp" },
    { key: "salt", qty: "1/4 tsp" },
  ]},
  { id: "r_blue_cheese_dressing", name: "Blue Cheese Dressing", restaurantPrice: 8, ingredientLines: [
    { key: "mayonnaise", qty: "1/2 cup" }, { key: "sour cream", qty: "4 oz" },
    { key: "blue cheese", qty: "2 oz" }, { key: "milk", qty: "1/4 cup" },
    { key: "lemon", qty: "1/2 whole" }, { key: "salt", qty: "1/4 tsp" },
    { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_chipotle_mayo", name: "Chipotle Mayo", restaurantPrice: 7, ingredientLines: [
    { key: "mayonnaise", qty: "1 cup" }, { key: "chipotle peppers", qty: "2 tbsp" },
    { key: "adobo sauce", qty: "1 tbsp" }, { key: "lime", qty: "1/2 whole" },
    { key: "garlic powder", qty: "1/2 tsp" }, { key: "salt", qty: "1/4 tsp" },
  ]},
  { id: "r_tzatziki_sauce", name: "Tzatziki Sauce", restaurantPrice: 7, ingredientLines: [
    { key: "greek yogurt", qty: "1 cup" }, { key: "cucumber", qty: "1/2 whole" },
    { key: "garlic", qty: "2 cloves" }, { key: "olive oil", qty: "1 tbsp" },
    { key: "lemon", qty: "1/2 whole" }, { key: "dill", qty: "1 tbsp" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_honey_mustard", name: "Honey Mustard", restaurantPrice: 6, ingredientLines: [
    { key: "mayonnaise", qty: "1/2 cup" }, { key: "mustard", qty: "2 tbsp" },
    { key: "honey", qty: "2 tbsp" }, { key: "apple cider vinegar", qty: "1 tsp" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
  { id: "r_garlic_aioli", name: "Garlic Aioli", restaurantPrice: 7, ingredientLines: [
    { key: "mayonnaise", qty: "1 cup" }, { key: "garlic", qty: "2 cloves" },
    { key: "lemon", qty: "1/2 whole" }, { key: "olive oil", qty: "1 tbsp" },
    { key: "salt", qty: "1/4 tsp" }, { key: "black pepper", qty: "1/4 tsp" },
  ]},
];

// ── Run computations ───────────────────────────────────────────────────────────
const rows = [];

for (const r of recipes) {
  const before = computeBefore(r.ingredientLines);
  const after = computeAfter(r.ingredientLines);
  const beforeSavings = roundMoney(r.restaurantPrice - before.total);
  const afterSavings = roundMoney(r.restaurantPrice - after.total);
  const delta = roundMoney(afterSavings - beforeSavings);

  const flags = [];
  if (beforeSavings < 0) flags.push("WAS-NEG");
  if (afterSavings < 0) flags.push("STILL-NEG");
  if (beforeSavings >= 0 && afterSavings < 0) flags.push("NEWLY-NEG");
  if (Math.abs(delta) > 5) flags.push(">$5-CHANGE");

  rows.push({ id: r.id, name: r.name, restaurant: r.restaurantPrice,
    beforeHome: before.total, afterHome: after.total,
    beforeSavings, afterSavings, delta, flags });
}

// ── Print markdown table ───────────────────────────────────────────────────────
function fmt(n) { return (n >= 0 ? "+" : "") + n.toFixed(2); }
function money(n) { return `$${Math.abs(n).toFixed(2)}`; }
function savCell(n) { return n < 0 ? `**-${money(-n)}**` : `+${money(n)}`; }

console.log("| Recipe | Rest. | Home (before) | Sav (before) | Home (after) | Sav (after) | Δ | Flags |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  const flagStr = r.flags.length ? r.flags.join(", ") : "—";
  console.log(`| ${r.name} | $${r.restaurant} | $${r.beforeHome.toFixed(2)} | ${savCell(r.beforeSavings)} | $${r.afterHome.toFixed(2)} | ${savCell(r.afterSavings)} | ${fmt(r.delta)} | ${flagStr} |`);
}

console.log("\n\nNegative before (WAS-NEG):");
rows.filter(r => r.beforeSavings < 0).forEach(r => console.log(`  ${r.name}: before=${r.beforeSavings}, after=${r.afterSavings}`));

console.log("\nStill negative after (STILL-NEG):");
const stillNeg = rows.filter(r => r.afterSavings < 0);
if (stillNeg.length === 0) console.log("  None");
else stillNeg.forEach(r => console.log(`  ${r.name}: ${r.afterSavings}`));

console.log("\nLarge changes (>$5):");
rows.filter(r => r.flags.includes(">$5-CHANGE")).forEach(r =>
  console.log(`  ${r.name}: ${fmt(r.delta)} (before=${r.beforeSavings}, after=${r.afterSavings})`));
