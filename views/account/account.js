app.controller("account", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.accounts = [];

    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/accounts").then(resp => {
            $scope.accounts = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })
    }






    $scope.initialize();

});