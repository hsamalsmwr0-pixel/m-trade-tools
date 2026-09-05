/* =========================================================
   M-Trade Tools — Calculator Engine
   File: js/calculator.js
   Version: V1.3.1
   ========================================================= */

(function () {
  "use strict";

  /**
   * Convert a value into a valid number.
   * Invalid or non-finite values become 0.
   */
  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  /**
   * Calculate all financial metrics for a product.
   *
   * Inputs:
   * - sellingPrice
   * - purchasePrice
   * - shipping
   * - packaging
   * - adCost
   * - units
   * - fixedCosts
   * - targetMargin
   *
   * Core formulas:
   *
   * Variable Cost / Unit
   * = Purchase + Shipping + Packaging + Advertising
   *
   * Contribution / Unit
   * = Selling Price - Variable Cost
   *
   * Total Revenue
   * = Selling Price × Units
   *
   * Total Variable Costs
   * = Variable Cost / Unit × Units
   *
   * Total Costs
   * = Total Variable Costs + Fixed Costs
   *
   * Net Profit
   * = Total Revenue - Total Costs
   *
   * Net Profit / Unit
   * = Contribution / Unit - Fixed Cost / Unit
   *
   * Profit Margin
   * = Net Profit / Total Revenue × 100
   *
   * ROI
   * = Net Profit / Total Costs × 100
   *
   * Target Price
   * = (Variable Cost / Unit + Fixed Cost / Unit)
   *   / (1 - Target Margin)
   *
   * Break-even Units
   * = Fixed Costs / Contribution / Unit
   */
  function calculateFinancials(input) {
    const data = input || {};

    const sellingPrice = toNumber(data.sellingPrice);
    const purchasePrice = toNumber(data.purchasePrice);
    const shipping = toNumber(data.shipping);
    const packaging = toNumber(data.packaging);
    const adCost = toNumber(data.adCost);
    const units = toNumber(data.units);
    const fixedCosts = toNumber(data.fixedCosts);
    const targetMargin = toNumber(data.targetMargin);

    /*
     * -------------------------------------------------------
     * 1. Variable Cost
     * -------------------------------------------------------
     */

    const variableCostPerUnit =
      purchasePrice +
      shipping +
      packaging +
      adCost;

    /*
     * -------------------------------------------------------
     * 2. Contribution
     * -------------------------------------------------------
     *
     * This is the amount left from each sale after variable
     * costs, before fixed costs.
     */

    const contributionPerUnit =
      sellingPrice - variableCostPerUnit;

    /*
     * -------------------------------------------------------
     * 3. Revenue
     * -------------------------------------------------------
     */

    const totalRevenue =
      sellingPrice * units;

    /*
     * -------------------------------------------------------
     * 4. Variable Costs
     * -------------------------------------------------------
     */

    const totalVariableCosts =
      variableCostPerUnit * units;

    /*
     * -------------------------------------------------------
     * 5. Total Costs
     * -------------------------------------------------------
     */

    const totalCosts =
      totalVariableCosts + fixedCosts;

    /*
     * -------------------------------------------------------
     * 6. Fixed Cost Per Unit
     * -------------------------------------------------------
     */

    const fixedCostPerUnit =
      units > 0
        ? fixedCosts / units
        : 0;

    /*
     * -------------------------------------------------------
     * 7. Net Profit Per Unit
     * -------------------------------------------------------
     */

    const netProfitPerUnit =
      contributionPerUnit - fixedCostPerUnit;

    /*
     * -------------------------------------------------------
     * 8. Net Profit
     * -------------------------------------------------------
     */

    const netProfit =
      totalRevenue - totalCosts;

    /*
     * -------------------------------------------------------
     * 9. Profit Margin
     * -------------------------------------------------------
     */

    const profitMargin =
      totalRevenue > 0
        ? (netProfit / totalRevenue) * 100
        : 0;

    /*
     * -------------------------------------------------------
     * 10. ROI
     * -------------------------------------------------------
     */

    const roi =
      totalCosts > 0
        ? (netProfit / totalCosts) * 100
        : 0;

    /*
     * -------------------------------------------------------
     * 11. Target Price
     * -------------------------------------------------------
     *
     * Target margin is based on NET profit.
     *
     * Example:
     *
     * Variable cost = 15.50
     * Fixed cost / unit = 5
     * Target margin = 30%
     *
     * Target price:
     *
     * (15.50 + 5) / (1 - 0.30)
     * = 29.2857
     */

    let targetPrice = 0;

    if (units > 0 && targetMargin < 100) {
      const targetMarginDecimal =
        targetMargin / 100;

      targetPrice =
        (
          variableCostPerUnit +
          fixedCostPerUnit
        ) /
        (1 - targetMarginDecimal);
    }

    /*
     * -------------------------------------------------------
     * 12. Break-even
     * -------------------------------------------------------
     *
     * Break-even is possible only when the contribution per
     * unit is positive.
     */

    let breakEvenUnits = 0;
    let breakEvenRevenue = 0;

    if (contributionPerUnit > 0) {
      breakEvenUnits =
        Math.ceil(
          fixedCosts / contributionPerUnit
        );

      breakEvenRevenue =
        breakEvenUnits * sellingPrice;
    }

    /*
     * -------------------------------------------------------
     * 13. Return Complete Result
     * -------------------------------------------------------
     */

    return {
      sellingPrice,
      purchasePrice,
      shipping,
      packaging,
      adCost,
      units,
      fixedCosts,
      targetMargin,

      variableCostPerUnit,
      contributionPerUnit,

      fixedCostPerUnit,
      netProfitPerUnit,

      totalRevenue,
      totalVariableCosts,
      totalCosts,

      netProfit,
      profitMargin,
      roi,

      targetPrice,

      breakEvenUnits,
      breakEvenRevenue
    };
  }

  /*
   * ---------------------------------------------------------
   * Public API
   * ---------------------------------------------------------
   *
   * app.js will access the calculator through:
   *
   * window.MTradeCalculator.calculateFinancials(...)
   */

  window.MTradeCalculator = {
    calculateFinancials
  };
})();
