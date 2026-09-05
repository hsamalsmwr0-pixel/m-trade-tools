/* =========================================================
   M-Trade Tools — Commercial Analysis Engine
   File: js/analysis.js
   Version: V1.3.1
   ========================================================= */

(function () {
  "use strict";

  /**
   * Evaluate the commercial performance of a product.
   *
   * Evaluation logic:
   * - Invalid selling price → غير صالح
   * - Contribution <= 0 → خاسر
   * - Net profit < 0 → خاسر
   * - Margin < 15% OR ROI < 25% → مربح ويحتاج تحسين
   * - Margin < 30% OR ROI < 50% → جيد
   * - Otherwise → قوي
   */
  function evaluateCommercially(result) {
    if (!result) {
      return {
        status: "غير صالح",
        type: "danger",
        reason: "لا توجد بيانات كافية للتحليل."
      };
    }

    const sellingPrice = Number(result.sellingPrice) || 0;
    const contributionPerUnit =
      Number(result.contributionPerUnit) || 0;
    const netProfit =
      Number(result.netProfit) || 0;
    const profitMargin =
      Number(result.profitMargin) || 0;
    const roi =
      Number(result.roi) || 0;

    if (sellingPrice <= 0) {
      return {
        status: "غير صالح",
        type: "danger",
        reason: "يجب إدخال سعر بيع صحيح."
      };
    }

    if (contributionPerUnit <= 0) {
      return {
        status: "خاسر",
        type: "danger",
        reason: "تكلفة الوحدة المتغيرة تساوي أو تتجاوز سعر البيع."
      };
    }

    if (netProfit < 0) {
      return {
        status: "خاسر",
        type: "danger",
        reason: "المشروع يحقق خسارة بعد احتساب التكاليف الثابتة."
      };
    }

    if (profitMargin < 15 || roi < 25) {
      return {
        status: "مربح ويحتاج تحسين",
        type: "warning",
        reason: "المنتج مربح، لكن هامش الربح أو العائد على الاستثمار ما زال يحتاج إلى تحسين."
      };
    }

    if (profitMargin < 30 || roi < 50) {
      return {
        status: "جيد",
        type: "info",
        reason: "المنتج يحقق أداءً تجارياً جيداً ويمكن تطويره أكثر."
      };
    }

    return {
      status: "قوي",
      type: "success",
      reason: "المنتج يحقق هامش ربح وعائداً جيدين وفق المعايير الحالية."
    };
  }

  /**
   * Generate a message comparing the current selling price
   * with the calculated target price.
   */
  function getTargetPriceMessage(currentPrice, targetPrice) {
    const current = Number(currentPrice) || 0;
    const target = Number(targetPrice) || 0;

    if (current <= 0 || target <= 0) {
      return "أدخل بيانات صحيحة لحساب السعر المستهدف.";
    }

    const difference = current - target;

    if (Math.abs(difference) < 0.01) {
      return "سعر البيع الحالي قريب جداً من السعر المستهدف.";
    }

    if (difference < 0) {
      return (
        "سعر البيع الحالي أقل من السعر المستهدف بحوالي " +
        Math.abs(difference).toFixed(2) +
        "."
      );
    }

    return (
      "سعر البيع الحالي أعلى من السعر المستهدف بحوالي " +
      difference.toFixed(2) +
      "."
    );
  }

  /**
   * Generate a break-even analysis message.
   */
  function getBreakEvenMessage(result) {
    if (!result) {
      return "لا توجد بيانات كافية لحساب نقطة التعادل.";
    }

    const contributionPerUnit =
      Number(result.contributionPerUnit) || 0;

    const fixedCosts =
      Number(result.fixedCosts) || 0;

    const breakEvenUnits =
      Number(result.breakEvenUnits) || 0;

    if (contributionPerUnit <= 0) {
      return "لا يمكن الوصول إلى نقطة التعادل لأن هامش المساهمة لكل وحدة غير موجب.";
    }

    if (fixedCosts <= 0) {
      return "لا توجد تكاليف ثابتة، لذلك تبدأ العملية من نقطة التعادل عند أول وحدة.";
    }

    return (
      "تحتاج إلى بيع " +
      breakEvenUnits +
      " وحدة تقريباً لتغطية جميع التكاليف الثابتة."
    );
  }

  /**
   * Return a complete commercial analysis object.
   */
  function analyze(result) {
    const evaluation = evaluateCommercially(result);

    const currentPrice =
      result && Number(result.sellingPrice)
        ? Number(result.sellingPrice)
        : 0;

    const targetPrice =
      result && Number(result.targetPrice)
        ? Number(result.targetPrice)
        : 0;

    return {
      evaluation,
      targetPriceMessage: getTargetPriceMessage(
        currentPrice,
        targetPrice
      ),
      breakEvenMessage: getBreakEvenMessage(result)
    };
  }

  /*
   * ---------------------------------------------------------
   * Public API
   * ---------------------------------------------------------
   */

  window.MTradeAnalysis = {
    evaluateCommercially,
    getTargetPriceMessage,
    getBreakEvenMessage,
    analyze
  };
})();
