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
    $scope.viewOrderDetail = function (id) {
        return $http.get("http://localhost:8000/api/client/order-details/getbyorderid/" + id)
            .then(resp => resp.data)
            .catch(error => {
                console.log("Error", error);
                return [];
            });
    };

    $scope.viewOrderDetail = function (id) {
        return $http.get("http://localhost:8000/api/client/order-details/getbyorderid/" + id)
            .then(resp => {
                console.log("Order Details:", resp.data); // Kiểm tra cấu trúc của dữ liệu
                return resp.data;
            })
            .catch(error => {
                console.log("Error", error);
                return [];
            });
    };

    $scope.exportPDF = function(order) {
        $scope.viewOrderDetail(order.id).then(orderDetails => {
            const { jsPDF } = window.jspdf;

            // Tạo danh sách chi tiết đơn hàng với các thuộc tính từ `product`
            const orderDetailsList = orderDetails.length > 0 ? orderDetails.map(detail => `
                <li>${detail.product.name || 'Tên không xác định'} - Số lượng: ${detail.amount || 0} - Giá: $${detail.product.price || 0}</li>
            `).join('') : '<li>Không có chi tiết đơn hàng</li>';

            // Tạo nội dung HTML cho chi tiết đơn hàng
            const content = `
                <div>
                    <h2>Hóa đơn chi tiết</h2>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Khách hàng:</strong> ${order.account.fullName}</p>
                    <p><strong>Ngày đặt hàng:</strong> ${$scope.extractDateFromCode(order.code)}</p>
                    <p><strong>Tổng tiền:</strong> $${order.amount}</p>
                    <h3>Danh sách chi tiết đơn hàng</h3>
                    <ul>
                        ${orderDetailsList}
                    </ul>
                    <p><strong>Trạng thái:</strong> ${order.status}</p>
                </div>
            `;
            document.getElementById('pdf-content').innerHTML = content;
            document.getElementById('pdf-content').style.display = 'block';

            // Sử dụng html2canvas để chuyển nội dung thành ảnh
            html2canvas(document.getElementById('pdf-content')).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');

                const imgWidth = 190;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

                pdf.save(`hoadon_${order.id}.pdf`);
                document.getElementById('pdf-content').style.display = 'none';
            });
        });
    };

    $scope.viewOrderDetail = function (id) {
        return $http.get("http://localhost:8000/api/client/order-details/getbyorderid/" + id)
            .then(resp => {
                console.log("Order Details:", resp.data); // Kiểm tra cấu trúc của dữ liệu
                return resp.data;
            })
            .catch(error => {
                console.log("Error", error);
                return [];
            });
    };
    
    
    
});