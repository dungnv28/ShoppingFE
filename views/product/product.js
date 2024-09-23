app.controller("product", function ($scope, $http, $location, $filter) {
    $scope.categories = [];
    $scope.form = {};


    $scope.initialize = function () {
        // $scope.isLoading = true;
        // // Load data 
        // $http.get("http://localhost:8000/api/admin/products").then(resp => {
        //     $scope.products = resp.data;
        //     $scope.filterPro =resp.data;
        //     console.log($scope.products);
        // }).catch(error => {
        //     console.log("Error", error);
        // })

       //Load data floors
     $http.get("http://localhost:8000/api/admin/categories").then(resp => {
        $scope.categories = resp.data;
    }).catch(error => {
        console.log("Error", error);
    })
    }


    $scope.initialize();

});