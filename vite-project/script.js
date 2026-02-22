/* =========================================================
   DarsNest AI Kitchen OS — script.js (UI Core v1)
   - Navigation (tabs -> pages)
   - Modals (Welcome, Staples, Recipe modal, Backdrop)
   - Pantry + Staples (Supabase if configured, local fallback)
   - Home stats + Recent items render
   - Pantry search + category filter
   - Recipes (basic selection grid) + Add-to-Week calendar
   ========================================================= */

/* =========================
   0) CONFIG (EDIT THIS)
   ========================= */

/**
 * ✅ Supabase setup:
 * 1) In Supabase Dashboard > Project Settings > API
 * 2) Copy: Project URL + anon public key
 * 3) Paste below
 *
 * If you leave these blank, app runs in LOCAL mode.
 */
const SUPABASE_URL = "";     // <-- paste your Project URL
const SUPABASE_ANON_KEY = ""; // <-- paste your anon public key

/**
 * We’ll use a simple “device user id” until you add real auth.
 * If you later enable Supabase Auth, we’ll switch to session user_id.
 */
const DEVICE_USER_ID_KEY = "darsnest_device_user_id";

/* =========================
   1) UTILITIES
   ========================= */

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

/* =========================
   2) SUPABASE LOADER
   ========================= */

let supabaseClient = null;
let usingSupabase = false;

async function ensureSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    usingSupabase = false;
    return null;
  }

  // If already loaded
  if (supabaseClient) return supabaseClient;

  // Load Supabase JS (UMD) at runtime so you don’t have to edit HTML
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

/* =========================
   3) DATA (MVP seed)
   ========================= */

/**
 * Pantry staples database (simple)
 * You can expand categories later. We store as pantry_items rows.
 */
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

/**
 * Recipes MVP seed (we will later replace with real DB)
 * restaurantPrice/homeCost are placeholders to demonstrate UI.
 * IMPORTANT: Green is used ONLY for “YOU SAVE”.
 */
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

/* =========================
   4) APP STATE
   ========================= */

const appState = {
  userId: getDeviceUserId(),

  // UI
  currentPage: "home",
  currentRecipeTab: "ai-recipes",
  pantryCategory: "all",
  pantrySearch: "",

  // Data
  pantryItems: [], // loaded
  selectedStaples: new Set(),

  // Recipes / plan (MVP placeholders)
  recipes: [...recipeSeed],
  mealPlan: {
    mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null
  },

  // toggles in Execution mode only (week-plan availability, not permanent pantry)
  ingredientAvailabilityOverrides: {
    // key: "recipeId|ingredientKey" => true/false
  },
};

/* =========================
   5) DOM REFERENCES
   ========================= */

const dom = {
  // pages
  pages: {
    home: $("#homePage"),
    pantry: $("#pantryPage"),
    scanner: $("#scannerPage"),
    recipes: $("#recipesPage"),
    "meal-planner": $("#mealPlannerPage"),
  },

  // nav
  tabItems: $$(".tab-item"),

  // pantry
  pantrySearch: $("#pantrySearch"),
  pantryGrid: $("#pantryGrid"),
  pantryCats: $$(".category-tab"),
  addItemBtn: $("#addItemBtn"),
  addMenu: $("#addMenu"),

  // home
  homePantryItems: $("#homePantryItems"),
  totalItemsCount: $("#totalItemsCount"),
  freshItemsCount: $("#freshItemsCount"),
  expiringItemsCount: $("#expiringItemsCount"),
  expiredItemsCount: $("#expiredItemsCount"),

  // staples modal
  staplesModal: $("#pantryStaplesModal"),
  staplesGrid: $("#staplesGrid"),
  saveStaplesBtn: $("#saveStaplesBtn"),
  skipStaplesBtn: $("#skipStaplesBtn"),
  closeStaplesModalBtn: $("#closeStaplesModalBtn"),

  // welcome modal
  welcomeModal: $("#welcomeModal"),
  startOnboardingBtn: $("#startOnboardingBtn"),

  // recipe modal
  recipeModal: $("#recipeModal"),
  recipeModalContent: $("#recipeModalContent"),
  closeRecipeModalBtn: $("#closeRecipeModalBtn"),

  // recipes
  recipeTabs: $$(".recipes-tab"),
  recipesGrid: $("#recipesGrid"),

  // scanner
  startScanBtn: $("#startScanBtn"),
  scannedItemEmoji: $("#scannedItemEmoji"),
  uploadPhotoBtn: $("#uploadPhotoBtn"),

  // meal planner
  weekCalendar: $("#weekCalendar"),
  weeklyRestaurantTotal: $("#weeklyRestaurantTotal"),
  weeklyHomeTotal: $("#weeklyHomeTotal"),
  weeklySavingsTotal: $("#weeklySavingsTotal"),
  generateMealPlanBtn: $("#generateMealPlanBtn"),

  // backdrop
  backdrop: $("#backdrop"),
};

