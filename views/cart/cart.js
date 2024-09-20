app.controller("cart", function ($scope, $http, $location, $filter) {
    $scope.carts = [
        {
          "id": 1,
          "code": "CART001",
          "product": {
            "id": 101,
            "name": "Product 1",
            "price": 100,
            "description": "Sample product 1",
            "urlimage": "https://cdn-images.farfetch-contents.com/off-white-black-outline-arrow-skate-s-s-tee_23348172_54637995_2048.jpg?c=3"
          },
          "account": {
            "id": 201,
            "username": "user1",
            "email": "user1@example.com"
          },
          "amount": 2
        },
        {
          "id": 2,
          "code": "CART002",
          "product": {
            "id": 102,
            "name": "Product 2",
            "price": 150,
            "description": "Sample product 2",
            "urlimage": "https://cdn-images.farfetch-contents.com/off-white-black-outline-arrow-skate-s-s-tee_23348172_54637995_2048.jpg?c=3"
          },
          "account": {
            "id": 202,
            "username": "user2",
            "email": "user2@example.com"
          },
          "amount": 1
        },
        {
          "id": 3,
          "code": "CART003",
          "product": {
            "id": 103,
            "name": "Product 3",
            "price": 200,
            "description": "Sample product 3",
            "urlimage": "https://cdn-images.farfetch-contents.com/off-white-black-outline-arrow-skate-s-s-tee_23348172_54637995_2048.jpg?c=3"
          },
          "account": {
            "id": 203,
            "username": "user3",
            "email": "user3@example.com"
          },
          "amount": 5
        }
      ]
      
    $scope.initialize = function () {
      

      
    }

  
    

    $scope.initialize();
});