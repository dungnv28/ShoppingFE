app.factory('authInterceptor', function ($q, $location,$window, authService) {
    var securedUrls = ['/service','/accounts','/room','/invoices','/statistical','/promotion']; // các url theo yêu cầu quyền truy cập ADMIN
    var unsecuredUrls = ['/login','/reset-password']; 
    return {
        request: function (config) {
            var path = $location.path();
            if (securedUrls.some(function(url) { return path.startsWith(url); }) && !authService.hasRole('ADMIN')) {
                $location.path('/404.html');
                return $q.reject(config);
            }
            if (unsecuredUrls.some(function(url) { return path.startsWith(url); }) && authService.getToken()) {
                $window.alert('You are already login !');
                $location.path('/');
                return $q.reject(config);
            }
            return config || $q.when(config); // nếu Url không cần được bảo vệ theo ADMIN thì sẽ cho đi tiếp
        }
    };
});
