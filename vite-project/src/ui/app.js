import { config } from "../state/index.js";
import {
  appState,
  selectRecipesForGrid,
  selectWeeklyTotals,
  selectWeeklyEngineDebug,
} from "../state/index.js";
import { renderSelectionGrid } from "./SelectionGrid.jsx";

/* =========================================================
   DarsNest AI Kitchen OS — app.js (UI Core v1)
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

function getRecipeById(recipeId) {
  return appState.recipes.find((x) => x.id === recipeId) || null;
}

function getMealSlotLabel(slotKey) {
  return MEAL_SLOTS.find((s) => s.key === slotKey)?.label || "Meal";
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
  { id: "olive_oil", name: "Olive Oil", category: "oils", emoji: "🫒", quantity: "1", unit: "bottle" },
  { id: "garlic_powder", name: "Garlic Powder", category: "spices", emoji: "🧄", quantity: "1", unit: "container" },
  { id: "onion_powder", name: "Onion Powder", category: "spices", emoji: "🧅", quantity: "1", unit: "container" },
  { id: "flour", name: "All-Purpose Flour", category: "baking", emoji: "🌾", quantity: "5", unit: "lb" },
  { id: "sugar", name: "Sugar", category: "baking", emoji: "🍚", quantity: "4", unit: "lb" },
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

const dom = {
  pages: {
    home: $("#homePage"),
    pantry: $("#pantryPage"),
    scanner: $("#scannerPage"),
    recipes: $("#recipesPage"),
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

  backdrop: $("#backdrop"),
};

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
      <div class="pantry-item" data-id="${i.id}">
        <span class="item-category">${cat}</span>
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
      <div class="pantry-card" data-id="${i.id}">
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
    if (available) have++;
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
}

function renderWeeklyTotals() {
  const totals = selectWeeklyTotals(appState);
  console.log("Weekly Engine Debug:", selectWeeklyEngineDebug(appState));
  console.log("Weekly Totals:", totals);

  if (dom.weeklyRestaurantTotal) dom.weeklyRestaurantTotal.textContent = money(totals.restaurantTotal);
  if (dom.weeklyHomeTotal) dom.weeklyHomeTotal.textContent = money(totals.homeTotal);
  if (dom.weeklySavingsTotal) dom.weeklySavingsTotal.textContent = money(totals.savingsTotal);
}

function openBackdrop() {
  if (dom.backdrop) dom.backdrop.classList.add("active");
}
function closeBackdrop() {
  if (dom.backdrop) dom.backdrop.classList.remove("active");
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

  const slotState =
    forDay && forMealSlot ? getMealSlotState(forDay, forMealSlot) : { recipeId, portions: DEFAULT_PORTIONS };

  const recipeForDisplay = scaleRecipeForDisplay(baseRecipe, slotState.portions);

  appState._lastOpenedRecipeId = recipeId;
  appState._lastOpenedMealSlot = forMealSlot;
  appState._lastOpenedDay = forDay;

  dom.recipeModal.classList.add("active");
  openBackdrop();
  dom.recipeModalContent.innerHTML = renderRecipeExecutionScreen(recipeForDisplay, {
    forDay,
    forMealSlot,
    portions: slotState.portions,
  });
}

function closeRecipeModal() {
  if (!dom.recipeModal) return;
  dom.recipeModal.classList.remove("active");
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
           data-staple-id="${s.id}"
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
}

function formatIngredientLabel(ingredientId) {
  const labels = {
    chicken: "Chicken",
    pasta: "Pasta",
    parmesan: "Parmesan",
    "heavy cream": "Heavy Cream",
    garlic: "Garlic",
    spice: "Spices",
    "ground beef": "Ground Beef",
    rice: "Rice",
    beans: "Beans",
    cheese: "Cheese",
    salsa: "Salsa",
    salmon: "Salmon",
    broccoli: "Broccoli",
    "olive oil": "Olive Oil",
    lemon: "Lemon",
  };

  return labels[ingredientId] || ingredientId;
}

function formatBaseQty(qty) {
  const n = Number(qty ?? 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(Math.round((n + Number.EPSILON) * 100) / 100);
}

function renderWeeklyPooledCartSummary() {
  const debug = selectWeeklyEngineDebug(appState);
  const cart = debug?.cart ?? null;

  if (!cart) {
    return `
      <div style="margin-top:10px; color: var(--muted); font-size:13px;">
        Add meals to your week to see pooled shopping totals.
      </div>
    `;
  }

  const netRequired = cart.net_required_base ?? {};
  const packagesToBuy = cart.packages_to_buy ?? {};
  const costByIngredient = cart.cost_by_ingredient ?? {};

  const ingredientIds = Object.keys(costByIngredient).filter((iid) => {
    const cost = Number(costByIngredient[iid] ?? 0);
    const net = Number(netRequired[iid] ?? 0);
    const pkgs = Number(packagesToBuy[iid] ?? 0);
    return cost > 0 || net > 0 || pkgs > 0;
  });

  if (!ingredientIds.length) {
    return `
      <div style="margin-top:10px; color: var(--muted); font-size:13px;">
        No pooled purchases needed this week.
      </div>
    `;
  }

  const rows = ingredientIds
    .sort((a, b) => formatIngredientLabel(a).localeCompare(formatIngredientLabel(b)))
    .map((iid) => {
      const name = formatIngredientLabel(iid);
      const net = formatBaseQty(netRequired[iid] ?? 0);
      const pkgs = packagesToBuy[iid] ?? 0;
      const cost = money(costByIngredient[iid] ?? 0);

      return `
        <div style="display:grid; grid-template-columns: 1.2fr .9fr .8fr .8fr; gap:8px; align-items:center; padding:10px 0; border-top:1px solid rgba(255,255,255,.06);">
          <div style="font-weight:800; color: var(--text);">${escapeHtml(name)}</div>
          <div style="font-size:12px; color: var(--muted);">${escapeHtml(net)}</div>
          <div style="font-size:12px; color: var(--muted); text-align:center;">${escapeHtml(String(pkgs))}</div>
          <div style="font-size:12px; color: var(--text); font-weight:800; text-align:right;">${escapeHtml(cost)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="font-size:12px; color: var(--muted); font-weight:800;">Weekly Cart Total</div>
        <div style="font-size:16px; color: var(--text); font-weight:900;">${escapeHtml(money(cart.cart_total_cost ?? 0))}</div>
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

function renderRecipeExecutionScreen(r, { forDay = null, forMealSlot = null, portions = DEFAULT_PORTIONS } = {}) {
  const readiness = computeReadiness(r);
  const pantrySet = new Set(appState.pantryItems.map((p) => pantryKey(p)));

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

      <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <summary style="cursor:pointer; font-weight:900;">Chef Maya Help</summary>
        <div style="margin-top:10px; color: var(--muted); line-height:1.45; font-size:13px;">
          Ask me about timing, substitutions, and technique. (We’ll wire the assistant next.)
        </div>
      </details>

      <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <summary style="cursor:pointer; font-weight:900;">Cost Breakdown</summary>
        ${renderWeeklyPooledCartSummary()}
      </details>

      <button class="btn btn-primary" type="button" data-add-week-from-modal="1" data-recipe-id="${escapeAttr(appState._lastOpenedRecipeId || r.id)}">
        Add to Week
      </button>
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
      toast("Manual add is next (form).", "🧩");
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
      appState._pendingAddMealSlot = null;
      setActivePage("meal-planner");
      toast("Tap a meal slot to place this meal.", "📅");
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
      const day = appState._lastOpenedDay;
      const mealSlot = appState._lastOpenedMealSlot;
      if (!day || !mealSlot) return;

      const slotState = getMealSlotState(day, mealSlot);
      slotState.portions = Math.max(MIN_PORTIONS, Number(slotState.portions || DEFAULT_PORTIONS) - 1);

      openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
      renderWeekCalendar();
      return;
    }

    const plusBtn = e.target.closest("[data-portion-plus]");
    if (plusBtn) {
      const day = appState._lastOpenedDay;
      const mealSlot = appState._lastOpenedMealSlot;
      if (!day || !mealSlot) return;

      const slotState = getMealSlotState(day, mealSlot);
      slotState.portions = Math.min(MAX_PORTIONS, Number(slotState.portions || DEFAULT_PORTIONS) + 1);

      openRecipeModal(slotState.recipeId, { forDay: day, forMealSlot: mealSlot });
      renderWeekCalendar();
      return;
    }

    const addFromModal = e.target.closest("[data-add-week-from-modal]");
    if (addFromModal) {
      const recipeId = addFromModal.dataset.recipeId;
      if (!recipeId) return;
      appState._pendingAddRecipeId = recipeId;
      appState._pendingAddMealSlot = null;
      closeRecipeModal();
      setActivePage("meal-planner");
      toast("Tap a meal slot to place this meal.", "📅");
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
      slotState.portions = DEFAULT_PORTIONS;
      appState._pendingAddMealSlot = mealSlot;
      appState._pendingAddRecipeId = null;
      renderWeekCalendar();
      toast(`${getMealSlotLabel(mealSlot)} added.`, "✅");
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
  if (n.includes("milk") || n.includes("cheese")) return "dairy";
  if (n.includes("chicken") || n.includes("beef") || n.includes("salmon")) return "meat";
  if (n.includes("apple") || n.includes("broccoli")) return "produce";
  if (n.includes("bread") || n.includes("pasta") || n.includes("rice")) return "grains";
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