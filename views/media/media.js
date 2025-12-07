app.controller("media", function ($scope, $http) {
    const API_BASE = "http://localhost:8000/api";

    $scope.images = [];
    $scope.searchTerm = "";
    $scope.searchKeyword = "";
    $scope.searchFilters = {
        keyword: ""
    };
    $scope.isLoading = false;
    $scope.isUploading = false;
    $scope.selectedKeys = {};
    $scope.isBulkDeleting = false;
    $scope.selectionMode = false;

    $scope.loadImages = function () {
        $scope.isLoading = true;
        $http.get(`${API_BASE}/s3/files`)
            .then(resp => {
                $scope.images = resp.data || [];
            })
            .catch(error => {
                console.error("Không thể tải danh sách ảnh", error);
            })
            .finally(() => {
                $scope.isLoading = false;
            });
    };

    $scope.handleFileChange = function (files) {
        if (!files || !files.length) {
            return;
        }
        $scope.$applyAsync(() => {
            $scope.uploadImages(files);
            document.getElementById("mediaUploadInput").value = "";
        });
    };

    $scope.uploadImages = function (files) {
        const isMultiple = files.length > 1;
        const endpoint = isMultiple ? "/s3/upload-multiple" : "/s3/upload";
        const formData = new FormData();

        angular.forEach(files, file => {
            const key = isMultiple ? "files" : "file";
            formData.append(key, file);
        });

        $scope.isUploading = true;
        $http.post(`${API_BASE}${endpoint}`, formData, {
            transformRequest: angular.identity,
            headers: { "Content-Type": undefined },
        }).then(resp => {
            const uploaded = resp.data;
            if (!uploaded) {
                throw new Error("Không nhận được dữ liệu từ S3.");
            }
            return $scope.saveImagesMetadata(uploaded);
        }).then(() => {
            $scope.loadImages();
        }).catch(error => {
            console.error("Lỗi khi tải ảnh", error);
            alert("Có lỗi khi tải ảnh. Vui lòng thử lại.");
        }).finally(() => {
            $scope.isUploading = false;
        });
    };

    $scope.saveImagesMetadata = function (uploaded) {
        const files = Array.isArray(uploaded) ? uploaded : [uploaded];
        const payload = files.map(img => ({
            name: img.name,
            key: img.key,
            url: img.url,
            size: img.size,
        }));

        if (payload.length === 1) {
            return $http.post(`${API_BASE}/images/save`, payload[0]);
        }
        return $http.post(`${API_BASE}/images/save-multiple`, payload);
    };

    $scope.deleteImage = function (image, options) {
        options = options || {};
        if (!image) return Promise.resolve();
        if (!options.skipConfirm) {
            const confirmed = window.confirm("Xoá ảnh này khỏi S3 và hệ thống?");
            if (!confirmed) return Promise.resolve();
        }

        const deleteMetadataIfExists = () => {
            if (image.id) {
                return $http.delete(`${API_BASE}/images/${image.id}`, {
                    responseType: "text",
                    transformResponse: angular.identity,
                });
            }
            return $scope.findImageByKey(image.key).then(foundId => {
                if (foundId) {
                    return $http.delete(`${API_BASE}/images/${foundId}`, {
                        responseType: "text",
                        transformResponse: angular.identity,
                    });
                }
            });
        };

        return $http.delete(`${API_BASE}/s3/delete`, {
            params: { key: image.key },
            responseType: "text",
            transformResponse: angular.identity,
        })
            .then(deleteMetadataIfExists)
            .then(() => {
                if (!options.silent) {
                    alert("Đã xoá ảnh.");
                }
                $scope.images = $scope.images.filter(img => img.key !== image.key);
            })
            .catch(error => {
                console.error("Không thể xoá ảnh", error);
                if (!options.silent) {
                    alert("Không thể xoá ảnh. Vui lòng thử lại.");
                }
                return Promise.reject(error);
            });
    };

    $scope.findImageByKey = function (key) {
        return $http.get(`${API_BASE}/images`).then(resp => {
            const match = (resp.data || []).find(item => item.key === key);
            return match ? match.id : null;
        });
    };

    $scope.isSelected = function (image) {
        return !!$scope.selectedKeys[image.key];
    };

    $scope.toggleSelect = function (image) {
        if (!image) return;
        if ($scope.isSelected(image)) {
            delete $scope.selectedKeys[image.key];
        } else {
            $scope.selectedKeys[image.key] = true;
        }
    };

    $scope.clearSelection = function () {
        $scope.selectedKeys = {};
    };

    $scope.getSelectedCount = function () {
        return Object.keys($scope.selectedKeys).length;
    };

    $scope.getVisibleImages = function () {
        return $scope.images.filter($scope.searchImages);
    };

    $scope.selectAllVisible = function () {
        $scope.getVisibleImages().forEach(img => {
            $scope.selectedKeys[img.key] = true;
        });
    };

    $scope.toggleSelectionMode = function () {
        $scope.selectionMode = !$scope.selectionMode;
        if (!$scope.selectionMode) {
            $scope.clearSelection();
        }
    };

    $scope.deleteSelected = function () {
        const selected = $scope.images.filter(img => $scope.isSelected(img));
        if (!selected.length) {
            return;
        }
        if (!window.confirm(`Xoá ${selected.length} ảnh đã chọn?`)) {
            return;
        }
        $scope.isBulkDeleting = true;
        selected.reduce((promise, img) => {
            return promise.then(() => $scope.deleteImage(img, { skipConfirm: true, silent: true }));
        }, Promise.resolve())
            .then(() => {
                alert("Đã xoá các ảnh đã chọn.");
                $scope.clearSelection();
                $scope.loadImages();
            })
            .catch(() => {
                alert("Có lỗi khi xoá một số ảnh đã chọn.");
                $scope.loadImages();
            })
            .finally(() => {
                $scope.isBulkDeleting = false;
            });
    };

    $scope.copyUrl = function (url) {
        if (!url) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                alert("Đã sao chép URL!");
            }).catch(() => {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
    };

    function fallbackCopy(text) {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            alert("Đã sao chép URL!");
        } catch (err) {
            alert("Không thể sao chép URL.");
        }
        document.body.removeChild(temp);
    }

    $scope.formatSize = function (size) {
        if (!size && size !== 0) return "N/A";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    $scope.applySearch = function () {
        const keyword = ($scope.searchFilters.keyword != null
            ? $scope.searchFilters.keyword
            : $scope.searchKeyword || "").toString();
        const trimmed = keyword.trim().toLowerCase();
        $scope.searchTerm = trimmed;
    };

    $scope.searchImages = function (item) {
        if (!$scope.searchTerm) return true;
        const keyword = $scope.searchTerm;
        return (item.name && item.name.toLowerCase().includes(keyword)) ||
            (item.key && item.key.toLowerCase().includes(keyword));
    };

    $scope.loadImages();
});
