app.controller("dashboard", function ($scope, $http,authService,$location) {
    $scope.products = [];
    $scope.viewPro = {};
    $scope.cartProduct = {}
    $scope.filterPro = []
    $scope.account = {};

    $scope.initialize = function () {
        $scope.isLoading = true;
        // Load data products
        $http.get("http://localhost:8000/api/admin/products").then(resp => {
            $scope.products = resp.data;
            $scope.filterPro =resp.data;
            console.log($scope.products);
        }).catch(error => {
            console.log("Error", error);
        })

      
    }

    $scope.viewProduct = function(pro) { /// hàm xem chi tiết sản phẩm
        $scope.viewPro = pro;
    }

    $scope.filterProducts = function(id) { /// hàm lọc theo category
        $scope.filterPro = $scope.products.filter(product => product.category.id == id);
    }

   
    $scope.addToCart = function (pro) {
        if (authService.getToken()) {
            $http.get("http://localhost:8000/api/client/accounts/" + authService.getUsername()).then(resp => {
                $scope.account = resp.data;
                $scope.cartProduct.product = pro;
                $scope.cartProduct.account = $scope.account;
                $scope.cartProduct.amount = 1;
                $http.post("http://localhost:8000/api/client/carts", $scope.cartProduct).then(resp => {
                }).catch(error => {
                    console.log("Error", error);
                });
            }).catch(error => {
                console.log("Error", error);
            });
        } else {
            $location.path('/login');
        }
    };


    $scope.initialize();
});