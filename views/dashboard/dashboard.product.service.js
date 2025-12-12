app.factory("dashboardProductService", function ($http, authService) {
  function authHeaders() {
    return authService.getToken()
      ? { Authorization: "Bearer " + authService.getToken() }
      : {};
  }

  function bootstrapScope($scope) {
    $scope.products = [];
    $scope.viewPro = {};
    $scope.filterPro = [];
    $scope.categories = [];
    $scope.categoriesTree = [];
    $scope.attributes = [];
    $scope.attributeValuesByAttr = {};
    $scope.productAttrMap = {};
    $scope.brands = [];
    $scope.selectedCategoryFilter = null;
    $scope.selectedAttributeValue = null;
    $scope.selectedBrandFilter = null;
    $scope.productPageSize = 15;
    $scope.currentProductPage = 1;
    $scope.totalProductPages = 1;
    $scope.pagedProducts = [];
  }

  function loadProducts($scope) {
    return $http
      .get("http://localhost:8000/api/admin/products")
      .then((resp) => {
        const list = Array.isArray(resp.data) ? resp.data : [];
        $scope.products = list;
        $scope.filterPro = list;
        refreshProductPagination($scope);
        return loadImagesForProducts($scope, list);
      });
  }

  function loadTaxonomies($scope) {
    return $http
      .get("http://localhost:8000/api/admin/categories")
      .then((resp) => {
        $scope.categories = resp.data;
        $scope.categoriesTree = buildCategoryTree($scope.categories);
      });
  }

  function loadAttributes($scope) {
    return $http
      .get("http://localhost:8000/api/admin/attributes", {
        headers: authHeaders(),
      })
      .then((resp) => {
        $scope.attributes = resp.data || [];
        return $http.get("http://localhost:8000/api/admin/attribute-values", {
          headers: authHeaders(),
        });
      })
      .then((resp) => {
        const values = resp?.data || [];
        const grouped = {};
        values.forEach((val) => {
          const attrId = val.attributeId || val.attribute?.id;
          if (!attrId) return;
          if (!grouped[attrId]) grouped[attrId] = [];
          grouped[attrId].push(val);
        });
        $scope.attributeValuesByAttr = grouped;
        return $http.get(
          "http://localhost:8000/api/admin/product-attribute-values",
          { headers: authHeaders() }
        );
      })
      .then((resp) => {
        const pavs = resp?.data || [];
        const map = {};
        pavs.forEach((item) => {
          const pid = item.productId || item.product?.id;
          const vid =
            item.attributeValueId || item.attributeValue?.id || item.value?.id;
          if (!pid || !vid) return;
          if (!map[pid]) map[pid] = [];
          map[pid].push(vid);
        });
        $scope.productAttrMap = map;
      });
  }

  function loadBrands($scope) {
    return $http
      .get("http://localhost:8000/api/admin/brands", {
        headers: authHeaders(),
      })
      .then((resp) => {
        $scope.brands = Array.isArray(resp.data) ? resp.data : [];
      });
  }

  function loadImagesForProducts($scope, products) {
    if (!Array.isArray(products) || !products.length) {
      return Promise.resolve();
    }
    const requests = products.map(function (product) {
      if (!product || !product.id) {
        return Promise.resolve();
      }
      return $http
        .get(`http://localhost:8000/api/product-images/product/${product.id}`)
        .then(function (resp) {
          product.productImages = resp.data || [];
          decorateProduct(product);
        })
        .catch(function (error) {
          console.log("Không thể tải ảnh cho sản phẩm", product.id, error);
        });
    });
    return Promise.all(requests);
  }

  function decorateProduct(product) {
    if (!product) return product;
    const thumb = resolveProductImageUrl(product);
    if (thumb) {
      product.thumbnailUrl = thumb;
      product.urlimage = thumb;
    }
    return product;
  }

  function resolveProductImageUrl(product) {
    if (!product) return null;
    if (product.urlimage) return product.urlimage;
    if (product.imageUrl) return product.imageUrl;
    if (product.image && product.image.url) return product.image.url;
    if (Array.isArray(product.productImages) && product.productImages.length) {
      const primary = product.productImages.find(function (pi) {
        return pi && pi.isPrimary && extractImageUrl(pi);
      });
      if (primary) {
        const primaryUrl = extractImageUrl(primary);
        if (primaryUrl) return primaryUrl;
      }
      for (let i = 0; i < product.productImages.length; i++) {
        const url = extractImageUrl(product.productImages[i]);
        if (url) return url;
      }
    }
    if (product.primaryImage && product.primaryImage.url) {
      return product.primaryImage.url;
    }
    return null;
  }

  function extractImageUrl(pi) {
    if (!pi) return null;
    if (pi.image && pi.image.url) return pi.image.url;
    if (pi.urlimage) return pi.urlimage;
    if (pi.url) return pi.url;
    return null;
  }

  function refreshProductPagination($scope) {
    const size = $scope.productPageSize || 15;
    const start = ($scope.currentProductPage - 1) * size;
    const list = Array.isArray($scope.filterPro) ? $scope.filterPro : [];
    $scope.totalProductPages = Math.max(1, Math.ceil(list.length / size));
    $scope.pagedProducts = list.slice(start, start + size);
  }

  function applyProductFilters($scope) {
    let list = Array.isArray($scope.products) ? [...$scope.products] : [];
    if ($scope.selectedCategoryFilter) {
      list = list.filter(
        (p) => p.category && p.category.id === $scope.selectedCategoryFilter
      );
    }
    if ($scope.selectedBrandFilter) {
      list = list.filter(
        (p) =>
          (p.brand && p.brand.id === $scope.selectedBrandFilter) ||
          p.brandId === $scope.selectedBrandFilter
      );
    }
    if ($scope.selectedAttributeValue) {
      list = list.filter((p) => {
        const pid = p.id;
        if (!pid) return false;
        let vals = $scope.productAttrMap[pid] || [];
        if (
          !vals.length &&
          (p.attributeValues || p.attributes || p.productAttributeValues)
        ) {
          vals = [];
          (p.attributeValues ||
            p.attributes ||
            p.productAttributeValues
          ).forEach((av) => {
            const valId =
              av.attributeValueId ||
              av.id ||
              av.attributeValue?.id ||
              av.value?.id;
            if (valId) vals.push(valId);
          });
        }
        return vals.includes($scope.selectedAttributeValue);
      });
    }
    $scope.filterPro = list;
    $scope.currentProductPage = 1;
    refreshProductPagination($scope);
  }

  function buildCategoryTree(flat) {
    if (!Array.isArray(flat)) return [];
    const byId = {};
    const roots = [];
    flat.forEach((c) => {
      byId[c.id] = { ...c, children: [] };
    });
    Object.values(byId).forEach((node) => {
      if (node.parentId && byId[node.parentId]) {
        byId[node.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  return {
    bootstrapScope,
    loadProducts,
    loadTaxonomies,
    loadAttributes,
    loadBrands,
    refreshProductPagination,
    applyProductFilters,
    buildCategoryTree,
  };
});
