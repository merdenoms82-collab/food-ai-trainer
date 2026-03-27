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

/* =========================================================
   DarsNest AI Kitchen OS — app.js
   Guided Pantry Add v1 + Shopping page wiring
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

const DEFAULT_PORTIONS = 2;
const MIN_PORTIONS = 1;
const MAX_PORTIONS = 12;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const GUIDED_PANTRY_CATALOG = [
  {
    id: "produce",
    label: "Produce",
    emoji: "🥦",
    category: "produce",
    items: [
      {
        id: "broccoli",
        label: "Broccoli",
        emoji: "🥦",
        unitOptions: ["head", "whole"],
      },
      {
        id: "onion",
        label: "Onion",
        emoji: "🧅",
        unitOptions: ["whole", "lb"],
      },
      {
        id: "lemon",
        label: "Lemon",
        emoji: "🍋",
        unitOptions: ["whole"],
      },
      {
        id: "garlic",
        label: "Garlic",
        emoji: "🧄",
        unitOptions: ["clove", "whole"],
      },
    ],
  },
  {
    id: "meat",
    label: "Meat",
    emoji: "🥩",
    category: "meat",
    items: [
      {
        id: "chicken",
        label: "Chicken",
        emoji: "🍗",
        variants: [
          { id: "breast", label: "Breast", fullName: "Chicken Breast", unitOptions: ["lb"] },
          { id: "thighs", label: "Thighs", fullName: "Chicken Thighs", unitOptions: ["lb"] },
          { id: "legs", label: "Legs", fullName: "Chicken Legs", unitOptions: ["lb"] },
          { id: "wings", label: "Wings", fullName: "Chicken Wings", unitOptions: ["lb"] },
        ],
      },
      {
        id: "beef",
        label: "Beef",
        emoji: "🥩",
        variants: [
          { id: "ground", label: "Ground Beef", fullName: "Ground Beef", unitOptions: ["lb"] },
          { id: "steak", label: "Steak", fullName: "Beef Steak", unitOptions: ["lb"] },
          { id: "roast", label: "Roast", fullName: "Beef Roast", unitOptions: ["lb"] },
        ],
      },
      {
        id: "pork",
        label: "Pork",
        emoji: "🥓",
        variants: [
          { id: "chops", label: "Chops", fullName: "Pork Chops", unitOptions: ["lb"] },
          { id: "bacon", label: "Bacon", fullName: "Bacon", unitOptions: ["lb", "pack"] },
        ],
      },
      {
        id: "salmon",
        label: "Salmon",
        emoji: "🐟",
        unitOptions: ["lb"],
      },
    ],
  },
  {
    id: "dairy",
    label: "Dairy",
    emoji: "🥛",
    category: "dairy",
    items: [
      {
        id: "milk",
        label: "Milk",
        emoji: "🥛",
        unitOptions: ["gallon", "quart"],
      },
      {
        id: "cheese",
        label: "Cheese",
        emoji: "🧀",
        unitOptions: ["oz", "lb"],
      },
      {
        id: "butter",
        label: "Butter",
        emoji: "🧈",
        unitOptions: ["box", "stick"],
      },
      {
        id: "heavy_cream",
        label: "Heavy Cream",
        emoji: "🥛",
        unitOptions: ["pint", "quart"],
      },
    ],
  },
  {
    id: "grains",
    label: "Grains",
    emoji: "🍚",
    category: "grains",
    items: [
      {
        id: "rice",
        label: "Rice",
        emoji: "🍚",
        unitOptions: ["lb", "cup", "bag"],
      },
      {
        id: "pasta",
        label: "Pasta",
        emoji: "🍝",
        unitOptions: ["box", "lb"],
      },
      {
        id: "bread",
        label: "Bread",
        emoji: "🍞",
        unitOptions: ["loaf"],
      },
    ],
  },
  {
    id: "canned",
    label: "Canned",
    emoji: "🥫",
    category: "canned",
    items: [
      {
        id: "beans",
        label: "Beans",
        emoji: "🫘",
        unitOptions: ["can"],
      },
      {
        id: "tomatoes",
        label: "Tomatoes",
        emoji: "🥫",
        unitOptions: ["can"],
      },
      {
        id: "salsa",
        label: "Salsa",
        emoji: "🫙",
        unitOptions: ["jar"],
      },
    ],
  },
  {
    id: "spices",
    label: "Spices",
    emoji: "🧂",
    category: "spices",
    items: [
      {
        id: "salt",
        label: "Salt",
        emoji: "🧂",
        unitOptions: ["container"],
      },
      {
        id: "pepper",
        label: "Black Pepper",
        emoji: "🧂",
        unitOptions: ["container"],
      },
      {
        id: "garlic_powder",
        label: "Garlic Powder",
        emoji: "🧄",
        unitOptions: ["container"],
      },
      {
        id: "onion_powder",
        label: "Onion Powder",
        emoji: "🧅",
        unitOptions: ["container"],
      },
      {
        id: "olive_oil",
        label: "Olive Oil",
        emoji: "🫒",
        unitOptions: ["bottle"],
      },
    ],
  },
];

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

const pantryStaplesDatabase = [
  { id: "salt", name: "Salt", category: "spices", emoji: "🧂", quantity: "1", unit: "container" },
  { id: "pepper", name: "Black Pepper", category: "spices", emoji: "🧂", quantity: "1", unit: "container" },
  { id: "olive_oil", name: "Olive Oil", category: "spices", emoji: "🫒", quantity: "1", unit: "bottle" },
  { id: "garlic_powder", name: "Garlic Powder", category: "spices", emoji: "🧄", quantity: "1", unit: "container" },
  { id: "onion_powder", name: "Onion Powder", category: "spices", emoji: "🧅", quantity: "1", unit: "container" },
  { id: "flour", name: "All-Purpose Flour", category: "grains", emoji: "🌾", quantity: "5", unit: "lb" },
  { id: "sugar", name: "Sugar", category: "grains", emoji: "🍚", quantity: "4", unit: "lb" },
  { id: "rice", name: "Rice", category: "grains", emoji: "🍚", quantity: "2", unit: "lb" },
  { id: "pasta", name: "Pasta", category: "grains", emoji: "🍝", quantity: "1", unit: "box" },
  { id: "canned_tomatoes", name: "Canned Tomatoes", category: "canned", emoji: "🥫", quantity: "1", unit: "can" },
];

const recipeSeed = [
  {
    id: "r_chicken_alfredo",
    name: "Chicken Alfredo",
    image: null,
    emoji: "🍝",
    restaurantPrice: 22,
    homeCost: 8,
    ingredients: [
      { name: "Chicken Breast", qty: "1.5 lb", key: "chicken breast" },
      { name: "Pasta", qty: "1 box", key: "pasta" },
      { name: "Parmesan", qty: "8 oz", key: "parmesan" },
      { name: "Heavy Cream", qty: "1 pint", key: "heavy cream" },
      { name: "Garlic", qty: "3 cloves", key: "garlic" },
      { name: "Salt", qty: "to taste", key: "salt" },
      { name: "Black Pepper", qty: "to taste", key: "black pepper" },
    ],
    steps: [
      "Boil pasta until al dente.",
      "Season and cook chicken, slice.",
      "Simmer cream, add parmesan and garlic.",
      "Toss pasta in sauce, top with chicken.",
    ],
  },
  {
    id: "r_taco_bowls",
    name: "Taco Bowls",
    image: null,
    emoji: "🌮",
    restaurantPrice: 18,
    homeCost: 6,
    ingredients: [
      { name: "Ground Beef", qty: "1 lb", key: "ground beef" },
      { name: "Rice", qty: "1 cup", key: "rice" },
      { name: "Beans", qty: "1 can", key: "beans" },
      { name: "Cheese", qty: "8 oz", key: "cheese" },
      { name: "Salsa", qty: "1 cup", key: "salsa" },
      { name: "Salt", qty: "to taste", key: "salt" },
    ],
    steps: [
      "Cook rice.",
      "Brown beef with seasoning.",
      "Warm beans, assemble bowls.",
    ],
  },
  {
    id: "r_salmon_veg",
    name: "Salmon + Veg",
    image: null,
    emoji: "🐟",
    restaurantPrice: 28,
    homeCost: 12,
    ingredients: [
      { name: "Salmon", qty: "1.5 lb", key: "salmon" },
      { name: "Broccoli", qty: "1 head", key: "broccoli" },
      { name: "Olive Oil", qty: "1 tbsp", key: "olive oil" },
      { name: "Salt", qty: "to taste", key: "salt" },
      { name: "Black Pepper", qty: "to taste", key: "black pepper" },
      { name: "Lemon", qty: "1", key: "lemon" },
    ],
    steps: [
      "Roast broccoli with oil, salt, pepper.",
      "Pan-sear salmon, finish with lemon.",
    ],
  },
];

appState.recipes = [...recipeSeed];
appState._guidedPantry = {
  step: "category",
  categoryId: null,
  itemId: null,
  variantId: null,
  quantity: "1",
  unit: "",
};

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
  const variant = getGuidedVariant();

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

function renderRecipesSelectionGrid() {
  if (!dom.recipesGrid) return;
  dom.recipesGrid.innerHTML = renderSelectionGrid(selectRecipesForGrid(appState));
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
  const openClass = isSlotOpen(dayKey, slotKey) ? " box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);" : "";

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
  const shopping = selectShoppingList(appState);
  const totals = selectWeeklyTotals(appState);

  if (dom.totalItems) dom.totalItems.textContent = String(shopping.items?.length ?? 0);
  if (dom.estimatedCost) dom.estimatedCost.textContent = money(shopping.cartTotal ?? 0);
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

      return `
        <div class="shopping-item" style="justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px; flex:1;">
            <div class="shopping-emoji">🛒</div>
            <div class="shopping-info">
              <div class="shopping-name">${escapeHtml(item.label)}</div>
              <div class="shopping-details">
                Need ${escapeHtml(needText)} • ${escapeHtml(String(item.packages))} package${item.packages === 1 ? "" : "s"}
              </div>
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
  const shopping = selectShoppingList(appState);

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
        <div style="font-size:16px; color: var(--text); font-weight:900;">${escapeHtml(money(shopping.cartTotal ?? 0))}</div>
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

  dom.pantryCats.forEach((tab) => {
    tab.addEventListener("click", () => {
      dom.pantryCats.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      appState.pantryCategory = normalizeKey(tab.dataset.category || "all");
      renderPantry();
    });
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

  dom.recipeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      dom.recipeTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const tabKey = tab.dataset.tab || "ai-recipes";
      appState.currentRecipeTab = tabKey;

      $("#aiRecipesTab")?.classList.toggle("active", tabKey === "ai-recipes");
      $("#myRecipesTab")?.classList.toggle("active", tabKey === "my-recipes");
      $("#favoritesTab")?.classList.toggle("active", tabKey === "favorites");
    });
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
      const wasFilled = !!slotState.recipeId;
      const shouldPreservePortions = wasFilled && slotState.portions > 0;

      slotState.recipeId = appState._pendingAddRecipeId;
      slotState.portions = shouldPreservePortions
        ? slotState.portions
        : Math.max(MIN_PORTIONS, Math.min(MAX_PORTIONS, Number(appState._pendingAddPortions || DEFAULT_PORTIONS)));

      appState._pendingAddRecipeId = null;
      appState._pendingAddPortions = DEFAULT_PORTIONS;

      if (isSlotOpen(day, mealSlot)) {
        openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
      }

      renderWeekCalendar();
      toast(wasFilled ? `${getMealSlotLabel(mealSlot)} replaced.` : `${getMealSlotLabel(mealSlot)} added.`, "✅");
      return;
    }

    if (slotState.recipeId) {
      openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
      return;
    }

    toast("Add a recipe from Recipes tab.", "ℹ️");
  });

  dom.startScanBtn?.addEventListener("click", () => {
    const emojis = ["🍎", "🥛", "🥦", "🍗", "🧀", "🍞"];
    const pick = emojis[Math.floor(Math.random() * emojis.length)];
    if (dom.scannedItemEmoji) dom.scannedItemEmoji.textContent = pick;

    const nameMap = {
      "🍎": "Apple",
      "🥛": "Milk",
      "🥦": "Broccoli",
      "🍗": "Chicken",
      "🧀": "Cheese",
      "🍞": "Bread",
    };
    const name = nameMap[pick] || "Item";
    const row = {
      user_id: appState.userId,
      name,
      category: guessCategory(name),
      quantity: "1",
      unit: "",
      emoji: pick,
      status: "fresh",
      expiry_date: null,
    };

    addPantryItem(row);
  });

  dom.uploadPhotoBtn?.addEventListener("click", () => {
    toast("Photo upload wiring next.", "🧩");
  });

  document.addEventListener("click", (e) => {
    const actionCard = e.target.closest("[data-action]");
    if (!actionCard) return;
    const action = actionCard.dataset.action;

    if (action === "scan") setActivePage("scanner");
    if (action === "pantry-staples") openStaplesModal();
    if (action === "recipes") setActivePage("recipes");
    if (action === "shopping") setActivePage("shopping");
  });
}

function guessCategory(name) {
  const n = normalizeKey(name);
  if (n.includes("milk") || n.includes("cheese") || n.includes("butter") || n.includes("cream")) return "dairy";
  if (n.includes("chicken") || n.includes("beef") || n.includes("salmon") || n.includes("pork") || n.includes("bacon")) return "meat";
  if (n.includes("apple") || n.includes("broccoli") || n.includes("onion") || n.includes("lemon") || n.includes("garlic")) return "produce";
  if (n.includes("bread") || n.includes("pasta") || n.includes("rice") || n.includes("flour") || n.includes("sugar")) return "grains";
  if (n.includes("salt") || n.includes("pepper") || n.includes("powder") || n.includes("oil")) return "spices";
  if (n.includes("beans") || n.includes("tomatoes") || n.includes("salsa")) return "canned";
  return "all";
}

async function addPantryItem(row) {
  if (await ensureSupabase()) {
    const sb = supabaseClient;
    const { error } = await sb.from("pantry_items").insert([row]);
    if (error) {
      console.error(error);
      toast("Supabase insert failed. Using local.", "⚠️");
      localInsertPantry([row]);
    } else {
      toast("Item added to pantry.", "✅");
    }
  } else {
    localInsertPantry([row]);
    toast("Item added (local).", "✅");
  }

  await loadPantryItems();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

function normalizeMealPlanShape() {
  for (const day of WEEK_DAYS) {
    ensureDayPlan(day.key);
  }
}

function init() {
  buildGuidedPantryModal();
  bindGuidedPantryEvents();

  const seen = localStorage.getItem("darsnest_seen_welcome");
  if (!seen) {
    localStorage.setItem("darsnest_seen_welcome", "1");
    setTimeout(openWelcomeModal, 250);
  }

  appState.userId = getDeviceUserId();
  normalizeMealPlanShape();

  bindEvents();
  setActivePage("home");

  renderRecipesSelectionGrid();
  renderWeekCalendar();
  renderShoppingPage();

  loadPantryItems().catch((err) => {
    console.error(err);
    toast("Load failed. Check console.", "⚠️");
  });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase not configured. Running in LOCAL mode.");
    toast("Running in local mode (add Supabase keys in app.js).", "ℹ️");
  }
}

document.addEventListener("DOMContentLoaded", init);