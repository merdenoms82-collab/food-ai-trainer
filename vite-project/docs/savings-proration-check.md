# Savings Proration Check — Baseline

Generated 2026-06-30 after `fix-negative-savings` branch.  
Use this table when adding new recipes to catch pricing anomalies before merge.

## What changed

**Before (broken):** `computeRecipePreviewPricing` called the weekly savings engine without injecting pantry staples. Every ingredient — including pantry staples like olive oil ($8/bottle), butter ($5/pack), mayonnaise ($5.50/bottle), honey ($6/bottle) — was charged at full package price even when only a tablespoon was used. 44 of 57 recipes showed negative savings on selection cards.

**After (fixed):** Per-unit proration — `cost = qty × (package_price / package_size)` — and pantry staples (same set as the weekly plan) are $0, consistent with the assumption that they're already owned.

**Weekly engine (`savingsEngine.js`) is untouched.** The weekly plan still buys whole packages for shopping-list accuracy.

## Before/After Table

| Recipe | Rest. | Home (before) | Sav (before) | Home (after) | Sav (after) | Δ | Notes |
|---|---|---|---|---|---|---|---|
| Salmon + Veg | $28 | $28.75 | **-$0.75** | $16.25 | +$11.75 | +$12.50 | WAS-NEG |
| Cheeseburgers & Fries | $28 | $26.50 | +$1.50 | $23.75 | +$4.25 | +$2.75 | |
| Sloppy Joes | $17 | $19.25 | **-$2.25** | $19.25 | **-$2.25** | $0.00 | STILL-NEG — see note below |
| BBQ Chicken Sandwiches | $21 | $28.50 | **-$7.50** | $17.00 | +$4.00 | +$11.50 | WAS-NEG |
| Breakfast Burritos | $26 | $23.00 | +$3.00 | $19.25 | +$6.75 | +$3.75 | |
| Bacon, Eggs & Toast | $14 | $19.50 | **-$5.50** | $11.83 | +$2.17 | +$7.67 | WAS-NEG |
| Pancakes & Bacon | $26 | $29.50 | **-$3.50** | $15.93 | +$10.07 | +$13.57 | WAS-NEG |
| Overnight Oats | $12 | $16.00 | **-$4.00** | $1.61 | +$10.39 | +$14.39 | WAS-NEG |
| Avocado Toast with Eggs | $14 | $20.25 | **-$6.25** | $8.58 | +$5.42 | +$11.67 | WAS-NEG |
| Berry Smoothie | $14 | $17.30 | **-$3.30** | $6.93 | +$7.07 | +$10.37 | WAS-NEG |
| Egg & Veggie Muffins | $10 | $15.50 | **-$5.50** | $5.38 | +$4.62 | +$10.12 | WAS-NEG |
| Taco Bowls | $18 | $17.75 | +$0.25 | $12.40 | +$5.60 | +$5.35 | |
| Beef Tacos | $22 | $20.00 | +$2.00 | $18.25 | +$3.75 | +$1.75 | |
| Chicken Quesadillas | $17 | $18.75 | **-$1.75** | $17.00 | +$0.00 | +$1.75 | WAS-NEG; badge hidden (savings = $0) |
| Beef Burritos | $19 | $21.25 | **-$2.25** | $15.90 | +$3.10 | +$5.35 | WAS-NEG |
| Chicken Enchiladas | $24 | $18.25 | +$5.75 | $16.75 | +$7.25 | +$1.50 | |
| Chicken Pot Pie | $23 | $23.50 | **-$0.50** | $14.38 | +$8.62 | +$9.12 | WAS-NEG |
| Beef Stew | $24 | $20.50 | +$3.50 | $16.90 | +$7.10 | +$3.60 | |
| Beef Chili | $18 | $11.25 | +$6.75 | $10.65 | +$7.35 | +$0.60 | |
| Loaded Baked Potatoes | $16 | $21.75 | **-$5.75** | $15.25 | +$0.75 | +$6.50 | WAS-NEG |
| Grilled Cheese & Tomato Soup | $16 | $18.00 | **-$2.00** | $10.38 | +$5.62 | +$7.62 | WAS-NEG |
| Ham & Cheese Sliders | $18 | $22.50 | **-$4.50** | $15.00 | +$3.00 | +$7.50 | WAS-NEG |
| Sheet Pan Sausage & Veggies | $20 | $17.75 | +$2.25 | $9.75 | +$10.25 | +$8.00 | |
| Chicken Alfredo | $22 | $20.50 | +$1.50 | $17.48 | +$4.52 | +$3.02 | |
| Spaghetti with Meat Sauce | $20 | $16.25 | +$3.75 | $13.40 | +$6.60 | +$2.85 | |
| Baked Ziti | $24 | $22.25 | +$1.75 | $18.13 | +$5.87 | +$4.12 | |
| Mac & Cheese with Sausage | $19 | $17.75 | +$1.25 | $10.50 | +$8.50 | +$7.25 | |
| Chicken Parmesan | $26 | $25.75 | +$0.25 | $18.00 | +$8.00 | +$7.75 | |
| Chicken Stir Fry | $21 | $26.75 | **-$5.75** | $13.55 | +$7.45 | +$13.20 | WAS-NEG |
| Beef Stir Fry | $23 | $22.75 | +$0.25 | $15.05 | +$7.95 | +$7.70 | |
| Chicken Fried Rice | $17 | $19.00 | **-$2.00** | $7.10 | +$9.90 | +$11.90 | WAS-NEG |
| Chicken Caesar Salad | $18 | $28.00 | **-$10.00** | $10.65 | +$7.35 | +$17.35 | WAS-NEG |
| Tomato Basil Soup | $12 | $24.00 | **-$12.00** | $5.36 | +$6.64 | +$18.64 | WAS-NEG |
| Black Bean & Rice Bowl | $16 | $26.50 | **-$10.50** | $7.15 | +$8.85 | +$19.35 | WAS-NEG |
| Tuna Salad Sandwich | $13 | $23.60 | **-$10.60** | $9.23 | +$3.77 | +$14.37 | WAS-NEG |
| Turkey Avocado Wrap | $19 | $30.00 | **-$11.00** | $18.50 | +$0.50 | +$11.50 | WAS-NEG |
| Greek Salad | $14 | $25.25 | **-$11.25** | $10.88 | +$3.12 | +$14.37 | WAS-NEG |
| Garlic Roasted Broccoli | $8 | $19.50 | **-$11.50** | $4.98 | +$3.02 | +$14.52 | WAS-NEG |
| Simple Rice Pilaf | $9 | $19.50 | **-$10.50** | $2.43 | +$6.57 | +$17.07 | WAS-NEG |
| Creamy Coleslaw | $6 | $21.00 | **-$15.00** | $2.50 | +$3.50 | +$18.50 | WAS-NEG |
| Béchamel Sauce | $8 | $16.50 | **-$8.50** | $0.75 | +$7.25 | +$15.75 | WAS-NEG |
| Velouté Sauce | $8 | $16.50 | **-$8.50** | $1.50 | +$6.50 | +$15.00 | WAS-NEG |
| Brown Sauce (Espagnole) | $9 | $19.55 | **-$10.55** | $2.43 | +$6.57 | +$17.12 | WAS-NEG |
| Classic Tomato Sauce | $7 | $25.00 | **-$18.00** | $2.98 | +$4.02 | +$22.02 | WAS-NEG |
| Hollandaise Sauce | $9 | $9.75 | **-$0.75** | $1.75 | +$7.25 | +$8.00 | WAS-NEG |
| Alfredo Sauce | $9 | $19.75 | **-$10.75** | $4.15 | +$4.85 | +$15.60 | WAS-NEG |
| Marinara Sauce | $7 | $20.25 | **-$13.25** | $2.73 | +$4.27 | +$17.52 | WAS-NEG |
| Quick Pan Sauce | $8 | $23.50 | **-$15.50** | $2.84 | +$5.16 | +$20.66 | WAS-NEG |
| Homestyle Gravy | $7 | $16.50 | **-$9.50** | $1.50 | +$5.50 | +$15.00 | WAS-NEG |
| Basic Vinaigrette | $6 | $17.75 | **-$11.75** | $0.08 | +$5.92 | +$17.67 | WAS-NEG |
| Tartar Sauce | $7 | $12.25 | **-$5.25** | $0.38 | +$6.62 | +$11.87 | WAS-NEG |
| Ranch Dressing | $7 | $26.00 | **-$19.00** | $0.94 | +$6.06 | +$25.06 | WAS-NEG |
| Alabama White Sauce | $8 | $19.75 | **-$11.75** | $0.38 | +$7.62 | +$19.37 | WAS-NEG |
| Blue Cheese Dressing | $8 | $22.75 | **-$14.75** | $3.02 | +$4.98 | +$19.73 | WAS-NEG |
| Chipotle Mayo | $7 | $17.00 | **-$10.00** | $0.25 | +$6.75 | +$16.75 | WAS-NEG |
| Tzatziki Sauce | $7 | $22.75 | **-$15.75** | $2.91 | +$4.09 | +$19.84 | WAS-NEG |
| Honey Mustard | $6 | $20.00 | **-$14.00** | $0.00 | +$6.00 | +$20.00 | WAS-NEG |
| Garlic Aioli | $7 | $21.00 | **-$14.00** | $0.53 | +$6.47 | +$20.47 | WAS-NEG |

