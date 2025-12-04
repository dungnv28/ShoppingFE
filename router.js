app.config(function ($routeProvider, $httpProvider) {
  $httpProvider.interceptors.push('tokenConfig');
  $httpProvider.interceptors.push('authInterceptor');
  $routeProvider
    .when("/", {
      templateUrl: "/views/dashboard2.html",
      controller: "dashboard",
    })
    .when("/cart", {
      templateUrl: "/views/cart/cart.html",
      controller: "cart",
    })
    .when("/orderhistory", {
      templateUrl: "/views/orderhistory/orderhistory.html",
      controller: "orderhistory",
    })
    .when("/category", {
      templateUrl: "/views/category/category.html",
      controller: "category",
    })
    .when("/product", {
      templateUrl: "/views/product/product.html",
      controller: "product",
    })
    .when("/prolist", {
      templateUrl: "/views/product/list.html",
      controller: "product",
    })
    .when("/category", {
      templateUrl: "/views/category/category.html",
      controller: "category",
    })
    .when("/account", {
      templateUrl: "/views/account/account.html",
      controller: "account",
    })
    .when("/order", {
      templateUrl: "/views/order/order.html",
      controller: "order",
    })
    .when("/sell", {
      templateUrl: "/views/sell/sell.html",
      controller: "sell",
    })
     .when("/attribute-value", {
      templateUrl: "/views/attributeValue/attributeValue.html",
      controller: "attributeValue",
    })
    //Authenticate
    .when("/login", {
      templateUrl: "/views/authenticate/login.html",
      controller: "loginCtrl",
    })
    .when("/registration", {
      templateUrl: "/views/authenticate/registration.html",
      controller: "loginCtrl",
    })
    .when("/attribute", {
      templateUrl: "/views/attribute/attribute.html",
      controller: "attribute",
    })
    .otherwise({
      templateUrl: "/views/404.html",
    });
});
