(function () {
    function ProductFormControllerBase($scope, $http, $location, $filter, $q, $timeout, $rootScope, options) {
        options = options || {};
        const mode = options.mode || "create";
        const editingId = options.productId || null;
        $scope.isEditMode = mode === "edit";
        $scope.editingProductId = editingId;

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
        $scope.removedAttributeIds = [];
        $scope.productAttr = { attribute: null, value: null };
        $scope.isSubmitting = false;
        $scope.successMessage = "";
        $scope.imageListModified = false;

        consumeFlashMessage();

        $scope.loadMediaLibrary = function () {
            $scope.mediaLoading = true;
            return $http.get("http://localhost:8000/api/images").then(resp => {
                $scope.mediaImages = resp.data || [];
            }).catch(error => {
                console.log("Error loading media", error);
            }).finally(() => {
                $scope.mediaLoading = false;
            });
        };

        function initialize() {
            const requests = [];
            requests.push($http.get("http://localhost:8000/api/admin/categories").then(resp => {
                $scope.categories = resp.data || [];
            }).catch(error => console.log("Error", error)));

            requests.push($http.get("http://localhost:8000/api/admin/attributes").then(resp => {
                $scope.attributes = resp.data || [];
            }).catch(error => console.log("Error", error)));

            requests.push($http.get("http://localhost:8000/api/admin/attribute-values").then(resp => {
                $scope.attributeValues = normalizeAttributeValues(resp.data || []);
                $scope.filteredAttributeValues = [];
            }).catch(error => console.log("Error", error)));

            requests.push($http.get("http://localhost:8000/api/admin/brands").then(resp => {
                $scope.brands = resp.data || [];
            }).catch(error => console.log("Error", error)));

            requests.push($scope.loadMediaLibrary());
            return $q.all(requests);
        }

        initialize().then(function () {
            if ($scope.isEditMode && editingId) {
                loadProductForEdit(editingId);
            } else {
                resetProductForm(true);
            }
        });

        $scope.$watch('productAttr.attribute', function (newVal) {
            applyFilterForAttribute(newVal);
        });

        $scope.onAttributeChange = function (attrId) {
            applyFilterForAttribute(attrId);
        };

        $scope.create = function () {
            if (!$scope.product.name || !$scope.product.name.trim()) {
                alert("Vui lòng nhập tên sản phẩm!");
                return;
            }
            if (!$scope.product.description || !$scope.product.description.trim()) {
                alert("Vui lòng nhập mô tả sản phẩm!");
                return;
            }
            if (!$scope.product.category || !$scope.product.category.id) {
                alert("Vui lòng chọn danh mục!");
                return;
            }
            if (!$scope.product.brandId) {
                alert("Vui lòng chọn hãng sản xuất!");
                return;
            }
            if (Number($scope.product.price) > 1000000000) {
                alert("Giá tối đa cho phép là 1.000.000.000đ!");
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
                if ($scope.selectedProductImages.length) {
                    createdProduct.urlimage = $scope.selectedProductImages[0].url;
                }
                decorateProduct(createdProduct);
                $scope.products.push(createdProduct);
                resetProductForm(true);
                $scope.isSubmitting = false;
                showInlineSuccess("Tạo sản phẩm thành công!");
            }).catch(error => {
                console.log("Error", error);
                alert("Unable to create product. Please try again!");
                $scope.isSubmitting = false;
            });
        };

        $scope.update = function () {
            if (!$scope.product || !$scope.product.id) {
                alert("Không xác định được sản phẩm cần cập nhật!");
                return;
            }
            if (!$scope.product.name || !$scope.product.name.trim()) {
                alert("Vui lòng nhập tên sản phẩm!");
                return;
            }
            if (!$scope.product.description || !$scope.product.description.trim()) {
                alert("Vui lòng nhập mô tả sản phẩm!");
                return;
            }
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
            if (Number($scope.product.price) > 1000000000) {
                alert("Giá tối đa cho phép là 1.000.000.000đ!");
                return;
            }
            $scope.isSubmitting = true;
            $http.put(`http://localhost:8000/api/admin/products/${$scope.product.id}`, payload).then(resp => {
                const updatedProduct = resp.data || payload;
                const productId = updatedProduct.id || $scope.product.id;
                return deleteRemovedAttributes(productId)
                    .then(() => saveProductAttributes(productId))
                    .then(() => saveProductImages(productId, { replace: $scope.imageListModified }))
                    .then(() => updatedProduct);
            }).then(updatedProduct => {
                decorateProduct(updatedProduct);
                showInlineSuccess("Cập nhật sản phẩm thành công!", { flash: true });
                resetProductForm();
                $scope.isSubmitting = false;
            }).catch(error => {
                console.log("Error", error);
                alert("Unable to update product. Please try again!");
                $scope.isSubmitting = false;
            });
        };

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
            const previousSelection = $scope.selectedProductImages ? $scope.selectedProductImages.slice() : [];
            const newSelection = $scope.tempSelectedImages.map(item => angular.copy(item));
            if (hasExistingImageOrderChanged(previousSelection, newSelection)) {
                $scope.imageListModified = true;
            }
            $scope.selectedProductImages = newSelection;
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
            const removed = $scope.selectedProductImages.splice(index, 1)[0];
            if (removed && removed.productImageId) {
                $scope.imageListModified = true;
            }
            updatePrimaryPreview();
        };

        $scope.setPrimaryImage = function (index) {
            if (index <= 0 || index >= $scope.selectedProductImages.length) return;
            const primary = $scope.selectedProductImages.splice(index, 1)[0];
            $scope.selectedProductImages.unshift(primary);
            if (primary && primary.productImageId) {
                $scope.imageListModified = true;
            }
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
                valueName: value.value,
                existingId: null
            });
            $scope.productAttr.value = null;
        };

        $scope.removeProductAttribute = function (index) {
            if (index < 0 || index >= $scope.selectedProductAttributes.length) return;
            const removed = $scope.selectedProductAttributes.splice(index, 1)[0];
            if (removed && removed.existingId) {
                if (!$scope.removedAttributeIds.includes(removed.existingId)) {
                    $scope.removedAttributeIds.push(removed.existingId);
                }
            }
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

        function resetProductForm(skipRedirect) {
            $scope.product = { category: {} };
            $scope.product.brandId = null;
            $scope.selectedProductImages = [];
            $scope.selectedProductAttributes = [];
            $scope.removedAttributeIds = [];
            $scope.productAttr.attribute = null;
            $scope.productAttr.value = null;
            $scope.isSubmitting = false;
            $scope.imageListModified = false;
            updatePrimaryPreview();
            if ($scope.isEditMode && !skipRedirect) {
                $location.path("/product/create");
            }
        }

        function loadProductForEdit(productId) {
            if (!productId) return;
            $scope.isEditMode = true;
            $scope.editingProductId = productId;
            $scope.isSubmitting = false;
            $scope.successMessage = "";
            $scope.selectedProductImages = [];
            $scope.selectedProductAttributes = [];
            $scope.removedAttributeIds = [];
            $http.get(`http://localhost:8000/api/admin/products/${productId}`).then(function (resp) {
                const productData = resp.data || {};
                prepareProductForForm(productData);
                $scope.product = productData;
                return $http.get(`http://localhost:8000/api/product-images/product/${productId}`);
            }).then(function (imageResp) {
                $scope.product.productImages = imageResp.data || [];
                return $http.get(`http://localhost:8000/api/admin/product-attribute-values/product/${productId}`);
            }).then(function (attrResp) {
                $scope.product.productAttributeValues = attrResp.data || [];
                syncSelectedImagesFromProduct();
                syncSelectedAttributesFromProduct();
            }).catch(function (error) {
                console.log("Không thể tải dữ liệu sản phẩm", error);
                alert("Không thể tải dữ liệu sản phẩm để chỉnh sửa!");
            });
        }

        function prepareProductForForm(productData) {
            if (!productData) return;
            if (!productData.category) {
                productData.category = {};
            }
            if (!productData.category.id && productData.categoryId) {
                productData.category.id = productData.categoryId;
            }
            const categoryInfo = findCategoryById(productData.category.id || productData.categoryId);
            if (categoryInfo) {
                productData.category = angular.copy(categoryInfo);
            }
            if (productData.brand && productData.brand.id) {
                productData.brandId = productData.brand.id;
            }
            if (!productData.brandId && productData.brand) {
                productData.brandId = productData.brand.id;
            }
        }

        function findCategoryById(id) {
            if (!id || !$scope.categories || !$scope.categories.length) return null;
            const target = Number(id);
            return $scope.categories.find(function (cate) {
                return Number(cate.id) === target;
            }) || null;
        }

        function syncSelectedImagesFromProduct() {
            $scope.selectedProductImages = [];
            if ($scope.product) {
                if (Array.isArray($scope.product.productImages) && $scope.product.productImages.length) {
                    $scope.selectedProductImages = $scope.product.productImages.map(function (pi) {
                        const img = pi.image || {};
                        return {
                            id: img.id || pi.imageId || null,
                            productImageId: pi.id || null,
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
            $scope.imageListModified = false;
        }

        function saveProductImages(productId, options) {
            options = options || {};
            if (!productId) {
                return $q.resolve();
            }
        const imageList = options.replace
            ? ($scope.selectedProductImages || [])
            : ($scope.selectedProductImages || []).filter(function (img) {
                return img && !img.productImageId;
            });
        console.log("[saveProductImages] mode:", options.replace ? "replace" : "append", "rawList:", angular.copy($scope.selectedProductImages));
        const payload = imageList
            .filter(img => img && img.id)
            .map((img, index) => ({
                productId: productId,
                imageId: img.id,
                isPrimary: index === 0,
                position: index
            }));
        console.log("[saveProductImages] payload:", payload);

            const addImages = function () {
                if (!payload.length) {
                    return $q.resolve();
                }
                return $http.post("http://localhost:8000/api/product-images/add-multiple", payload).then(function (resp) {
                    console.log("[saveProductImages] add-multiple success", resp.data);
                    return resp;
                });
            };

        if (options.replace) {
            if (!payload.length) {
                console.log("[saveProductImages] replace=true but no payload, only deleting existing images");
                return $http({
                    method: "DELETE",
                    url: `http://localhost:8000/api/product-images/product/${productId}`,
                    responseType: "text",
                    transformResponse: []
                }).then(function (resp) {
                    console.log("[saveProductImages] delete-only success");
                    return resp;
                });
            }
            console.log("[saveProductImages] replace=true with payload, deleting old images first");
            return $http({
                method: "DELETE",
                url: `http://localhost:8000/api/product-images/product/${productId}`,
                responseType: "text",
                transformResponse: []
            }).then(function (resp) {
                console.log("[saveProductImages] delete success", resp.data);
                return addImages();
            });
        }

        if (!payload.length) {
            return $q.resolve();
        }
        console.log("[saveProductImages] append mode, adding payload only");
        return addImages();
    }

        function syncSelectedAttributesFromProduct() {
            $scope.selectedProductAttributes = [];
            if (!$scope.product || !Array.isArray($scope.product.productAttributeValues)) {
                return;
            }
            $scope.selectedProductAttributes = $scope.product.productAttributeValues.map(function (pav) {
                const attrData = pav.attribute || null;
                const attrId = attrData && attrData.id ? attrData.id : pav.attributeId;
                const attribute = attrData || findAttributeById(attrId);

                const valueData = pav.attributeValue || pav.value || null;
                const valueId = valueData && valueData.id ? valueData.id : (pav.attributeValueId || pav.valueId);
                const value = valueData || findAttributeValueById(valueId);
                const mappingId = pav.id || pav.productAttributeValueId || pav.mappingId || null;

                return {
                    attributeId: attrId,
                    attributeName: attribute ? attribute.name : '',
                    valueId: valueId,
                    valueName: value ? value.value : '',
                    existingId: mappingId
                };
            }).filter(item => item.attributeId && item.valueId);
        }

        function saveProductAttributes(productId) {
            if (!productId) {
                return $q.resolve();
            }
            const newItems = $scope.selectedProductAttributes.filter(function (item) {
                return !item.existingId;
            });
            if (!newItems.length) {
                return $q.resolve();
            }
            const requests = newItems.map(function (item) {
                const payload = {
                    product: { id: productId },
                    attribute: { id: item.attributeId },
                    value: { id: item.valueId }
                };
                return $http.post("http://localhost:8000/api/admin/product-attribute-values", payload);
            });
            return $q.all(requests);
        }

        function deleteRemovedAttributes(productId) {
            if (!productId) {
                $scope.removedAttributeIds = [];
                return $q.resolve();
            }
            if (!$scope.removedAttributeIds.length) {
                return $q.resolve();
            }
            const requests = $scope.removedAttributeIds.map(function (id) {
                return $http.delete(`http://localhost:8000/api/admin/product-attribute-values/${id}`);
            });
            return $q.all(requests).finally(function () {
                $scope.removedAttributeIds = [];
            });
        }

        function decorateProduct(product) {
            if (!product) return product;
            const thumb = resolveProductImageUrl(product);
            if (thumb) {
                product.thumbnailUrl = thumb;
                product.urlimage = thumb;
            }
            return product;
        }

        function resolveProductImageUrl(product) {
            if (!product) return null;
            if (product.urlimage) return product.urlimage;
            if (product.imageUrl) return product.imageUrl;
            if (product.image && product.image.url) return product.image.url;
            if (Array.isArray(product.productImages) && product.productImages.length) {
                const primary = product.productImages.find(function (pi) {
                    return pi && pi.isPrimary && extractImageUrl(pi);
                });
                if (primary) {
                    const primaryUrl = extractImageUrl(primary);
                    if (primaryUrl) return primaryUrl;
                }
                for (let i = 0; i < product.productImages.length; i++) {
                    const url = extractImageUrl(product.productImages[i]);
                    if (url) return url;
                }
            }
            if (product.primaryImage && product.primaryImage.url) {
                return product.primaryImage.url;
            }
            return null;
        }

        function extractImageUrl(pi) {
            if (!pi) return null;
            if (pi.image && pi.image.url) return pi.image.url;
            if (pi.urlimage) return pi.urlimage;
            if (pi.url) return pi.url;
            return null;
        }

        function hasExistingImageOrderChanged(prevList, newList) {
            const prevIds = getExistingImageIds(prevList);
            const newIds = getExistingImageIds(newList);
            if (prevIds.length !== newIds.length) {
                return true;
            }
            for (let i = 0; i < prevIds.length; i++) {
                if (prevIds[i] !== newIds[i]) {
                    return true;
                }
            }
            return false;
        }

        function getExistingImageIds(list) {
            if (!Array.isArray(list)) return [];
            return list.filter(function (img) {
                return img && img.productImageId;
            }).map(function (img) {
                return img.productImageId;
            });
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

        function showInlineSuccess(message, opts) {
            opts = opts || {};
            $scope.successMessage = message;
            if (opts.flash) {
                $rootScope.productFlashMessage = message;
            }
            $timeout(function () {
                $scope.successMessage = "";
            }, 4000);
        }

        function consumeFlashMessage() {
            if ($rootScope.productFlashMessage) {
                $scope.successMessage = $rootScope.productFlashMessage;
                $rootScope.productFlashMessage = "";
                $timeout(function () {
                    $scope.successMessage = "";
                }, 4000);
            }
        }
    }

    app.controller("productCreateCtrl", function ($scope, $http, $location, $filter, $q, $timeout, $rootScope) {
        ProductFormControllerBase($scope, $http, $location, $filter, $q, $timeout, $rootScope, { mode: "create" });
    });

    app.controller("productEditCtrl", function ($scope, $http, $location, $filter, $q, $timeout, $rootScope, $routeParams) {
        ProductFormControllerBase($scope, $http, $location, $filter, $q, $timeout, $rootScope, {
            mode: "edit",
            productId: Number($routeParams.id)
        });
    });
})();
