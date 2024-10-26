app.controller("order", function ($scope, $http) {
    $scope.searchTerm = '';
    $scope.orders = [];

    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/orders").then(resp => {
            $scope.orders = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })
    }

    $scope.extractDateFromCode = function(code) {
        const timestampPart = code.slice(6, 19);
        const timestamp = parseInt(timestampPart, 10);
        const date = new Date(timestamp);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${day} tháng ${month}, ${year}, ${hours}:${minutes}`;
    }
    $scope.initialize();

    // ---------- hàm update trạng thái ----------
    $scope.toggleStatus = function(item, status) {
        const confirmUpdate = confirm("Bạn có muốn cập nhật trạng thái này?");
        if (confirmUpdate) {
            if (item.status === status) {
                item.status = 0; 
            } else {
                item.status = status; 
            }
            const orderToUpdate = angular.copy(item); 
            updateOrder(orderToUpdate);
        }
    };
    
    function updateOrder(order) {
        $http.put('http://localhost:8000/api/client/orders', order) 
            .then(function(response) {
                alert('Cập nhật trạng thái thành công:');
            })
            .catch(function(error) {
                console.error('Có lỗi xảy ra khi cập nhật trạng thái:', error);
            });
    }
    
    
    
});