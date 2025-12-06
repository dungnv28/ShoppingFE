app.controller("product", function ($scope, $http, $location, $filter, $q, $timeout) {
    $scope.searchTerm = '';
    $scope.products = [];
    $scope.categories = [];
    $scope.attributes = [];
    $scope.attributeValues = [];
    $scope.filteredAttributeValues = [];
    $scope.cate = {};
    $scope.attributeValue = {};
    $scope.product = {};
    $scope.selectedProductImages = [];
    $scope.mediaImages = [];
    $scope.mediaLoading = false;
    $scope.mediaSearchKeyword = "";
    $scope.tempSelectedImages = [];
    $scope.brands = [];
    $scope.brandForm = {};
    $scope.selectedProductAttributes = [];
    $scope.productAttr = {
        attribute: null,
        value: null
    };
    $scope.isSubmitting = false;
    $scope.successMessage = "";

    $scope.loadMediaLibrary = function () {
        $scope.mediaLoading = true;
        $http.get("http://localhost:8000/api/images").then(resp => {
            $scope.mediaImages = resp.data || [];
        }).catch(error => {
            console.log("Error loading media", error);
        }).finally(() => {
            $scope.mediaLoading = false;
        });
    };

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

        $http.get("http://localhost:8000/api/admin/brands")
            .then(resp => {
                $scope.brands = resp.data || [];
            })
            .catch(error => {
                console.log("Error", error);
            });

        $scope.loadMediaLibrary();
    };

    $scope.views = function (pro) {
        $scope.product = pro;
        syncSelectedImagesFromProduct();
        if (pro && pro.brand && pro.brand.id) {
            $scope.product.brandId = pro.brand.id;
        } else {
            $scope.product.brandId = null;
        }
        syncSelectedAttributesFromProduct();
    };

    $scope.create = function () {
        if (!$scope.product.category || !$scope.product.category.id) {
            alert("Vui lòng chọn danh mục!");
            return;
        }
        if (!$scope.product.brandId) {
            alert("Vui lòng chọn hãng sản xuất!");
            return;
        }
        if (!$scope.product.price || !$scope.product.quantity) {
            alert("Vui lòng nhập giá và số lượng!");
            return;
        }

        const payload = {
            name: $scope.product.name,
            description: $scope.product.description,
            price: $scope.product.price,
            quantity: $scope.product.quantity,
            status: 1,
            categoryId: $scope.product.category && $scope.product.category.id ? Number($scope.product.category.id) : null,
            brandId: $scope.product.brandId ? Number($scope.product.brandId) : null
        };
        $scope.isSubmitting = true;
        $scope.successMessage = "";
        $http.post("http://localhost:8000/api/admin/products", payload).then(resp => {
            const createdProduct = resp.data;
            return saveProductImages(createdProduct.id)
                .then(() => saveProductAttributes(createdProduct.id))
                .then(() => createdProduct);
        }).then(createdProduct => {
            $scope.products.push(createdProduct);
            resetProductForm();
            $scope.isSubmitting = false;
            $scope.successMessage = "Tạo sản phẩm thành công!";
            $timeout(function () {
                $scope.successMessage = "";
            }, 4000);
        }).catch(error => {
            console.log("Error", error);
            alert("Unable to create product. Please try again!");
            $scope.isSubmitting = false;
        });
    };

    $scope.$watch('productAttr.attribute', function (newVal) {
        applyFilterForAttribute(newVal);
    });

    $scope.onAttributeChange = function (attrId) {
        applyFilterForAttribute(attrId);
    };

    $scope.update = function () {
        const payload = {
            id: $scope.product.id,
            name: $scope.product.name,
            description: $scope.product.description,
            price: $scope.product.price,
            quantity: $scope.product.quantity,
            status: 1,
            categoryId: $scope.product.category && $scope.product.category.id ? Number($scope.product.category.id) : null,
            brandId: $scope.product.brandId ? Number($scope.product.brandId) : null
        };
        $http.put(`http://localhost:8000/api/admin/products/${$scope.product.id}`, payload).then(resp => {
            alert("Product updated successfully!");
            $scope.products.push(resp.data);
            resetProductForm();
        }).catch(error => {
            console.log("Error", error);
            alert("Unable to update product. Please try again!");
        });
    };

    $scope.createAttribute = function () {
        if (!$scope.cate.name) {
            alert("Please enter attribute name!");
            return;
        }

        $http.post("http://localhost:8000/api/admin/attributes", $scope.cate).then(resp => {
            $scope.attributes.push(resp.data);
            $scope.productAttr.attribute = resp.data.id;
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
        var attrId = $scope.attributeValue.attributeId || $scope.attributeValue.parentId || $scope.productAttr.attribute;
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
            $scope.productAttr.value = resp.data.id;
            const attrIdResponse = getAttributeId(newVal);
            if (attrIdResponse) {
                $scope.productAttr.attribute = attrIdResponse;
            }
            applyFilterForAttribute($scope.productAttr.attribute);
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

    $scope.openMediaModal = function () {
        if (!$scope.mediaImages.length) {
            $scope.loadMediaLibrary();
        }
        $scope.tempSelectedImages = $scope.selectedProductImages.map(item => angular.copy(item));
    };

    $scope.mediaFilter = function (item) {
        if (!$scope.mediaSearchKeyword) return true;
        const keyword = $scope.mediaSearchKeyword.toLowerCase();
        const name = (item.name || "").toLowerCase();
        const key = (item.key || "").toLowerCase();
        return name.includes(keyword) || key.includes(keyword);
    };

    $scope.isMediaTempSelected = function (image) {
        return $scope.tempSelectedImages.some(item => isSameImage(item, image));
    };

    $scope.toggleMediaTemp = function (image) {
        const idx = $scope.tempSelectedImages.findIndex(item => isSameImage(item, image));
        if (idx !== -1) {
            $scope.tempSelectedImages.splice(idx, 1);
        } else {
            $scope.tempSelectedImages.push(image);
        }
    };

    $scope.confirmMediaSelection = function () {
        $scope.selectedProductImages = $scope.tempSelectedImages.map(item => angular.copy(item));
        updatePrimaryPreview();
        const modalEl = document.getElementById("modalSelectMedia");
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }
        }
    };

    $scope.removeSelectedImage = function (index) {
        if (index < 0 || index >= $scope.selectedProductImages.length) return;
        $scope.selectedProductImages.splice(index, 1);
        updatePrimaryPreview();
    };

    $scope.setPrimaryImage = function (index) {
        if (index <= 0 || index >= $scope.selectedProductImages.length) return;
        const primary = $scope.selectedProductImages.splice(index, 1)[0];
        $scope.selectedProductImages.unshift(primary);
        updatePrimaryPreview();
    };

    $scope.addAttributeToProduct = function () {
        const currentAttr = $scope.productAttr.attribute;
        const currentValue = $scope.productAttr.value;
        if (!currentAttr || !currentValue) {
            alert("Vui lòng chọn thuộc tính và giá trị!");
            return;
        }
        const attrId = Number(currentAttr);
        const valueId = Number(currentValue);
        if (!attrId || !valueId) {
            return;
        }
        const exists = $scope.selectedProductAttributes.some(item => item.valueId === valueId);
        if (exists) {
            alert("Giá trị này đã được gán cho sản phẩm!");
            return;
        }
        const attribute = findAttributeById(attrId);
        const value = findAttributeValueById(valueId);
        if (!attribute || !value) {
            alert("Không tìm thấy dữ liệu thuộc tính!");
            return;
        }
        $scope.selectedProductAttributes.push({
            attributeId: attrId,
            attributeName: attribute.name,
            valueId: valueId,
            valueName: value.value
        });
        $scope.productAttr.value = null;
    };

    $scope.removeProductAttribute = function (index) {
        if (index < 0 || index >= $scope.selectedProductAttributes.length) return;
        $scope.selectedProductAttributes.splice(index, 1);
    };

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

    function findAttributeById(id) {
        const target = Number(id);
        return $scope.attributes.find(attr => Number(attr.id) === target);
    }

    function findAttributeValueById(id) {
        const target = Number(id);
        return $scope.attributeValues.find(val => Number(val.id) === target);
    }

    function applyFilterForAttribute(attrId) {
        if (!attrId) {
            $scope.filteredAttributeValues = [];
            $scope.productAttr.value = null;
            return;
        }
        var idNum = Number(attrId);
        $scope.filteredAttributeValues = $scope.attributeValues.filter(function (v) {
            return Number(getAttributeId(v)) === idNum;
        });
        $scope.productAttr.value = null;
    }

    function updatePrimaryPreview() {
        if (!$scope.product) {
            $scope.product = {};
        }
        if ($scope.selectedProductImages.length > 0) {
            $scope.product.urlimage = $scope.selectedProductImages[0].url;
        } else {
            $scope.product.urlimage = null;
        }
    }

    function resetProductForm() {
        $scope.product = {};
        $scope.product.brandId = null;
        $scope.selectedProductImages = [];
        $scope.selectedProductAttributes = [];
        $scope.productAttr.attribute = null;
        $scope.productAttr.value = null;
        $scope.isSubmitting = false;
        updatePrimaryPreview();
    }

    function isSameImage(a, b) {
        if (!a || !b) return false;
        if (a.id && b.id) {
            return Number(a.id) === Number(b.id);
        }
        if (a.key && b.key) {
            return a.key === b.key;
        }
        return a.url === b.url;
    }

    function syncSelectedImagesFromProduct() {
        $scope.selectedProductImages = [];
        if ($scope.product) {
            if (Array.isArray($scope.product.productImages) && $scope.product.productImages.length) {
                $scope.selectedProductImages = $scope.product.productImages.map(function (pi) {
                    const img = pi.image || {};
                    return {
                        id: img.id || pi.imageId || null,
                        key: img.key || null,
                        url: img.url || pi.urlimage || pi.url || null,
                        isPrimary: pi.isPrimary || false
                    };
                }).filter(img => img.url);
                if ($scope.product.productImages.some(pi => pi.isPrimary)) {
                    $scope.selectedProductImages.sort(function (a, b) {
                        const aPrimary = a.isPrimary ? 1 : 0;
                        const bPrimary = b.isPrimary ? 1 : 0;
                        return bPrimary - aPrimary;
                    });
                }
            } else if ($scope.product.urlimage) {
                $scope.selectedProductImages = [{
                    id: $scope.product.primaryImageId || null,
                    url: $scope.product.urlimage
                }];
            }
        }
        updatePrimaryPreview();
    }

    function saveProductImages(productId) {
        if (!productId) {
            return $q.resolve();
        }
        const payload = $scope.selectedProductImages
            .filter(img => img && img.id)
            .map((img, index) => ({
                productId: productId,
                imageId: img.id,
                isPrimary: index === 0,
                position: index
            }));

        if (!payload.length) {
            return $q.resolve();
        }

        return $http.post("http://localhost:8000/api/product-images/add-multiple", payload);
    }

    function syncSelectedAttributesFromProduct() {
        $scope.selectedProductAttributes = [];
        if (!$scope.product || !Array.isArray($scope.product.productAttributeValues)) {
            return;
        }
        $scope.selectedProductAttributes = $scope.product.productAttributeValues.map(function (pav) {
            const attrId = pav.attribute ? pav.attribute.id : pav.attributeId;
            const valueId = pav.attributeValue ? pav.attributeValue.id : pav.attributeValueId;
            const attribute = pav.attribute || findAttributeById(attrId);
            const value = pav.attributeValue || findAttributeValueById(valueId);
            return {
                attributeId: attrId,
                attributeName: attribute ? attribute.name : '',
                valueId: valueId,
                valueName: value ? value.value : ''
            };
        }).filter(item => item.attributeId && item.valueId);
    }

    function saveProductAttributes(productId) {
        if (!productId) {
            return $q.resolve();
        }
        if (!$scope.selectedProductAttributes.length) {
            return $q.resolve();
        }
        const requests = $scope.selectedProductAttributes.map(function (item) {
            const payload = {
                product: { id: productId },
                attribute: { id: item.attributeId },
                value: { id: item.valueId }
            };
            return $http.post("http://localhost:8000/api/admin/product-attribute-values", payload);
        });
        return $q.all(requests);
    }

    $scope.createBrand = function () {
        if (!$scope.brandForm.name) {
            alert("Vui lòng nhập tên hãng!");
            return;
        }
        $http.post("http://localhost:8000/api/admin/brands", $scope.brandForm).then(resp => {
            $scope.brands.push(resp.data);
            $scope.product.brandId = resp.data.id;
            $scope.brandForm = {};
            const modalEl = document.getElementById("modalAddBrand");
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            alert("Thêm hãng thành công!");
        }).catch(error => {
            console.log("Error creating brand", error);
            alert("Không thể tạo hãng. Vui lòng thử lại!");
        });
    };
});
