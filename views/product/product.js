app.controller("product", function ($scope, $http, $location, $filter) {
    $scope.searchTerm = '';
    $scope.products = [];
    $scope.categories = [];
    $scope.attributes = [];
    $scope.attributeValues = [];
    $scope.filteredAttributeValues = [];
    $scope.cate = {};
    $scope.attributeValue = {};
    $scope.product = {};

    $scope.initialize = function () {
        $http.get("http://localhost:8000/api/admin/products").then(resp => {
            $scope.products = resp.data;
        }).catch(error => {
            console.log("Error", error);
        });

        $http.get("http://localhost:8000/api/admin/categories").then(resp => {
            $scope.categories = resp.data;
        }).catch(error => {
            console.log("Error", error);
        });

        $http.get("http://localhost:8000/api/admin/attributes")
            .then(resp => {
                $scope.attributes = resp.data;
            })
            .catch(error => {
                console.log("Error", error);
            });

        $http.get("http://localhost:8000/api/admin/attribute-values")
            .then(resp => {
                $scope.attributeValues = normalizeAttributeValues(resp.data);
                $scope.filteredAttributeValues = [];
            })
            .catch(error => {
                console.log("Error", error);
            });
    };

    $scope.views = function (pro) {
        $scope.product = pro;
    };

    $scope.create = function () {
        $scope.product.status = true;
        $scope.product.categoryId = $scope.product.category.id;
        $http.post("http://localhost:8000/api/admin/products", $scope.product).then(resp => {
            alert("Product created successfully!");
            $scope.products.push(resp.data);
            $scope.product = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };

    $scope.$watch('selectedAttribute', function (newVal) {
        applyFilterForAttribute(newVal);
    });

    $scope.onAttributeChange = function (attrId) {
        applyFilterForAttribute(attrId);
    };

    $scope.update = function () {
        $scope.product.status = true;
        $scope.product.categoryId = $scope.product.category.id;
        $http.put(`http://localhost:8000/api/admin/products/${$scope.product.id}`, $scope.product).then(resp => {
            alert("Product updated successfully!");
            $scope.products.push(resp.data);
            $scope.product = {};
        }).catch(error => {
            console.log("Error", error);
        });
    };

    $scope.createAttribute = function () {
        if (!$scope.cate.name) {
            alert("Please enter attribute name!");
            return;
        }

        $http.post("http://localhost:8000/api/admin/attributes", $scope.cate).then(resp => {
            $scope.attributes.push(resp.data);
            $scope.selectedAttribute = resp.data.id;
            $scope.cate.name = "";
            let modal = bootstrap.Modal.getInstance(document.getElementById("modalAddAttribute"));
            modal.hide();
            alert("Attribute created successfully!");

        }).catch(err => {
            console.log(err);
            alert("Error creating attribute!");
        });
    };

    $scope.createAttributeValue = function () {
        // Ensure attributeId set from selected attribute if missing
        var attrId = $scope.attributeValue.attributeId || $scope.attributeValue.parentId || $scope.selectedAttribute;
        if (!$scope.attributeValue.value || !attrId) {
            alert("Please enter a value and choose an attribute!");
            return;
        }

        var payload = {
            value: $scope.attributeValue.value,
            attributeId: attrId
        };

        $http.post("http://localhost:8000/api/admin/attribute-values", payload).then(resp => {
            const newVal = normalizeAttributeValue(resp.data);
            $scope.attributeValues.push(newVal);
            $scope.selectedValue = resp.data.id;
            const attrIdResponse = getAttributeId(newVal);
            if (attrIdResponse) {
                $scope.selectedAttribute = attrIdResponse;
            }
            applyFilterForAttribute($scope.selectedAttribute);
            $scope.attributeValue = {};
            let modal = bootstrap.Modal.getInstance(document.getElementById("modalAddValue"));
            modal.hide();
            alert("Attribute value created successfully!");

        }).catch(err => {
            console.log(err);
            alert("Error creating attribute value!");
        });
    };

    $scope.initialize();
    // normalize single attribute value shape so UI always has parentId
    function normalizeAttributeValue(item) {
        if (!item) return item;
        if (item.parentId == null && item.attribute && item.attribute.id != null) {
            item.parentId = item.attribute.id;
        }
        if (item.parentId == null && item.attributeId != null) {
            item.parentId = item.attributeId;
        }
        return item;
    }

    function normalizeAttributeValues(list) {
        if (!Array.isArray(list)) return [];
        return list.map(function (item) {
            return normalizeAttributeValue(item);
        });
    }

    function getAttributeId(item) {
        if (!item) return null;
        if (item.parentId != null) return item.parentId;
        if (item.attribute && item.attribute.id != null) return item.attribute.id;
        if (item.attributeId != null) return item.attributeId;
        return null;
    }

    function applyFilterForAttribute(attrId) {
        if (!attrId) {
            $scope.filteredAttributeValues = [];
            $scope.selectedValue = null;
            return;
        }
        var idNum = Number(attrId);
        $scope.filteredAttributeValues = $scope.attributeValues.filter(function (v) {
            return Number(getAttributeId(v)) === idNum;
        });
        $scope.selectedValue = null;
    }
});