/* =========================
   6) RENDER HELPERS
   ========================= */

function normalizeKey(s) {
  return String(s || "").trim().toLowerCase();
}

function pantryKey(item) {
  // used for matching recipe ingredients to pantry items
  return normalizeKey(item.name);
}

function computeHomeStats() {
  // We don’t have expiry/status logic yet; keep basic counts.
  const total = appState.pantryItems.length;

  // If your rows contain status, we’ll respect it.
  const fresh = appState.pantryItems.filter(x => x.status === "fresh").length;
  const expiring = appState.pantryItems.filter(x => x.status === "expiring").length;
  const expired = appState.pantryItems.filter(x => x.status === "expired").length;

  // If status is missing, show totals as “fresh” to avoid confusing zeros.
  const hasAnyStatus = appState.pantryItems.some(x => x.status);
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

  // Recent items (last 6)
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

  dom.homePantryItems.innerHTML = items.map(i => {
    const cat = i.category || "uncategorized";
    const qty = i.quantity ? `${i.quantity}${i.unit ? " " + i.unit : ""}` : "";
    return `
      <div class="pantry-item" data-id="${i.id}">
        <span class="item-category">${cat}</span>
        <div class="item-name">${escapeHtml(i.emoji ? `${i.emoji} ${i.name}` : i.name)}</div>
        <div class="item-details">${escapeHtml(qty || "—")}</div>
      </div>
    `;
  }).join("");
}

