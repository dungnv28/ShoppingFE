app.controller("cart", function ($scope, $http, $location, authService) {
    $scope.loading = false;
    $scope.carts = []
    $scope.account = {};
    $scope.order = {};
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

    $scope.deleteCart = function (cartId) {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
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


    $scope.getTotalPrice = function () {
        return $scope.carts.reduce((sum, cart) => {
            return sum + (cart.product.price * cart.amount);
        }, 0);
    };


    // ------------- order --------------
    $scope.closeModal = function () {
        $scope.loading = true;
        $scope.order.amount = $scope.getTotalPrice();
        $scope.order.status = 0;
        $scope.order.account = $scope.account;
        $http.post("http://localhost:8000/api/client/orders", $scope.order)
            .then(resp => {
                console.log("Đơn hàng đã được tạo thành công!", resp.data);
                const orderId = resp.data.id;
                const createOrderDetailPromises = $scope.carts.map(cart => {
                    const orderDetail = {
                        order: { id: orderId },
                        product: { id: cart.product.id },
                    };
                    return $http.post("http://localhost:8000/api/client/order-details", orderDetail);
                });
                return Promise.all(createOrderDetailPromises);
            })
            .then(responses => {
                console.log("Chi tiết đơn hàng đã được tạo thành công!", responses);
                $scope.loading = false;
                $('#checkout').modal('hide');
                $scope.deleteCartsByAccount($scope.account.id);
                $scope.carts = [];
            })
            .catch(error => {
                console.log("Lỗi khi tạo đơn hàng", error);
                $scope.loading = false;
            });
    };


    $scope.deleteCartsByAccount = function (accountId) {
        return $http.delete("http://localhost:8000/api/client/carts/byaccountid/" + accountId)
            .then(resp => {
                console.log("Đã xóa tất cả giỏ hàng cho tài khoản thành công!", resp.data);
            })
            .catch(error => {
                console.log("Lỗi khi xóa giỏ hàng", error);
            });
    };


    $scope.initialize();
});