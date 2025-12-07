app.service("cartService", function ($http, authService, $q) {
  const CART_API = "http://localhost:8000/api/client/carts";
  const ACCOUNT_API = "http://localhost:8000/api/client/accounts";
  const ORDER_API = "http://localhost:8000/api/client/orders";
  const ORDER_DETAIL_API = "http://localhost:8000/api/client/order-details";

  function buildCartPayload(account, product, amount) {
    return {
      account: account,
      product: product,
      amount: amount || 1,
    };
  }

  this.ensureAccount = function () {
    const username = authService.getUsername();
    if (!username) {
      return $q.reject({ code: "NOT_AUTH" });
    }
    return $http.get(`${ACCOUNT_API}/${username}`).then((resp) => resp.data);
  };

  this.fetchCartByAccount = function (accountId) {
    if (!accountId) {
      return $q.resolve([]);
    }
    return $http
      .get(`${CART_API}/getbyaccount/${accountId}`)
      .then((resp) => resp.data || []);
  };

  this.loadAccountWithCart = function () {
    return this.ensureAccount().then((account) => {
      return this.fetchCartByAccount(account.id).then((items) => ({
        account,
        items,
      }));
    });
  };

  this.addItem = function (account, product, amount) {
    return $http.post(
      CART_API,
      buildCartPayload(account, product, amount || 1)
    );
  };

  this.deleteItem = function (cartId) {
    return $http.delete(`${CART_API}/${cartId}`);
  };

  this.deleteByAccount = function (accountId) {
    return $http.delete(`${CART_API}/byaccountid/${accountId}`);
  };

  this.computeTotal = function (items) {
    return (items || []).reduce((sum, cart) => {
      const price = cart?.product?.price || 0;
      const amount = cart?.amount || 0;
      return sum + price * amount;
    }, 0);
  };

  this.generateOrderCode = function (username) {
    const id = username || "guest";
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${randomPart}${timestamp}_${id}`;
  };

  this.createOrder = function (orderPayload) {
    return $http.post(ORDER_API, orderPayload);
  };

  this.createOrderDetails = function (orderId, cartItems) {
    const requests = (cartItems || []).map((cart) => {
      const detail = {
        order: { id: orderId },
        product: { id: cart?.product?.id },
        amount: cart?.amount || 0,
      };
      return $http.post(ORDER_DETAIL_API, detail);
    });
    return $q.all(requests);
  };
});
