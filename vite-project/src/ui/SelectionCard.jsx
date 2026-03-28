import React from "react";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function getRecipeId(recipe) {
  return String(recipe?.id ?? recipe?.recipe_id ?? "");
}

function getRecipeName(recipe) {
  return String(recipe?.name ?? recipe?.title ?? "Untitled Recipe").trim();
}

function getImageUrl(recipe) {
  return String(recipe?.image_url ?? recipe?.image ?? "").trim();
}

function getRestaurantPrice(recipe) {
  return Number(recipe?.restaurant_price ?? recipe?.restaurantPrice ?? 0);
}

function getHomeCost(recipe) {
  return Number(recipe?.home_cost ?? recipe?.homeCost ?? 0);
}

function getSavings(recipe) {
  const explicitSavings = Number(recipe?.savings);
  if (Number.isFinite(explicitSavings)) return explicitSavings;

  const restaurant = getRestaurantPrice(recipe);
  const home = getHomeCost(recipe);
  return restaurant - home;
}

function getReadiness(recipe) {
  const explicitReadiness = Number(recipe?.readiness_pct);
  if (Number.isFinite(explicitReadiness)) return explicitReadiness;
  return 0;
}

function getFallbackMonogram(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "DN";

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function SelectionCard({ recipe }) {
  const recipeId = getRecipeId(recipe);
  const recipeName = getRecipeName(recipe);
  const imageUrl = getImageUrl(recipe);
  const restaurantPrice = getRestaurantPrice(recipe);
  const homeCost = getHomeCost(recipe);
  const savings = getSavings(recipe);
  const readiness = getReadiness(recipe);

  const showFallback = !imageUrl;
  const fallbackMonogram = getFallbackMonogram(recipeName);

  const fallbackSurfaceStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, rgba(26,34,53,0.96) 0%, rgba(18,24,38,1) 100%)",
  };

  const fallbackWrapStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    textAlign: "center",
  };

  const fallbackMonogramStyle = {
    width: "56px",
    height: "56px",
    display: "grid",
    placeItems: "center",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--dn-text, #F1F5F9)",
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "0.04em",
  };

  const fallbackLabelStyle = {
    color: "var(--dn-muted, #9CA3AF)",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.3,
  };

  return (
    <article className="dn-card" data-recipe-id={recipeId}>
      <div className="dn-card__imgWrap" aria-hidden="true">
        {!showFallback ? (
          <img
            className="dn-card__img"
            src={imageUrl}
            alt={recipeName}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div style={fallbackSurfaceStyle}>
            <div style={fallbackWrapStyle}>
              <div style={fallbackMonogramStyle}>{fallbackMonogram}</div>
              <div style={fallbackLabelStyle}>Recipe Preview</div>
            </div>
          </div>
        )}
      </div>

      <div className="dn-card__body">
        <h3 className="dn-card__title">{recipeName}</h3>

        <div className="dn-card__row dn-card__row--restaurant">
          <span className="dn-card__label">Restaurant</span>
          <span className="dn-card__value dn-card__value--restaurant">
            {money(restaurantPrice)}
          </span>
        </div>

        <div className="dn-card__row">
          <span className="dn-card__label">Home</span>
          <span className="dn-card__value">{money(homeCost)}</span>
        </div>

        <div className="dn-card__savings" aria-label="Savings">
          YOU SAVE <span className="dn-card__savingsNum">{money(savings)}</span>
        </div>

        <div className="dn-card__readiness">
          {readiness}% Ingredients Ready
        </div>

        <button className="dn-card__btn" type="button" data-add-to-week="1">
          Add to Week
        </button>
      </div>
    </article>
  );
}