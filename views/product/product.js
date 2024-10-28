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

    // $scope.create = function () {
    //     $scope.account.status = true;
    //     $http.post("http://localhost:8000/api/client/accounts",$scope.account).then(resp => {
    //         alert("Thêm tài khoản thành công!")
    //         $scope.accounts.push(resp.data);
    //         $scope.account = {};
    //     }).catch(error => {
    //         console.log("Error", error);
    //     });
    // };

    // $scope.update = function () {
    //     $scope.account.status = true;
    //     $http.put("http://localhost:8000/api/client/accounts",$scope.account).then(resp => {
    //         alert("Update tài khoản thành công!")
    //     }).catch(error => {
    //         console.log("Error", error);
    //     });
    // };
    
    $scope.initialize();

});