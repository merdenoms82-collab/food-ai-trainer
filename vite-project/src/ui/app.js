import { config } from "../state/index.js";
import {
  appState,
  selectRecipesForGrid,
  selectWeeklyTotals,
  selectWeeklyEngineDebug,
  selectChefMayaHelp,
  selectShoppingList,
} from "../state/index.js";
import { renderSelectionGrid } from "./SelectionGrid.jsx";
import { GUIDED_PANTRY_CATALOG } from "../data/pantryCatalog.js";
import { pantryStaplesDatabase } from "../data/pantryStaples.js";
import { recipeSeed } from "../data/recipeSeed.js";

/* =========================================================
   DarsNest AI Kitchen OS — app.js
   Guided Pantry Add v1 + Shopping page wiring
   Recipes genre filter row added under AI Recipes
   Home quick actions + View All wired
   ========================================================= */

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;
const DEVICE_USER_ID_KEY = "darsnest_device_user_id";

const WEEK_DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

const RECIPE_GENRE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "italian", label: "Italian" },
  { key: "mexican", label: "Mexican" },
  { key: "chinese", label: "Chinese" },
  { key: "american", label: "American" },
  { key: "comfort", label: "Classic" },
  { key: "breakfast", label: "Breakfast" },
  { key: "chicken", label: "Chicken" },
  { key: "beef", label: "Beef" },
  { key: "seafood", label: "Seafood" },
  { key: "sauces", label: "Sauces" },
];

const SAUCE_RECIPE_IDS = new Set([
  "r_bechamel_sauce",
  "r_veloute_sauce",
  "r_brown_espagnole_sauce",
  "r_classic_tomato_sauce",
  "r_hollandaise_sauce",
  "r_alfredo_sauce",
  "r_marinara_sauce",
  "r_pan_sauce",
  "r_homestyle_gravy",
  "r_basic_vinaigrette",
  "r_tartar_sauce",
  "r_ranch_dressing",
  "r_alabama_white_sauce",
  "r_blue_cheese_dressing",
  "r_chipotle_mayo",
  "r_tzatziki_sauce",
  "r_honey_mustard",
  "r_garlic_aioli",
]);

const DEFAULT_PORTIONS = 2;
const MIN_PORTIONS = 1;
const MAX_PORTIONS = 12;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function uid(prefix = "u") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getDeviceUserId() {
  let id = localStorage.getItem(DEVICE_USER_ID_KEY);
  if (!id) {
    id = uid("device");
    localStorage.setItem(DEVICE_USER_ID_KEY, id);
  }
  return id;
}

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatShoppingQuantity(value) {
  if (value === null || value === undefined || value === "") return "0";

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "0";
  }

  const num = Number(value);
  if (!Number.isFinite(num)) return "0";

  if (Number.isInteger(num)) return String(num);

  return String(Math.round((num + Number.EPSILON) * 100) / 100);
}

function getShoppingItems(shopping) {
  if (Array.isArray(shopping?.items)) return shopping.items;
  if (Array.isArray(shopping?.list)) return shopping.list;
  return [];
}

function getShoppingHasMeals(shopping) {
  if (typeof shopping?.hasMeals === "boolean") return shopping.hasMeals;
  if (typeof shopping?.hasPlannedMeals === "boolean") return shopping.hasPlannedMeals;
  return false;
}

function getShoppingCartTotal(shopping) {
  if (Number.isFinite(Number(shopping?.cartTotal))) return Number(shopping.cartTotal);
  if (Number.isFinite(Number(shopping?.totalPurchasedCost))) return Number(shopping.totalPurchasedCost);
  return 0;
}

function normalizeShoppingItem(rawItem) {
  const label = String(
    rawItem?.label ??
      rawItem?.name ??
      rawItem?.ingredient_label ??
      rawItem?.ingredient_id ??
      "Item"
  );

  const unit = String(
    rawItem?.unit ??
      rawItem?.base_unit ??
      rawItem?.display_unit ??
      ""
  ).trim();

  const needQtyText = String(
    rawItem?.needQtyText ??
      rawItem?.net_required_text ??
      formatShoppingQuantity(rawItem?.net_required_base)
  );

  const packages = Number(
    rawItem?.packages ??
      rawItem?.packages_to_buy ??
      0
  );

  const cost = Number(
    rawItem?.cost ??
      rawItem?.purchased_cost ??
      0
  );

  const pantryNote = String(
    rawItem?.pantryNote ??
      rawItem?.pantry_note ??
      rawItem?.sourceNote ??
      rawItem?.source_note ??
      ""
  ).trim();

  return {
    ingredientId: String(rawItem?.ingredientId ?? rawItem?.ingredient_id ?? ""),
    label,
    unit,
    needQtyText,
    packages: Number.isFinite(packages) ? packages : 0,
    cost: Number.isFinite(cost) ? cost : 0,
    pantryNote,
  };
}

function getNormalizedShoppingView(shopping) {
  return {
    hasMeals: getShoppingHasMeals(shopping),
    cartTotal: getShoppingCartTotal(shopping),
    items: getShoppingItems(shopping).map(normalizeShoppingItem),
  };
}

function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function toast(msg, icon = "✅") {
  const el = $("#notification");
  if (!el) return;
  const iconEl = $("#notificationIcon");
  const textEl = $("#notificationText");
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1600);
}

function normalizeKey(s) {
  return String(s || "").trim().toLowerCase();
}

function pantryKey(item) {
  return normalizeKey(item.name);
}

function createEmptyMealSlot() {
  return {
    recipeId: null,
    portions: DEFAULT_PORTIONS,
  };
}

function createEmptyDayPlan() {
  return {
    breakfast: createEmptyMealSlot(),
    lunch: createEmptyMealSlot(),
    dinner: createEmptyMealSlot(),
  };
}

function ensureMealSlotShape(slotValue) {
  if (!slotValue || typeof slotValue !== "object" || Array.isArray(slotValue)) {
    return createEmptyMealSlot();
  }

  const recipeId = slotValue.recipeId ?? null;
  const portions = Number.isFinite(Number(slotValue.portions))
    ? Math.max(MIN_PORTIONS, Number(slotValue.portions))
    : DEFAULT_PORTIONS;

  return {
    recipeId,
    portions,
  };
}

function ensureDayPlan(dayKey) {
  const dayPlan = appState.mealPlan?.[dayKey];

  if (!dayPlan || typeof dayPlan !== "object" || Array.isArray(dayPlan)) {
    appState.mealPlan[dayKey] = createEmptyDayPlan();
    return appState.mealPlan[dayKey];
  }

  dayPlan.breakfast = ensureMealSlotShape(dayPlan.breakfast);
  dayPlan.lunch = ensureMealSlotShape(dayPlan.lunch);
  dayPlan.dinner = ensureMealSlotShape(dayPlan.dinner);

  return dayPlan;
}

function getMealSlotState(dayKey, slotKey) {
  const dayPlan = ensureDayPlan(dayKey);
  dayPlan[slotKey] = ensureMealSlotShape(dayPlan[slotKey]);
  return dayPlan[slotKey];
}

function clearMealSlot(dayKey, slotKey) {
  const dayPlan = ensureDayPlan(dayKey);
  dayPlan[slotKey] = createEmptyMealSlot();
}

function isSlotOpen(dayKey, slotKey) {
  return appState._lastOpenedDay === dayKey && appState._lastOpenedMealSlot === slotKey;
}

function syncOpenSlotValidity() {
  const day = appState._lastOpenedDay;
  const mealSlot = appState._lastOpenedMealSlot;
  const recipeId = appState._lastOpenedRecipeId;

  if (!day || !mealSlot) return;

  const slotState = getMealSlotState(day, mealSlot);

  if (!slotState.recipeId || slotState.recipeId !== recipeId) {
    closeRecipeModal();
  }
}

function getRecipeById(recipeId) {
  return appState.recipes.find((x) => x.id === recipeId) || null;
}

function getMealSlotLabel(slotKey) {
  return MEAL_SLOTS.find((s) => s.key === slotKey)?.label || "Meal";
}

function getPreviewPortions(recipeId) {
  const stored = Number(appState._previewRecipePortionsById?.[recipeId]);
  if (Number.isFinite(stored) && stored > 0) {
    return Math.max(MIN_PORTIONS, Math.min(MAX_PORTIONS, stored));
  }
  return DEFAULT_PORTIONS;
}

function setPreviewPortions(recipeId, portions) {
  if (!recipeId) return;
  const safe = Math.max(MIN_PORTIONS, Math.min(MAX_PORTIONS, Number(portions) || DEFAULT_PORTIONS));
  appState._previewRecipePortionsById[recipeId] = safe;
}

function getActivePortionsForRecipe(recipeId, forDay = null, forMealSlot = null) {
  if (forDay && forMealSlot) {
    return getMealSlotState(forDay, forMealSlot).portions;
  }
  return getPreviewPortions(recipeId);
}

