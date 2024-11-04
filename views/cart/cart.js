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
                    console.log($scope.carts)
                }).catch(error => {
                    console.log("Error", error);
                })
            })
        } else {
            $location.path('/login');
        }
        // console.log($scope.generateCode(authService.getUsername()))
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
        const availableItems = $scope.carts.filter(cartItem => cartItem.product.quantity > 0);
    if (availableItems.length === 0) {
        alert("Không có sản phẩm nào còn hàng để thanh toán.");
        $scope.loading = false;
        return;
    }
        $scope.loading = true;
        $scope.order.amount = $scope.getTotalPrice();
        $scope.order.status = 0;
        $scope.order.account = $scope.account;
        $scope.order.code = $scope.generateCode(authService.getUsername()); //code ở dạng auto gen phía back-end
        $http.post("http://localhost:8000/api/client/orders", $scope.order)
            .then(resp => {
                console.log("Đơn hàng đã được tạo thành công!", resp.data);
                const orderId = resp.data.id;
                const createOrderDetailPromises = availableItems.map(cart => {
                    const orderDetail = {
                        order: { id: orderId },
                        product: { id: cart.product.id },
                        amount: cart.amount,
                    };
                    return $http.post("http://localhost:8000/api/client/order-details", orderDetail);
                });
                return Promise.all(createOrderDetailPromises);
            })
            .then(responses => {
                alert("Chi tiết đơn hàng đã được tạo thành công!", responses);
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
            })
            .catch(error => {
                console.log("Lỗi khi xóa giỏ hàng", error);
            });
    };

    $scope.generateCode = function(username) {
        var timestamp = Date.now(); 
        var randomString = Math.random().toString(36).substring(2, 8);
        var generatedCode = randomString + timestamp + "_" + username;
        return generatedCode;
    };

    $scope.checkAndOpenModal = function() {
        if ($scope.carts.length > 0) {
            var checkoutModal = new bootstrap.Modal(document.getElementById('checkout'));
            checkoutModal.show();
        } else {
            alert("Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán!");
        }
    };

    $scope.checkQuantity = function (cartItem) {
        const maxQuantity = cartItem.product.quantity; 
        if (cartItem.amount > maxQuantity) {
            alert("Số lượng không đủ! Sản phẩm này chỉ còn " + maxQuantity + " cái.");
            cartItem.amount = maxQuantity; 
        }
    };
    
    

    $scope.initialize();
});