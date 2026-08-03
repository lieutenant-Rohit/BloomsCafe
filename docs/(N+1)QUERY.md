# N+1 Query Problem — Fixes Summary

## What is N+1?

When Hibernate loads an entity with a LAZY association, it fires **1 query to get the parent entities** and then **N additional queries** to resolve the association for each parent. This results in poor performance as N grows.

---

## All Locations Found & Fixed

### 1. CartItemRepository — `findByCartId()` and `findByCartIdAndProductId()`

**Problem:**
```java
List<CartItem> items = cartItemRepository.findByCartId(cartId);
// For each item, cartItem.getProduct() fires N queries
// For each product, product.getCategory() fires N more queries
// Total: 1 + N + N queries
```

**Fix:** `JOIN FETCH ci.product p JOIN FETCH p.category`

**Result:** 3 cart items → **7 queries → 1 query**

---

### 2. ProductRepository — `findAll(Pageable)` and `findByCategoryId()`

**Problem:**
```java
Page<Product> products = productRepository.findByCategoryId(categoryId, pageable);
// For each product in the page, product.getCategory() fires N queries
// Total: 1 + N queries
```

**Fix:** `JOIN FETCH p.category` with separate `countQuery`

**Result:** 10 products per page → **11 queries → 1 query**

---

### 3. OrderRepository — `findAll()` and `findByUserId()`

**Problem (Triple N+1):**
```java
List<Order> orders = orderRepository.findAll();
// For each order:
//   order.getUser()           → N queries
//   order.getOrderItems()     → N queries
//   For each item:
//     orderItem.getProduct()  → M queries
// Total: 1 + N + N + M queries
```

**Fix:** `SELECT DISTINCT o FROM Order o JOIN FETCH o.user JOIN FETCH o.orderItems oi JOIN FETCH oi.product`

**Result:** 5 orders × 3 items → **26 queries → 1 query**

---

### 4. OrderService — `placeOrder()` loop query

**Problem:**
```java
for (OrderItemRequest item : request.getOrderItems()) {
    Product product = productRepository.findById(item.getProductId());
    // N separate round-trips inside a loop
}
```

**Fix:** Batch fetch once using `findAllById()` + `Map<ProductId, Product>`

```java
Set<Long> productIds = request.getOrderItems().stream()
    .map(OrderItemRequest::getProductId)
    .collect(Collectors.toSet());
Map<Long, Product> productMap = productRepository.findAllById(productIds)
    .stream().collect(Collectors.toMap(Product::getId, p -> p));
```

**Result:** 8 items → **9 queries → 2 queries**

---

## Pattern Used: `JOIN FETCH`

```sql
SELECT parent.*, child.*
FROM parent_table parent
JOIN child_table child ON child.parent_id = parent.id
```

### Rules of thumb:
- **Singular associations** (`@ManyToOne`, `@OneToOne`) → always use `JOIN FETCH` in read queries
- **Collection associations** (`@OneToMany`, `@ManyToMany`) → use `JOIN FETCH` when:
  - Query returns `List` (not `Page`) → safe with `DISTINCT`
  - Query returns `Page` → use `@BatchSize` or separate query instead
- Always provide a `countQuery` when using `JOIN FETCH` with pagination

## Affected Files (4 repositories + 1 service)

| File | Lines Changed |
|---|---|
| `CartItemRepository.java` | Added `@Query` with `JOIN FETCH` on both methods |
| `ProductRepository.java` | Overrode `findAll()` and `findByCategoryId()` with `JOIN FETCH` + `countQuery` |
| `OrderRepository.java` | Overrode `findAll()` and `findByUserId()` with `JOIN FETCH` + `DISTINCT` |
| `OrderService.java` | Replaced for-loop `findById()` with batch `findAllById()` + Map |
