app.controller("sell", function ($scope, $http,authService,$location) {
    $scope.products = [];
    $scope.listItems = [];
    $scope.accounts = [];
    $scope.account = {};
    $scope.acc = {};
    $scope.order = {};
    $scope.form = { vanglai: false };

    $scope.initialize = function () {
        if (authService.getToken()) {
            $http.get("http://localhost:8000/api/client/accounts/" + authService.getUsername()).then(resp => {
                $scope.acc = resp.data;
            });
            $http.get("http://localhost:8000/api/admin/products").then(resp => {
                $scope.products = resp.data;
            }).catch(error => {
                console.log("Error", error);
            })
    
            $http.get("http://localhost:8000/api/client/accounts").then(resp => {
                $scope.accounts = resp.data;
            }).catch(error => {
                console.log("Error", error);
            })
        } else {
            $location.path('/login');
        }
    }

    $scope.addItem = function(item) {
        const exists = $scope.listItems.some(i => i.id === item.id);
        if (!exists) {
            $scope.listItems.push(item);
            $scope.listItems = $scope.listItems.map(product => {
                product.amount = 1;
                return product;
            });
        } else {
            alert("Sản phẩm này đã có trong danh sách!");
        }
    };

    $scope.deleteItem = function(itemId) {
        const index = $scope.listItems.findIndex(item => item.id === itemId);
        if (index !== -1) {
            $scope.listItems.splice(index, 1);
        } else {
            alert("Không tìm thấy sản phẩm để xóa!");
        }
    };
    
    $scope.addAccount = function(account) {
        $scope.account = account; 
    };
    
    $scope.TotalPrice = function() {
        let total = 0;
        $scope.listItems.forEach(item => {
            total += item.price * item.amount; 
        });
        return total;
    };
    
    
    $scope.isAccountEmpty = function() {
        return !$scope.account || Object.keys($scope.account).length === 0;
    };

    $scope.deleteAcc = function() {
        $scope.account = {};
    };


    // ------------- order --------------
    
    $scope.sold = function () {
        $scope.order.amount = $scope.TotalPrice();
        $scope.order.status = 2;
        if ($scope.listItems.length === 0) {
            alert("Vui lòng chọn sản phẩm!");
            return;
        }
        if (Object.keys($scope.account).length === 0 && !$scope.form.vanglai) {
            alert("Vui lòng chọn khách hàng!");
            return;
        }
        $scope.order.account = $scope.form.vanglai ? $scope.acc : $scope.account;
        $scope.order.code = $scope.generateCode($scope.order.account.username);
        const confirmUpdate = confirm("Xác nhận đơn hàng?");
        if (!confirmUpdate) return;
        const updatedProducts = $scope.listItems.map(function(item) {
            return {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity - item.amount, 
                urlimage: item.urlimage,
                description: item.description,
                categoryId: item.category ? item.category.id : null,
                status: true
            };
        });
        $scope.updateProduct = function (product) {
            return $http.put(`http://localhost:8000/api/admin/products/${product.id}`, product)
                .then(resp => {
                    console.log("Cập nhật sản phẩm thành công!", resp.data);
                    return resp.data;
                })
                .catch(error => {
                    console.error("Lỗi cập nhật sản phẩm:", error);
                    throw error;
                });
        };
        const updateQuantityPromises = updatedProducts.map(function(product) {
            return $scope.updateProduct(product);
        });
        Promise.all(updateQuantityPromises)
            .then(function(results) {
                return $http.post("http://localhost:8000/api/client/orders", $scope.order);
            })
            .then(function(resp) {
                alert("Đơn hàng đã được tạo thành công!", resp.data);
                const orderId = resp.data.id;
                const createOrderDetailPromises = $scope.listItems.map(function(item) {
                    var orderDetail = {
                        order: { id: orderId },
                        product: { id: item.id },
                        amount: item.amount,
                    };
                    return $http.post("http://localhost:8000/api/client/order-details", orderDetail);
                });
                return Promise.all(createOrderDetailPromises);
            })
            .then(function() {
                $('#checkout').modal('hide');
                $scope.account = {};
                $scope.listItems = [];
                $scope.$apply();  // Buộc Angular cập nhật lại view nếu cần
            })
            .catch(function(error) {
                console.error("Lỗi khi tạo đơn hàng hoặc cập nhật sản phẩm", error);
            });
    };
    

    $scope.generateCode = function(username) {
        var timestamp = Date.now(); 
        var randomString = Math.random().toString(36).substring(2, 8);
        var generatedCode = randomString + timestamp + "_" + username;
        return generatedCode;
    };


    $scope.initialize();
});