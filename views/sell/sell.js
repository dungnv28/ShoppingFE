app.controller("sell", function ($scope, $http) {
    $scope.products = [];
    $scope.listItems = [];
    $scope.accounts = [];
    $scope.account = {};
    $scope.initialize = function () {
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
        console.log($scope.account)
    };
    
    $scope.TotalPrice = function() {
        let total = 0;
        $scope.listItems.forEach(item => {
            total += item.price;
        });
        return total;
    };
    
    



    $scope.initialize();
});