function scaleRecipeForDisplay(recipe, portions = DEFAULT_PORTIONS) {
  const factor = Number(portions) / DEFAULT_PORTIONS;

  return {
    ...recipe,
    ingredients: (recipe.ingredients ?? []).map((ing) => {
      const raw = String(ing.qty ?? "").trim();
      const match = raw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

      if (!match) return { ...ing };

      const qty = Number.parseFloat(match[1]);
      const unitPart = match[2] ?? "";

      if (!Number.isFinite(qty)) return { ...ing };

      const scaledQty = Math.round((qty * factor + Number.EPSILON) * 100) / 100;
      const qtyText = Number.isInteger(scaledQty) ? String(scaledQty) : String(scaledQty);

      return {
        ...ing,
        qty: unitPart ? `${qtyText} ${unitPart}`.trim() : qtyText,
      };
    }),
    homeCost: Number(recipe.homeCost || 0) * factor,
    restaurantPrice: Number(recipe.restaurantPrice || 0) * factor,
  };
}

let supabaseClient = null;
let usingSupabase = false;

async function ensureSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    usingSupabase = false;
    return null;
  }

  if (supabaseClient) return supabaseClient;

  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load supabase-js CDN"));
      document.head.appendChild(s);
    });
  }

  if (!window.supabase?.createClient) {
    usingSupabase = false;
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  usingSupabase = true;
  return supabaseClient;
}

appState.recipes = [...recipeSeed];
appState._guidedPantry = {
  step: "category",
  categoryId: null,
  itemId: null,
  variantId: null,
  quantity: "1",
  unit: "",
};
appState.currentRecipeGenre = appState.currentRecipeGenre || "all";

const dom = {
  pages: {
    home: $("#homePage"),
    pantry: $("#pantryPage"),
    scanner: $("#scannerPage"),
    recipes: $("#recipesPage"),
    shopping: $("#shoppingPage"),
    "meal-planner": $("#mealPlannerPage"),
  },

  tabItems: $$(".tab-item"),

  pantrySearch: $("#pantrySearch"),
  pantryGrid: $("#pantryGrid"),
  pantryCats: $$(".category-tab"),
  addItemBtn: $("#addItemBtn"),
  addMenu: $("#addMenu"),

  homePantryItems: $("#homePantryItems"),
  totalItemsCount: $("#totalItemsCount"),
  freshItemsCount: $("#freshItemsCount"),
  expiringItemsCount: $("#expiringItemsCount"),
  expiredItemsCount: $("#expiredItemsCount"),

  staplesModal: $("#pantryStaplesModal"),
  staplesGrid: $("#staplesGrid"),
  saveStaplesBtn: $("#saveStaplesBtn"),
  skipStaplesBtn: $("#skipStaplesBtn"),
  closeStaplesModalBtn: $("#closeStaplesModalBtn"),

  welcomeModal: $("#welcomeModal"),
  startOnboardingBtn: $("#startOnboardingBtn"),

  recipeModal: $("#recipeModal"),
  recipeModalContent: $("#recipeModalContent"),
  closeRecipeModalBtn: $("#closeRecipeModalBtn"),

  recipeTabs: $$(".recipes-tab"),
  recipesGrid: $("#recipesGrid"),
  recipeGenreBar: null,

  startScanBtn: $("#startScanBtn"),
  scannedItemEmoji: $("#scannedItemEmoji"),
  uploadPhotoBtn: $("#uploadPhotoBtn"),

  weekCalendar: $("#weekCalendar"),
  weeklyRestaurantTotal: $("#weeklyRestaurantTotal"),
  weeklyHomeTotal: $("#weeklyHomeTotal"),
  weeklySavingsTotal: $("#weeklySavingsTotal"),
  generateMealPlanBtn: $("#generateMealPlanBtn"),

  shoppingList: $("#shoppingList"),
  totalItems: $("#totalItems"),
  estimatedCost: $("#estimatedCost"),
  estimatedSavings: $("#estimatedSavings"),

  backdrop: $("#backdrop"),
};

let guidedPantryDom = null;

function ensureRecipeGenreBar() {
  if (dom.recipeGenreBar || !dom.recipesGrid) return;

  const bar = document.createElement("div");
  bar.id = "recipeGenreBar";
  bar.style.display = "grid";
  bar.style.gridTemplateColumns = "repeat(auto-fit, minmax(110px, 1fr))";
  bar.style.gap = "8px";
  bar.style.width = "100%";
  bar.style.padding = "0 0 12px";
  bar.style.margin = "4px 0 12px";

  dom.recipesGrid.parentNode?.insertBefore(bar, dom.recipesGrid);
  dom.recipeGenreBar = bar;
}

function recipeHasNameOrIngredient(recipe, terms) {
  const haystack = [
    recipe.name,
    ...(recipe.ingredients || []).map((x) => x.name),
    ...(recipe.ingredients || []).map((x) => x.key),
  ]
    .filter(Boolean)
    .map(normalizeKey)
    .join(" ");

  return terms.some((term) => haystack.includes(normalizeKey(term)));
}

function inferRecipeGenres(recipe) {
  const explicit = Array.isArray(recipe.genres)
    ? recipe.genres.map(normalizeKey)
    : recipe.genre
      ? [normalizeKey(recipe.genre)]
      : [];

  const genres = new Set(explicit);

  if (recipeHasNameOrIngredient(recipe, ["alfredo", "parmesan", "mozzarella", "ricotta", "marinara", "spaghetti", "fettuccine", "penne", "lasagna", "ziti"])) {
    genres.add("italian");
  }

  if (recipeHasNameOrIngredient(recipe, ["taco", "burrito", "enchilada", "quesadilla", "salsa", "refried beans", "tortilla", "taco shells"])) {
    genres.add("mexican");
  }

  if (recipeHasNameOrIngredient(recipe, ["stir fry", "fried rice", "soy sauce", "teriyaki", "ramen", "rice noodles"])) {
    genres.add("chinese");
  }

  if (recipeHasNameOrIngredient(recipe, ["burger", "sloppy joe", "grilled cheese", "baked potato", "bacon", "toast", "bbq", "pot pie"])) {
    genres.add("american");
  }

  if (recipeHasNameOrIngredient(recipe, ["stew", "chili", "mac", "pot pie", "baked ziti", "grilled cheese", "loaded", "sliders"])) {
    genres.add("comfort");
  }

  if (recipeHasNameOrIngredient(recipe, ["breakfast", "pancake", "egg", "bacon", "sausage", "toast", "waffle", "burrito"])) {
    genres.add("breakfast");
  }

  if (recipeHasNameOrIngredient(recipe, ["chicken breast", "chicken thighs", "chicken", "buffalo chicken"])) {
    genres.add("chicken");
  }

  if (recipeHasNameOrIngredient(recipe, ["ground beef", "beef", "sirloin", "brisket", "stew meat"])) {
    genres.add("beef");
  }

  if (recipeHasNameOrIngredient(recipe, ["salmon", "shrimp", "tilapia", "cod", "catfish", "crab", "scallops"])) {
    genres.add("seafood");
  }

  if (SAUCE_RECIPE_IDS.has(recipe.id)) {
    genres.add("sauces");
  }

  if (!genres.size) {
    genres.add("american");
  }

  return Array.from(genres);
}

function recipeMatchesGenre(recipe, genreKey) {
  if (genreKey === "all") return true;
  return inferRecipeGenres(recipe).includes(normalizeKey(genreKey));
}

function renderRecipeGenreBar() {
  ensureRecipeGenreBar();
  if (!dom.recipeGenreBar) return;

  const showBar = appState.currentRecipeTab === "ai-recipes";
  dom.recipeGenreBar.style.display = showBar ? "grid" : "none";

  if (!showBar) return;

  dom.recipeGenreBar.innerHTML = RECIPE_GENRE_OPTIONS.map((genre) => {
    const active = appState.currentRecipeGenre === genre.key;
    return `
      <button
        type="button"
        class="btn ${active ? "btn-primary" : "btn-secondary"}"
        data-recipe-genre="${escapeAttr(genre.key)}"
        style="height:36px; width:100%;"
      >
        ${escapeHtml(genre.label)}
      </button>
    `;
  }).join("");
}

