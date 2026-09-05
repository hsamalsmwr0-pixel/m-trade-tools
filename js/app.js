/* =========================================================
   M-Trade Tools — Application Controller
   File: js/app.js
   Version: V1.3.1
   ========================================================= */

(function () {
  "use strict";

  const currencySymbols = {
    JOD: "د.أ",
    USD: "$",
    SAR: "ر.س",
    AED: "د.إ",
    EGP: "ج.م"
  };

  let lastCalculation = null;

  function getElement(id) {
    return document.getElementById(id);
  }

  function getNumber(id) {
    const element = getElement(id);

    if (!element) {
      return 0;
    }

    const value = Number(element.value);

    return Number.isFinite(value) ? value : 0;
  }

  function getFormData() {
    return {
      productName:
        getElement("productName")?.value.trim() || "",

      currency:
        getElement("currency")?.value || "JOD",

      sellingPrice:
        getNumber("sellingPrice"),

      purchasePrice:
        getNumber("purchasePrice"),

      shipping:
        getNumber("shipping"),

      packaging:
        getNumber("packaging"),

      adCost:
        getNumber("adCost"),

      units:
        getNumber("units"),

      fixedCosts:
        getNumber("fixedCosts"),

      targetMargin:
        getNumber("targetMargin")
    };
  }

  function formatMoney(value, currency) {
    const number = Number(value) || 0;
    const symbol =
      currencySymbols[currency] || currency || "";

    return (
      number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) +
      " " +
      symbol
    );
  }

  function formatPercent(value) {
    const number = Number(value) || 0;

    return (
      number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + "%"
    );
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(message, type = "info") {
    const messageElement =
      getElement("message");

    if (!messageElement) {
      return;
    }

    messageElement.textContent = message;
    messageElement.className =
      "message " + type;
  }

  function hideMessage() {
    const messageElement =
      getElement("message");

    if (!messageElement) {
      return;
    }

    messageElement.textContent = "";
    messageElement.className =
      "message hidden";
  }

  function validateForm(data) {
    if (!data.productName) {
      return "يرجى إدخال اسم المنتج.";
    }

    if (data.sellingPrice <= 0) {
      return "يرجى إدخال سعر بيع أكبر من صفر.";
    }

    if (data.units <= 0) {
      return "يرجى إدخال عدد وحدات أكبر من صفر.";
    }

    if (
      data.targetMargin < 0 ||
      data.targetMargin >= 100
    ) {
      return "يجب أن تكون نسبة هامش الربح المستهدف بين 0% و99.99%.";
    }

    if (data.purchasePrice < 0) {
      return "سعر الشراء لا يمكن أن يكون سالباً.";
    }

    if (data.shipping < 0) {
      return "تكلفة الشحن لا يمكن أن تكون سالبة.";
    }

    if (data.packaging < 0) {
      return "تكلفة التغليف لا يمكن أن تكون سالبة.";
    }

    if (data.adCost < 0) {
      return "تكلفة الإعلان لا يمكن أن تكون سالبة.";
    }

    if (data.fixedCosts < 0) {
      return "التكاليف الثابتة لا يمكن أن تكون سالبة.";
    }

    return null;
  }

  function showSections() {
    const resultSection =
      getElement("resultsSection");

    const analysisSection =
      getElement("analysisSection");

    const targetSection =
      getElement("targetSection");

    const breakEvenSection =
      getElement("breakEvenSection");

    [
      resultSection,
      analysisSection,
      targetSection,
      breakEvenSection
    ].forEach((section) => {
      if (section) {
        section.classList.remove("hidden");
      }
    });
  }

  function renderResults(result) {
    const currency =
      result.currency || "JOD";

    const values = {
      variableCostPerUnit:
        formatMoney(
          result.variableCostPerUnit,
          currency
        ),

      contributionPerUnit:
        formatMoney(
          result.contributionPerUnit,
          currency
        ),

      netProfitPerUnit:
        formatMoney(
          result.netProfitPerUnit,
          currency
        ),

      totalRevenue:
        formatMoney(
          result.totalRevenue,
          currency
        ),

      totalCosts:
        formatMoney(
          result.totalCosts,
          currency
        ),

      netProfit:
        formatMoney(
          result.netProfit,
          currency
        ),

      profitMargin:
        formatPercent(
          result.profitMargin
        ),

      roi:
        formatPercent(
          result.roi
        )
    };

    Object.keys(values).forEach((id) => {
      const element = getElement(id);

      if (element) {
        element.textContent =
          values[id];
      }
    });
  }

  function renderAnalysis(result) {
    const analysis =
      window.MTradeAnalysis.analyze(
        result
      );

    const evaluation =
      analysis.evaluation;

    const statusElement =
      getElement("evaluationStatus");

    const mainElement =
      getElement("commercialEvaluation");

    const profitElement =
      getElement("evaluationProfit");

    const marginElement =
      getElement("evaluationMargin");

    const roiElement =
      getElement("evaluationROI");

    if (statusElement) {
      statusElement.textContent =
        evaluation.status;
    }

    if (mainElement) {
      mainElement.textContent =
        evaluation.reason;

      mainElement.className =
        "evaluation-main " +
        evaluation.type;
    }

    if (profitElement) {
      profitElement.textContent =
        formatMoney(
          result.netProfit,
          result.currency
        );
    }

    if (marginElement) {
      marginElement.textContent =
        formatPercent(
          result.profitMargin
        );
    }

    if (roiElement) {
      roiElement.textContent =
        formatPercent(
          result.roi
        );
    }
  }

  function renderTargetPrice(result) {
    const targetPriceElement =
      getElement("targetPrice");

    const targetMessageElement =
      getElement("targetMessage");

    if (targetPriceElement) {
      targetPriceElement.textContent =
        formatMoney(
          result.targetPrice,
          result.currency
        );
    }

    if (targetMessageElement) {
      targetMessageElement.textContent =
        window.MTradeAnalysis.getTargetPriceMessage(
          result.sellingPrice,
          result.targetPrice
        );
    }
  }

  function renderBreakEven(result) {
    const unitsElement =
      getElement("breakEvenUnits");

    const revenueElement =
      getElement("breakEvenRevenue");

    const messageElement =
      getElement("breakEvenMessage");

    if (unitsElement) {
      unitsElement.textContent =
        result.breakEvenUnits.toLocaleString(
          "en-US"
        );
    }

    if (revenueElement) {
      revenueElement.textContent =
        formatMoney(
          result.breakEvenRevenue,
          result.currency
        );
    }

    if (messageElement) {
      messageElement.textContent =
        window.MTradeAnalysis.getBreakEvenMessage(
          result
        );
    }
  }

  function calculateProfit(options = {}) {
    hideMessage();

    const data =
      getFormData();

    const validationError =
      validateForm(data);

    if (validationError) {
      showMessage(
        validationError,
        "error"
      );

      return null;
    }

    const result =
      window.MTradeCalculator.calculateFinancials(
        data
      );

    result.productName =
      data.productName;

    result.currency =
      data.currency;

    lastCalculation = result;

    renderResults(result);
    renderAnalysis(result);
    renderTargetPrice(result);
    renderBreakEven(result);
    showSections();

    if (!options.silent) {
      showMessage(
        "تم حساب النتائج بنجاح.",
        "success"
      );
    }

    return result;
  }

  function saveProduct() {
    hideMessage();

    const result =
      calculateProfit({
        silent: true
      });

    if (!result) {
      return null;
    }

    const product = {
      productName:
        result.productName,

      currency:
        result.currency,

      sellingPrice:
        result.sellingPrice,

      purchasePrice:
        result.purchasePrice,

      shipping:
        result.shipping,

      packaging:
        result.packaging,

      adCost:
        result.adCost,

      units:
        result.units,

      fixedCosts:
        result.fixedCosts,

      targetMargin:
        result.targetMargin
    };

    const saved =
      window.MTradeStorage.saveProduct(
        product
      );

    if (!saved) {
      showMessage(
        "تعذر حفظ المنتج.",
        "error"
      );

      return null;
    }

    renderSavedProducts();

    showMessage(
      "تم حفظ المنتج بنجاح.",
      "success"
    );

    return saved;
  }

  function loadProduct(id) {
    const product =
      window.MTradeStorage.getProduct(
        id
      );

    if (!product) {
      showMessage(
        "تعذر العثور على المنتج.",
        "error"
      );

      return;
    }

    const fields = {
      productName:
        product.productName || "",

      currency:
        product.currency || "JOD",

      sellingPrice:
        product.sellingPrice ?? "",

      purchasePrice:
        product.purchasePrice ?? "",

      shipping:
        product.shipping ?? "",

      packaging:
        product.packaging ?? "",

      adCost:
        product.adCost ?? "",

      units:
        product.units ?? "",

      fixedCosts:
        product.fixedCosts ?? "",

      targetMargin:
        product.targetMargin ?? ""
    };

    Object.keys(fields).forEach((id) => {
      const element =
        getElement(id);

      if (element) {
        element.value =
          fields[id];
      }
    });

    const result =
      calculateProfit({
        silent: true
      });

    if (result) {
      showMessage(
        "تم تحميل المنتج.",
        "info"
      );
    }
  }

  function deleteProduct(id) {
    if (!id) {
      return;
    }

    const deleted =
      window.MTradeStorage.deleteProduct(
        id
      );

    if (!deleted) {
      showMessage(
        "تعذر حذف المنتج.",
        "error"
      );

      return;
    }

    renderSavedProducts();

    showMessage(
      "تم حذف المنتج.",
      "success"
    );
  }

  function renderSavedProducts() {
    const container =
      getElement("savedProducts");

    if (!container) {
      return;
    }

    const products =
      window.MTradeStorage.getProducts();

    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد منتجات محفوظة حالياً.
        </div>
      `;

      return;
    }

    container.innerHTML =
      products
        .slice()
        .reverse()
        .map((product) => {
          const currency =
            product.currency || "JOD";

          const createdAt =
            product.createdAt
              ? new Date(
                  product.createdAt
                ).toLocaleDateString(
                  "ar-JO"
                )
              : "";

          let calculated = null;

          try {
            calculated =
              window.MTradeCalculator.calculateFinancials(
                product
              );
          } catch (error) {
            console.error(
              "M-Trade Tools: Failed to calculate saved product.",
              error
            );
          }

          const netProfit =
            calculated
              ? calculated.netProfit
              : 0;

          const margin =
            calculated
              ? calculated.profitMargin
              : 0;

          return `
            <article
              class="saved-product"
              data-product-id="${escapeHTML(product.id)}"
            >
              <div class="saved-product-header">
                <div>
                  <div class="saved-product-name">
                    ${escapeHTML(
                      product.productName ||
                      "منتج بدون اسم"
                    )}
                  </div>

                  <div class="saved-product-date">
                    ${escapeHTML(createdAt)}
                  </div>
                </div>
              </div>

              <div class="saved-product-details">
                <div class="saved-product-detail">
                  <span>سعر البيع</span>
                  <strong>
                    ${escapeHTML(
                      formatMoney(
                        product.sellingPrice,
                        currency
                      )
                    )}
                  </strong>
                </div>

                <div class="saved-product-detail">
                  <span>الوحدات</span>
                  <strong>
                    ${escapeHTML(
                      Number(
                        product.units || 0
                      ).toLocaleString(
                        "en-US"
                      )
                    )}
                  </strong>
                </div>

                <div class="saved-product-detail">
                  <span>صافي الربح</span>
                  <strong>
                    ${escapeHTML(
                      formatMoney(
                        netProfit,
                        currency
                      )
                    )}
                  </strong>
                </div>

                <div class="saved-product-detail">
                  <span>هامش الربح</span>
                  <strong>
                    ${escapeHTML(
                      formatPercent(
                        margin
                      )
                    )}
                  </strong>
                </div>
              </div>

              <div class="saved-product-actions">
                <button
                  type="button"
                  class="load-product-btn"
                  data-action="load"
                  data-id="${escapeHTML(product.id)}"
                >
                  تحميل
                </button>

                <button
                  type="button"
                  class="delete-product-btn"
                  data-action="delete"
                  data-id="${escapeHTML(product.id)}"
                >
                  حذف
                </button>
              </div>
            </article>
          `;
        })
        .join("");
  }

  function clearCalculator() {
    const form =
      getElement("calculatorForm");

    if (form) {
      form.reset();
    } else {
      const fieldIds = [
        "productName",
        "sellingPrice",
        "purchasePrice",
        "shipping",
        "packaging",
        "adCost",
        "units",
        "fixedCosts",
        "targetMargin"
      ];

      fieldIds.forEach((id) => {
        const element =
          getElement(id);

        if (element) {
          element.value = "";
        }
      });

      const currency =
        getElement("currency");

      if (currency) {
        currency.value = "JOD";
      }
    }

    lastCalculation = null;

    const sections = [
      "resultsSection",
      "analysisSection",
      "targetSection",
      "breakEvenSection"
    ];

    sections.forEach((id) => {
      const section =
        getElement(id);

      if (section) {
        section.classList.add(
          "hidden"
        );
      }
    });

    hideMessage();
  }

  function setupEvents() {
    const calculateButton =
      getElement("calculateBtn");

    const saveButton =
      getElement("saveBtn");

    const clearButton =
      getElement("clearBtn");

    if (calculateButton) {
      calculateButton.addEventListener(
        "click",
        function () {
          calculateProfit();
        }
      );
    }

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        function () {
          saveProduct();
        }
      );
    }

    if (clearButton) {
      clearButton.addEventListener(
        "click",
        function () {
          clearCalculator();
        }
      );
    }

    const savedProducts =
      getElement("savedProducts");

    if (savedProducts) {
      savedProducts.addEventListener(
        "click",
        function (event) {
          const button =
            event.target.closest(
              "[data-action]"
            );

          if (!button) {
            return;
          }

          const action =
            button.dataset.action;

          const id =
            button.dataset.id;

          if (action === "load") {
            loadProduct(id);
          }

          if (action === "delete") {
            deleteProduct(id);
          }
        }
      );
    }
  }

  function init() {
    setupEvents();
    renderSavedProducts();
  }

  /*
   * ---------------------------------------------------------
   * Public API
   * ---------------------------------------------------------
   */

  window.MTradeApp = {
    calculateProfit,
    saveProduct,
    loadProduct,
    deleteProduct,
    renderSavedProducts,
    clearCalculator,
    getFormData,
    formatMoney,
    formatPercent,
    getLastCalculation: function () {
      return lastCalculation;
    }
  };

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
