import { italianRecipes } from "./recipes/italianRecipes.js";
import { mexicanRecipes } from "./recipes/mexicanRecipes.js";
import { americanRecipes } from "./recipes/americanRecipes.js";
import { asianRecipes } from "./recipes/asianRecipes.js";
import { comfortRecipes } from "./recipes/comfortRecipes.js";
import { breakfastRecipes } from "./recipes/breakfastRecipes.js";
import { sauceRecipes } from "./recipes/sauceRecipes.js";

export const recipeSeed = [
  ...italianRecipes,
  ...mexicanRecipes,
  ...americanRecipes,
  ...asianRecipes,
  ...comfortRecipes,
  ...breakfastRecipes,
  ...sauceRecipes,
];