function buildGuidedPantryModal() {
  const modal = document.createElement("div");
  modal.className = "pantry-staples-modal";
  modal.id = "guidedPantryModal";
  modal.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="modal-header">
      <div class="modal-title-wrap" style="display:flex; align-items:center; gap:10px;">
        <button class="btn btn-secondary" id="guidedPantryBackBtn" type="button" style="height:36px; padding:0 12px; display:none;">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="modal-title" id="guidedPantryTitle">Manual Add</div>
      </div>
      <button class="close-btn" id="closeGuidedPantryBtn" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
      <div id="guidedPantryIntro" style="color: var(--muted); font-size:13px; line-height:1.45;">
        Pick a category to start.
      </div>

      <div
        id="guidedPantryOptions"
        style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;"
      ></div>

      <div id="guidedPantryConfirm" style="display:none; flex-direction:column; gap:12px;">
        <div
          id="guidedPantryPreview"
          class="card"
          style="padding:12px; background: var(--surface-2);"
        ></div>

        <div class="card" style="padding:12px;">
          <div style="font-weight:900; margin-bottom:10px;">Quantity</div>
          <input
            id="guidedPantryQty"
            type="number"
            min="1"
            step="0.25"
            value="1"
            style="width:100%; height:44px; border-radius: var(--r); border:1px solid var(--divider); background: var(--surface-2); color: var(--text); padding:0 12px;"
          />
        </div>

        <div class="card" style="padding:12px;">
          <div style="font-weight:900; margin-bottom:10px;">Unit</div>
          <select
            id="guidedPantryUnit"
            style="width:100%; height:44px; border-radius: var(--r); border:1px solid var(--divider); background: var(--surface-2); color: var(--text); padding:0 12px;"
          ></select>
        </div>

        <button class="btn btn-primary" id="saveGuidedPantryBtn" type="button">
          Save to Pantry
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  guidedPantryDom = {
    modal,
    title: $("#guidedPantryTitle"),
    intro: $("#guidedPantryIntro"),
    backBtn: $("#guidedPantryBackBtn"),
    closeBtn: $("#closeGuidedPantryBtn"),
    options: $("#guidedPantryOptions"),
    confirm: $("#guidedPantryConfirm"),
    preview: $("#guidedPantryPreview"),
    qty: $("#guidedPantryQty"),
    unit: $("#guidedPantryUnit"),
    saveBtn: $("#saveGuidedPantryBtn"),
  };
}

function resetGuidedPantryState() {
  appState._guidedPantry = {
    step: "category",
    categoryId: null,
    itemId: null,
    variantId: null,
    quantity: "1",
    unit: "",
  };
}

function getGuidedCategory() {
  return GUIDED_PANTRY_CATALOG.find((x) => x.id === appState._guidedPantry.categoryId) || null;
}

function getGuidedItem() {
  const category = getGuidedCategory();
  if (!category) return null;
  return category.items.find((x) => x.id === appState._guidedPantry.itemId) || null;
}

function getGuidedVariant() {
  const item = getGuidedItem();
  if (!item?.variants?.length) return null;
  return item.variants.find((x) => x.id === appState._guidedPantry.variantId) || null;
}

function getGuidedUnitOptions() {
  const variant = getGuidedVariant();
  const item = getGuidedItem();
  const opts = variant?.unitOptions ?? item?.unitOptions ?? ["whole"];
  return Array.isArray(opts) && opts.length ? opts : ["whole"];
}

function getGuidedResolvedName() {
  const item = getGuidedItem();
  const variant = getGuidedVariant();

  if (!item) return "";

  if (variant?.fullName) return variant.fullName;
  if (variant?.label) return `${item.label} ${variant.label}`.trim();
  return item.label;
}

function getGuidedResolvedEmoji() {
  const category = getGuidedCategory();
  const item = getGuidedItem();
  return item?.emoji || category?.emoji || "📦";
}

function syncGuidedUnitSelection() {
  const options = getGuidedUnitOptions();
  const current = appState._guidedPantry.unit;
  if (!options.includes(current)) {
    appState._guidedPantry.unit = options[0];
  }
}

function openBackdrop() {
  if (dom.backdrop) dom.backdrop.classList.add("active");
}

function closeBackdrop() {
  if (dom.backdrop) dom.backdrop.classList.remove("active");
}

function openGuidedPantryModal() {
  if (!guidedPantryDom) return;
  resetGuidedPantryState();
  renderGuidedPantryModal();
  guidedPantryDom.modal.classList.add("active");
  openBackdrop();
}

function closeGuidedPantryModal() {
  if (!guidedPantryDom) return;
  guidedPantryDom.modal.classList.remove("active");
  closeBackdrop();
}

function renderGuidedOptionCard({ id, label, emoji, subtitle = "", selected = false, type }) {
  return `
    <button
      class="staple-card ${selected ? "selected" : ""}"
      type="button"
      data-guided-type="${escapeAttr(type)}"
      data-guided-id="${escapeAttr(id)}"
      style="text-align:left; width:100%;"
    >
      <span class="staple-emoji">${escapeHtml(emoji || "📦")}</span>
      <div class="staple-name">${escapeHtml(label)}</div>
      <div class="staple-details">${escapeHtml(subtitle || "")}</div>
      <div class="staple-checkmark"><i class="fas fa-check"></i></div>
    </button>
  `;
}

function renderGuidedPantryModal() {
  if (!guidedPantryDom) return;

  const state = appState._guidedPantry;
  const category = getGuidedCategory();
  const item = getGuidedItem();

  guidedPantryDom.backBtn.style.display = state.step === "category" ? "none" : "inline-flex";

  if (state.step === "category") {
    guidedPantryDom.title.textContent = "Pick Category";
    guidedPantryDom.intro.textContent = "Choose the pantry group first.";
    guidedPantryDom.options.style.display = "grid";
    guidedPantryDom.confirm.style.display = "none";

    guidedPantryDom.options.innerHTML = GUIDED_PANTRY_CATALOG.map((entry) =>
      renderGuidedOptionCard({
        id: entry.id,
        label: entry.label,
        emoji: entry.emoji,
        subtitle: "Tap to continue",
        selected: state.categoryId === entry.id,
        type: "category",
      })
    ).join("");
    return;
  }

  if (state.step === "item" && category) {
    guidedPantryDom.title.textContent = category.label;
    guidedPantryDom.intro.textContent = "Choose the item you want to add.";
    guidedPantryDom.options.style.display = "grid";
    guidedPantryDom.confirm.style.display = "none";

    guidedPantryDom.options.innerHTML = category.items.map((entry) =>
      renderGuidedOptionCard({
        id: entry.id,
        label: entry.label,
        emoji: entry.emoji || category.emoji,
        subtitle: entry.variants?.length ? "Choose type" : "Tap to continue",
        selected: state.itemId === entry.id,
        type: "item",
      })
    ).join("");
    return;
  }

  if (state.step === "variant" && item?.variants?.length) {
    guidedPantryDom.title.textContent = item.label;
    guidedPantryDom.intro.textContent = "Pick the exact type.";
    guidedPantryDom.options.style.display = "grid";
    guidedPantryDom.confirm.style.display = "none";

    guidedPantryDom.options.innerHTML = item.variants.map((entry) =>
      renderGuidedOptionCard({
        id: entry.id,
        label: entry.label,
        emoji: item.emoji || category?.emoji,
        subtitle: "Tap to continue",
        selected: state.variantId === entry.id,
        type: "variant",
      })
    ).join("");
    return;
  }

  syncGuidedUnitSelection();

  guidedPantryDom.title.textContent = "Confirm Item";
  guidedPantryDom.intro.textContent = "Set quantity and unit, then save it to pantry.";
  guidedPantryDom.options.style.display = "none";
  guidedPantryDom.confirm.style.display = "flex";

  guidedPantryDom.preview.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="width:44px; height:44px; border-radius: var(--r); background: var(--surface); border:1px solid var(--divider); display:flex; align-items:center; justify-content:center; font-size:20px;">
        ${escapeHtml(getGuidedResolvedEmoji())}
      </div>
      <div>
        <div style="font-weight:900; font-size:14px;">${escapeHtml(getGuidedResolvedName())}</div>
        <div style="margin-top:4px; color: var(--muted); font-size:12px;">${escapeHtml(category?.label || "")}</div>
      </div>
    </div>
  `;

  guidedPantryDom.qty.value = state.quantity || "1";
  guidedPantryDom.unit.innerHTML = getGuidedUnitOptions()
    .map((unit) => `<option value="${escapeAttr(unit)}">${escapeHtml(unit)}</option>`)
    .join("");
  guidedPantryDom.unit.value = state.unit;
}

function stepBackGuidedPantry() {
  const state = appState._guidedPantry;

  if (state.step === "confirm") {
    const item = getGuidedItem();
    state.step = item?.variants?.length ? "variant" : "item";
    renderGuidedPantryModal();
    return;
  }

  if (state.step === "variant") {
    state.variantId = null;
    state.step = "item";
    renderGuidedPantryModal();
    return;
  }

  if (state.step === "item") {
    state.categoryId = null;
    state.itemId = null;
    state.step = "category";
    renderGuidedPantryModal();
  }
}

function handleGuidedSelection(type, id) {
  const state = appState._guidedPantry;

  if (type === "category") {
    state.categoryId = id;
    state.itemId = null;
    state.variantId = null;
    state.step = "item";
    renderGuidedPantryModal();
    return;
  }

  if (type === "item") {
    state.itemId = id;
    state.variantId = null;

    const item = getGuidedItem();
    if (item?.variants?.length) {
      state.step = "variant";
    } else {
      state.step = "confirm";
      syncGuidedUnitSelection();
    }

    renderGuidedPantryModal();
    return;
  }

  if (type === "variant") {
    state.variantId = id;
    state.step = "confirm";
    syncGuidedUnitSelection();
    renderGuidedPantryModal();
  }
}

function bindGuidedPantryEvents() {
  if (!guidedPantryDom) return;

  guidedPantryDom.closeBtn?.addEventListener("click", closeGuidedPantryModal);
  guidedPantryDom.backBtn?.addEventListener("click", stepBackGuidedPantry);

  guidedPantryDom.options?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-guided-type][data-guided-id]");
    if (!btn) return;
    handleGuidedSelection(btn.dataset.guidedType, btn.dataset.guidedId);
  });

  guidedPantryDom.qty?.addEventListener("input", (e) => {
    appState._guidedPantry.quantity = e.target.value || "1";
  });

  guidedPantryDom.unit?.addEventListener("change", (e) => {
    appState._guidedPantry.unit = e.target.value || "";
  });

  guidedPantryDom.saveBtn?.addEventListener("click", async () => {
    const quantity = Number.parseFloat(appState._guidedPantry.quantity);
    const unit = appState._guidedPantry.unit;
    const name = getGuidedResolvedName();
    const category = getGuidedCategory();
    const emoji = getGuidedResolvedEmoji();

    if (!name || !category) {
      toast("Pick an item first.", "ℹ️");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast("Enter a valid quantity.", "ℹ️");
      return;
    }

    if (!unit) {
      toast("Pick a unit.", "ℹ️");
      return;
    }

    await addPantryItem({
      user_id: appState.userId,
      name,
      category: category.category,
      quantity: String(quantity),
      unit,
      emoji,
      status: "fresh",
      expiry_date: null,
    });

    closeGuidedPantryModal();
    toast(`${name} added to pantry.`, "✅");
  });
}

function computeHomeStats() {
  const total = appState.pantryItems.length;
  const fresh = appState.pantryItems.filter((x) => x.status === "fresh").length;
  const expiring = appState.pantryItems.filter((x) => x.status === "expiring").length;
  const expired = appState.pantryItems.filter((x) => x.status === "expired").length;
  const hasAnyStatus = appState.pantryItems.some((x) => x.status);

  return {
    total,
    fresh: hasAnyStatus ? fresh : total,
    expiring: hasAnyStatus ? expiring : 0,
    expired: hasAnyStatus ? expired : 0,
  };
}

function renderHome() {
  const stats = computeHomeStats();
  if (dom.totalItemsCount) dom.totalItemsCount.textContent = stats.total;
  if (dom.freshItemsCount) dom.freshItemsCount.textContent = stats.fresh;
  if (dom.expiringItemsCount) dom.expiringItemsCount.textContent = stats.expiring;
  if (dom.expiredItemsCount) dom.expiredItemsCount.textContent = stats.expired;

  if (!dom.homePantryItems) return;
  const items = [...appState.pantryItems].slice(-6).reverse();

  if (!items.length) {
    dom.homePantryItems.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">📦</div>
        <div class="empty-title">No pantry items yet</div>
        <div class="empty-subtitle">Add staples or scan your first item.</div>
      </div>
    `;
    return;
  }

  dom.homePantryItems.innerHTML = items
    .map((i) => {
      const cat = i.category || "uncategorized";
      const qty = i.quantity ? `${i.quantity}${i.unit ? ` ${i.unit}` : ""}` : "";
      return `
        <div class="pantry-item" data-id="${escapeAttr(i.id || "")}">
          <span class="item-category">${escapeHtml(cat)}</span>
          <div class="item-name">${escapeHtml(i.emoji ? `${i.emoji} ${i.name}` : i.name)}</div>
          <div class="item-details">${escapeHtml(qty || "—")}</div>
        </div>
      `;
    })
    .join("");
}

