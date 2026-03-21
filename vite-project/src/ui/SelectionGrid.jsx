import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./selectionGrid.css";
import SelectionCard from "./SelectionCard.jsx";

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