function renderPantry() {
  if (!dom.pantryGrid) return;

  const q = normalizeKey(appState.pantrySearch);
  const cat = appState.pantryCategory;

  let items = [...appState.pantryItems];

  if (cat && cat !== "all") {
    items = items.filter(i => normalizeKey(i.category) === cat);
  }
  if (q) {
    items = items.filter(i =>
      normalizeKey(i.name).includes(q) ||
      normalizeKey(i.category).includes(q)
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

  dom.pantryGrid.innerHTML = items.map(i => {
    const statusClass =
      i.status === "expired" ? "status-expired" :
      i.status === "expiring" ? "status-warning" :
      "status-fresh";

    return `
      <div class="pantry-card" data-id="${i.id}">
        <div class="item-status ${statusClass}"></div>
        <div class="item-image">${escapeHtml(i.emoji || "📦")}</div>
        <div class="item-name">${escapeHtml(i.name)}</div>
        <div class="item-details">${escapeHtml((i.quantity ?? "") + (i.unit ? " " + i.unit : ""))}</div>
      </div>
    `;
  }).join("");
}

function computeReadiness(recipe) {
  // Readiness based on pantry match OR overrides (weekly plan toggles)
  const pantrySet = new Set(appState.pantryItems.map(p => pantryKey(p)));

  let have = 0;
  for (const ing of recipe.ingredients) {
    const key = normalizeKey(ing.key || ing.name);
    const overrideKey = `${recipe.id}|${key}`;
    const override = appState.ingredientAvailabilityOverrides[overrideKey];
    const inPantry = pantrySet.has(key);

    const available = (override === undefined) ? inPantry : !!override;
    if (available) have++;
  }

  const total = recipe.ingredients.length || 1;
  return Math.round((have / total) * 100);
}

function renderRecipesSelectionGrid() {
  if (!dom.recipesGrid) return;

  const cards = appState.recipes.map(r => {
    const save = Math.max(0, Number(r.restaurantPrice || 0) - Number(r.homeCost || 0));
    const readiness = computeReadiness(r);

    // We only show 3–5 key ingredients on card (Selection Mode clean)
    const previewIngredients = r.ingredients.slice(0, 5).map(x => x.name).join(", ");

    return `
      <article class="recipe-card" data-recipe-id="${r.id}">
        <div class="recipe-media">
          ${r.image
            ? `<img src="${escapeAttr(r.image)}" alt="${escapeAttr(r.name)}" />`
            : `<div style="height:100%; display:flex; align-items:center; justify-content:center; font-size:48px;">${escapeHtml(r.emoji || "🍽️")}</div>`
          }
        </div>

        <div class="recipe-body">
          <h3 class="recipe-name">${escapeHtml(r.name)}</h3>
          <div class="recipe-restaurant">Restaurant: ${money(r.restaurantPrice)}</div>
          <div class="recipe-home">Home: ${money(r.homeCost)}</div>
          <div class="recipe-save">YOU SAVE ${money(save)}</div>
          <div class="recipe-readiness">${readiness}% Ingredients Ready</div>
          <div style="color: var(--muted); font-size: 11px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(previewIngredients)}
          </div>

          <button class="recipe-cta" type="button" data-add-to-week="1">Add to Week</button>
        </div>
      </article>
    `;
  }).join("");

  dom.recipesGrid.innerHTML = cards || `
    <div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">🍽️</div>
      <div class="empty-title">No recipes yet</div>
      <div class="empty-subtitle">We’ll load a real database next.</div>
    </div>
  `;
}

function renderWeekCalendar() {
  if (!dom.weekCalendar) return;

  const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

  dom.weekCalendar.innerHTML = days.map((d) => {
    const rid = appState.mealPlan[d.key];
    const r = rid ? appState.recipes.find(x => x.id === rid) : null;
    const save = r ? Math.max(0, (r.restaurantPrice||0) - (r.homeCost||0)) : 0;

    return `
      <div class="day-slot" data-day="${d.key}">
        <div class="day-name">${d.label}</div>
        <div class="day-date">—</div>
        <div class="day-meal">${r ? escapeHtml(r.name) : "Tap to add"}</div>
        ${r ? `<div style="font-size:11px; font-weight:900; color: var(--save);">+${money(save)} saved</div>` : ""}
      </div>
    `;
  }).join("");

  renderWeeklyTotals();
}

function renderWeeklyTotals() {
  // MVP totals = sum of recipe placeholders. Later the pooled cost engine replaces this.
  let restaurant = 0;
  let home = 0;

  for (const dayKey of Object.keys(appState.mealPlan)) {
    const rid = appState.mealPlan[dayKey];
    if (!rid) continue;
    const r = appState.recipes.find(x => x.id === rid);
    if (!r) continue;
    restaurant += Number(r.restaurantPrice || 0);
    home += Number(r.homeCost || 0);
  }

  const save = Math.max(0, restaurant - home);

  if (dom.weeklyRestaurantTotal) dom.weeklyRestaurantTotal.textContent = money(restaurant);
  if (dom.weeklyHomeTotal) dom.weeklyHomeTotal.textContent = money(home);
  if (dom.weeklySavingsTotal) dom.weeklySavingsTotal.textContent = money(save);
}

/* =========================
   7) MODALS / MENUS
   ========================= */

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

function openRecipeModal(recipeId, { forDay = null } = {}) {
  const r = appState.recipes.find(x => x.id === recipeId);
  if (!r || !dom.recipeModal || !dom.recipeModalContent) return;

  dom.recipeModal.classList.add("active");
  openBackdrop();

  // Execution Mode screen hierarchy (locked order)
  dom.recipeModalContent.innerHTML = renderRecipeExecutionScreen(r, forDay);
}
function closeRecipeModal() {
  if (!dom.recipeModal) return;
  dom.recipeModal.classList.remove("active");
  closeBackdrop();
}

function toggleAddMenu(force = null) {
  if (!dom.addMenu) return;
  const isOpen = dom.addMenu.classList.contains("active");
  const next = (force === null) ? !isOpen : !!force;
  dom.addMenu.classList.toggle("active", next);
}

/* =========================
   8) STAPLES UI
   ========================= */

function renderStaplesGrid() {
  if (!dom.staplesGrid) return;

  const pantryNames = new Set(appState.pantryItems.map(p => pantryKey(p)));

  dom.staplesGrid.innerHTML = pantryStaplesDatabase.map(s => {
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
  }).join("");
}

async function saveSelectedStaplesToPantry() {
  const selected = pantryStaplesDatabase.filter(s => appState.selectedStaples.has(s.id));
  if (!selected.length) {
    toast("No staples selected.", "ℹ️");
    return;
  }

  // Convert staples to pantry_items rows
  const rows = selected.map(s => ({
    user_id: appState.userId,
    name: s.name,
    category: s.category,
    quantity: s.quantity,
    unit: s.unit,
    emoji: s.emoji,
    status: "fresh",
    expiry_date: null
  }));

  // Save to Supabase if configured, else local
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

  // Clear selection, close, reload pantry
  appState.selectedStaples.clear();
  closeStaplesModal();
  await loadPantryItems();
}

/* =========================
   9) DATA ACCESS (Supabase + local fallback)
   ========================= */

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
  const withIds = rows.map(r => ({ ...r, id: uid("pi"), created_at: new Date().toISOString() }));
  localSavePantry([...all, ...withIds]);
}

async function loadPantryItems() {
  // Supabase mode
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
      appState.pantryItems = localLoadPantry().filter(x => x.user_id === appState.userId);
    } else {
      appState.pantryItems = data || [];
    }
  } else {
    appState.pantryItems = localLoadPantry().filter(x => x.user_id === appState.userId);
  }

  renderHome();
  renderPantry();
  renderStaplesGrid();
  renderRecipesSelectionGrid();
  renderWeekCalendar();
}

