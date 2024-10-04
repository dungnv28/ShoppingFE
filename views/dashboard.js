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
            // Lấy thông tin tài khoản
            $http.get("http://localhost:8000/api/client/accounts/" + authService.getUsername())
                .then(resp => {
                    $scope.account = resp.data;
    
                    // Lấy danh sách sản phẩm trong giỏ hàng của tài khoản
                    return $http.get("http://localhost:8000/api/client/carts/getbyaccount/" + $scope.account.id);
                })
                .then(resp => {
                    const carts = resp.data; // Danh sách giỏ hàng
                    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                    const productExists = carts.some(cart => cart.product.id === pro.id);
                    
                    if (productExists) {
                        alert("Sản phẩm đã có trong giỏ hàng!");
                        return; // Không thêm sản phẩm nữa
                    }
    
                    // Nếu sản phẩm chưa có, thêm sản phẩm vào giỏ hàng
                    $scope.cartProduct.product = pro;
                    $scope.cartProduct.account = $scope.account;
                    $scope.cartProduct.amount = 1;
                    alert("Thêm sản phẩm thành công!"); // Chỉ hiển thị thông báo khi thêm thành công
                    return $http.post("http://localhost:8000/api/client/carts", $scope.cartProduct);
                })
                .then(resp => {
                    
                })
                .catch(error => {
                    console.log("Error", error);
                });
        } else {
            $location.path('/login');
        }
    };
    


    $scope.initialize();
});