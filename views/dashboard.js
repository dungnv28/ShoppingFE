app.controller("dashboard", function ($scope, $http,authService,$location) {
    $scope.nameUser = "Welcome !";
    $scope.isLogin = false;
    $scope.products = [];
    $scope.viewPro = {};
    $scope.cartProduct = {}
    $scope.filterPro = []
    $scope.account = {};
    $scope.categories = [];
    $scope.initialize = function () {
        $scope.isLoading = true;
        if (authService.getToken()) {
            $scope.isLogin = true;
            $scope.nameUser = authService.getUsername();
        }
        // Load data products
$http.get("http://localhost:8000/api/admin/products").then(resp => {
    const list = Array.isArray(resp.data) ? resp.data : [];
    $scope.products = list;
    $scope.filterPro = list;
    return loadImagesForProducts($scope.products);
}).catch(error => {
    console.log("Error", error);
})

        $http.get("http://localhost:8000/api/admin/categories").then(resp => {
            $scope.categories = resp.data;
            
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

   
    $scope.logout = function () {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('token');
        $scope.isLogin = false;
        $scope.nameUser = "Welcome !";
        }
    };

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
    
    function loadImagesForProducts(products) {
        if (!Array.isArray(products) || !products.length) {
            return Promise.resolve();
        }
        const requests = products.map(function (product) {
            if (!product || !product.id) {
                return Promise.resolve();
            }
            return $http.get(`http://localhost:8000/api/product-images/product/${product.id}`)
                .then(function (resp) {
                    product.productImages = resp.data || [];
                    decorateProduct(product);
                }).catch(function (error) {
                    console.log("Không thể tải ảnh cho sản phẩm", product.id, error);
                });
        });
        return Promise.all(requests);
    }

    function decorateProduct(product) {
        if (!product) return product;
        const thumb = resolveProductImageUrl(product);
        if (thumb) {
            product.thumbnailUrl = thumb;
            product.urlimage = thumb;
        }
        return product;
    }

    function resolveProductImageUrl(product) {
        if (!product) return null;
        if (product.urlimage) return product.urlimage;
        if (product.imageUrl) return product.imageUrl;
        if (product.image && product.image.url) return product.image.url;
        if (Array.isArray(product.productImages) && product.productImages.length) {
            const primary = product.productImages.find(function (pi) {
                return pi && pi.isPrimary && extractImageUrl(pi);
            });
            if (primary) {
                const primaryUrl = extractImageUrl(primary);
                if (primaryUrl) return primaryUrl;
            }
            for (let i = 0; i < product.productImages.length; i++) {
                const url = extractImageUrl(product.productImages[i]);
                if (url) return url;
            }
        }
        if (product.primaryImage && product.primaryImage.url) {
            return product.primaryImage.url;
        }
        return null;
    }

    function extractImageUrl(pi) {
        if (!pi) return null;
        if (pi.image && pi.image.url) return pi.image.url;
        if (pi.urlimage) return pi.urlimage;
        if (pi.url) return pi.url;
        return null;
    }

    
    $scope.initialize();
});