/* =========================
   10) RECIPE EXECUTION SCREEN (Modal)
   ========================= */

function renderRecipeExecutionScreen(r, forDay) {
  // Locked order:
  // 1) Recipe Name
  // 2) Portion Controls (placeholder)
  // 3) Ingredients (with toggles)
  // 4) Steps
  // 5) Chef Maya panel (collapsible placeholder)
  // 6) Cost breakdown (collapsed placeholder)
  const readiness = computeReadiness(r);

  const ingredientsHtml = r.ingredients.map((ing) => {
    const key = normalizeKey(ing.key || ing.name);
    const overrideKey = `${r.id}|${key}`;
    const pantrySet = new Set(appState.pantryItems.map(p => pantryKey(p)));
    const inPantry = pantrySet.has(key);

    const override = appState.ingredientAvailabilityOverrides[overrideKey];
    const available = (override === undefined) ? inPantry : !!override;

    // Toggle is for weekly plan / readiness only (does not permanently update pantry)
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
  }).join("");

  const stepsHtml = (r.steps || []).map((s, idx) => `
    <li class="instruction-step" style="padding:12px; background: var(--surface-2); border:1px solid rgba(255,255,255,.06); border-radius: var(--r); margin-bottom:10px;">
      <div style="font-weight:900; margin-bottom:6px;">Step ${idx + 1}</div>
      <div style="color: var(--text); opacity:.95; line-height:1.45;">${escapeHtml(s)}</div>
    </li>
  `).join("");

  const save = Math.max(0, Number(r.restaurantPrice || 0) - Number(r.homeCost || 0));

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <!-- 1) Name -->
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:18px; font-weight:900;">${escapeHtml(r.name)}</div>
          <div style="margin-top:6px; font-size:12px; color: var(--text); opacity:.9;">${readiness}% Ingredients Ready</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color: rgba(239,68,68,.9); font-weight:800;">Restaurant ${money(r.restaurantPrice)}</div>
          <div style="font-size:12px; color: var(--text); font-weight:800;">Home ${money(r.homeCost)}</div>
          <div style="font-size:16px; color: var(--save); font-weight:900;">SAVE ${money(save)}</div>
        </div>
      </div>

      <!-- 2) Portion controls (placeholder) -->
      <div class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <div style="font-weight:900; margin-bottom:8px;">Portions</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="btn btn-secondary" type="button" data-portion-minus="1" style="height:36px;">−</button>
          <div style="min-width:60px; text-align:center; font-weight:900;">2</div>
          <button class="btn btn-secondary" type="button" data-portion-plus="1" style="height:36px;">+</button>
          <div style="margin-left:auto; color: var(--muted); font-size:12px;">(Scaling engine next)</div>
        </div>
      </div>

      <!-- 3) Ingredients -->
      <div>
        <div style="font-weight:900; margin-bottom:10px;">Ingredients</div>
        <ul class="ingredients-list" style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
          ${ingredientsHtml}
        </ul>
      </div>

      <!-- 4) Steps -->
      <div>
        <div style="font-weight:900; margin-bottom:10px;">Steps</div>
        <ol class="instructions-list" style="list-style:none; padding:0; margin:0;">
          ${stepsHtml}
        </ol>
      </div>

      <!-- 5) Chef Maya panel (collapsed by default) -->
      <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <summary style="cursor:pointer; font-weight:900;">Chef Maya Help</summary>
        <div style="margin-top:10px; color: var(--muted); line-height:1.45; font-size:13px;">
          Ask me about timing, substitutions, and technique. (We’ll wire the assistant next.)
        </div>
      </details>

      <!-- 6) Cost breakdown (collapsed) -->
      <details class="card" style="background: var(--surface); border:1px solid var(--divider); border-radius: var(--r); padding:12px;">
        <summary style="cursor:pointer; font-weight:900;">Cost Breakdown</summary>
        <div style="margin-top:10px; color: var(--muted); font-size:13px;">
          Pooled cart math + proportional allocation is next (Savings Engine).
        </div>
      </details>

      <!-- Add to week (if opened from selection mode) -->
      <button class="btn btn-primary" type="button" data-add-week-from-modal="1" data-recipe-id="${escapeAttr(r.id)}">
        Add to Week
      </button>
    </div>
  `;
}

/* =========================
   11) NAVIGATION
   ========================= */

function setActivePage(pageKey) {
  appState.currentPage = pageKey;

  // pages
  Object.entries(dom.pages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("active", k === pageKey);
  });

  // tabs
  dom.tabItems.forEach(t => {
    t.classList.toggle("active", t.dataset.page === pageKey);
  });

  // close any menus
  toggleAddMenu(false);
}

/* =========================
   12) EVENTS
   ========================= */

function bindEvents() {
  // Tabs
  dom.tabItems.forEach(t => {
    t.addEventListener("click", (e) => {
      e.preventDefault();
      const page = t.dataset.page;
      if (!page) return;
      setActivePage(page);
    });
  });

  // Backdrop click closes modals/menus
  dom.backdrop?.addEventListener("click", () => {
    toggleAddMenu(false);
    closeStaplesModal();
    closeRecipeModal();
    closeWelcomeModal();
  });

  // Welcome modal
  dom.startOnboardingBtn?.addEventListener("click", () => {
    closeWelcomeModal();
    openStaplesModal();
  });

  // Pantry search
  dom.pantrySearch?.addEventListener("input", debounce((e) => {
    appState.pantrySearch = e.target.value || "";
    renderPantry();
  }, 120));

  // Pantry categories
  dom.pantryCats.forEach(tab => {
    tab.addEventListener("click", () => {
      dom.pantryCats.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      appState.pantryCategory = normalizeKey(tab.dataset.category || "all");
      renderPantry();
    });
  });

  // Add menu toggle
  dom.addItemBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleAddMenu();
  });

  // Add menu actions
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

  // Staples modal events
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

  // Recipes tabs
  dom.recipeTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      dom.recipeTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const tabKey = tab.dataset.tab || "ai-recipes";
      appState.currentRecipeTab = tabKey;

      // show/hide tab contents
      $("#aiRecipesTab")?.classList.toggle("active", tabKey === "ai-recipes");
      $("#myRecipesTab")?.classList.toggle("active", tabKey === "my-recipes");
      $("#favoritesTab")?.classList.toggle("active", tabKey === "favorites");
    });
  });

  // Recipes grid interactions (open modal / add to week)
  dom.recipesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-card");
    if (!card) return;
    const recipeId = card.dataset.recipeId;
    if (!recipeId) return;

    // If clicked button: add to week
    const addBtn = e.target.closest("[data-add-to-week]");
    if (addBtn) {
      // default behavior: switch to Plan and ask user to pick day by tapping day slot
      // store “pending recipe” in temp var
      appState._pendingAddRecipeId = recipeId;
      setActivePage("meal-planner");
      toast("Tap a day to place this meal.", "📅");
      return;
    }

    // Otherwise open recipe
    openRecipeModal(recipeId);
  });

  // Recipe modal close
  dom.closeRecipeModalBtn?.addEventListener("click", closeRecipeModal);

  // Recipe modal ingredient toggles + add-to-week button
  dom.recipeModalContent?.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-toggle-ingredient]");
    if (toggleBtn) {
      const ingKey = toggleBtn.dataset.ingKey;
      if (!ingKey) return;

      // find current recipe in modal by scanning nearest data
      // (simple method: store last opened recipe id)
      const recipeId = appState._lastOpenedRecipeId;
      if (!recipeId) return;

      const overrideKey = `${recipeId}|${normalizeKey(ingKey)}`;

      // toggle
      const current = appState.ingredientAvailabilityOverrides[overrideKey];
      appState.ingredientAvailabilityOverrides[overrideKey] = !(current === undefined ? false : current);

      // Re-render modal + cards + weekly totals
      openRecipeModal(recipeId);
      renderRecipesSelectionGrid();
      renderWeekCalendar();
      return;
    }

    const addFromModal = e.target.closest("[data-add-week-from-modal]");
    if (addFromModal) {
      const recipeId = addFromModal.dataset.recipeId;
      if (!recipeId) return;
      appState._pendingAddRecipeId = recipeId;
      closeRecipeModal();
      setActivePage("meal-planner");
      toast("Tap a day to place this meal.", "📅");
      return;
    }
  });

  // Week calendar tap to assign / open
  dom.weekCalendar?.addEventListener("click", (e) => {
    const slot = e.target.closest(".day-slot");
    if (!slot) return;

    const day = slot.dataset.day;
    if (!day) return;

    // If pending recipe, assign to day
    if (appState._pendingAddRecipeId) {
      appState.mealPlan[day] = appState._pendingAddRecipeId;
      appState._pendingAddRecipeId = null;
      renderWeekCalendar();
      toast("Meal added.", "✅");
      return;
    }

    // If day already has recipe, open it (execution mode)
    const rid = appState.mealPlan[day];
    if (rid) openRecipeModal(rid, { forDay: day });
    else toast("Add a recipe from Recipes tab.", "ℹ️");
  });

  // Scanner demo
  dom.startScanBtn?.addEventListener("click", () => {
    // Fake scan: cycle emoji, add sample item
    const emojis = ["🍎", "🥛", "🥦", "🍗", "🧀", "🍞"];
    const pick = emojis[Math.floor(Math.random() * emojis.length)];
    if (dom.scannedItemEmoji) dom.scannedItemEmoji.textContent = pick;

    const nameMap = {
      "🍎": "Apple",
      "🥛": "Milk",
      "🥦": "Broccoli",
      "🍗": "Chicken",
      "🧀": "Cheese",
      "🍞": "Bread"
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
      expiry_date: null
    };

    addPantryItem(row);
  });

  dom.uploadPhotoBtn?.addEventListener("click", () => {
    toast("Photo upload wiring next.", "🧩");
  });

  // quick actions routing (home)
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

/* add pantry item (supabase or local) */
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

/* =========================
   13) HTML escaping
   ========================= */

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

/* =========================
   14) INIT
   ========================= */

function init() {
  // On first run show welcome modal (simple flag)
  const seen = localStorage.getItem("darsnest_seen_welcome");
  if (!seen) {
    localStorage.setItem("darsnest_seen_welcome", "1");
    // slight delay to avoid jank
    setTimeout(openWelcomeModal, 250);
  }

  // Track last opened recipe for toggles
  const originalOpenRecipeModal = openRecipeModal;
  openRecipeModal = function patchedOpenRecipeModal(recipeId, opts) {
    appState._lastOpenedRecipeId = recipeId;
    return originalOpenRecipeModal(recipeId, opts);
  };

  bindEvents();
  setActivePage("home");

  // Initial renders
  renderRecipesSelectionGrid();
  renderWeekCalendar();

  // Load pantry data
  loadPantryItems().catch(err => {
    console.error(err);
    toast("Load failed. Check console.", "⚠️");
  });

  // If Supabase keys are empty, tell user once (not annoying)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase not configured. Running in LOCAL mode.");
    toast("Running in local mode (add Supabase keys in script.js).", "ℹ️");
  }
}

document.addEventListener("DOMContentLoaded", init);