function renderPantry() {
  if (!dom.pantryGrid) return;

  const q = normalizeKey(appState.pantrySearch);
  const cat = appState.pantryCategory;

  let items = [...appState.pantryItems];

  if (cat && cat !== "all") {
    items = items.filter((i) => normalizeKey(i.category) === cat);
  }
  if (q) {
    items = items.filter(
      (i) => normalizeKey(i.name).includes(q) || normalizeKey(i.category).includes(q)
    );
  }

  if (!items.length) {
    dom.pantryGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🔎</div>
        <div class="empty-title">No matches</div>
        <div class="empty-subtitle">Try a different search or category.</div>
      </div>
    `;
    return;
  }

  dom.pantryGrid.innerHTML = items
    .map((i) => {
      const statusClass =
        i.status === "expired"
          ? "status-expired"
          : i.status === "expiring"
            ? "status-warning"
            : "status-fresh";

      return `
        <div class="pantry-card" data-id="${escapeAttr(i.id || "")}">
          <div class="item-status ${statusClass}"></div>

          <button
            class="pantry-delete-btn"
            type="button"
            data-delete-pantry-item="1"
            data-id="${escapeAttr(i.id || "")}"
            aria-label="Delete ${escapeAttr(i.name || "pantry item")}"
            title="Delete item"
          >
            <i class="fas fa-trash"></i>
          </button>

          <div class="item-image">${escapeHtml(i.emoji || "📦")}</div>
          <div class="item-name">${escapeHtml(i.name)}</div>
          <div class="item-details">${escapeHtml((i.quantity ?? "") + (i.unit ? " " + i.unit : ""))}</div>
        </div>
      `;
    })
    .join("");
}

function computeReadiness(recipe) {
  const pantrySet = new Set(appState.pantryItems.map((p) => pantryKey(p)));

  let have = 0;
  for (const ing of recipe.ingredients) {
    const key = normalizeKey(ing.key || ing.name);
    const overrideKey = `${recipe.id}|${key}`;
    const override = appState.ingredientAvailabilityOverrides[overrideKey];
    const inPantry = pantrySet.has(key);
    const available = override === undefined ? inPantry : !!override;
    if (available) have += 1;
  }

  const total = recipe.ingredients.length || 1;
  return Math.round((have / total) * 100);
}

function getFilteredRecipesForGrid() {
  const baseRecipes = selectRecipesForGrid(appState);

  if (appState.currentRecipeTab !== "ai-recipes") {
    return baseRecipes;
  }

  return baseRecipes.filter((recipe) =>
    recipeMatchesGenre(recipe, appState.currentRecipeGenre || "all")
  );
}

function renderRecipesSelectionGrid() {
  renderRecipeGenreBar();

  if (!dom.recipesGrid) return;

  const filteredRecipes = getFilteredRecipesForGrid();
  dom.recipesGrid.innerHTML = renderSelectionGrid(filteredRecipes);

  if (!filteredRecipes.length) {
    dom.recipesGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🍽️</div>
        <div class="empty-title">No recipes in this section</div>
        <div class="empty-subtitle">Try a different recipe filter.</div>
      </div>
    `;
  }
}

function renderMealSlot(dayKey, slotKey) {
  const slotState = getMealSlotState(dayKey, slotKey);
  const recipe = slotState.recipeId ? getRecipeById(slotState.recipeId) : null;
  const scaledRecipe = recipe ? scaleRecipeForDisplay(recipe, slotState.portions) : null;
  const save = scaledRecipe
    ? Math.max(0, Number(scaledRecipe.restaurantPrice || 0) - Number(scaledRecipe.homeCost || 0))
    : 0;

  const isPendingPlacement = !!appState._pendingAddRecipeId;
  const slotLabel = getMealSlotLabel(slotKey);
  const openClass = isSlotOpen(dayKey, slotKey)
    ? " box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);"
    : "";

  return `
    <button
      class="meal-slot-button"
      type="button"
      data-day="${dayKey}"
      data-meal-slot="${slotKey}"
      style="
        width:100%;
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:4px;
        padding:10px;
        background: var(--surface);
        border:1px solid rgba(255,255,255,.08);
        border-radius: var(--r);
        text-align:left;
        cursor:pointer;
        ${openClass}
      "
    >
      <div style="font-size:11px; font-weight:900; color: var(--muted); text-transform:uppercase; letter-spacing:.04em;">
        ${escapeHtml(slotLabel)}
      </div>

      <div style="font-size:13px; font-weight:800; color: var(--text); line-height:1.3;">
        ${recipe ? escapeHtml(recipe.name) : (isPendingPlacement ? `Tap to place ${escapeHtml(slotLabel)}` : "Tap to add")}
      </div>

      ${
        recipe
          ? `
            <div style="font-size:11px; color: var(--muted);">${escapeHtml(String(slotState.portions))} portions</div>
            <div style="font-size:11px; font-weight:900; color: var(--save);">+${escapeHtml(money(save))} saved</div>
          `
          : isPendingPlacement
            ? `<div style="font-size:11px; color: var(--muted);">${escapeHtml(String(appState._pendingAddPortions || DEFAULT_PORTIONS))} pending portions</div>`
            : `<div style="font-size:11px; color: var(--muted);">—</div>`
      }
    </button>
  `;
}

