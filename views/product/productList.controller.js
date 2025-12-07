(function () {
    app.controller("productListCtrl", function ($scope, $http, $location, $q) {
        $scope.filters = {
            search: '',
            category: null,
            brand: null
        };
        $scope.searchTerm = '';
        $scope.products = [];
        $scope.filteredProducts = [];
        $scope.pagedProducts = [];
        $scope.categories = [];
        $scope.brands = [];
        $scope.filterCategoryId = null;
        $scope.filterBrandId = null;
        $scope.isProductSelectionMode = false;
        $scope.selectedProducts = {};
        $scope.isBulkDeleting = false;
        $scope.pageSize = 10;
        $scope.currentPage = 1;

        initialize();

        function initialize() {
            loadProducts();
            $http.get("http://localhost:8000/api/admin/categories").then(resp => {
                $scope.categories = resp.data || [];
            }).catch(error => console.log("Error", error));

            $http.get("http://localhost:8000/api/admin/brands").then(resp => {
                $scope.brands = resp.data || [];
            }).catch(error => console.log("Error", error));
        }

        function loadProducts() {
            $http.get("http://localhost:8000/api/admin/products").then(resp => {
                const list = Array.isArray(resp.data) ? resp.data : [];
                $scope.products = decorateProductList(list);
                return loadImagesForProducts($scope.products);
            }).catch(error => console.log("Error", error));
        }

        $scope.getFilteredProducts = function () {
            return $scope.filteredProducts || [];
        };

        $scope.applyFiltersManual = function () {
            const keyword = ($scope.filters.search != null ? $scope.filters.search : $scope.searchTerm || "").toString();
            const trimmed = keyword.trim();
            $scope.searchTerm = trimmed;
            const normalizedCategory = getSelectedCategoryId();
            const normalizedBrand = getSelectedBrandId();
            const categorySelected = normalizedCategory != null;
            const brandSelected = normalizedBrand != null;
            if (!trimmed && !categorySelected && !brandSelected) {
                $scope.filters.search = '';
                $scope.searchTerm = '';
                $scope.currentPage = 1;
                $scope.filteredProducts = Array.isArray($scope.products) ? $scope.products.slice() : [];
                updatePagedProducts();
                return;
            }
            $scope.currentPage = 1;
            applyFilters();
        };

        $scope.$watch('filters.category', function (newVal) {
            $scope.filterCategoryId = newVal && newVal.id != null ? Number(newVal.id) : null;
        });

        $scope.$watch('filters.brand', function (newVal) {
            $scope.filterBrandId = newVal && newVal.id != null ? Number(newVal.id) : null;
        });

        $scope.setPageSize = function (size) {
            if (!size) return;
            $scope.pageSize = Number(size);
            $scope.currentPage = 1;
            updatePagedProducts();
        };

        $scope.goToPage = function (page) {
            const total = getTotalPages();
            if (page < 1 || page > total) return;
            $scope.currentPage = page;
            updatePagedProducts();
        };

        $scope.nextPage = function () {
            $scope.goToPage($scope.currentPage + 1);
        };

        $scope.prevPage = function () {
            $scope.goToPage($scope.currentPage - 1);
        };

        $scope.pageRange = function () {
            const total = getTotalPages();
            return Array.from({ length: total }, (_, i) => i + 1);
        };

        $scope.toggleSelectionMode = function () {
            $scope.isProductSelectionMode = !$scope.isProductSelectionMode;
            if (!$scope.isProductSelectionMode) {
                clearProductSelections();
            }
        };

        $scope.isProductSelected = function (productId) {
            if (productId == null) return false;
            return !!$scope.selectedProducts[productId];
        };

        $scope.toggleProductSelection = function (product, $event) {
            if ($event) {
                $event.stopPropagation();
            }
            if (!$scope.isProductSelectionMode) return;
            if (!product || product.id == null) return;
            if ($scope.selectedProducts[product.id]) {
                delete $scope.selectedProducts[product.id];
            } else {
                $scope.selectedProducts[product.id] = true;
            }
        };

        $scope.toggleSelectAllProducts = function ($event) {
            if ($event) {
                $event.stopPropagation();
            }
            if (!$scope.isProductSelectionMode) return;
            const filtered = $scope.getFilteredProducts();
            if (!filtered.length) {
                return;
            }
            const shouldSelectAll = filtered.some(function (item) {
                return !$scope.selectedProducts[item.id];
            });
            if (shouldSelectAll) {
                filtered.forEach(function (item) {
                    if (item.id != null) {
                        $scope.selectedProducts[item.id] = true;
                    }
                });
            } else {
                filtered.forEach(function (item) {
                    if (item.id != null && $scope.selectedProducts[item.id]) {
                        delete $scope.selectedProducts[item.id];
                    }
                });
            }
        };

        $scope.selectedProductCount = function () {
            return Object.keys($scope.selectedProducts).length;
        };

        $scope.hasProductSelection = function () {
            return $scope.selectedProductCount() > 0;
        };

        $scope.isAllFilteredSelected = function () {
            const filtered = $scope.getFilteredProducts();
            if (!filtered.length) {
                return false;
            }
            return filtered.every(function (item) {
                return item.id != null && $scope.selectedProducts[item.id];
            });
        };

        $scope.bulkDeleteProducts = function () {
            if (!$scope.hasProductSelection() || $scope.isBulkDeleting) {
                return;
            }
            if (!confirm("Bạn có chắc muốn xoá các sản phẩm đã chọn?")) {
                return;
            }
            const ids = Object.keys($scope.selectedProducts);
            if (!ids.length) return;
            $scope.isBulkDeleting = true;
            const deletedIds = [];
            ids.reduce(function (prevPromise, id) {
                return prevPromise.then(function () {
                    return deleteProductWithRelations(id).then(function () {
                        deletedIds.push(id);
                    });
                });
            }, $q.resolve()).then(function () {
                $scope.products = $scope.products.filter(function (item) {
                    return !deletedIds.includes(String(item.id));
                });
                clearProductSelections();
                $scope.isBulkDeleting = false;
                $scope.isProductSelectionMode = false;
            }).catch(function (error) {
            alert("Không thể xoá sản phẩm. Vui lòng thử lại!");
            $scope.isBulkDeleting = false;
        });
        };

        $scope.editProduct = function (item) {
            if (!item || !item.id) return;
            $location.path(`/product/edit/${item.id}`);
        };

        function clearProductSelections() {
            $scope.selectedProducts = {};
        }

        function deleteProductWithRelations(productId) {
            if (!productId) {
                return $q.reject("Thiếu productId để xoá");
            }
            return deleteProductAttributeValues(productId)
                .then(function () {
                    return deleteProductImages(productId);
                })
                .then(function () {
                    return $http.delete(`http://localhost:8000/api/admin/products/${productId}`);
                });
        }

        function deleteProductAttributeValues(productId) {
            if (!productId) {
                return $q.resolve();
            }
            return $http.get(`http://localhost:8000/api/admin/product-attribute-values/product/${productId}`)
                .then(function (resp) {
                    const list = Array.isArray(resp.data) ? resp.data : [];
                    if (!list.length) {
                        return $q.resolve();
                    }
                    const requests = list.map(function (item) {
                        const pavId = item && (item.id || item.productAttributeValueId);
                        if (!pavId) {
                            return $q.resolve();
                        }
                        return $http.delete(`http://localhost:8000/api/admin/product-attribute-values/${pavId}`);
                    });
                    return $q.all(requests);
                }).catch(function (error) {
                    if (error && error.status === 404) {
                        return $q.resolve();
                    }
                    return $q.reject(error);
                });
        }

        function deleteProductImages(productId) {
            return $http({
                method: "DELETE",
                url: `http://localhost:8000/api/product-images/product/${productId}`,
                responseType: "text",
                transformResponse: []
            }).catch(function (error) {
                if (error && error.status === 404) {
                    return $q.resolve();
                }
                return $q.reject(error);
            });
        }

        function decorateProductList(list) {
            if (!Array.isArray(list)) return [];
            return list.map(function (item) {
                return decorateProduct(item);
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

        function loadImagesForProducts(products) {
            if (!Array.isArray(products) || !products.length) {
                return $q.resolve();
            }
            const requests = products.map(function (product) {
                if (!product || !product.id) {
                    return $q.resolve();
                }
                return $http.get(`http://localhost:8000/api/product-images/product/${product.id}`)
                    .then(function (resp) {
                        product.productImages = resp.data || [];
                        decorateProduct(product);
                    }).catch(function (error) {
                        console.log("Không thể tải ảnh cho sản phẩm", product.id, error);
                    });
            });
            return $q.all(requests);
        }

        $scope.$watch('products', function () {
            applyFilters();
        }, true);

        function applyFilters() {
            if (!$scope.products || !$scope.products.length) {
                $scope.filteredProducts = [];
                $scope.pagedProducts = [];
                return;
            }
            const term = ($scope.searchTerm || "").toLowerCase();
            const selectedCategory = getSelectedCategoryId();
            const selectedBrand = getSelectedBrandId();

            $scope.filteredProducts = $scope.products.filter(function (item) {
                const matchesSearch = !term ||
                    (item.name && item.name.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term));
                const matchesCategory = !selectedCategory ||
                    (item.category && Number(item.category.id) === selectedCategory) ||
                    Number(item.categoryId) === selectedCategory;
                const matchesBrand = !selectedBrand ||
                    (item.brand && Number(item.brand.id) === selectedBrand) ||
                    Number(item.brandId) === selectedBrand;
                return matchesSearch && matchesCategory && matchesBrand;
            });
            updatePagedProducts();
        }

        function updatePagedProducts() {
            if ($scope.pageSize <= 0) {
                $scope.pagedProducts = angular.copy($scope.filteredProducts);
                return;
            }
            const total = getTotalPages();
            if ($scope.currentPage > total) {
                $scope.currentPage = total || 1;
            }
            const start = ($scope.currentPage - 1) * $scope.pageSize;
            $scope.pagedProducts = $scope.filteredProducts.slice(start, start + $scope.pageSize);
        }

        function getTotalPages() {
            if (!$scope.filteredProducts.length || !$scope.pageSize) return 1;
            return Math.max(1, Math.ceil($scope.filteredProducts.length / $scope.pageSize));
        }

        function normalizeFilterValue(value) {
            if (value === undefined || value === null || value === "") {
                return null;
            }
            if (typeof value === "object") {
                if (value.id != null) {
                    const objId = Number(value.id);
                    return isNaN(objId) ? null : objId;
                }
                return null;
            }
            const parsed = Number(value);
            return isNaN(parsed) ? null : parsed;
        }

        function getSelectedCategoryId() {
            const source = $scope.filters.category || $scope.filterCategoryId;
            return normalizeFilterValue(source);
        }

        function getSelectedBrandId() {
            const source = $scope.filters.brand || $scope.filterBrandId;
            return normalizeFilterValue(source);
        }
    });
})();