## Summary

- **44 of 57 recipes** were negative before the fix (not the 5 originally counted).  
  Root cause: `buildAutoStaplePantryItems()` was omitted from preview, so olive oil ($8/bottle), butter ($5/pack), mayonnaise ($5.50/bottle), and honey ($6/bottle) were all charged as full packages for any quantity used.
- **56 of 57 recipes** are positive after the fix.
- **No recipe flips from positive to negative.**

## One remaining negative: Sloppy Joes

**After savings: -$2.25.** This is a seed data issue, not a code bug. The real per-unit ingredient cost is $19.25 (ground beef $5.50 + buns $3.50 + sauce $2.00 + fries $4.00 + pickles $3.50 + onion $0.75), but `restaurantPrice` is only $17. The savings badge is hidden by Fix 2 (display guard). 

**Recommendation:** raise `restaurantPrice` to $22 in `americanRecipes.js` (sloppy joes at a casual restaurant for a family runs $20–24), which would yield +$2.75 savings.

## Pantry staples (always $0 in preview after fix)

Same list as the weekly plan's `PANTRY_STAPLE_IDS`:  
spice (salt/pepper), olive oil, butter, garlic powder, onion powder, cayenne pepper, red pepper flakes, nutmeg, basil, parsley, dill, mustard, mayonnaise, vinegar, apple cider vinegar, soy sauce, bbq sauce, tomato paste, adobo sauce, chipotle peppers, prepared horseradish, flour, sugar, honey, bread crumbs.

## Checklist for adding new recipes

Run `node scripts/verify-savings.mjs` and check:
- No new STILL-NEG entries
- No recipe where "Sav (after)" is negative
- If a new recipe shows anomalously low savings (<$1), verify its `restaurantPrice` is realistic
