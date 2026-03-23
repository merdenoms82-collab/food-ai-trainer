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
  return String(recipe?.name ?? "").trim();
}

function getImageUrl(recipe) {
  return String(recipe?.image_url ?? "").trim();
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
            alt=""
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
            {money(recipe.restaurant_price)}
          </span>
        </div>

        <div className="dn-card__row">
          <span className="dn-card__label">Home</span>
          <span className="dn-card__value">{money(recipe.home_cost)}</span>
        </div>

        <div className="dn-card__savings" aria-label="Savings">
          YOU SAVE <span className="dn-card__savingsNum">{money(recipe.savings)}</span>
        </div>

        <div className="dn-card__readiness">
          {Number(recipe.readiness_pct) || 0}% Ingredients Ready
        </div>

        <button className="dn-card__btn" type="button" data-add-to-week="1">
          Add to Week
        </button>
      </div>
    </article>
  );
}