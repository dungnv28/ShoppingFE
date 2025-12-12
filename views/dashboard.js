app.controller("dashboard", function (
  $scope,
  $http,
  authService,
  $location,
  cartService,
  $timeout,
  $q,
  $route,
  dashboardProductService
) {
  $scope.nameUser = "Welcome !";
  $scope.isLogin = false;
  $scope.cartProduct = {};
  $scope.account = {};
  $scope.cartItems = [];
  $scope.cartLoading = false;
  $scope.cartProcessing = false;
  $scope.cartNotice = "";
  $scope.cartError = "";
  const CHECKOUT_MODAL_ID = "cartCheckoutModal";
  const PAGE_TEMPLATES = {
    home: "/views/dashboard/pages/home.html",
    products: "/views/dashboard/pages/products.html",
    about: "/views/dashboard/pages/about.html",
    news: "/views/dashboard/pages/news.html",
    contact: "/views/dashboard/pages/contact.html",
    career: "/views/dashboard/pages/career.html",
  };
  $scope.pageTemplate = PAGE_TEMPLATES.home;
  dashboardProductService.bootstrapScope($scope);

  function updatePageSection() {
    const page = ($route.current && $route.current.pageId) || "home";
    $scope.pageSection = page;
    $scope.pageTemplate = PAGE_TEMPLATES[page] || PAGE_TEMPLATES.home;
  }

  $scope.$on("$routeChangeSuccess", updatePageSection);
  updatePageSection();

  $scope.initialize = function () {
    $scope.isLoading = true;
    if (authService.getToken()) {
      $scope.isLogin = true;
      $scope.nameUser = authService.getUsername();
      $scope.loadCart();
    }
    dashboardProductService
      .loadProducts($scope)
      .then(() => dashboardProductService.loadTaxonomies($scope))
      .then(() => dashboardProductService.loadAttributes($scope))
      .then(() => dashboardProductService.loadBrands($scope))
      .catch((error) => {
        console.log("Error", error);
      });
  };

  $scope.viewProduct = function (pro) {
    $scope.viewPro = pro;
  };

  $scope.filterProducts = function (id) {
    $scope.selectedCategoryFilter = id;
    dashboardProductService.applyProductFilters($scope);
  };

  $scope.logout = function () {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("token");
      $scope.isLogin = false;
      $scope.nameUser = "Welcome !";
      $scope.account = {};
      $scope.cartItems = [];
    }
  };

  $scope.addToCart = function (pro) {
    if (!authService.getToken()) {
      $location.path("/login");
      return;
    }
    if (!pro || !pro.id) {
      return;
    }
    if (pro.quantity !== undefined && pro.quantity <= 0) {
      alert("Sản phẩm đã hết hàng.");
      return;
    }
    const ensureCartPromise = $scope.account.id
      ? $q.resolve($scope.cartItems)
      : $scope.loadCart();
    ensureCartPromise
      .then(() => {
        const existed = ($scope.cartItems || []).some(
          (item) => item?.product?.id === pro.id
        );
        if (existed) {
          alert("Sản phẩm đã có trong giỏ hàng!");
          return null;
        }
        return cartService.addItem($scope.account, pro, 1).then(() => {
          return $scope.loadCart().then(() => {
            showNotice("Đã thêm sản phẩm vào giỏ hàng!");
          });
        });
      })
      .catch((error) => {
        handleCartError(error, "Không thể thêm sản phẩm vào giỏ hàng.");
      });
  };

  $scope.loadCart = function () {
    if (!authService.getToken()) {
      $scope.cartItems = [];
      $scope.account = {};
      return $q.resolve([]);
    }
    $scope.cartLoading = true;
    return cartService
      .loadAccountWithCart()
      .then((data) => {
        $scope.account = data.account || {};
        $scope.cartItems = data.items || [];
        $scope.cartError = "";
        return $scope.cartItems;
      })
      .catch((error) => {
        handleCartError(error, "Không thể tải giỏ hàng.");
        return [];
      })
      .finally(() => {
        $scope.cartLoading = false;
      });
  };

  $scope.getCartCount = function () {
    return ($scope.cartItems || []).length;
  };

  $scope.getCartTotal = function () {
    return cartService.computeTotal($scope.cartItems);
  };

  $scope.resolveCartImage = function (item) {
    if (!item) return null;
    return resolveProductImageUrl(item.product);
  };

  $scope.hasChildren = function (cate) {
    return cate && Array.isArray(cate.children) && cate.children.length > 0;
  };

  $scope.goToProductPage = function (page) {
    if (!page || page < 1 || page > $scope.totalProductPages) return;
    $scope.currentProductPage = page;
    dashboardProductService.refreshProductPagination($scope);
  };

  $scope.selectCategory = function (id) {
    $scope.selectedCategoryFilter = id;
    if (id === null) {
      $scope.selectedAttributeValue = null;
    }
    dashboardProductService.applyProductFilters($scope);
  };

  $scope.selectAttributeValue = function (valId) {
    $scope.selectedAttributeValue =
      $scope.selectedAttributeValue === valId ? null : valId;
    dashboardProductService.applyProductFilters($scope);
  };

  $scope.selectBrand = function (brandId) {
    $scope.selectedBrandFilter =
      $scope.selectedBrandFilter === brandId ? null : brandId;
    dashboardProductService.applyProductFilters($scope);
  };

  $scope.checkCartQuantity = function (cartItem) {
    if (!cartItem || !cartItem.product) return;
    const maxQuantity =
      cartItem.product.quantity !== undefined
        ? cartItem.product.quantity
        : cartItem.product?.stock;
    if (maxQuantity !== undefined && cartItem.amount > maxQuantity) {
      alert(
        "Số lượng không đủ! Sản phẩm này chỉ còn " + maxQuantity + " cái."
      );
      cartItem.amount = maxQuantity;
    }
    if (cartItem.amount <= 0) {
      cartItem.amount = 1;
    }
  };

  $scope.prepareCart = function ($event) {
    if (!$scope.isLogin) {
      if ($event) {
        $event.preventDefault();
      }
      $location.path("/login");
      return;
    }
    if (!$scope.cartItems.length && !$scope.cartLoading) {
      $scope.loadCart();
    }
  };

  $scope.removeCartItem = function (item) {
    if (!item || !item.id) {
      return;
    }
    cartService
      .deleteItem(item.id)
      .then(() => {
        $scope.cartItems = $scope.cartItems.filter((cart) => cart.id !== item.id);
        showNotice("Đã xóa sản phẩm khỏi giỏ hàng.");
      })
      .catch((error) => {
        handleCartError(error, "Không thể xóa sản phẩm khỏi giỏ hàng.");
      });
  };

  $scope.openCheckoutModal = function () {
    if (!$scope.cartItems.length) {
      alert("Giỏ hàng của bạn đang trống.");
      return;
    }
    const available = getAvailableCartItems();
    if (!available.length) {
      alert("Không có sản phẩm nào còn hàng để thanh toán.");
      return;
    }
    const modal = getModalInstance(CHECKOUT_MODAL_ID);
    if (modal) {
      modal.show();
    }
  };

  $scope.performCheckout = function () {
    const available = getAvailableCartItems();
    if (!available.length) {
      alert("Không có sản phẩm nào còn hàng để thanh toán.");
      return;
    }
    $scope.cartProcessing = true;
    const payload = {
      amount: cartService.computeTotal(available),
      status: 0,
      account: $scope.account,
      code: cartService.generateOrderCode(authService.getUsername()),
    };
    cartService
      .createOrder(payload)
      .then((resp) => {
        const orderId = resp.data?.id;
        return cartService.createOrderDetails(orderId, available);
      })
      .then(() => {
        if ($scope.account?.id) {
          return cartService.deleteByAccount($scope.account.id);
        }
        return null;
      })
      .then(() => $scope.loadCart())
      .then(() => {
        hideCheckoutModal();
        showNotice("Thanh toán thành công!");
      })
      .catch((error) => {
        handleCartError(error, "Không thể thanh toán đơn hàng.");
      })
      .finally(() => {
        $scope.cartProcessing = false;
      });
  };

  function getAvailableCartItems() {
    return ($scope.cartItems || []).filter((cart) => {
      const quantity = cart?.product?.quantity;
      return quantity === undefined || quantity > 0;
    });
  }

  function getModalInstance(id) {
    if (typeof bootstrap === "undefined") {
      return null;
    }
    const element = document.getElementById(id);
    if (!element) {
      return null;
    }
    return bootstrap.Modal.getOrCreateInstance(element);
  }

  function hideCheckoutModal() {
    const modal = getModalInstance(CHECKOUT_MODAL_ID);
    if (modal) {
      modal.hide();
    }
  }

  function showNotice(message) {
    $scope.cartNotice = message || "";
    if (message) {
      $timeout(() => {
        $scope.cartNotice = "";
      }, 3000);
    }
  }

  function handleCartError(error, fallbackMessage) {
    console.log("Cart error", error);
    $scope.cartError = fallbackMessage || "Đã xảy ra lỗi.";
  }

  function loadImagesForProducts(products) {
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

  $scope.initialize();
});
