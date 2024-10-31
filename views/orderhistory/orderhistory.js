app.controller("orderhistory", function ($scope, $http, $location, authService) {
    $scope.orders = [];
    $scope.orderDetails = [];
    $scope.viewOrder = {};
    $scope.orderDate = "";
    $scope.searchTerm = '';
    $scope.account = {};
    $scope.initialize = function () {
        if (authService.getToken()) {
            $http.get("http://localhost:8000/api/client/accounts/" + authService.getUsername()).then(resp => {
                $scope.account = resp.data;
                $http.get("http://localhost:8000/api/client/orders/byaccid/" + $scope.account.id).then(resp => {
                    $scope.orders = resp.data;
                    $scope.viewSingleOrder($scope.orders[0]);
                    $scope.viewOrderDetail($scope.orders[0].id);
                    $scope.orderDate = $scope.extractDateFromCode($scope.orders[0].code)
                }).catch(error => {
                    console.log("Error", error);
                })
            })
        } else {
            $location.path('/login');
        }
    }


    $scope.viewSingleOrder = function (order) {
        $scope.viewOrderDetail(order.id);
        $scope.viewOrder = order;
        $scope.orderDate = $scope.extractDateFromCode(order.code)
    }

    $scope.viewOrderDetail = function (id) {
        $http.get("http://localhost:8000/api/client/order-details/getbyorderid/" + id).then(resp => {
            $scope.orderDetails = resp.data;
            console.log($scope.orderDetails)
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.extractDateFromCode = function (code) {
        const timestampPart = code.slice(6, 19);
        const timestamp = parseInt(timestampPart, 10);
        const date = new Date(timestamp);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${day} tháng ${month}, ${year}, ${hours}:${minutes}`;
    }


    $scope.initialize();

    $scope.isCollapsed = true;

});