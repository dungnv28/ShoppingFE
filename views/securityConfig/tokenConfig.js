app.factory('tokenConfig', function ($q, $location, $injector){
    return {
        'request': function (config) {
          var AuthService = $injector.get('authService');
          var token = AuthService.getToken(); 
          var tokenExpirationTime = localStorage.getItem('tokenExpirationTime');
          if (!token || !tokenExpirationTime || tokenExpirationTime <= Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpirationTime');
          } else if (config.url.indexOf('http://localhost:8000/auth/login') === -1 && config.url.indexOf('http://localhost:8000/reset-password') === -1) {
            config.headers.Authorization = 'Bearer ' + token; 
          }
          return config || $q.when(config);
        }
        
      };

})