function renderWeekCalendar() {
  if (!dom.weekCalendar) return;

  dom.weekCalendar.innerHTML = WEEK_DAYS
    .map((d) => {
      ensureDayPlan(d.key);

      return `
        <div class="day-slot" data-day="${d.key}">
          <div class="day-name">${d.label}</div>
          <div class="day-date">—</div>

          <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            ${renderMealSlot(d.key, "breakfast")}
            ${renderMealSlot(d.key, "lunch")}
            ${renderMealSlot(d.key, "dinner")}
          </div>
        </div>
      `;
    })
    .join("");

  renderWeeklyTotals();
  renderShoppingPage();
}

function renderWeeklyTotals() {
  const totals = selectWeeklyTotals(appState);
  console.log("Weekly Engine Debug:", selectWeeklyEngineDebug(appState));
  console.log("Weekly Totals:", totals);

  if (dom.weeklyRestaurantTotal) dom.weeklyRestaurantTotal.textContent = money(totals.restaurantTotal);
  if (dom.weeklyHomeTotal) dom.weeklyHomeTotal.textContent = money(totals.homeTotal);
  if (dom.weeklySavingsTotal) dom.weeklySavingsTotal.textContent = money(totals.savingsTotal);
}

function renderShoppingPage() {
  const shopping = getNormalizedShoppingView(selectShoppingList(appState));
  const totals = selectWeeklyTotals(appState);

  if (dom.totalItems) dom.totalItems.textContent = String(shopping.items.length);
  if (dom.estimatedCost) dom.estimatedCost.textContent = money(shopping.cartTotal);
  if (dom.estimatedSavings) dom.estimatedSavings.textContent = money(totals.savingsTotal ?? 0);

  if (!dom.shoppingList) return;

  if (!shopping.hasMeals) {
    dom.shoppingList.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🛒</div>
        <div class="empty-title">No meals planned yet</div>
        <div class="empty-subtitle">Add meals to your week to build your shopping list.</div>
      </div>
    `;
    return;
  }

  if (!shopping.items.length) {
    dom.shoppingList.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">✅</div>
        <div class="empty-title">No shopping needed</div>
        <div class="empty-subtitle">Your pantry already covers everything in this week's plan.</div>
      </div>
    `;
    return;
  }

  dom.shoppingList.innerHTML = shopping.items
    .map((item) => {
      const needText = item.unit ? `${item.needQtyText} ${item.unit}` : item.needQtyText;
      const packageCount = Math.max(0, Number(item.packages || 0));
      const packageLabel = `${packageCount} package${packageCount === 1 ? "" : "s"}`;
      const noteHtml = item.pantryNote
        ? `<div class="shopping-source">${escapeHtml(item.pantryNote)}</div>`
        : "";

      return `
        <div class="shopping-item" style="justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px; flex:1;">
            <div class="shopping-emoji">🛒</div>
            <div class="shopping-info">
              <div class="shopping-name">${escapeHtml(item.label)}</div>
              <div class="shopping-details">
                Need ${escapeHtml(needText)} • ${escapeHtml(packageLabel)}
              </div>
              ${noteHtml}
            </div>
          </div>
          <div style="font-weight:900;">${escapeHtml(money(item.cost))}</div>
        </div>
      `;
    })
    .join("");
}

function refreshExecutionStateAfterSlotMutation() {
  syncOpenSlotValidity();
  renderWeekCalendar();
}

function openWelcomeModal() {
  if (!dom.welcomeModal) return;
  dom.welcomeModal.classList.add("active");
  openBackdrop();
}

function closeWelcomeModal() {
  if (!dom.welcomeModal) return;
  dom.welcomeModal.classList.remove("active");
  closeBackdrop();
}

function openStaplesModal() {
  if (!dom.staplesModal) return;
  dom.staplesModal.classList.add("active");
  openBackdrop();
  renderStaplesGrid();
}

function closeStaplesModal() {
  if (!dom.staplesModal) return;
  dom.staplesModal.classList.remove("active");
  closeBackdrop();
}

function openRecipeModal(recipeId, { forDay = null, forMealSlot = null } = {}) {
  const baseRecipe = getRecipeById(recipeId);
  if (!baseRecipe || !dom.recipeModal || !dom.recipeModalContent) return;

  const activePortions = getActivePortionsForRecipe(recipeId, forDay, forMealSlot);
  const recipeForDisplay = scaleRecipeForDisplay(baseRecipe, activePortions);

  appState._lastOpenedRecipeId = recipeId;
  appState._lastOpenedMealSlot = forMealSlot;
  appState._lastOpenedDay = forDay;

  dom.recipeModal.classList.add("active");
  openBackdrop();
  dom.recipeModalContent.innerHTML = renderRecipeExecutionScreen(recipeForDisplay, {
    forDay,
    forMealSlot,
    portions: activePortions,
  });
}

function clearOpenRecipeTracking() {
  appState._lastOpenedRecipeId = null;
  appState._lastOpenedMealSlot = null;
  appState._lastOpenedDay = null;
}

function closeRecipeModal() {
  if (!dom.recipeModal) return;
  dom.recipeModal.classList.remove("active");
  clearOpenRecipeTracking();
  closeBackdrop();
}

function toggleAddMenu(force = null) {
  if (!dom.addMenu) return;
  const isOpen = dom.addMenu.classList.contains("active");
  const next = force === null ? !isOpen : !!force;
  dom.addMenu.classList.toggle("active", next);
}

function renderStaplesGrid() {
  if (!dom.staplesGrid) return;

  const pantryNames = new Set(appState.pantryItems.map((p) => pantryKey(p)));

  dom.staplesGrid.innerHTML = pantryStaplesDatabase
    .map((s) => {
      const inPantry = pantryNames.has(normalizeKey(s.name));
      const selected = appState.selectedStaples.has(s.id);

      return `
        <div class="staple-card ${selected ? "selected" : ""} ${inPantry ? "disabled" : ""}"
             data-staple-id="${escapeAttr(s.id)}"
             role="button"
             tabindex="0"
             aria-disabled="${inPantry ? "true" : "false"}">
          <span class="staple-emoji">${escapeHtml(s.emoji)}</span>
          <div class="staple-name">${escapeHtml(s.name)}</div>
          <div class="staple-details">${escapeHtml(`${s.quantity} ${s.unit}`)}</div>
          <div class="staple-checkmark"><i class="fas fa-check"></i></div>
        </div>
      `;
    })
    .join("");
}

async function saveSelectedStaplesToPantry() {
  const selected = pantryStaplesDatabase.filter((s) => appState.selectedStaples.has(s.id));
  if (!selected.length) {
    toast("No staples selected.", "ℹ️");
    return;
  }

  const rows = selected.map((s) => ({
    user_id: appState.userId,
    name: s.name,
    category: s.category,
    quantity: s.quantity,
    unit: s.unit,
    emoji: s.emoji,
    status: "fresh",
    expiry_date: null,
  }));

  if (await ensureSupabase()) {
    const sb = supabaseClient;
    const { error } = await sb.from("pantry_items").insert(rows);
    if (error) {
      console.error(error);
      toast("Supabase insert failed. Using local.", "⚠️");
      localInsertPantry(rows);
    } else {
      toast("Staples added to pantry.", "✅");
    }
  } else {
    localInsertPantry(rows);
    toast("Staples added (local).", "✅");
  }

  appState.selectedStaples.clear();
  closeStaplesModal();
  await loadPantryItems();
}

const LOCAL_PANTRY_KEY = "darsnest_local_pantry_items";

