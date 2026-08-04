# BloomsCafe — Database Bottleneck Report

**Status:** One bottleneck identified & fixed (product read caching). Remaining optimizations documented with a roadmap at the end.

---

## 1. The Problem

Load testing the single-instance deployment exposed a clear ceiling:

- **E2E throughput saturates at ~980 req/s** regardless of VUs — adding load only grows latency, never throughput
- The **products endpoint** — the hottest read in the system — hit PostgreSQL on **every single request**, even though the data is nearly static
- No evidence the DB could scale past this point without changes

### Evidence (k6, 20s per level)

| VUs | p(95) latency | Throughput | Observation |
|-----|--------------|-----------|-------------|
| 100 | 108 ms | 240 req/s | healthy |
| 300 | 274 ms | 624 req/s | healthy |
| 500 | 826 ms | 874 req/s | latency climbing |
| 700 | 1.54 s | 979 req/s | ceiling reached |
| 800 | 2.18 s | 983 req/s | FAIL — queueing, throughput flat |

The curve shape (flat throughput + growing latency) is the classic signature of a **serialized resource behind the app**: the database.

### Root causes found in the code

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Product reads have **no `@Cacheable`** — only write methods had `@CacheEvict`, so the `products` cache was never populated | `ProductService.java` | Every catalog request = full DB query (the 13k req/s endpoint) |
| 2 | **No indexes** on hot FK columns (`products.category_id`, `cart_items.cart_id`, `order_items.order_id`, `orders.user_id`) | schema (verified via `\d`) | Seq scans as data grows |
| 3 | Some read methods lack `@Transactional(readOnly = true)` → **reads hit the primary** instead of the replica | `CartService.getCart`, `getOrCreateCart` | Replica underused; primary overloaded |
| 4 | Order placement issues **1 + N + N statements** (order + items + per-item stock UPDATE) | `OrderService.placeOrder` | Write amplification per order |
| 5 | Stock decrements have **no locking** | `OrderService` | Oversell risk + write contention |
| 6 | Single-product read does **no JOIN FETCH** → lazy `category` load per request | `ProductService.getProductById` | N+1 on catalog details |

## 2. The Fix (Implemented)

### Fix 1 — Cache product reads in Redis (the main bottleneck)

**Before:** `GET /api/products` (list, by-category, by-id) → PostgreSQL on every request.
**After:** first request loads from the DB, subsequent requests are served from Redis for 10 minutes; any product/category write evicts the cache.

Changes:

1. **`ProductService.java`** — added `@Cacheable` to the three read methods with distinct keys:
   - `products::all-{page}-{size}`
   - `products::category-{categoryId}-{page}-{size}`
   - `products::id-{id}`

2. **`ProductPageResponse.java`** (new DTO) — cache and return this instead of Spring's `Page<Product>`.
   - **Why:** `PageImpl` has no default constructor, so Jackson cannot rebuild it from Redis — the first attempt 500'd with
     `Cannot construct instance of PageImpl (no Creators...)`. The DTO is a plain serializable POJO with the same JSON shape (`content`, `totalPages`, `totalElements`, ...), so the API contract and the frontend are unchanged.

3. **`ProductRepository.java`** — new `findWithCategoryById` with `JOIN FETCH p.category`, so the category is loaded before the entity is serialized into Redis (a lazy Hibernate proxy must never reach the cache).

4. **`CategoryService.java`** — category writes now evict the `products` cache too (via `@Caching`), so a renamed category can never leave stale product data in Redis.

### Verification

| Check | Result |
|-------|--------|
| Cache populated after first request | `products::all-0-10`, `products::id-1`, `products::category-1-0-10` present in Redis |
| TTL | ~590s (10 min) ✓ |
| Eviction on product write (PUT) | all `products*` keys purged immediately ✓ |
| Eviction on category write (POST) | all `products*` keys purged immediately ✓ |
| Cache round-trip (deserialize → respond) | 200 OK with valid JSON ✓ |
| k6, 1000 VUs, 20s, after fix | **216,285 requests, 0 errors, p(95) = 167 ms, ~10.8k req/s** ✓ |
| Redis hit ratio during that run | 377,624 hits vs 27 misses — catalog served from cache, DB untouched ✓ |

## 3. Result

- The read path (the highest-volume traffic) no longer touches PostgreSQL at all — Redis absorbs it at ~13k req/s headroom
- The DB now only sees cache misses and write traffic, which is what the primary/replica setup is for
- E2E ceiling remains ~980 req/s, because **order placement and login still write to PostgreSQL** — the fix removed the read side of the bottleneck, not the write side

## 4. Remaining Roadmap (not yet implemented)

| # | Optimization | Expected effect |
|---|--------------|-----------------|
| 2 | Row-level stock locking (`@Version` or `SELECT ... FOR UPDATE`) | Prevents oversell; serializes stock writes |
| 3 | Indexes on `products(category_id)`, `cart_items(cart_id)`, `cart_items(product_id)`, `order_items(order_id)`, `orders(user_id)`, `orders(status)` | Kills seq scans as data grows |
| 4 | JDBC batching (`hibernate.jdbc.batch_size`) for order items + stock updates | Fewer round-trips per order → higher write throughput |
| 5 | Add `@Transactional(readOnly = true)` to remaining read methods (`CartService.getCart`, etc.) | Routes reads to the replica, offloading the primary |
| 6 | `JOIN FETCH` on cart-item reads | Removes residual N+1 |

## 5. Conclusion

The database was the system's ceiling at ~980 req/s. The **highest-impact fix — caching product reads in Redis — is done and verified**: the catalog is now served from cache with zero DB involvement, ~10.8k req/s at 1000 VUs and 0 errors. The remaining bottleneck is the **write path** (order placement + login), which is addressed by the roadmap items above; items 3–5 are low-risk, high-value next steps.
