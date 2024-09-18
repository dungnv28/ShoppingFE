app.controller("dashboard", function ($scope, $http, $location, $filter) {
    $scope.products = [];
    $scope.viewPro = {}
    $scope.filterPro = []
    $scope.initialize = function () {
        $scope.isLoading = true;
        // Load data rooms
        $http.get("http://localhost:8000/api/admin/products").then(resp => {
            $scope.products = resp.data;
            $scope.filterPro =resp.data;
        }).catch(error => {
            console.log("Error", error);
        })

      
    }

    $scope.viewProduct = function(pro) { /// hàm xem chi tiết sản phẩm
        $scope.viewPro = pro;
    }

    $scope.filterProducts = function(id) { /// hàm lọc theo category
        $scope.filterPro = $scope.products.filter(product => product.categoryId == id);
    }


    $scope.initialize();
});