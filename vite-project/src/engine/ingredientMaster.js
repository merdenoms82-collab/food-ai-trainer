// src/engine/ingredientMaster.js
// Locked ingredient master (package sizes, prices, base units).
// Pure data. No UI. No Supabase.

export const ingredientMaster = {
  rice:    { id: "rice",    base_unit: "cup",  package_size: 10, package_price: 4.00 },
  chicken: { id: "chicken", base_unit: "lb",   package_size: 1,  package_price: 5.00 },
  salsa:   { id: "salsa",   base_unit: "jar",  package_size: 1,  package_price: 3.50 },
  spice:   { id: "spice",   base_unit: "tbsp", package_size: 5,  package_price: 3.00 },
};