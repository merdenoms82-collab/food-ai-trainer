import React from "react";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

export default function WeeklySavingsHeader({
  restaurantTotal = 0,
  homeTotal = 0,
  savingsTotal = 0,
}) {
  return (
    <>
      <div className="weekly-row">
        <div className="weekly-metric">
          <div className="weekly-label">Restaurant</div>
          <div className="weekly-value weekly-restaurant" id="weeklyRestaurantTotal">
            {money(restaurantTotal)}
          </div>
        </div>
        <div className="weekly-metric">
          <div className="weekly-label">Home</div>
          <div className="weekly-value" id="weeklyHomeTotal">
            {money(homeTotal)}
          </div>
        </div>
      </div>
      <div className="weekly-headline">
        <div className="weekly-label">YOU SAVE THIS WEEK</div>
        <div className="weekly-save" id="weeklySavingsTotal">
          {money(savingsTotal)}
        </div>
      </div>
    </>
  );
}
