/* =========================================================
   M-Trade Tools — Local Storage Manager
   File: js/storage.js
   Version: V1.3.1
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "mTradeProducts";

  /**
   * Safely parse JSON from localStorage.
   */
  function parseProducts(value) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "M-Trade Tools: Failed to parse saved products.",
        error
      );

      return [];
    }
  }

  /**
   * Get all saved products.
   */
  function getProducts() {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY);

      return parseProducts(stored);
    } catch (error) {
      console.error(
        "M-Trade Tools: Failed to read localStorage.",
        error
      );

      return [];
    }
  }

  /**
   * Save the complete products array.
   */
  function saveProducts(products) {
    if (!Array.isArray(products)) {
      return false;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
      );

      return true;
    } catch (error) {
      console.error(
        "M-Trade Tools: Failed to save products.",
        error
      );

      return false;
    }
  }

  /**
   * Save a new product.
   */
  function saveProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    const products = getProducts();

    const newProduct = {
      ...product,
      id:
        product.id ||
        Date.now().toString(),
      createdAt:
        product.createdAt ||
        new Date().toISOString()
    };

    products.push(newProduct);

    const saved =
      saveProducts(products);

    return saved
      ? newProduct
      : null;
  }

  /**
   * Delete a product by ID.
   */
  function deleteProduct(id) {
    if (!id) {
      return false;
    }

    const products = getProducts();

    const filteredProducts =
      products.filter(
        (product) =>
          String(product.id) !== String(id)
      );

    if (
      filteredProducts.length ===
      products.length
    ) {
      return false;
    }

    return saveProducts(
      filteredProducts
    );
  }

  /**
   * Get one product by ID.
   */
  function getProduct(id) {
    if (!id) {
      return null;
    }

    const products = getProducts();

    return (
      products.find(
        (product) =>
          String(product.id) ===
          String(id)
      ) || null
    );
  }

  /**
   * Update an existing product.
   */
  function updateProduct(id, updates) {
    if (
      !id ||
      !updates ||
      typeof updates !== "object"
    ) {
      return null;
    }

    const products = getProducts();

    const index =
      products.findIndex(
        (product) =>
          String(product.id) ===
          String(id)
      );

    if (index === -1) {
      return null;
    }

    const updatedProduct = {
      ...products[index],
      ...updates,
      id: products[index].id,
      createdAt:
        products[index].createdAt
    };

    products[index] =
      updatedProduct;

    const saved =
      saveProducts(products);

    return saved
      ? updatedProduct
      : null;
  }

  /**
   * Remove all saved products.
   */
  function clearProducts() {
    try {
      localStorage.removeItem(
        STORAGE_KEY
      );

      return true;
    } catch (error) {
      console.error(
        "M-Trade Tools: Failed to clear localStorage.",
        error
      );

      return false;
    }
  }

  /**
   * Get the number of saved products.
   */
  function getProductCount() {
    return getProducts().length;
  }

  /*
   * ---------------------------------------------------------
   * Public API
   * ---------------------------------------------------------
   */

  window.MTradeStorage = {
    STORAGE_KEY,
    getProducts,
    saveProducts,
    saveProduct,
    deleteProduct,
    getProduct,
    updateProduct,
    clearProducts,
    getProductCount
  };
})();
