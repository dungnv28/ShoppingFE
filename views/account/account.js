app.controller("account", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.accounts = [];
    $scope.userRoles = [];

    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/client/accounts").then(resp => {
            $scope.accounts = resp.data;
        }).catch(error => {
            console.log("Error", error);
        })
    }


    $scope.findRoleByAccountId = function (id) {
        $http.get("http://localhost:8000/api/admin/userroles/getrole/" + id).then(resp => {
            $scope.userRoles[id] = resp.data;
        }).catch(error => {
            console.log("Error", error);
        });
    };
// ------- hoàn thiện nốt hàm phân quyền ------
    $scope.adminGranted = function(accountId) {
        const hasAdminRole = userRoles[accountId] && userRoles[accountId].some(role => role.code === 'ADMIN');
    
        if (hasAdminRole) {
            $http.delete(`http://localhost:8000/api/admin/userroles/remove/${accountId}/ADMIN`).then(response => {
                console.log('Đã xóa quyền ADMIN cho tài khoản:', accountId);
            }).catch(error => {
                console.log("Error khi xóa quyền:", error);
            });
        } else {
            // Nếu tài khoản chưa có quyền ADMIN, thực hiện thêm quyền ADMIN
            $http.post(`http://localhost:8000/api/admin/userroles/add`, { accountId: accountId, roleCode: 'ADMIN' }).then(response => {
                // Cập nhật lại danh sách userRoles
                console.log('Đã thêm quyền ADMIN cho tài khoản:', accountId);
                // Cập nhật userRoles sau khi thêm quyền
                // Có thể gọi lại hàm lấy userRoles hoặc cập nhật mảng userRoles
            }).catch(error => {
                console.log("Error khi thêm quyền:", error);
            });
        }
    };
    
    
    $scope.initialize();

});