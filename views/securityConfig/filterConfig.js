app.factory('authInterceptor', function ($q, $location, $window, authService) {
    var securedUrls = ['/product', '/account', '/order', '/sell']; // các URL yêu cầu quyền truy cập ADMIN
    var unsecuredUrls = ['/login', '/reset-password']; 

    return {
        request: function (config) {
            var path = $location.path();
            var securedPathRegex = new RegExp(`^(${securedUrls.join('|')})(/|$)`);
            var hasRoleAdmin = authService.hasRole('ADMIN');
            var hasRoles = authService.getRoles && authService.getRoles().length > 0;
            if (securedPathRegex.test(path) && !hasRoleAdmin && !hasRoles) {
                $location.path('/404.html');
                return $q.reject(config);
            }
            if (unsecuredUrls.some(function(url) { return path.startsWith(url); }) && authService.getToken()) {
                $window.alert('You are already logged in!');
                $location.path('/');
                return $q.reject(config);
            }
            
            return config || $q.when(config);
        }
    };
});
