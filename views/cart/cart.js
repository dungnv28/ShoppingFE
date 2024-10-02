app.controller("cart", function ($scope, $http, $location, authService) {
    $scope.carts = []
    $scope.selectedCarts = [];
    $scope.account = {};
    $scope.initialize = function () {
        if (authService.getToken()) {
            $http.get("http://localhost:8000/api/client/accounts/" + authService.getUsername()).then(resp => {
                $scope.account = resp.data;
                $http.get("http://localhost:8000/api/client/carts/getbyaccount/" + $scope.account.id).then(resp => {
                    $scope.carts = resp.data;
                }).catch(error => {
                    console.log("Error", error);
                })
            })
        } else {
            $location.path('/login');
        }
    }


    // Hàm để chọn hoặc bỏ chọn (checkbox) một giỏ hàng
    $scope.toggleCartSelection = function (cart) {
        const index = $scope.selectedCarts.indexOf(cart);

        if (index > -1) {
            // Nếu giỏ hàng đã tồn tại trong danh sách thì loại bỏ nó (uncheck)
            $scope.selectedCarts.splice(index, 1);
        } else {
            // Nếu giỏ hàng chưa có trong danh sách thì thêm vào (checkbox)
            $scope.selectedCarts.push(cart);
        }

        console.log("Selected Carts:", $scope.selectedCarts);
    };

    $scope.getTotalPrice = function() {
        return $scope.carts.reduce((sum, cart) => {
            return sum + (cart.product.price * cart.amount);
        }, 0);
    };

    $scope.initialize();
});