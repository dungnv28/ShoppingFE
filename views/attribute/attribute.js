app.controller("attribute", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.attributes = [];
    $scope.cate = {};
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/admin/attributes")
            .then(resp => {
                $scope.attributes = resp.data;
            })
            .catch(error => {
                console.log("Error", error);
            });
    };



    $scope.create = function () {

        $http.post("http://localhost:8000/api/admin/attributes", $scope.cate).then(resp => {

            alert("Thêm danh mục thành công!")
            $scope.categories.push(resp.data);
            $scope.cate = {};

        }).catch(error => {
            console.log("Error", error);
        });
    };


    $scope.update = function () {

        $http.put(`http://localhost:8000/api/admin/attributes/${$scope.cate.id}`, $scope.cate).then(resp => {

            alert("Cập nhật danh mục thành công!");
            $scope.cate = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };

    // ✔ NÚT SỬA
    $scope.views = function (cate) {
        $scope.cate = angular.copy(cate);
    };

    $scope.initialize();
});