function localLoadPantry() {
  try {
    const raw = localStorage.getItem(LOCAL_PANTRY_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

function localSavePantry(items) {
  localStorage.setItem(LOCAL_PANTRY_KEY, JSON.stringify(items));
}

function localInsertPantry(rows) {
  const all = localLoadPantry();
  const withIds = rows.map((r) => ({ ...r, id: uid("pi"), created_at: new Date().toISOString() }));
  localSavePantry([...all, ...withIds]);
}

function localDeletePantryItem(itemId, userId) {
  const all = localLoadPantry();
  const next = all.filter((item) => !(item.id === itemId && item.user_id === userId));
  localSavePantry(next);
}

async function deletePantryItem(itemId) {
  if (!itemId) return;

  if (await ensureSupabase()) {
    const sb = supabaseClient;
    const { error } = await sb
      .from("pantry_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", appState.userId);

    if (error) {
      console.error(error);
      toast("Supabase delete failed. Using local.", "⚠️");
      localDeletePantryItem(itemId, appState.userId);
    } else {
      toast("Item deleted from pantry.", "🗑️");
    }
  } else {
    localDeletePantryItem(itemId, appState.userId);
    toast("Item deleted (local).", "🗑️");
  }

  await loadPantryItems();
}

async function loadPantryItems() {
  if (await ensureSupabase()) {
    const sb = supabaseClient;
    const { data, error } = await sb
      .from("pantry_items")
      .select("*")
      .eq("user_id", appState.userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast("Supabase load failed. Using local.", "⚠️");
      appState.pantryItems = localLoadPantry().filter((x) => x.user_id === appState.userId);
    } else {
      appState.pantryItems = data || [];
    }
  } else {
    appState.pantryItems = localLoadPantry().filter((x) => x.user_id === appState.userId);
  }

  renderHome();
  renderPantry();
  renderStaplesGrid();
  renderRecipesSelectionGrid();
  renderWeekCalendar();
  renderShoppingPage();
}

function renderWeeklyPooledCartSummary() {
  const shopping = getNormalizedShoppingView(selectShoppingList(appState));

  if (!shopping.hasMeals) {
    return `
      <div style="margin-top:10px; color: var(--muted); font-size:13px;">
        Add meals to your week to see pooled shopping totals.
      </div>
    `;
  }

  if (!shopping.items.length) {
    return `
      <div style="margin-top:10px; color: var(--muted); font-size:13px;">
        No pooled purchases needed this week.
      </div>
    `;
  }

  const rows = shopping.items
    .map((item) => {
      const needText = item.unit ? `${item.needQtyText} ${item.unit}` : item.needQtyText;

      return `
        <div style="display:grid; grid-template-columns: 1.2fr .9fr .8fr .8fr; gap:8px; align-items:center; padding:10px 0; border-top:1px solid rgba(255,255,255,.06);">
          <div style="font-weight:800; color: var(--text);">${escapeHtml(item.label)}</div>
          <div style="font-size:12px; color: var(--muted);">${escapeHtml(needText)}</div>
          <div style="font-size:12px; color: var(--muted); text-align:center;">${escapeHtml(String(item.packages))}</div>
          <div style="font-size:12px; color: var(--text); font-weight:800; text-align:right;">${escapeHtml(money(item.cost))}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="font-size:12px; color: var(--muted); font-weight:800;">Weekly Cart Total</div>
        <div style="font-size:16px; color: var(--text); font-weight:900;">${escapeHtml(money(shopping.cartTotal))}</div>
      </div>

      <div style="display:grid; grid-template-columns: 1.2fr .9fr .8fr .8fr; gap:8px; padding:0 0 6px; font-size:11px; color: var(--muted); font-weight:900; text-transform:uppercase; letter-spacing:.04em;">
        <div>Ingredient</div>
        <div>Need</div>
        <div style="text-align:center;">Packages</div>
        <div style="text-align:right;">Cost</div>
      </div>

      <div style="display:flex; flex-direction:column;">
        ${rows}
      </div>
    </div>
  `;
}

function renderChefMayaSection(title, items, renderItem) {
  if (!items?.length) return "";

  return `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <div style="font-size:12px; color: var(--text); font-weight:900; letter-spacing:.02em;">
        ${escapeHtml(title)}
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${items.map(renderItem).join("")}
      </div>
    </div>
  `;
}

function renderChefMayaHelpBlock(help) {
  const stepClarifications = renderChefMayaSection(
    "Step clarification",
    help?.stepClarifications ?? [],
    (item) => `
      <div style="padding:10px; background: var(--surface-2); border:1px solid rgba(255,255,255,.06); border-radius: var(--r);">
        <div style="font-size:12px; color: var(--text); font-weight:900; margin-bottom:4px;">
          ${escapeHtml(item.title)}
        </div>
        <div style="margin:0; color: var(--muted); line-height:1.45; font-size:13px;">
          ${escapeHtml(item.detail)}
        </div>
      </div>
    `
  );

  const substitutions = renderChefMayaSection(
    "Safe substitutions",
    help?.substitutions ?? [],
    (item) => `
      <div style="padding:10px; background: var(--surface-2); border:1px solid rgba(255,255,255,.06); border-radius: var(--r);">
        <div style="font-size:12px; color: var(--text); font-weight:900; margin-bottom:4px;">
          ${escapeHtml(item.ingredient)}
        </div>
        <div style="margin:0; color: var(--muted); line-height:1.45; font-size:13px;">
          ${escapeHtml(item.guidance)}
        </div>
      </div>
    `
  );

  const timingTechnique = renderChefMayaSection(
    "Timing & technique",
    help?.timingAndTechnique ?? [],
    (item) => `
      <div style="padding:10px; background: var(--surface-2); border:1px solid rgba(255,255,255,.06); border-radius: var(--r);">
        <div style="font-size:12px; color: var(--text); font-weight:900; margin-bottom:4px;">
          ${escapeHtml(item.title)}
        </div>
        <div style="margin:0; color: var(--muted); line-height:1.45; font-size:13px;">
          ${escapeHtml(item.detail)}
        </div>
      </div>
    `
  );

  return `
    <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
      <summary style="cursor:pointer; font-weight:900;">Chef Maya Help</summary>
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:12px;">
        <div style="color: var(--muted); line-height:1.45; font-size:13px;">
          ${escapeHtml(help?.intro ?? "")}
        </div>
        ${stepClarifications}
        ${substitutions}
        ${timingTechnique}
      </div>
    </details>
  `;
}

function renderRecipeExecutionScreen(r, { forDay = null, forMealSlot = null, portions = DEFAULT_PORTIONS } = {}) {
  const readiness = computeReadiness(r);
  const pantrySet = new Set(appState.pantryItems.map((p) => pantryKey(p)));
  const slotFilled = !!(forDay && forMealSlot && getMealSlotState(forDay, forMealSlot).recipeId);
  const isSlotContext = !!(forDay && forMealSlot);
  const chefMayaHelp = selectChefMayaHelp(r, {
    portions,
    readinessPct: readiness,
  });

  const ingredientsHtml = r.ingredients
    .map((ing) => {
      const key = normalizeKey(ing.key || ing.name);
      const overrideKey = `${appState._lastOpenedRecipeId}|${key}`;
      const inPantry = pantrySet.has(key);
      const override = appState.ingredientAvailabilityOverrides[overrideKey];
      const available = override === undefined ? inPantry : !!override;

      return `
        <li class="ingredient-item" data-ing-key="${escapeAttr(key)}" style="display:flex; align-items:center; gap:10px;">
          <span class="ingredient-emoji">${available ? "✔️" : "➕"}</span>
          <div style="flex:1;">
            <div class="ingredient-name" style="font-weight:900;">${escapeHtml(ing.name)}</div>
            <div style="color: var(--muted); font-size:12px; margin-top:2px;">${escapeHtml(ing.qty || "")}</div>
          </div>
          <button class="btn btn-secondary"
                  type="button"
                  data-toggle-ingredient="1"
                  data-ing-key="${escapeAttr(key)}"
                  style="height:36px; padding:0 10px;">
            ${available ? "Available" : "Need"}
          </button>
        </li>
      `;
    })
    .join("");

  const stepsHtml = (r.steps || [])
    .map(
      (s, idx) => `
        <li class="instruction-step" style="padding:12px; background: var(--surface-2); border:1px solid rgba(255,255,255,.06); border-radius: var(--r); margin-bottom:10px;">
          <div style="font-weight:900; margin-bottom:6px;">Step ${idx + 1}</div>
          <div style="color: var(--text); opacity:.95; line-height:1.45;">${escapeHtml(s)}</div>
        </li>
      `
    )
    .join("");

  const save = Math.max(0, Number(r.restaurantPrice || 0) - Number(r.homeCost || 0));
  const slotContext =
    forDay && forMealSlot
      ? `
          <div style="font-size:12px; color: var(--muted); font-weight:800; margin-top:6px;">
            ${escapeHtml(forDay.toUpperCase())} • ${escapeHtml(getMealSlotLabel(forMealSlot))}
          </div>
        `
      : "";

  const primaryLabel = isSlotContext ? "Replace from Recipes" : "Add to Week";

  const removeButton = slotFilled
    ? `
        <button class="btn btn-secondary"
                type="button"
                data-remove-slot="1"
                style="height:40px;">
          Remove from Slot
        </button>
      `
    : "";

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:18px; font-weight:900;">${escapeHtml(r.name)}</div>
          ${slotContext}
          <div style="margin-top:6px; font-size:12px; color: var(--text); opacity:.9;">${readiness}% Ingredients Ready</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color: rgba(239,68,68,.9); font-weight:800;">Restaurant ${money(r.restaurantPrice)}</div>
          <div style="font-size:12px; color: var(--text); font-weight:800;">Home ${money(r.homeCost)}</div>
          <div style="font-size:16px; color: var(--save); font-weight:900;">SAVE ${money(save)}</div>
        </div>
      </div>

      <div class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <div style="font-weight:900; margin-bottom:8px;">Portions</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="btn btn-secondary" type="button" data-portion-minus="1" style="height:36px;">−</button>
          <div style="min-width:60px; text-align:center; font-weight:900;">${escapeHtml(String(portions))}</div>
          <button class="btn btn-secondary" type="button" data-portion-plus="1" style="height:36px;">+</button>
        </div>
      </div>

      <div>
        <div style="font-weight:900; margin-bottom:10px;">Ingredients</div>
        <ul class="ingredients-list" style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
          ${ingredientsHtml}
        </ul>
      </div>

      <div>
        <div style="font-weight:900; margin-bottom:10px;">Steps</div>
        <ol class="instructions-list" style="list-style:none; padding:0; margin:0;">
          ${stepsHtml}
        </ol>
      </div>

      ${renderChefMayaHelpBlock(chefMayaHelp)}

      <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <summary style="cursor:pointer; font-weight:900;">Cost Breakdown</summary>
        ${renderWeeklyPooledCartSummary()}
      </details>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" type="button" data-add-week-from-modal="1" data-recipe-id="${escapeAttr(appState._lastOpenedRecipeId || r.id)}" style="flex:1;">
          ${escapeHtml(primaryLabel)}
        </button>
        ${removeButton}
      </div>
    </div>
  `;
}

function setActivePage(pageKey) {
  appState.currentPage = pageKey;

  Object.entries(dom.pages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("active", k === pageKey);
  });

  dom.tabItems.forEach((t) => {
    t.classList.toggle("active", t.dataset.page === pageKey);
  });

  toggleAddMenu(false);

  if (pageKey === "shopping") {
    renderShoppingPage();
  }

  if (pageKey === "recipes") {
    renderRecipesSelectionGrid();
  }
}

function bindEvents() {
  dom.tabItems.forEach((t) => {
    t.addEventListener("click", (e) => {
      e.preventDefault();
      const page = t.dataset.page;
      if (!page) return;
      setActivePage(page);
    });
  });

  document.addEventListener("click", (e) => {
    const actionCard = e.target.closest(".action-card");
    if (!actionCard) return;

    e.preventDefault();
    e.stopPropagation();

    const titleEl = actionCard.querySelector(".action-title");
    const label = normalizeKey(titleEl?.textContent || "");

    if (label.includes("smart scan")) {
      setActivePage("scanner");
      return;
    }

    if (label.includes("pantry staples")) {
      openStaplesModal();
      return;
    }

    if (label.includes("recipes")) {
      setActivePage("recipes");
      return;
    }

    if (label.includes("shopping")) {
      setActivePage("shopping");
    }
  });

  document.addEventListener("click", (e) => {
    const viewAllBtn = e.target.closest(".view-all-btn");
    if (!viewAllBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const section = viewAllBtn.closest(".section-header");
    const title = normalizeKey(section?.querySelector(".section-title")?.textContent || "");

    if (title.includes("recent items")) {
      setActivePage("pantry");
    }
  });

  dom.backdrop?.addEventListener("click", () => {
    toggleAddMenu(false);
    closeStaplesModal();
    closeRecipeModal();
    closeWelcomeModal();
    closeGuidedPantryModal();
  });

  dom.startOnboardingBtn?.addEventListener("click", () => {
    closeWelcomeModal();
    openStaplesModal();
  });

  dom.pantrySearch?.addEventListener(
    "input",
    debounce((e) => {
      appState.pantrySearch = e.target.value || "";
      renderPantry();
    }, 120)
  );

  document.addEventListener("click", (e) => {
    const pantryTab = e.target.closest(".category-tab");
    if (!pantryTab) return;

    dom.pantryCats = $$(".category-tab");
    dom.pantryCats.forEach((t) => t.classList.remove("active"));
    pantryTab.classList.add("active");

    appState.pantryCategory = normalizeKey(pantryTab.dataset.category || "all");
    renderPantry();
  });

  dom.pantryGrid?.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest("[data-delete-pantry-item]");
    if (!deleteBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const itemId = deleteBtn.dataset.id;
    if (!itemId) return;

    await deletePantryItem(itemId);
  });

  dom.addItemBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleAddMenu();
  });

  dom.addMenu?.addEventListener("click", (e) => {
    const item = e.target.closest(".menu-item");
    if (!item) return;
    const action = item.dataset.action;
    toggleAddMenu(false);

    if (action === "pantry-staples") {
      openStaplesModal();
    } else if (action === "scan") {
      setActivePage("scanner");
    } else if (action === "manual-add") {
      openGuidedPantryModal();
    }
  });

  dom.closeStaplesModalBtn?.addEventListener("click", closeStaplesModal);
  dom.skipStaplesBtn?.addEventListener("click", closeStaplesModal);
  dom.saveStaplesBtn?.addEventListener("click", saveSelectedStaplesToPantry);

  dom.staplesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".staple-card");
    if (!card) return;

    const id = card.dataset.stapleId;
    if (!id) return;

    if (card.classList.contains("disabled")) {
      toast("Already in pantry.", "ℹ️");
      return;
    }

    if (appState.selectedStaples.has(id)) appState.selectedStaples.delete(id);
    else appState.selectedStaples.add(id);

    renderStaplesGrid();
  });

  document.addEventListener("click", (e) => {
    const recipeTab = e.target.closest(".recipes-tab");
    if (!recipeTab) return;

    dom.recipeTabs = $$(".recipes-tab");
    dom.recipeTabs.forEach((t) => t.classList.remove("active"));
    recipeTab.classList.add("active");

    const tabKey = recipeTab.dataset.tab || "ai-recipes";
    appState.currentRecipeTab = tabKey;
    appState.currentRecipeGenre = "all";

    $("#aiRecipesTab")?.classList.toggle("active", tabKey === "ai-recipes");
    $("#myRecipesTab")?.classList.toggle("active", tabKey === "my-recipes");
    $("#favoritesTab")?.classList.toggle("active", tabKey === "favorites");

    renderRecipesSelectionGrid();
  });

  document.addEventListener("click", (e) => {
    const genreBtn = e.target.closest("[data-recipe-genre]");
    if (!genreBtn) return;

    appState.currentRecipeGenre = genreBtn.dataset.recipeGenre || "all";
    renderRecipesSelectionGrid();
  });

  dom.recipesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-card, .dn-card");
    if (!card) return;
    const recipeId = card.dataset.recipeId;
    if (!recipeId) return;

    const addBtn = e.target.closest("[data-add-to-week]");
    if (addBtn) {
      appState._pendingAddRecipeId = recipeId;
      appState._pendingAddPortions = getPreviewPortions(recipeId);
      setActivePage("meal-planner");
      renderWeekCalendar();
      toast("Tap a meal slot to place or replace this meal.", "📅");
      return;
    }

    openRecipeModal(recipeId);
  });

  dom.closeRecipeModalBtn?.addEventListener("click", closeRecipeModal);

  dom.recipeModalContent?.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-toggle-ingredient]");
    if (toggleBtn) {
      const ingKey = toggleBtn.dataset.ingKey;
      if (!ingKey) return;

      const recipeId = appState._lastOpenedRecipeId;
      if (!recipeId) return;

      const overrideKey = `${recipeId}|${normalizeKey(ingKey)}`;
      const current = appState.ingredientAvailabilityOverrides[overrideKey];
      appState.ingredientAvailabilityOverrides[overrideKey] = !(current === undefined ? false : current);

      openRecipeModal(recipeId, {
        forDay: appState._lastOpenedDay,
        forMealSlot: appState._lastOpenedMealSlot,
      });
      renderRecipesSelectionGrid();
      renderWeekCalendar();
      return;
    }

    const minusBtn = e.target.closest("[data-portion-minus]");
    if (minusBtn) {
      const recipeId = appState._lastOpenedRecipeId;
      if (!recipeId) return;

      const day = appState._lastOpenedDay;
      const mealSlot = appState._lastOpenedMealSlot;

      if (day && mealSlot) {
        const slotState = getMealSlotState(day, mealSlot);
        if (!slotState.recipeId) return;
        slotState.portions = Math.max(MIN_PORTIONS, Number(slotState.portions || DEFAULT_PORTIONS) - 1);
        openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
        renderWeekCalendar();
        return;
      }

      const next = Math.max(MIN_PORTIONS, getPreviewPortions(recipeId) - 1);
      setPreviewPortions(recipeId, next);
      openRecipeModal(recipeId);
      return;
    }

    const plusBtn = e.target.closest("[data-portion-plus]");
    if (plusBtn) {
      const recipeId = appState._lastOpenedRecipeId;
      if (!recipeId) return;

      const day = appState._lastOpenedDay;
      const mealSlot = appState._lastOpenedMealSlot;

      if (day && mealSlot) {
        const slotState = getMealSlotState(day, mealSlot);
        if (!slotState.recipeId) return;
        slotState.portions = Math.min(MAX_PORTIONS, Number(slotState.portions || DEFAULT_PORTIONS) + 1);
        openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
        renderWeekCalendar();
        return;
      }

      const next = Math.min(MAX_PORTIONS, getPreviewPortions(recipeId) + 1);
      setPreviewPortions(recipeId, next);
      openRecipeModal(recipeId);
      return;
    }

    const removeBtn = e.target.closest("[data-remove-slot]");
    if (removeBtn) {
      const day = appState._lastOpenedDay;
      const mealSlot = appState._lastOpenedMealSlot;
      if (!day || !mealSlot) return;

      clearMealSlot(day, mealSlot);
      toast(`${getMealSlotLabel(mealSlot)} cleared.`, "🗑️");
      refreshExecutionStateAfterSlotMutation();
      return;
    }

    const addOrReplaceBtn = e.target.closest("[data-add-week-from-modal]");
    if (addOrReplaceBtn) {
      const recipeId = addOrReplaceBtn.dataset.recipeId;
      if (!recipeId) return;

      const isSlotContext = !!(appState._lastOpenedDay && appState._lastOpenedMealSlot);

      appState._pendingAddRecipeId = recipeId;
      appState._pendingAddPortions = isSlotContext
        ? getMealSlotState(appState._lastOpenedDay, appState._lastOpenedMealSlot).portions
        : getPreviewPortions(recipeId);

      closeRecipeModal();
      setActivePage(isSlotContext ? "recipes" : "meal-planner");
      renderWeekCalendar();

      toast(
        isSlotContext
          ? "Choose a recipe to replace this slot."
          : "Tap a meal slot to add this recipe.",
        "📅"
      );
    }
  });

  dom.weekCalendar?.addEventListener("click", (e) => {
    const mealSlotBtn = e.target.closest("[data-day][data-meal-slot]");
    if (!mealSlotBtn) return;

    const day = mealSlotBtn.dataset.day;
    const mealSlot = mealSlotBtn.dataset.mealSlot;
    if (!day || !mealSlot) return;

    const slotState = getMealSlotState(day, mealSlot);

    if (appState._pendingAddRecipeId) {
      slotState.recipeId = appState._pendingAddRecipeId;
      slotState.portions = appState._pendingAddPortions || DEFAULT_PORTIONS;
      const addedRecipe = getRecipeById(slotState.recipeId);
      appState._pendingAddRecipeId = null;
      appState._pendingAddPortions = DEFAULT_PORTIONS;
      toast(`${addedRecipe?.name || "Meal"} added to ${getMealSlotLabel(mealSlot)}.`, "✅");
      renderWeekCalendar();
      return;
    }

    if (slotState.recipeId) {
      openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
      return;
    }

    setActivePage("recipes");
    toast(`Pick a recipe for ${getMealSlotLabel(mealSlot)}.`, "📖");
  });

  dom.startScanBtn?.addEventListener("click", async () => {
    const row = {
      user_id: appState.userId,
      name: "Scanned Item",
      category: "all",
      quantity: "1",
      unit: "whole",
      emoji: "📦",
      status: "fresh",
      expiry_date: null,
    };

    await addPantryItem(row);
  });

  dom.uploadPhotoBtn?.addEventListener("click", async () => {
    const row = {
      user_id: appState.userId,
      name: "Uploaded Item",
      category: "all",
      quantity: "1",
      unit: "whole",
      emoji: "📦",
      status: "fresh",
      expiry_date: null,
    };

    await addPantryItem(row);
  });
}

function guessCategory(name) {
  const n = normalizeKey(name);

  if (
    n.includes("milk") ||
    n.includes("cheese") ||
    n.includes("butter") ||
    n.includes("cream") ||
    n.includes("yogurt") ||
    n.includes("egg")
  ) {
    return "dairy";
  }

  if (
    n.includes("chicken") ||
    n.includes("beef") ||
    n.includes("salmon") ||
    n.includes("pork") ||
    n.includes("bacon") ||
    n.includes("sausage") ||
    n.includes("shrimp") ||
    n.includes("turkey") ||
    n.includes("ham")
  ) {
    return "meat";
  }

  if (
    n.includes("apple") ||
    n.includes("avocado") ||
    n.includes("broccoli") ||
    n.includes("onion") ||
    n.includes("lemon") ||
    n.includes("lime") ||
    n.includes("garlic") ||
    n.includes("lettuce") ||
    n.includes("spinach") ||
    n.includes("tomato") ||
    n.includes("potato") ||
    n.includes("carrot") ||
    n.includes("pepper") ||
    n.includes("jalapeno") ||
    n.includes("cilantro") ||
    n.includes("zucchini") ||
    n.includes("mushroom") ||
    n.includes("cucumber")
  ) {
    return "produce";
  }

  if (
    n.includes("bread") ||
    n.includes("bun") ||
    n.includes("bagel") ||
    n.includes("muffin")
  ) {
    return "bakery";
  }

  if (
    n.includes("pasta") ||
    n.includes("rice") ||
    n.includes("flour") ||
    n.includes("sugar") ||
    n.includes("oats") ||
    n.includes("quinoa") ||
    n.includes("spaghetti") ||
    n.includes("penne") ||
    n.includes("macaroni") ||
    n.includes("noodle")
  ) {
    return "grains";
  }

  if (
    n.includes("salt") ||
    n.includes("pepper") ||
    n.includes("powder") ||
    n.includes("seasoning") ||
    n.includes("paprika") ||
    n.includes("cumin") ||
    n.includes("oil") ||
    n.includes("vinegar")
  ) {
    return "spices";
  }

  if (
    n.includes("beans") ||
    n.includes("tomatoes") ||
    n.includes("tomato sauce") ||
    n.includes("tomato paste") ||
    n.includes("broth") ||
    n.includes("salsa") ||
    n.includes("corn") ||
    n.includes("peas") ||
    n.includes("pickles") ||
    n.includes("olives") ||
    n.includes("peanut butter") ||
    n.includes("jelly")
  ) {
    return "canned";
  }

  if (
    n.includes("ketchup") ||
    n.includes("mustard") ||
    n.includes("mayo") ||
    n.includes("mayonnaise") ||
    n.includes("bbq") ||
    n.includes("ranch") ||
    n.includes("dressing") ||
    n.includes("soy sauce") ||
    n.includes("teriyaki") ||
    n.includes("hot sauce") ||
    n.includes("worcestershire")
  ) {
    return "condiments";
  }

  if (n.includes("frozen")) {
    return "frozen";
  }

  return "all";
}

async function addPantryItem(row) {
  if (!row.category || row.category === "all") {
    row.category = guessCategory(row.name);
  }

  if (await ensureSupabase()) {
    const sb = supabaseClient;
    const { error } = await sb.from("pantry_items").insert([row]);
    if (error) {
      console.error(error);
      toast("Supabase add failed. Using local.", "⚠️");
      localInsertPantry([row]);
    } else {
      toast(`${row.name} added.`, "✅");
    }
  } else {
    localInsertPantry([row]);
    toast(`${row.name} added (local).`, "✅");
  }

  await loadPantryItems();
}

function renderMyRecipesPlaceholder() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📘</div>
      <div class="empty-title">My Recipes coming soon</div>
      <div class="empty-subtitle">Your custom recipes will appear here.</div>
    </div>
  `;
}

function renderFavoritesPlaceholder() {
  return `
    <div class="empty-state">
      <div class="empty-icon">⭐</div>
      <div class="empty-title">No favorites yet</div>
      <div class="empty-subtitle">Save meals here once favorites are wired.</div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

async function bootstrap() {
  appState.userId = getDeviceUserId();
  appState.pantryItems = [];
  appState.selectedStaples = new Set();
  appState.currentPage = appState.currentPage || "home";
  appState.currentRecipeTab = appState.currentRecipeTab || "ai-recipes";
  appState.currentRecipeGenre = appState.currentRecipeGenre || "all";
  appState.pantrySearch = appState.pantrySearch || "";
  appState.pantryCategory = appState.pantryCategory || "all";
  appState.ingredientAvailabilityOverrides = appState.ingredientAvailabilityOverrides || {};
  appState.mealPlan = appState.mealPlan || {};
  appState._previewRecipePortionsById = appState._previewRecipePortionsById || {};
  appState._pendingAddRecipeId = null;
  appState._pendingAddPortions = DEFAULT_PORTIONS;
  clearOpenRecipeTracking();

  buildGuidedPantryModal();
  bindGuidedPantryEvents();
  bindEvents();
  setActivePage(appState.currentPage);

  $("#myRecipesTab") && ($("#myRecipesTab").innerHTML = renderMyRecipesPlaceholder());
  $("#favoritesTab") && ($("#favoritesTab").innerHTML = renderFavoritesPlaceholder());

  renderHome();
  renderPantry();
  renderStaplesGrid();
  renderRecipesSelectionGrid();
  renderWeekCalendar();
  renderShoppingPage();

  await loadPantryItems();

  const shouldShowWelcome = !localStorage.getItem("darsnest_welcome_seen");
  if (shouldShowWelcome) {
    localStorage.setItem("darsnest_welcome_seen", "1");
    openWelcomeModal();
  }
}

bootstrap();