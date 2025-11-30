app.controller("category", function ($scope, $http, $location, $filter) {

    $scope.searchTerm = '';
    $scope.categories = [];
    $scope.cate = {};
    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/admin/categories")
            .then(resp => {

                // B1: nhận dữ liệu backend
                let list = resp.data;

                // B2: build level phân cấp
                $scope.categories = buildTreeOrdered(list);

                // B3: nếu đang tạo mới thì chọn mặc định danh mục cha
                // if (!$scope.cate.id && $scope.categories.length > 0) {
                //     $scope.cate.parentId = $scope.categories[0].id;
                // }

            })
            .catch(error => {
                console.log("Error", error);
            });
    };


    // ✔ TẠO MỚI DANH MỤC
    $scope.create = function () {

        console.log("Create sending:", $scope.cate); // kiểm tra xem có parentId không

        $http.post("http://localhost:8000/api/admin/categories", $scope.cate).then(resp => {

            alert("Thêm danh mục thành công!")
            $scope.categories.push(resp.data);

            // Reset form → nhưng giữ lại parentId mặc định
            $scope.cate = {};
            if ($scope.categories.length > 0) {
                $scope.cate.parentId = $scope.categories[0].id;
            }

        }).catch(error => {
            console.log("Error", error);
        });
    };

    // ✔ CẬP NHẬT DANH MỤC
    $scope.update = function () {

        console.log("Update sending:", $scope.cate); // kiểm tra parentId

        $http.put(`http://localhost:8000/api/admin/categories/${$scope.cate.id}`, $scope.cate).then(resp => {

            alert("Cập nhật danh mục thành công!");

            // Cập nhật ngay trên bảng
            let idx = $scope.categories.findIndex(c => c.id === resp.data.id);
            if (idx !== -1) {
                $scope.categories[idx] = resp.data;
            }

            // Reset form → giữ parent mặc định
            $scope.cate = {};
            if ($scope.categories.length > 0) {
                $scope.cate.parentId = $scope.categories[0].id;
            }

        }).catch(error => {
            console.log("Error", error);
        });
    };

    // ✔ NÚT SỬA
    $scope.views = function (cate) {
        // Phải dùng angular.copy để tránh binding 2 chiều sai
        $scope.cate = angular.copy(cate);
    };

    function buildTreeOrdered(categories) {
        let map = {};
        let roots = [];

        // Tạo map id → category
        categories.forEach(c => {
            c.children = [];
            map[c.id] = c;
        });

        // Gán children cho từng parent
        categories.forEach(c => {
            if (c.parentId) {
                if (map[c.parentId]) {
                    map[c.parentId].children.push(c);
                }
            } else {
                roots.push(c);
            }
        });

        // Hàm duyệt cây theo thứ tự
        let ordered = [];
        function traverse(node, level) {
            node.level = level;
            ordered.push(node);
            node.children.forEach(child => traverse(child, level + 1));
        }

        // Duyệt tất cả root
        roots.forEach(r => traverse(r, 0));

        return ordered;
    }




    $scope.initialize();
});
