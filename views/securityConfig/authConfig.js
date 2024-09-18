app.factory('authService', function () {
  var authService = {}
  authService.hasRole = function (roleName) {
    var token = authService.getToken();
    if (!token) {
      return false;
    }
    var tokenPayload = JSON.parse(atob(token.split('.')[1]));
    var role = tokenPayload.roles;
    return role.indexOf(roleName) !== -1; // kiem tra role co trung khop voi role cua token hay khong
  };
  authService.getToken = function () {
    return localStorage.getItem('token');
  };
  authService.getUsername = function () {
    var token = authService.getToken()
    if (!token) {
      return false;
    }
    var tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return tokenPayload.sub;
  };
  authService.clearToken = function () {
    localStorage.setItem('token', '');
  };
  return authService;
});