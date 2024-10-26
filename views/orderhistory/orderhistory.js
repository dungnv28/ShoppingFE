app.controller("orderhistory", function ($scope, $http, $location, $filter) {
    $scope.orders = [];
    $scope.orderDetails = [];
    $scope.viewOrder = {};
    $scope.orderDate = "";
    
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/orders").then(resp => {
            $scope.orders = resp.data;
            $scope.viewSingleOrder($scope.orders[0]);
            $scope.viewOrderDetail($scope.orders[0].id);
            $scope.orderDate = $scope.extractDateFromCode($scope.orders[0].code)
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.viewSingleOrder = function (order) {
        $scope.viewOrderDetail(order.id);
        $scope.viewOrder = order;
        $scope.orderDate = $scope.extractDateFromCode(order.code)
    }

    $scope.viewOrderDetail = function (id) {
        $http.get("http://localhost:8000/api/client/order-details/getbyorderid/"+id).then(resp => {
            $scope.orderDetails = resp.data;
            console.log($scope.orderDetails)
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.extractDateFromCode = function(code) {
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