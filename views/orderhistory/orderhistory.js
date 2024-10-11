app.controller("orderhistory", function ($scope, $http, $location, $filter) {
    $scope.orders = [];
    $scope.orderDetails = [];
    $scope.viewOrder = {};
    
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/orders").then(resp => {
            $scope.orders = resp.data;
            $scope.viewSingleOrder($scope.orders[0]);

        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.viewSingleOrder = function (order) {
        $scope.viewOrder = order;
    }

    $scope.viewOrderDetail = function (id) {
        $http.get("http://localhost:8000/api/client/order-details").then(resp => {
           

        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.initialize();
});