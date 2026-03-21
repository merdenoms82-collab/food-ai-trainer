import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./selectionGrid.css";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function SelectionCard({ recipe }) {
  return (
    <article className="dn-card" data-recipe-id={String(recipe.recipe_id ?? "")}>
      <div className="dn-card__imgWrap" aria-hidden="true">
        <img
          className="dn-card__img"
          src={String(recipe.image_url ?? "")}
          alt=""
          loading="lazy"
        />
      </div>

      <div className="dn-card__body">
        <h3 className="dn-card__title">{String(recipe.name ?? "")}</h3>

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
          YOU SAVE{" "}
          <span className="dn-card__savingsNum">{money(recipe.savings)}</span>
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

function SelectionGrid({ recipes = [] }) {
  return (
    <section className="dn-selection" aria-label="Selection Mode Recipe Grid">
      <div className="dn-selection__grid">
        {recipes.map((recipe) => (
          <SelectionCard
            key={String(recipe.recipe_id ?? recipe.id ?? "")}
            recipe={recipe}
          />
        ))}
      </div>
    </section>
  );
}

export function renderSelectionGrid(recipes = []) {
  return renderToStaticMarkup(<SelectionGrid recipes={recipes} />);
}
