// src/engine/ingredientMaster.js
// Locked ingredient master (package sizes, prices, base units).
// Pure data. No UI. No Supabase.

export const ingredientMaster = {
  rice:        { id: "rice",        base_unit: "cup", package_size: 10, package_price: 4.00 },
  chicken:     { id: "chicken",     base_unit: "lb",  package_size: 1,  package_price: 5.00 },
  salsa:       { id: "salsa",       base_unit: "jar", package_size: 1,  package_price: 3.50 },
  spice:       { id: "spice",       base_unit: "tbsp", package_size: 5, package_price: 3.00 },

  pasta:       { id: "pasta",       base_unit: "box", package_size: 1,   package_price: 1.75 },
  parmesan:    { id: "parmesan",    base_unit: "oz",  package_size: 8,   package_price: 4.50 },
  "heavy cream": { id: "heavy cream", base_unit: "pint", package_size: 1, package_price: 3.50 },
  garlic:      { id: "garlic",      base_unit: "clove", package_size: 10, package_price: 0.75 },
  "ground beef": { id: "ground beef", base_unit: "lb", package_size: 1,   package_price: 5.50 },
  beans:       { id: "beans",       base_unit: "can", package_size: 1,    package_price: 1.25 },
  cheese:      { id: "cheese",      base_unit: "oz",  package_size: 8,    package_price: 3.50 },
  salmon:      { id: "salmon",      base_unit: "lb",  package_size: 1,    package_price: 9.00 },
  broccoli:    { id: "broccoli",    base_unit: "head", package_size: 1,   package_price: 2.00 },
  "olive oil": { id: "olive oil",   base_unit: "tbsp", package_size: 25,  package_price: 8.00 },
  lemon:       { id: "lemon",       base_unit: "whole", package_size: 1,  package_price: 0.75 },
};