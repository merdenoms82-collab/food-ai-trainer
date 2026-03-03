// src/state/store.js
// Minimal state placeholder — no engine, no UI, no Supabase.

export const appState = {
  // ---- Core identity / session ----
  userId: null,

  // ---- UI state (read/write by UI) ----
  currentPage: "home",
  currentRecipeTab: "ai-recipes",
  pantryCategory: "all",
  pantrySearch: "",

  // ---- Pantry / staples ----
  pantryItems: [],
  selectedStaples: new Set(),

  // ---- Recipes / plan (UI currently expects these) ----
  recipes: [],
  mealPlan: {
    mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
  },
  ingredientAvailabilityOverrides: {},
  _pendingAddRecipeId: null,
  _lastOpenedRecipeId: null,

  // Phase 2 seed data (temporary): Selection Mode cards
  recipesForGrid: [
    {
      recipe_id: "r_001",
      name: "Garlic Butter Chicken & Rice",
      image_url:
        "https://images.unsplash.com/photo-1604908176997-125f25cc500f?auto=format&fit=crop&w=1200&q=70",
      restaurant_price: 18.0,
      home_cost: 6.75,
      savings: 11.25,
      readiness_pct: 82,
    },
    {
      recipe_id: "r_002",
      name: "Beef Tacos (Weeknight)",
      image_url:
        "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=70",
      restaurant_price: 22.0,
      home_cost: 8.5,
      savings: 13.5,
      readiness_pct: 64,
    },
    {
      recipe_id: "r_003",
      name: "Salmon Bowl (Simple)",
      image_url:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=70",
      restaurant_price: 24.0,
      home_cost: 10.25,
      savings: 13.75,
      readiness_pct: 71,
    },
    {
      recipe_id: "r_004",
      name: "Turkey Chili (Big Batch)",
      image_url:
        "https://images.unsplash.com/photo-1555243896-c709bfa0b564?auto=format&fit=crop&w=1200&q=70",
      restaurant_price: 20.0,
      home_cost: 7.25,
      savings: 12.75,
      readiness_pct: 76,
    },
  ],
};