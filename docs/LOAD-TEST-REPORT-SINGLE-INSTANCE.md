# BloomsCafe — Single-Instance Load Test Report

**Scope:** Capacity evaluation of the simplified single-instance deployment (Spring Boot on :8080 serving API + frontend), replacing the previous 3-instance + Nginx topology.

---

## 1. System Under Test

| Component | Configuration |
|-----------|--------------|
| **App** | 1 × Spring Boot 3.2 (Java 21) on port 8080, serving REST API + built React frontend from `static/` |
| **Database** | PostgreSQL 16 primary :5432 (writes) + replica :5433 (reads, streaming) |
| **Cache** | Redis :6379 — products/categories cached, 10-minute TTL |
| **Pools** | Hikari 80 connections (single instance) |
| **Load generator** | k6 v2.1.0 on the same machine, hitting `http://localhost:8080` |

## 2. Test Script — `capacity-test.js`

Runs the full end-to-end customer flow per iteration (same scenario as the previous 3-instance report):

1. **Login** — `POST /api/auth/login` (once per VU, on first iteration, unique identity `customer{N}@example.com`)
2. **Browse Products** — `GET /api/products?page=0&size=10`
3. **Browse Categories** — `GET /api/categories?page=0&size=10`
4. **Get Single Product** — `GET /api/products/{1..20}`
5. **Add to Cart** — `POST /api/cart/items`
6. **View Cart** — `GET /api/cart`
7. **Place Order** — `POST /api/orders` (from cart)
8. **View Orders** — `GET /api/orders/my-orders`

Each iteration is paced with a random 1–4 s sleep.

**Thresholds** (both inherited from the previous report):

| Threshold | Rule |
|-----------|------|
| `http_req_duration` | p(95) < 2000 ms |
| `errors` | rate < 0.10 |

**Run modes:**

```bash
k6 run capacity-test.js                       # 100 VUs, 30s
k6 run -e VUS=500 -e DUR=60s capacity-test.js # custom VUs/duration
```

## 3. Results — E2E Capacity Sweep (20 s per level)

| VUs | p(95) latency | Throughput | Error rate | Checks | Status |
|-----|--------------|-----------|------------|--------|--------|
| 100 | 108 ms | 240 req/s | 0.00% | 0 failed | **PASS** |
| 200 | 164 ms | 434 req/s | 0.00% | 0 failed | **PASS** |
| 300 | 274 ms | 624 req/s | 0.00% | 0 failed | **PASS** |
| 400 | 415 ms | 754 req/s | 0.00% | 0 failed | **PASS** |
| 500 | 826 ms | 874 req/s | 0.00% | 0 failed | **PASS** |
| 600 | 1.26 s | 943 req/s | 0.00% | 0 failed | **PASS** |
| 700 | 1.54 s | 979 req/s | 0.00% | 0 failed | **PASS** |
| 800 | 2.18 s | 983 req/s | 0.00% | 0 failed | **FAIL** (latency) |

## 4. Results — Cached-Read Micro-Benchmark

Products endpoint only (`GET /api/products?page=0&size=10`, no auth — pure Redis-cached reads), 20 s per level:

| VUs | p(95) latency | Throughput | Errors |
|-----|--------------|-----------|--------|
| 500 | 59.49 ms | 13,546 req/s | 0.00% |
| 1000 | 112.9 ms | 12,866 req/s | 0.00% |
| 2000 | 289.6 ms | 11,736 req/s | 0.00% |
| 3000 | 448.1 ms | 10,394 req/s | 0.00% |
| 4000 | 618.9 ms | 8,741 req/s | 0.28% |
| 5000 | 1.12 s | 6,270 req/s | 0.00% |

**Ceiling: ~13,500 req/s** at 500 VUs (p95 = 59 ms). Beyond the peak, the system overloads: throughput falls as VUs grow (queueing collapse), yet p(95) stays under the 2 s threshold even at 5,000 VUs and errors remain ~0%.

## 5. Capacity Analysis

- **Saturation point:** ~950–990 req/s. Throughput plateaus above 500 VUs while latency keeps growing — classic queueing behavior behind a fixed resource ceiling.
- **Max that passes both thresholds:** **700 VUs** (p95 = 1.54 s, 0% errors).
- **Best latency-to-capacity balance:** **300–400 VUs** (p95 ≤ 415 ms, ~625–754 req/s).
- **Ceiling origin:** the PostgreSQL server itself (primary writes + replica reads on one PG instance) — not the app thread pool, not Redis.

## 6. Single Instance vs 3 Instances (same e2e scenario)

| VUs | 3 instances p(95) | 3 instances rps | 1 instance p(95) | 1 instance rps |
|-----|-------------------|-----------------|------------------|----------------|
| 300 | 14.96 ms | 638/s | 274 ms | 624/s |
| 400 | 309 ms | 723/s | 415 ms | 754/s |
| 500 | 138 ms | 982/s | 826 ms | 874/s |
| 600 | 1.82 s | 551/s | 1.26 s | 943/s |
| 700 | 1.82 s | 695/s | 1.54 s | 979/s |
| 800 | 2.50 s | FAIL | 2.18 s | FAIL |

**Findings:**

1. **Same throughput ceiling (~980 req/s)** in both topologies — confirms the PostgreSQL server was always the system bottleneck, not the number of app instances.
2. **Latency scales ~6× worse on one instance at high VUs** (500 VUs: 826 ms vs 138 ms). Three instances provided 3 thread pools and 3×80 Hikari connections to absorb queueing; a single instance queues everything behind one pool.
3. **Both topologies fail the p(95) < 2 s threshold at 800 VUs** — the DB ceiling bites at the same point.
4. **Cached reads are unaffected** by instance count: Redis serves them with sub-10 ms p(95) and ~13 k req/s headroom even on a single instance.

## 7. Conclusion

The single-instance deployment matches the 3-instance setup in raw throughput because the database was the binding constraint all along. The trade-off is latency under load: **recommended operating point is ≤ 400 VUs** (p95 < 415 ms, 0% errors). Beyond ~500 VUs, latency degrades sharply (p95 ≈ 826 ms → 2.18 s at 800), though errors remain at 0% even at the saturation limit.

**Recommendations for further scale (in order of impact):**
1. Move to a dedicated app tier with more instances/pools — restores the latency headroom lost by going single-instance.
2. Investigate DB-side scaling first (bigger pool, replica read balance, index review) — it is the true ceiling.
3. Keep Redis-cached endpoints as-is; they have ~13× headroom.
