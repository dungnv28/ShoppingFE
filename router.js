app.config(function ($routeProvider, $httpProvider) {
  $httpProvider.interceptors.push('tokenConfig');
  $httpProvider.interceptors.push('authInterceptor');
  $routeProvider
    .when("/", {
      templateUrl: "/views/dashboard.html",
      controller: "dashboard",
    })
    .when("/cart", {
      templateUrl: "/views/cart/cart.html",
      controller: "cart",
    })
    .when("/product", {
      templateUrl: "/views/product/product.html",
      controller: "product",
    })
    .when("/category", {
      templateUrl: "/views/category/category.html",
      controller: "category",
    })
    //Authenticate
    .when("/login", {
      templateUrl: "/views/authenticate/login.html",
      controller: "loginCtrl",
    })
    .when("/reset-password/:token", {
      templateUrl: "/views/authenticate/resetPassword.html",
      controller: "loginCtrl",
    })
    .otherwise({
      templateUrl: "/views/404.html",
    });
});
