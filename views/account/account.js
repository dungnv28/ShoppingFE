app.controller("account", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.accounts = [];
    $scope.userRole = [];

    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/accounts").then(resp => {
            $scope.accounts = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.findRoleByAccountId = function (id) {
        $http.get("http://localhost:8000/api/admin/userroles/getrole/"+id).then(resp => {
            $scope.userRole = resp.data;
            console.log($scope.userRole)
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.findRoleByAccountId(1)
    $scope.initialize();

});