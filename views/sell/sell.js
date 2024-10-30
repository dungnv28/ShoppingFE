app.controller("sell", function ($scope, $http) {
    $scope.products = [];
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





    
    $scope.initialize();
});