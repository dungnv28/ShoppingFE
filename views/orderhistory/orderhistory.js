app.controller("orderhistory", function ($scope, $http, $location, $filter) {
    $scope.orders = {};

    
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/orders").then(resp => {
            $scope.orders = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })
    }



// vsAfdAdddfd



    $scope.initialize();
});