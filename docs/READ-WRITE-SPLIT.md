# Read/Write Database Splitting — Implementation Guide

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  Application                      │
│                                                    │
│  @Transactional(readOnly = true)                   │
│  └─ ProductService.getAllProducts()                │
│  └─ CategoryService.getCategories()               │
│  └─ OrderService.getUserOrders()                   │
│                          │                         │
│  @Transactional                                    │
│  └─ CartService.addToCart()                       │
│  └─ OrderService.placeOrder()                     │
│  └─ AuthService.login()                           │
│                          │                         │
└──────────────────────────┼─────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  AbstractRoutingDS     │
              │                        │
              │  determineCurrent-     │
              │  LookupKey():          │
              │    readOnly?           │
              │    ┌── true  → REPLICA │
              │    └── false → PRIMARY │
              └────────┬───────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
    ┌─────────────────┐  ┌─────────────────┐
    │   PRIMARY       │  │   REPLICA       │
    │   localhost:5432 │  │  localhost:5433 │
    │   HikariPool=80  │  │  HikariPool=80  │
    │   Writes         │  │  Reads only     │
    └─────────────────┘  └─────────────────┘
```

## The Problem

A single PostgreSQL instance handling all traffic creates a bottleneck:

- Read queries (product listings, category browsing) compete with write queries (order placement, auth) for the same connection pool and CPU
- Under load test, the database becomes the choke point — connection pool exhaustion leads to cascading failures
- Reads typically outnumber writes 3:1 in an e-commerce flow, wasting write capacity on read traffic

## The Solution: `AbstractRoutingDataSource`

Spring provides `AbstractRoutingDataSource` — a DataSource implementation that routes to one of multiple target DataSources based on a lookup key. We subclass it and check Spring's `TransactionSynchronizationManager` to determine the current transaction mode.

### Step 1: Configure Two DataSources

In `application.properties`, define separate connection pools pointing to two PostgreSQL instances:

```properties
# Primary — handles all writes
primary.datasource.jdbc-url=jdbc:postgresql://localhost:5432/bakery_db
primary.datasource.username=root1
primary.datasource.hikari.maximum-pool-size=80

# Replica — handles all read-only queries
replica.datasource.jdbc-url=jdbc:postgresql://localhost:5433/bakery_db
replica.datasource.username=root1
replica.datasource.hikari.maximum-pool-size=80
```

Both point to the same `bakery_db` database, but on different PostgreSQL instances (different ports, could be different hosts in production). Each has its own HikariCP pool of 80 connections, giving **160 connections per app instance** total.

### Step 2: Create DataSource Beans

```java
@Bean
@ConfigurationProperties(prefix = "primary.datasource")
public DataSource primaryDataSource() {
    return DataSourceBuilder.create().build();
}

@Bean
@ConfigurationProperties(prefix = "replica.datasource")
public DataSource replicaDataSource() {
    return DataSourceBuilder.create().build();
}
```

Spring Boot's `DataSourceBuilder` automatically picks up the `jdbc-url`, `username`, `password`, `driver-class-name`, and HikariCP settings from the configuration properties.

### Step 3: Build the Routing DataSource

```java
@Bean
@Primary
public DataSource routingDataSource(DataSource primaryDataSource, DataSource replicaDataSource) {
    Map<Object, Object> targets = new HashMap<>();
    targets.put("PRIMARY", primaryDataSource);
    targets.put("REPLICA", replicaDataSource);

    AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
        @Override
        protected Object determineCurrentLookupKey() {
            return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                    ? "REPLICA" : "PRIMARY";
        }
    };
    routing.setDefaultTargetDataSource(primaryDataSource);
    routing.setTargetDataSources(targets);
    routing.afterPropertiesSet();

    return new LazyConnectionDataSourceProxy(routing);
}
```

**Key points:**

- `@Primary` — marks this as the DataSource to inject everywhere (replaces Spring Boot's auto-configured single DataSource)
- `determineCurrentLookupKey()` — the core routing logic. At runtime, it inspects `TransactionSynchronizationManager.isCurrentTransactionReadOnly()`, which returns `true` when inside a `@Transactional(readOnly = true)` context
- `routing.setDefaultTargetDataSource(primaryDataSource)` — any unmapped key or non-transactional access falls back to the primary
- `LazyConnectionDataSourceProxy` — critical wrapping. Without it, Hibernate opens a connection eagerly at transaction start (before the `readOnly` flag is available) to inspect metadata. The proxy defers connection acquisition until the first SQL statement executes, by which time `TransactionSynchronizationManager` correctly reflects the `readOnly` state

### Step 4: Annotate Service Methods

The `readOnly` flag on `@Transactional` is what triggers the routing:

```java
@Service
public class ProductService {

    @Transactional(readOnly = true)  // → routes to REPLICA
    public Page<Product> getAllProducts(Pageable pageable) { ... }

    @Transactional(readOnly = true)  // → routes to REPLICA
    public Product getProductById(Long id) { ... }

    // No readOnly → routes to PRIMARY (default)
    @Transactional
    public Product createProduct(Product product) { ... }
}
```

### Complete Routing Table

| Annotation | Lookup Key | Target | Port | Use Case |
|------------|-----------|--------|------|----------|
| `@Transactional(readOnly = true)` | `REPLICA` | `replicaDataSource` | 5433 | Product queries, category browsing, viewing orders |
| `@Transactional` (default) | `PRIMARY` | `primaryDataSource` | 5432 | Login, register, add to cart, place order, create/update/delete |
| No transaction | `PRIMARY` | `primaryDataSource` | 5432 | Fallback for non-transactional access |

## Why `LazyConnectionDataSourceProxy` Matters

Without the lazy proxy, Hibernate's startup behavior breaks the routing:

1. Hibernate begins a `@Transactional(readOnly = true)` method
2. Before `determineCurrentLookupKey()` is called, Hibernate opens a connection to check dialect, sequence, etc.
3. That connection is acquired from the *primary* datasource (the default)
4. The connection gets bound to the transaction
5. `determineCurrentLookupKey()` now returns `REPLICA`, but a connection is already acquired from PRIMARY
6. **The read goes to the primary anyway**

`LazyConnectionDataSourceProxy` defers the first `getConnection()` call until the first actual JDBC statement is executed. By that time, `TransactionSynchronizationManager.isCurrentTransactionReadOnly()` correctly returns `true`, and the connection comes from the replica.

## Impact on Load Testing

Without read/write split:
- 1 pool of 10 connections for everything
- Reads and writes compete for the same 10 connections
- At 50 VUs, connection pool saturates immediately

With read/write split:
- 80 connections for reads + 80 connections for writes = 160 per instance
- 3 instances × 160 = 480 total database connections available
- Product browsing (75% of traffic) goes to the replica, leaving the primary free for auth and order writes
- This was a key enabler for reaching 195 VUs with 0% errors (vs failing at 50 VUs)

## Production Considerations

- **Replication lag**: The replica may lag behind the primary by milliseconds. `readOnly = true` methods might see stale data. This is acceptable for product listings but not for "view my order after placing it" scenarios
- **Read-your-writes consistency**: After placing an order, the order confirmation query should route to PRIMARY to guarantee the write is visible. This can be handled by using `@Transactional(readOnly = true)` strategically or by routing specific methods to PRIMARY regardless of the `readOnly` flag
- **Connection pool sizing**: 80 per datasource was tuned empirically — too low causes queuing, too high causes PostgreSQL context switching overhead
- **PgBouncer alternative**: For higher scale, PgBouncer in transaction mode can sit between the app and PostgreSQL to absorb connection bursts beyond what HikariCP pools provide
