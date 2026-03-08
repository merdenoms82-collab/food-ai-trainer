export const config = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export function bootEngine() {
  console.log("engine boot");
}

export { computeWeeklySavingsEngineV1 } from "./savingsEngine.js";
export { ingredientMaster } from "./ingredientMaster.js";