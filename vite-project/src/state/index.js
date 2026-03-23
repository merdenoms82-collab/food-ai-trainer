// src/state/index.js
// Single import surface for UI.

export { config } from "../engine/index.js";

export { appState } from "./store.js";
export {
  selectRecipesForGrid,
  selectWeeklyTotals,
  selectWeeklyEngineDebug,
  selectChefMayaHelp,
} from "./selectors.js";

export {
  PLAN_FREE,
  PLAN_PREMIUM,
  FEATURE_GATE_KEYS,
  selectEntitlementState,
  selectCurrentPlan,
  selectFeatureGateCatalog,
  selectFeatureFlags,
  selectIsFeatureAvailable,
} from "./entitlements.js";