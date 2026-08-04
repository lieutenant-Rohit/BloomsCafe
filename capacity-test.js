import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginLatency = new Trend('login_duration');
const productQueryLatency = new Trend('product_query_duration');
const orderPlaceLatency = new Trend('order_place_duration');

const BASE_URL = 'http://localhost:8080';

function randomProductId() {
  return Math.floor(Math.random() * 20) + 1;
}

function login(email, password) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'login success': (r) => r.status === 200 });
  loginLatency.add(res.timings.duration);
  return res.json().token;
}

export const options = {
  vus: __ENV.VUS ? Number(__ENV.VUS) : 100,
  duration: __ENV.DUR || '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.1'],
  },
};

let vuToken = null;

export default function (data) {
  if (!vuToken) {
    vuToken = login(`customer${__VU}@example.com`, 'customer123');
  }

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vuToken}`,
    },
  };

  group('Browse Products', function () {
    const res = http.get(`${BASE_URL}/api/products?page=0&size=10`);
    check(res, {
      'products status 200': (r) => r.status === 200,
      'products has content': (r) => r.json('content').length > 0,
    });
    productQueryLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);
  });

  group('Browse Categories', function () {
    const res = http.get(`${BASE_URL}/api/categories?page=0&size=10`);
    check(res, { 'categories status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('Get Single Product', function () {
    const res = http.get(`${BASE_URL}/api/products/${randomProductId()}`);
    check(res, { 'single product status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('Cart Operations', function () {
    const addRes = http.post(`${BASE_URL}/api/cart/items`,
      JSON.stringify({ productId: randomProductId(), quantity: 1 }),
      authHeaders
    );
    check(addRes, { 'add to cart 200': (r) => r.status === 200 });
    errorRate.add(addRes.status !== 200);

    const viewRes = http.get(`${BASE_URL}/api/cart`, authHeaders);
    check(viewRes, { 'view cart 200': (r) => r.status === 200 });
    errorRate.add(viewRes.status !== 200);
  });

  group('Place Order', function () {
    const res = http.post(`${BASE_URL}/api/orders`, null, authHeaders);
    check(res, { 'place order 200': (r) => r.status === 200 });
    orderPlaceLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);
  });

  group('View Orders', function () {
    const res = http.get(`${BASE_URL}/api/orders/my-orders`, authHeaders);
    check(res, { 'my orders 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(Math.random() * 3 + 1);
}
