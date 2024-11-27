app.controller("category", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.categories = [];
    $scope.cate ={}
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/admin/categories").then(resp => {
            $scope.categories = resp.data;
            
        }).catch(error => {
            console.log("Error", error);
        })
    }

    $scope.create = function () {
        $http.post("http://localhost:8000/api/admin/categories",$scope.cate).then(resp => {
            alert("Thêm danh mục thành công!")
            $scope.categories.push(resp.data);
            $scope.cate = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };


    $scope.update = function () {
        $http.put(`http://localhost:8000/api/admin/categories/${$scope.cate.id}`, $scope.cate).then(resp => {
            alert("Cập nhật danh mục thành công!");
            $scope.cate = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };

    $scope.views = function (cate) {
        $scope.cate = cate;
    };

    $scope.initialize();
});