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

    $scope.adminGranted = function(accountId) {
        const hasAdminRole = $scope.userRoles[accountId] && $scope.userRoles[accountId].some(role => role.code === 'ADMIN');
        
        if (hasAdminRole) {

            if (window.confirm("Bạn có chắc chắn muốn thu hồi quyền Admin?")) {
                $http.delete("http://localhost:8000/api/admin/userroles/byaccount/" + accountId).then(response => {
                    alert("Thu hồi quyền Admin thành công!");
                }).catch(error => {
                    console.log("Lỗi khi thu hồi quyền:", error);
                });
            }
        } else {
            if (window.confirm("Bạn có chắc chắn muốn thêm quyền Admin?")) {
                const grantedUserRole = {
                    account: {
                        id: accountId 
                    },
                    role: {
                        id: 1 
                    }
                };
                $http.post("http://localhost:8000/api/admin/userroles", grantedUserRole).then(response => {
                    alert("Thêm quyền Admin thành công!");
                }).catch(error => {
                    console.log("Error khi thêm quyền:", error);
                });
            }
        }
    };
    
    
    
    $scope.initialize();

});