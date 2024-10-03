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

    $scope.deleteCart = function(cartId) {
        if (confirm("Bạn có chắc chắn muốn xóa giỏ hàng này?")) {
            $http.delete("http://localhost:8000/api/client/carts/" + cartId)
                .then(resp => {
                    $scope.carts = $scope.carts.filter(cart => cart.id !== cartId);
                    console.log("Xóa giỏ hàng thành công!");
                })
                .catch(error => {
                    console.log("Error", error);
                });
        }
    };


    $scope.getTotalPrice = function() {
        return $scope.carts.reduce((sum, cart) => {
            return sum + (cart.product.price * cart.amount);
        }, 0);
    };

    $scope.initialize();
});