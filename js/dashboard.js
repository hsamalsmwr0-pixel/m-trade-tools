(function () {
  "use strict";

  const STORAGE = window.MTradeStorage;
  const CALCULATOR = window.MTradeCalculator;

  if (!STORAGE || !CALCULATOR) {
    console.error("M-Trade Dashboard: required modules are not available.");
    return;
  }

  const CURRENCY_SYMBOLS = {
    JOD: "د.أ",
    USD: "$",
    SAR: "ر.س",
    AED: "د.إ",
    EGP: "ج.م",
    EUR: "€",
    GBP: "£"
  };

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCurrencySymbol(currency) {
    return CURRENCY_SYMBOLS[currency] || currency || "";
  }

  function formatMoney(value, currency) {
    const number = Number(value) || 0;

    return (
      number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) +
      " " +
      getCurrencySymbol(currency)
    );
  }

  function formatPercent(value) {
    const number = Number(value) || 0;

    return (
      number.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + "%"
    );
  }

  function getProducts() {
    try {
      const products = STORAGE.getProducts();
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error("M-Trade Dashboard: failed to load products.", error);
      return [];
    }
  }

  function calculateProducts(products) {
    return products
      .map((product) => {
        try {
          const result = CALCULATOR.calculateFinancials(product);

          return {
            product,
            result
          };
        } catch (error) {
          console.error(
            "M-Trade Dashboard: failed to calculate product.",
            product,
            error
          );

          return null;
        }
      })
      .filter(Boolean);
  }

  function getCurrencyGroups(calculatedProducts) {
    const groups = {};

    calculatedProducts.forEach(({ product, result }) => {
      const currency = product.currency || "JOD";

      if (!groups[currency]) {
        groups[currency] = {
          currency,
          revenue: 0,
          costs: 0,
          profit: 0,
          units: 0
        };
      }

      groups[currency].revenue += Number(result.totalRevenue) || 0;
      groups[currency].costs += Number(result.totalCosts) || 0;
      groups[currency].profit += Number(result.netProfit) || 0;
      groups[currency].units += Number(result.units) || 0;
    });

    return Object.values(groups);
  }

  function getAverageMargin(calculatedProducts) {
    if (!calculatedProducts.length) {
      return 0;
    }

    const totalMargin = calculatedProducts.reduce(
      (sum, item) => sum + (Number(item.result.profitMargin) || 0),
      0
    );

    return totalMargin / calculatedProducts.length;
  }

  function getStatus(margin) {
    if (margin < 0) {
      return {
        label: "خاسر",
        className: "danger"
      };
    }

    if (margin < 15) {
      return {
        label: "يحتاج تحسين",
        className: "warning"
      };
    }

    if (margin < 30) {
      return {
        label: "جيد",
        className: "success"
      };
    }

    return {
      label: "قوي",
      className: "success"
    };
  }

  function renderEmptyState() {
    return `
      <div class="mtd-empty">
        <div class="mtd-empty-icon">📊</div>
        <h3>لا توجد منتجات محفوظة بعد</h3>
        <p>
          احفظ منتجاتك من الحاسبة حتى تظهر بياناتها وتحليلاتها هنا.
        </p>
      </div>
    `;
  }

  function renderCurrencySummaries(groups) {
    if (!groups.length) {
      return "";
    }

    return `
      <div class="mtd-section">
        <div class="mtd-section-header">
          <div>
            <h3>الأداء المالي</h3>
            <p>البيانات مجمعة حسب العملة لتجنب خلط العملات.</p>
          </div>
        </div>

        <div class="mtd-currency-grid">
          ${groups
            .map(
              (group) => `
                <div class="mtd-currency-card">
                  <div class="mtd-currency-title">
                    ${escapeHTML(group.currency)}
                  </div>

                  <div class="mtd-finance-row">
                    <span>الإيرادات</span>
                    <strong>${formatMoney(
                      group.revenue,
                      group.currency
                    )}</strong>
                  </div>

                  <div class="mtd-finance-row">
                    <span>التكاليف</span>
                    <strong>${formatMoney(
                      group.costs,
                      group.currency
                    )}</strong>
                  </div>

                  <div class="mtd-finance-row">
                    <span>صافي الربح</span>
                    <strong>${formatMoney(
                      group.profit,
                      group.currency
                    )}</strong>
                  </div>

                  <div class="mtd-finance-row">
                    <span>الوحدات</span>
                    <strong>${group.units.toLocaleString("en-US")}</strong>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderProductsRanking(calculatedProducts) {
    if (!calculatedProducts.length) {
      return "";
    }

    const sorted = [...calculatedProducts].sort(
      (a, b) =>
        (Number(b.result.profitMargin) || 0) -
        (Number(a.result.profitMargin) || 0)
    );

    const topProducts = sorted.slice(0, 3);

    return `
      <div class="mtd-section">
        <div class="mtd-section-header">
          <div>
            <h3>أفضل المنتجات</h3>
            <p>مرتبة حسب هامش الربح.</p>
          </div>
        </div>

        <div class="mtd-products-list">
          ${topProducts
            .map(({ product, result }, index) => {
              const status = getStatus(result.profitMargin);

              return `
                <div class="mtd-product-row">
                  <div class="mtd-rank">${index + 1}</div>

                  <div class="mtd-product-info">
                    <strong>${escapeHTML(
                      product.productName || "منتج بدون اسم"
                    )}</strong>

                    <span>
                      ${formatMoney(
                        result.netProfitPerUnit,
                        product.currency
                      )}
                      ربح / وحدة
                    </span>
                  </div>

                  <div class="mtd-product-margin">
                    <strong>${formatPercent(
                      result.profitMargin
                    )}</strong>
                    <small class="${status.className}">
                      ${status.label}
                    </small>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderWeakProducts(calculatedProducts) {
    const weak = [...calculatedProducts]
      .filter(({ result }) => (Number(result.profitMargin) || 0) < 15)
      .sort(
        (a, b) =>
          (Number(a.result.profitMargin) || 0) -
          (Number(b.result.profitMargin) || 0)
      )
      .slice(0, 5);

    if (!weak.length) {
      return `
        <div class="mtd-section">
          <div class="mtd-section-header">
            <div>
              <h3>المنتجات التي تحتاج تحسين</h3>
            </div>
          </div>

          <div class="mtd-positive">
            ✅ لا توجد منتجات بهامش أقل من 15%.
          </div>
        </div>
      `;
    }

    return `
      <div class="mtd-section">
        <div class="mtd-section-header">
          <div>
            <h3>المنتجات التي تحتاج تحسين</h3>
            <p>منتجات بهامش ربح أقل من 15%.</p>
          </div>
        </div>

        <div class="mtd-products-list">
          ${weak
            .map(({ product, result }) => {
              const status = getStatus(result.profitMargin);

              return `
                <div class="mtd-product-row">
                  <div class="mtd-warning-icon">⚠️</div>

                  <div class="mtd-product-info">
                    <strong>${escapeHTML(
                      product.productName || "منتج بدون اسم"
                    )}</strong>

                    <span>
                      الربح:
                      ${formatMoney(
                        result.netProfit,
                        product.currency
                      )}
                    </span>
                  </div>

                  <div class="mtd-product-margin">
                    <strong>${formatPercent(
                      result.profitMargin
                    )}</strong>

                    <small class="${status.className}">
                      ${status.label}
                    </small>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderDashboard() {
    const root = document.getElementById("mtrade-dashboard");

    if (!root) {
      return;
    }

    const products = getProducts();
    const calculatedProducts = calculateProducts(products);

    if (!calculatedProducts.length) {
      root.innerHTML = `
        <div class="mtd-dashboard-header">
          <div>
            <span class="mtd-label">M-TRADE TOOLS</span>
            <h2>لوحة التحكم</h2>
            <p>نظرة سريعة على أداء منتجاتك.</p>
          </div>

          <button id="mtd-refresh" class="mtd-refresh-btn">
            ↻ تحديث
          </button>
        </div>

        ${renderEmptyState()}
      `;

      attachRefreshButton();
      return;
    }

    const totalProducts = products.length;

    const totalUnits = calculatedProducts.reduce(
      (sum, item) => sum + (Number(item.result.units) || 0),
      0
    );

    const averageMargin = getAverageMargin(calculatedProducts);
    const currencyGroups = getCurrencyGroups(calculatedProducts);

    root.innerHTML = `
      <div class="mtd-dashboard-header">
        <div>
          <span class="mtd-label">M-TRADE TOOLS V1.4</span>
          <h2>لوحة التحكم</h2>
          <p>مركز التحكم بأداء منتجاتك التجارية.</p>
        </div>

        <button id="mtd-refresh" class="mtd-refresh-btn">
          ↻ تحديث
        </button>
      </div>

      <div class="mtd-kpi-grid">

        <div class="mtd-kpi-card">
          <span class="mtd-kpi-icon">📦</span>
          <span class="mtd-kpi-label">المنتجات</span>
          <strong>${totalProducts}</strong>
        </div>

        <div class="mtd-kpi-card">
          <span class="mtd-kpi-icon">🔢</span>
          <span class="mtd-kpi-label">إجمالي الوحدات</span>
          <strong>${totalUnits.toLocaleString("en-US")}</strong>
        </div>

        <div class="mtd-kpi-card">
          <span class="mtd-kpi-icon">📈</span>
          <span class="mtd-kpi-label">متوسط هامش الربح</span>
          <strong>${formatPercent(averageMargin)}</strong>
        </div>

        <div class="mtd-kpi-card">
          <span class="mtd-kpi-icon">💰</span>
          <span class="mtd-kpi-label">العملات المستخدمة</span>
          <strong>${currencyGroups.length}</strong>
        </div>

      </div>

      ${renderCurrencySummaries(currencyGroups)}

      ${renderProductsRanking(calculatedProducts)}

      ${renderWeakProducts(calculatedProducts)}
    `;

    attachRefreshButton();
  }

  function attachRefreshButton() {
    const button = document.getElementById("mtd-refresh");

    if (button) {
      button.addEventListener("click", renderDashboard);
    }
  }

  function createDashboard() {
    if (document.getElementById("mtrade-dashboard")) {
      return;
    }

    const main = document.querySelector("main");

    if (!main) {
      console.error("M-Trade Dashboard: <main> not found.");
      return;
    }

    const dashboard = document.createElement("section");

    dashboard.id = "mtrade-dashboard";
    dashboard.className = "mtd-dashboard";

    main.insertBefore(dashboard, main.firstElementChild);

    renderDashboard();
  }

  function patchStorageMethod(methodName) {
    const original = STORAGE[methodName];

    if (typeof original !== "function") {
      return;
    }

    if (original.__mtradeDashboardPatched) {
      return;
    }

    function wrappedStorageMethod() {
      const result = original.apply(this, arguments);

      setTimeout(renderDashboard, 0);

      return result;
    }

    wrappedStorageMethod.__mtradeDashboardPatched = true;

    STORAGE[methodName] = wrappedStorageMethod;
  }

  function initializeStorageRefresh() {
    [
      "saveProduct",
      "deleteProduct",
      "updateProduct",
      "clearProducts"
    ].forEach(patchStorageMethod);
  }

  function injectStyles() {
    if (document.getElementById("mtd-dashboard-styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "mtd-dashboard-styles";

    style.textContent = `
      .mtd-dashboard {
        margin-bottom: 24px;
      }

      .mtd-dashboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .mtd-label {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--primary, #4f8cff);
        margin-bottom: 6px;
      }

      .mtd-dashboard h2 {
        margin: 0 0 5px;
        font-size: 26px;
      }

      .mtd-dashboard-header p {
        margin: 0;
        color: var(--muted, #8e9baa);
      }

      .mtd-refresh-btn {
        border: 1px solid var(--border, #25303c);
        background: var(--card2, #151e28);
        color: var(--text, #f4f7fa);
        padding: 10px 14px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
      }

      .mtd-refresh-btn:hover {
        border-color: var(--primary, #4f8cff);
      }

      .mtd-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 18px;
      }

      .mtd-kpi-card {
        background: var(--card, #111820);
        border: 1px solid var(--border, #25303c);
        border-radius: var(--radius, 18px);
        padding: 18px;
        min-height: 125px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .mtd-kpi-icon {
        font-size: 20px;
      }

      .mtd-kpi-label {
        color: var(--muted, #8e9baa);
        font-size: 13px;
      }

      .mtd-kpi-card strong {
        font-size: 25px;
      }

      .mtd-section {
        background: var(--card, #111820);
        border: 1px solid var(--border, #25303c);
        border-radius: var(--radius, 18px);
        padding: 18px;
        margin-bottom: 18px;
      }

      .mtd-section-header {
        margin-bottom: 16px;
      }

      .mtd-section-header h3 {
        margin: 0 0 5px;
        font-size: 18px;
      }

      .mtd-section-header p {
        margin: 0;
        color: var(--muted, #8e9baa);
        font-size: 13px;
      }

      .mtd-currency-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      .mtd-currency-card {
        background: var(--card2, #151e28);
        border: 1px solid var(--border, #25303c);
        border-radius: 14px;
        padding: 15px;
      }

      .mtd-currency-title {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .mtd-finance-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--border, #25303c);
        font-size: 13px;
      }

      .mtd-finance-row:last-child {
        border-bottom: 0;
      }

      .mtd-finance-row span {
        color: var(--muted, #8e9baa);
      }

      .mtd-products-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mtd-product-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--card2, #151e28);
        border: 1px solid var(--border, #25303c);
        border-radius: 14px;
        padding: 13px;
      }

      .mtd-rank {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary, #4f8cff);
        color: white;
        font-weight: 800;
      }

      .mtd-warning-icon {
        font-size: 22px;
      }

      .mtd-product-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mtd-product-info strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mtd-product-info span {
        color: var(--muted, #8e9baa);
        font-size: 12px;
      }

      .mtd-product-margin {
        text-align: left;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .mtd-product-margin strong {
        font-size: 15px;
      }

      .mtd-product-margin small {
        font-size: 11px;
        font-weight: 700;
      }

      .mtd-product-margin small.success {
        color: var(--success, #27c281);
      }

      .mtd-product-margin small.warning {
        color: var(--warning, #f4b740);
      }

      .mtd-product-margin small.danger {
        color: var(--danger, #ef5350);
      }

      .mtd-positive {
        padding: 14px;
        border-radius: 12px;
        background: rgba(39, 194, 129, 0.08);
        color: var(--success, #27c281);
      }

      .mtd-empty {
        background: var(--card, #111820);
        border: 1px solid var(--border, #25303c);
        border-radius: var(--radius, 18px);
        padding: 40px 20px;
        text-align: center;
      }

      .mtd-empty-icon {
        font-size: 42px;
        margin-bottom: 10px;
      }

      .mtd-empty h3 {
        margin: 0 0 8px;
      }

      .mtd-empty p {
        margin: 0;
        color: var(--muted, #8e9baa);
      }

      @media (max-width: 760px) {
        .mtd-kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .mtd-dashboard-header {
          align-items: flex-start;
        }
      }

      @media (max-width: 480px) {
        .mtd-kpi-grid {
          grid-template-columns: 1fr 1fr;
        }

        .mtd-kpi-card {
          min-height: 105px;
          padding: 14px;
        }

        .mtd-kpi-card strong {
          font-size: 21px;
        }

        .mtd-dashboard-header {
          flex-direction: column;
        }

        .mtd-refresh-btn {
          width: 100%;
        }

        .mtd-product-row {
          align-items: flex-start;
        }

        .mtd-product-margin {
          min-width: 72px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    createDashboard();
    initializeStorageRefresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.MTradeDashboard = {
    refresh: renderDashboard
  };
})();
