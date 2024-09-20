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
