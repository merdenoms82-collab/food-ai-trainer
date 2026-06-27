// src/engine/ingredientMaster.js
// Locked ingredient master (package sizes, prices, base units).
// Pure data. No UI. No Supabase.
// Prices: 2024 US national average grocery basket (USDA/BLS).

export const ingredientMaster = {

  // ── ORIGINAL 15 ──────────────────────────────────────────────────────────
  rice:            { id: "rice",            base_unit: "cup",   package_size: 10,  package_price: 4.00 },
  chicken:         { id: "chicken",         base_unit: "lb",    package_size: 1,   package_price: 5.00 },
  salsa:           { id: "salsa",           base_unit: "jar",   package_size: 1,   package_price: 3.50 },
  spice:           { id: "spice",           base_unit: "tbsp",  package_size: 5,   package_price: 3.00 },
  pasta:           { id: "pasta",           base_unit: "box",   package_size: 1,   package_price: 1.75 },
  parmesan:        { id: "parmesan",        base_unit: "oz",    package_size: 8,   package_price: 4.50 },
  "heavy cream":   { id: "heavy cream",     base_unit: "pint",  package_size: 1,   package_price: 3.50 },
  garlic:          { id: "garlic",          base_unit: "clove", package_size: 10,  package_price: 0.75 },
  "ground beef":   { id: "ground beef",     base_unit: "lb",    package_size: 1,   package_price: 5.50 },
  beans:           { id: "beans",           base_unit: "can",   package_size: 1,   package_price: 1.25 },
  cheese:          { id: "cheese",          base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  salmon:          { id: "salmon",          base_unit: "lb",    package_size: 1,   package_price: 9.00 },
  broccoli:        { id: "broccoli",        base_unit: "head",  package_size: 1,   package_price: 2.00 },
  "olive oil":     { id: "olive oil",       base_unit: "tbsp",  package_size: 25,  package_price: 8.00 },
  lemon:           { id: "lemon",           base_unit: "whole", package_size: 1,   package_price: 0.75 },

  // ── PROTEINS & MEAT ──────────────────────────────────────────────────────
  eggs:            { id: "eggs",            base_unit: "whole", package_size: 12,  package_price: 4.00 },
  "egg yolks":     { id: "egg yolks",       base_unit: "whole", package_size: 12,  package_price: 4.00 },
  bacon:           { id: "bacon",           base_unit: "pack",  package_size: 1,   package_price: 6.00 },
  sausage:         { id: "sausage",         base_unit: "lb",    package_size: 1,   package_price: 4.50 },
  "beef sirloin":  { id: "beef sirloin",    base_unit: "lb",    package_size: 1,   package_price: 8.00 },
  "beef stew meat":{ id: "beef stew meat",  base_unit: "lb",    package_size: 1,   package_price: 6.00 },
  ham:             { id: "ham",             base_unit: "lb",    package_size: 1,   package_price: 5.00 },

  // ── PRODUCE & FRESH ──────────────────────────────────────────────────────
  onion:           { id: "onion",           base_unit: "whole", package_size: 1,   package_price: 0.75 },
  tomatoes:        { id: "tomatoes",        base_unit: "whole", package_size: 1,   package_price: 1.00 },
  lettuce:         { id: "lettuce",         base_unit: "head",  package_size: 1,   package_price: 2.50 },
  "bell peppers":  { id: "bell peppers",    base_unit: "whole", package_size: 1,   package_price: 1.25 },
  potatoes:        { id: "potatoes",        base_unit: "lb",    package_size: 1,   package_price: 1.00 },
  "russet potatoes":{ id: "russet potatoes",base_unit: "whole", package_size: 1,   package_price: 0.75 },
  carrots:         { id: "carrots",         base_unit: "lb",    package_size: 1,   package_price: 1.50 },
  celery:          { id: "celery",          base_unit: "stalk", package_size: 1,   package_price: 0.30 },
  "green onions":  { id: "green onions",    base_unit: "bunch", package_size: 1,   package_price: 1.25 },
  shallot:         { id: "shallot",         base_unit: "whole", package_size: 1,   package_price: 0.75 },
  cucumber:        { id: "cucumber",        base_unit: "whole", package_size: 1,   package_price: 1.25 },
  ginger:          { id: "ginger",          base_unit: "whole", package_size: 1,   package_price: 2.00 },
  lime:            { id: "lime",            base_unit: "whole", package_size: 1,   package_price: 0.50 },
  basil:           { id: "basil",           base_unit: "tbsp",  package_size: 6,   package_price: 3.00 },
  parsley:         { id: "parsley",         base_unit: "tbsp",  package_size: 8,   package_price: 2.50 },
  dill:            { id: "dill",            base_unit: "tbsp",  package_size: 8,   package_price: 2.50 },

  // ── DAIRY ────────────────────────────────────────────────────────────────
  milk:            { id: "milk",            base_unit: "cup",   package_size: 8,   package_price: 3.00 },
  butter:          { id: "butter",          base_unit: "tbsp",  package_size: 32,  package_price: 5.00 },
  mozzarella:      { id: "mozzarella",      base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  ricotta:         { id: "ricotta",         base_unit: "oz",    package_size: 15,  package_price: 4.00 },
  "cheddar cheese":{ id: "cheddar cheese",  base_unit: "oz",    package_size: 8,   package_price: 3.50 },
  "sour cream":    { id: "sour cream",      base_unit: "oz",    package_size: 16,  package_price: 3.00 },
  "swiss cheese":  { id: "swiss cheese",    base_unit: "oz",    package_size: 8,   package_price: 4.00 },
  "blue cheese":   { id: "blue cheese",     base_unit: "oz",    package_size: 5,   package_price: 4.50 },
  "greek yogurt":  { id: "greek yogurt",    base_unit: "cup",   package_size: 2,   package_price: 3.50 },

  // ── DRY GOODS & PANTRY STAPLES ───────────────────────────────────────────
  flour:           { id: "flour",           base_unit: "tbsp",  package_size: 100, package_price: 2.50 },
  sugar:           { id: "sugar",           base_unit: "tsp",   package_size: 432, package_price: 3.00 },
  bread:           { id: "bread",           base_unit: "loaf",  package_size: 1,   package_price: 3.50 },
  "bread crumbs":  { id: "bread crumbs",    base_unit: "cup",   package_size: 4,   package_price: 3.00 },
  macaroni:        { id: "macaroni",        base_unit: "box",   package_size: 1,   package_price: 1.75 },
  spaghetti:       { id: "spaghetti",       base_unit: "box",   package_size: 1,   package_price: 1.75 },
  "flour tortillas":{ id: "flour tortillas",base_unit: "pack",  package_size: 1,   package_price: 3.50 },
  "taco shells":   { id: "taco shells",     base_unit: "box",   package_size: 1,   package_price: 3.00 },
  "pancake mix":   { id: "pancake mix",     base_unit: "cup",   package_size: 10,  package_price: 3.50 },
  "pie crust":     { id: "pie crust",       base_unit: "box",   package_size: 1,   package_price: 4.50 },
  "dinner rolls":  { id: "dinner rolls",    base_unit: "pack",  package_size: 1,   package_price: 3.00 },
  "hamburger buns":{ id: "hamburger buns",  base_unit: "pack",  package_size: 1,   package_price: 3.50 },
  vinegar:         { id: "vinegar",         base_unit: "tbsp",  package_size: 32,  package_price: 3.00 },
  "apple cider vinegar":{ id: "apple cider vinegar", base_unit: "cup", package_size: 2, package_price: 4.00 },

  // ── CANNED, JARRED & BROTH ───────────────────────────────────────────────
  "pasta sauce":   { id: "pasta sauce",     base_unit: "jar",   package_size: 1,   package_price: 3.00 },
  "enchilada sauce":{ id: "enchilada sauce",base_unit: "can",   package_size: 1,   package_price: 2.50 },
  "sloppy joe sauce":{ id: "sloppy joe sauce",base_unit: "can", package_size: 1,   package_price: 2.00 },
  "tomato soup":   { id: "tomato soup",     base_unit: "can",   package_size: 1,   package_price: 1.50 },
  "crushed tomatoes":{ id: "crushed tomatoes",base_unit: "can", package_size: 1,   package_price: 2.00 },
  "whole peeled tomatoes":{ id: "whole peeled tomatoes", base_unit: "can", package_size: 1, package_price: 2.50 },
  "diced tomatoes":{ id: "diced tomatoes",  base_unit: "can",   package_size: 1,   package_price: 1.75 },
  "tomato paste":  { id: "tomato paste",    base_unit: "tbsp",  package_size: 12,  package_price: 1.50 },
  "black beans":   { id: "black beans",     base_unit: "can",   package_size: 1,   package_price: 1.25 },
  "kidney beans":  { id: "kidney beans",    base_unit: "can",   package_size: 1,   package_price: 1.25 },
  "chicken broth": { id: "chicken broth",   base_unit: "cup",   package_size: 4,   package_price: 3.00 },
  "beef broth":    { id: "beef broth",      base_unit: "cup",   package_size: 4,   package_price: 3.50 },

  // ── CONDIMENTS, SAUCES & LIQUIDS ─────────────────────────────────────────
  mayonnaise:      { id: "mayonnaise",      base_unit: "cup",   package_size: 4,   package_price: 5.50 },
  mustard:         { id: "mustard",         base_unit: "tbsp",  package_size: 24,  package_price: 2.50 },
  honey:           { id: "honey",           base_unit: "tbsp",  package_size: 16,  package_price: 6.00 },
  "maple syrup":   { id: "maple syrup",     base_unit: "bottle",package_size: 1,   package_price: 8.00 },
  "bbq sauce":     { id: "bbq sauce",       base_unit: "bottle",package_size: 1,   package_price: 3.50 },
  pickles:         { id: "pickles",         base_unit: "jar",   package_size: 1,   package_price: 3.50 },
  "soy sauce":     { id: "soy sauce",       base_unit: "tbsp",  package_size: 30,  package_price: 3.50 },
  "teriyaki sauce":{ id: "teriyaki sauce",  base_unit: "cup",   package_size: 2,   package_price: 4.00 },
  "adobo sauce":   { id: "adobo sauce",     base_unit: "tbsp",  package_size: 7,   package_price: 2.50 },
  "chipotle peppers":{ id: "chipotle peppers",base_unit: "tbsp",package_size: 7,   package_price: 2.50 },
  "prepared horseradish":{ id: "prepared horseradish", base_unit: "tbsp", package_size: 6, package_price: 3.50 },
  "white wine":    { id: "white wine",      base_unit: "cup",   package_size: 3,   package_price: 8.00 },

  // ── FROZEN & PACKAGED ────────────────────────────────────────────────────
  "frozen french fries":{ id: "frozen french fries", base_unit: "bag", package_size: 1, package_price: 4.00 },
  "frozen stir fry mix":{ id: "frozen stir fry mix", base_unit: "bag", package_size: 1, package_price: 4.50 },
  "frozen mixed vegetables":{ id: "frozen mixed vegetables", base_unit: "bag", package_size: 1, package_price: 3.00 },
  "frozen peas":   { id: "frozen peas",     base_unit: "cup",   package_size: 4,   package_price: 2.50 },
  "frozen hash browns":{ id: "frozen hash browns", base_unit: "bag", package_size: 1, package_price: 4.00 },
  "coleslaw mix":  { id: "coleslaw mix",    base_unit: "bag",   package_size: 1,   package_price: 2.50 },

  // ── SPICES & SEASONINGS ───────────────────────────────────────────────────
  "garlic powder": { id: "garlic powder",   base_unit: "tsp",   package_size: 20,  package_price: 3.00 },
  "onion powder":  { id: "onion powder",    base_unit: "tsp",   package_size: 20,  package_price: 3.00 },
  nutmeg:          { id: "nutmeg",          base_unit: "tsp",   package_size: 10,  package_price: 3.50 },
  "cayenne pepper":{ id: "cayenne pepper",  base_unit: "tsp",   package_size: 10,  package_price: 3.00 },
  "red pepper flakes":{ id: "red pepper flakes", base_unit: "tsp", package_size: 10, package_price: 3.00 },
};
