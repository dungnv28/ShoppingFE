app.controller("product", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.products = [];
    $scope.categories = [];
    $scope.product = {};
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/admin/products").then(resp => {
            $scope.products = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })

        $http.get("http://localhost:8000/api/admin/categories").then(resp => {
            $scope.categories = resp.data;
            
        }).catch(error => {
            console.log("Error", error);
        })
    }

    
    $scope.views = function (pro) {
        $scope.product = pro;
    };

    $scope.create = function () {
        $scope.product.status = true;
        $scope.product.categoryId = $scope.product.category.id
        $http.post("http://localhost:8000/api/admin/products",$scope.product).then(resp => {
            alert("Thêm sản phẩm thành công!")
            $scope.products.push(resp.data);
            $scope.product = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };

    $scope.update = function () {
        $scope.product.status = true;
        $scope.product.categoryId = $scope.product.category.id;
        $http.put(`http://localhost:8000/api/admin/products/${$scope.product.id}`, $scope.product).then(resp => {
            alert("Cập nhật sản phẩm thành công!");
            $scope.products.push(resp.data);
            $scope.product = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };
    

   
    $scope.initialize();

});