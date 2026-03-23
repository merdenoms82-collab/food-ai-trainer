// src/state/entitlements.js
// Read-only entitlement selectors for future freemium gating.
// No billing logic. No UI logic. No engine logic.

export const PLAN_FREE = "free";
export const PLAN_PREMIUM = "premium";

export const FEATURE_GATE_KEYS = Object.freeze([
  "selectionMode",
  "weeklyPlanning",
  "shoppingPooling",
  "executionMode",
  "chefMaya",
  "pantryScanner",
]);

function normalizePlan(plan) {
  return plan === PLAN_PREMIUM ? PLAN_PREMIUM : PLAN_FREE;
}

function getRawEntitlements(state) {
  return state?.entitlements ?? {};
}

function getFeatureAvailabilityMap(state) {
  return getRawEntitlements(state).featureAvailability ?? {};
}

function getFeatureRule(state, featureKey) {
  return getFeatureAvailabilityMap(state)[featureKey] ?? {
    free: false,
    premium: false,
  };
}

function getRequiredPlan(rule) {
  if (rule?.free) return PLAN_FREE;
  if (rule?.premium) return PLAN_PREMIUM;
  return null;
}

export function selectEntitlementState(state) {
  const raw = getRawEntitlements(state);
  const plan = normalizePlan(raw.plan);
  const status = raw.status ?? "active";
  const localDevBypass = raw.localDevBypass !== false;

  return {
    plan,
    status,
    localDevBypass,
    featureAvailability: getFeatureAvailabilityMap(state),
  };
}

export function selectCurrentPlan(state) {
  return selectEntitlementState(state).plan;
}

export function selectFeatureGateCatalog(state) {
  const entitlementState = selectEntitlementState(state);
  const catalog = {};

  for (const featureKey of FEATURE_GATE_KEYS) {
    const rule = getFeatureRule(state, featureKey);
    const enabledByPlan = !!rule[entitlementState.plan];
    const enabled = entitlementState.localDevBypass ? true : enabledByPlan;

    catalog[featureKey] = {
      featureKey,
      plan: entitlementState.plan,
      status: entitlementState.status,
      localDevBypass: entitlementState.localDevBypass,
      enabled,
      enabledByPlan,
      requiredPlan: getRequiredPlan(rule),
      rules: {
        free: !!rule.free,
        premium: !!rule.premium,
      },
    };
  }

  return catalog;
}

export function selectFeatureFlags(state) {
  const catalog = selectFeatureGateCatalog(state);
  const flags = {};

  for (const featureKey of FEATURE_GATE_KEYS) {
    flags[featureKey] = !!catalog[featureKey]?.enabled;
  }

  return flags;
}

export function selectIsFeatureAvailable(state, featureKey) {
  return !!selectFeatureGateCatalog(state)[featureKey]?.enabled;
}