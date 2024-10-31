app.controller("sell", function ($scope, $http,authService,$location) {
    $scope.products = [];
    $scope.listItems = [];
    $scope.accounts = [];
    $scope.account = {};
    $scope.acc = {};
    $scope.order = {};
    $scope.form = { vanglai: false };

     // khách vãng lai , check nếu là true thì đơn hàng sẽ là khách vãng lại => clear data của $scope.account
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
            total += item.price;
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
        if ($scope.listItems.length == 0) { 
            alert("Vui lòng chọn sản phẩm!");
            return;
        }
        else if (Object.keys($scope.account).length === 0 && !$scope.form.vanglai) { 
            alert("Vui lòng chọn khách hàng!");
            return;
        }
        else if($scope.form.vanglai){
            $scope.order.account = $scope.acc
        }else {
            $scope.order.account = $scope.account
        }
        // console.log($scope.order.account)
        $scope.order.code = $scope.generateCode($scope.order.account.username); 
        $http.post("http://localhost:8000/api/client/orders", $scope.order)
            .then(resp => {
                alert("Đơn hàng đã được tạo thành công!", resp.data);
                const orderId = resp.data.id;
                const createOrderDetailPromises = $scope.listItems.map(item => {
                    const orderDetail = {
                        order: { id: orderId },
                        product: { id: item.id },
                    };
                    return $http.post("http://localhost:8000/api/client/order-details", orderDetail);
                });
                return Promise.all(createOrderDetailPromises);
            })
            .then(responses => {
                $('#checkout').modal('hide');
                $scope.account = {};
                $scope.listItems = [];
            })
            .catch(error => {
                console.log("Lỗi khi tạo đơn hàng", error);
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