````# BloomsCafe — Complete Project Report

> A full-stack cafe e-commerce platform (bakery) with production-grade backend architecture.
> Prepared for interview explanation and LLM consumption.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Backend Layer-by-Layer](#4-backend-layer-by-layer)
   - 4.1 Entry Point
   - 4.2 Entities (Domain Model)
   - 4.3 Repositories (Data Access)
   - 4.4 Services (Business Logic)
   - 4.5 Controllers (API Layer)
   - 4.6 DTOs (Data Transfer Objects)
   - 4.7 Security (JWT + Spring Security)
   - 4.8 Configuration
   - 4.9 Exception Handling
   - 4.10 Data Seeder
5. [Frontend Overview](#5-frontend-overview)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Key Design Decisions & Trade-offs](#7-key-design-decisions--trade-offs)
8. [N+1 Query Problem & Fix](#8-n1-query-problem--fix)
9. [Complete API Reference](#9-complete-api-reference)
10. [Interview Q&A — Top Questions & How to Answer](#10-interview-qa--top-questions--how-to-answer)
11. [How to Present the Project in an Interview](#11-how-to-present-the-project-in-an-interview)
12. [Potential Improvements](#12-potential-improvements)

---

## 1. Project Overview

BloomsCafe is a **two-sided e-commerce platform** for a bakery/cafe:

- **Customer side**: Browse menu, manage a cart, place orders, track order status
- **Admin side**: CRUD products/categories/users, manage orders, view dashboard

The project demonstrates real-world production patterns:
- Horizontal scaling (3 app instances behind Nginx)
- Read/write database splitting
- Distributed caching (Redis)
- Stateless JWT authentication
- N+1 query prevention
- Monitoring (Actuator + Prometheus)

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend Language** | Java | 21 |
| **Framework** | Spring Boot | 3.2.4 |
| **ORM** | Spring Data JPA / Hibernate | — |
| **Database** | PostgreSQL | Primary (5432) + Replica (5433) |
| **Cache** | Redis | 6379 |
| **Auth** | JWT (jjwt) | 0.11.5 |
| **Build** | Maven | — |
| **Frontend** | React + TypeScript + Tailwind CSS 3 + Vite 5 | — |
| **State Management** | Zustand | — |
| **HTTP Client** | Axios | — |
| **Proxy/LB** | Nginx | — |
| **Monitoring** | Spring Actuator + Micrometer Prometheus | — |
| **Lombok** | Boilerplate reduction | — |

---

## 3. System Architecture

### 3.1 High-Level Diagram

```
Browser (React SPA)
     │
     ▼
Nginx (:8080)  ───  static files directly, /api/* → round-robin
     │
     ├── App Instance 1 (:8081)
     ├── App Instance 2 (:8082)
     └── App Instance 3 (:8083)
           │
           ├── Redis Cache (shared, 10min TTL)
           │
           └── AbstractRoutingDataSource
                    │
                    ├── PostgreSQL Primary (:5432) — writes
                    └── PostgreSQL Replica (:5433) — reads
```

### 3.2 Request Flow (End-to-End)

```
1. Browser → Nginx (:8080)
2. Nginx → App Instance (:8081 via round-robin)
3. JwtAuthenticationFilter (extracts Bearer token, validates, sets SecurityContext)
4. Controller (parses HTTP, delegates)
5. Service (@Transactional, business logic, cache coordination)
6. RoutingDataSource (readOnly? → Replica : Primary)
7. Repository (JPQL with JOIN FETCH)
8. Response ← JSON ← 200 OK
```

### 3.3 Package Structure

```
src/main/java/com/bloomscafe/
├── BloomsCafeApplication.java     # @SpringBootApplication + @EnableCaching
├── DataSeeder.java                # CommandLineRunner — seeds users/categories/products
├── config/
│   ├── DataSourceConfig.java      # Primary + Replica routing
│   ├── RedisConfig.java           # Redis cache config (10min TTL, JSON serializer)
│   └── ServerPortFilter.java      # Adds X-Server-Port header
├── controller/
│   ├── AuthController.java        # /api/auth (register, login)
│   ├── CartController.java        # /api/cart (CRUD)
│   ├── CategoryController.java    # /api/categories (CRUD)
│   ├── OrderController.java       # /api/orders (place, history, manage)
│   ├── ProductController.java     # /api/products (CRUD, browse)
│   └── UserController.java        # /api/users (admin CRUD)
├── dto/
│   ├── AuthenticationRequest.java # Login payload
│   ├── AuthenticationResponse.java# JWT token response
│   ├── CartResponse.java          # Cart + items response
│   ├── OrderItemRequest.java      # {productId, quantity}
│   ├── OrderRequest.java          # List<OrderItemRequest>
│   └── RegisterRequest.java       # Registration payload
├── entity/
│   ├── User.java                  # id, name, email, password, address, role, createdAt
│   ├── Role.java                  # enum: CUSTOMER, STAFF, ADMIN
│   ├── Category.java              # id, name, @OneToMany products
│   ├── Product.java               # id, name, price, stockQuantity, imageUrl, @ManyToOne Category
│   ├── Cart.java                  # id, @OneToOne User
│   ├── CartItem.java              # id, @ManyToOne Cart, @ManyToOne Product, quantity
│   ├── Order.java                 # id, @ManyToOne User, totalPrice, status, @OneToMany OrderItems, createdAt
│   ├── OrderItem.java             # id, @ManyToOne Order, @ManyToOne Product, quantity, priceAtPurchase
│   └── OrderStatus.java           # enum: PLACED, PREPARING, READY, COMPLETED, CANCELLED
├── exception/
│   ├── GlobalExceptionHandler.java    # @RestControllerAdvice
│   ├── InsufficientStockException.java
│   └── ResourceNotFoundException.java
├── repository/
│   ├── CartItemRepository.java    # findByCartId + findByCartIdAndProductId (both JOIN FETCH)
│   ├── CartRepository.java        # findByUserId
│   ├── CategoryRepository.java    # findByName
│   ├── OrderItemRepository.java   # findByOrderId
│   ├── OrderRepository.java       # findAll + findByUserId (both JOIN FETCH)
│   ├── ProductRepository.java     # findAll + findByCategoryId (JOIN FETCH + countQuery)
│   └── UserRepository.java        # findByEmail
├── security/
│   ├── CustomUserDetailsService.java  # implements UserDetailsService
│   ├── JwtAuthenticationFilter.java   # OncePerRequestFilter — extracts & validates JWT
│   ├── JwtUtil.java                   # Generate, validate, extract claims from JWT
│   └── SecurityConfig.java            # SecurityFilterChain, AuthProvider, PasswordEncoder
└── service/
    ├── AuthService.java           # register (hash password + JWT) + login (authenticate + JWT)
    ├── CartService.java           # get, add, update, remove, clear (auto-creates cart)
    ├── CategoryService.java       # CRUD + Redis caching (@Cacheable / @CacheEvict)
    ├── OrderService.java          # placeOrder (direct + from cart), getUserOrders, getAllOrders, updateStatus
    ├── ProductService.java        # CRUD + caching for single product
    └── UserService.java           # CRUD + password hashing on update
```

---

## 4. Backend Layer-by-Layer

### 4.1 Entry Point (`BloomsCafeApplication.java`)

```java
@SpringBootApplication
@EnableCaching
public class BloomsCafeApplication {
    public static void main(String[] args) {
        SpringApplication.run(BloomsCafeApplication.class, args);
    }
}
```

- `@EnableCaching` activates Spring's cache abstraction backed by Redis

### 4.2 Entities (Domain Model)

#### Relationships Map

```
User (1) ──── (1) Cart
User (1) ──── (N) Order
Cart (1) ──── (N) CartItem
CartItem (N) ──── (1) Product
Order (1) ──── (N) OrderItem
OrderItem (N) ──── (1) Product
Product (N) ──── (1) Category
```

#### Entity Details

**User**
- `@Table(name = "users")`
- Fields: id (IDENTITY), name, email (unique), password (@JsonIgnore), address, role (EnumType.STRING), createdAt
- `@PrePersist` sets createdAt on first save
- `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` prevents serialization errors with lazy proxies

**Category**
- Fields: id, name (unique)
- `@OneToMany(mappedBy = "category", cascade = ALL, fetch = LAZY)` + `@JsonIgnore` to avoid circular serialization

**Product**
- Fields: id, name, price (BigDecimal precision=10, scale=2), stockQuantity, imageUrl
- `@ManyToOne(fetch = LAZY)` → Category

**Cart**
- `@OneToOne(fetch = LAZY)` → User (unique)

**CartItem**
- `@ManyToOne` → Cart, `@ManyToOne` → Product
- quantity (Integer)

**Order**
- `@ManyToOne` → User
- totalPrice (BigDecimal), status (OrderStatus enum)
- `@OneToMany(mappedBy = "order", cascade = ALL)` → OrderItem
- `@PrePersist` sets createdAt and default status = PLACED

**OrderItem**
- `@ManyToOne` → Order (@JsonIgnore to avoid circular ref), `@ManyToOne` → Product
- quantity, priceAtPurchase (stores price at time of order)

**Role enum**: `CUSTOMER`, `STAFF`, `ADMIN`
**OrderStatus enum**: `PLACED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`

---

### 4.3 Repositories (Data Access)

All extend `JpaRepository`. Key custom queries:

| Repository | Method | JPQL |
|---|---|---|
| `CartItemRepository` | `findByCartId` | `SELECT ci FROM CartItem ci JOIN FETCH ci.product p JOIN FETCH p.category WHERE ci.cart.id = :cartId` |
| `CartItemRepository` | `findByCartIdAndProductId` | Same pattern + `AND ci.product.id = :productId` |
| `ProductRepository` | `findAll(Pageable)` | `SELECT p FROM Product p JOIN FETCH p.category` + `countQuery` |
| `ProductRepository` | `findByCategoryId` | Same + `WHERE p.category.id = :categoryId` + `countQuery` |
| `OrderRepository` | `findAll()` | `SELECT DISTINCT o FROM Order o JOIN FETCH o.user JOIN FETCH o.orderItems oi JOIN FETCH oi.product` |
| `OrderRepository` | `findByUserId` | Same + `WHERE o.user.id = :userId` |
| `CartRepository` | `findByUserId` | Standard derived query |
| `CategoryRepository` | `findByName` | Standard derived query |
| `UserRepository` | `findByEmail` | Standard derived query |

All `JOIN FETCH` queries exist to prevent N+1. See Section 8.

---

### 4.4 Services (Business Logic)

#### AuthService
- `register(RegisterRequest)`: Creates User with BCrypt-encoded password, generates JWT
- `login(AuthenticationRequest)`: Delegates to AuthenticationManager (which uses CustomUserDetailsService), generates JWT
- Both methods are `@Transactional`

#### CartService
- `getCart(email)`: Gets or creates cart for user, fetches items with JOIN FETCH
- `addItem(email, productId, quantity)`: Validates stock, creates or increments CartItem
- `updateItemQuantity(email, productId, quantity)`: Sets quantity (deletes if <= 0)
- `removeItem(email, productId)`: Removes item from cart
- `clearCart(email)`: Removes all items
- `getOrCreateCart(email)`: Private helper — creates Cart if one doesn't exist

#### CategoryService
- `getAllCategories(page, size)`: `@Cacheable("categories", key = "'all_' + #page + '_' + #size")`
- `getCategoryById(id)`: `@Cacheable("categories", key = "#id")`
- `createCategory`, `updateCategory`, `deleteCategory`: All `@CacheEvict(value = "categories", allEntries = true)`

#### ProductService
- `getAllProducts(page, size)`: Paginated with JOIN FETCH
- `getProductsByCategory(categoryId, page, size)`: Paginated with JOIN FETCH
- `getProductById(id)`: `@Cacheable("products", key = "#id")`
- `createProduct`, `updateProduct`, `deleteProduct`: `@CacheEvict(value = "products", allEntries = true)`
- `updateProduct` verifies new category exists if category is being changed

#### OrderService
- `placeOrder(email, request)`: Batch-fetches products via `findAllById()` into a Map (avoids N+1 loop), validates stock, decrements stock, calculates totals, saves Order
- `placeOrderFromCart(email)`: Fetches cart items, validates stock, creates order, clears cart
- `getUserOrders(email)`: `@Transactional(readOnly = true)`
- `getAllOrders()`: Admin-only, uses JOIN FETCH
- `updateOrderStatus(orderId, status)`: Updates status for admin order management

#### UserService
- `getAllUsers(pageable)`, `getUserById(id)`, `createUser(user)`, `updateUser(id, userDetails)`, `deleteUser(id)`
- Update hashes the password via `BCryptPasswordEncoder`

---

### 4.5 Controllers (API Layer)

All controllers use constructor injection (no `@Autowired`).

- **AuthController** (`/api/auth`): `POST /register`, `POST /login` — public
- **ProductController** (`/api/products`): `GET` (paginated), `GET /category/{id}`, `GET /{id}` — public; `POST`, `PUT /{id}`, `DELETE /{id}` — ADMIN
- **CategoryController** (`/api/categories`): Same pattern as Product
- **CartController** (`/api/cart`): `GET`, `POST /items`, `PUT /items/{productId}`, `DELETE /items/{productId}`, `DELETE` — authenticated
- **OrderController** (`/api/orders`): `POST` (place order — body or empty = from cart), `GET /my-orders`, `GET` (admin — all), `PUT /{id}/status` (admin)
- **UserController** (`/api/users`): `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` — ADMIN only

CartController and OrderController use `Authentication` parameter (injected by Spring Security) to get the logged-in user's email via `authentication.getName()`.

---

### 4.6 DTOs

| DTO | Fields | Usage |
|---|---|---|
| `AuthenticationRequest` | email, password | Login request body |
| `AuthenticationResponse` | token (String) | Login/register response |
| `RegisterRequest` | name, email, password, address, role | Registration body |
| `OrderItemRequest` | productId, quantity | Part of OrderRequest |
| `OrderRequest` | orderItems (List<OrderItemRequest>) | Place order body |
| `CartResponse` | cartId, items (List<CartItemResponse>) | Cart response |
| `CartResponse.CartItemResponse` | id, product, quantity | Nested in CartResponse |

All use Lombok `@Data`.

---

### 4.7 Security (JWT + Spring Security)

#### 4.7.1 SecurityConfig

```java
@Configuration
@EnableWebSecurity
```

**Beans:**
- `SecurityFilterChain`: Disables CSRF, sets route-level authorization, stateless sessions, adds JWT filter before `UsernamePasswordAuthenticationFilter`
- `AuthenticationProvider`: `DaoAuthenticationProvider` with `CustomUserDetailsService` + `BCryptPasswordEncoder`
- `AuthenticationManager`: From `AuthenticationConfiguration`
- `PasswordEncoder`: `BCryptPasswordEncoder`

**Route Security Rules:**
```
/api/auth/**                            → PERMIT_ALL
GET /api/products/**                    → PERMIT_ALL
GET /api/categories/**                  → PERMIT_ALL
POST /api/products/**                   → ADMIN
PUT /api/products/**                    → ADMIN
DELETE /api/products/**                 → ADMIN
POST /api/categories/**                 → ADMIN
PUT /api/categories/**                  → ADMIN
DELETE /api/categories/**               → ADMIN
/api/users/**                           → ADMIN
/actuator/**                            → PERMIT_ALL
All other requests                      → AUTHENTICATED
```

#### 4.7.2 JwtUtil

- `@PostConstruct init()`: Decodes `jwt.secret` from Base64, or auto-generates a key
- `generateToken(email, role)`: Creates JWT with `sub=email`, `role` claim, `iat`, `exp` (24h), signed with HMAC-SHA256
- `extractUsername(token)`, `extractRole(token)`, `extractExpiration(token)`
- `isTokenValid(token, email)`: Checks username match + not expired
- `extractAllClaims(token)`: Parses JWT with signing key

#### 4.7.3 JwtAuthenticationFilter

`OncePerRequestFilter`:
1. Reads `Authorization: Bearer <token>` header
2. If header missing or wrong format → continues filter chain
3. Extracts username from JWT
4. Loads `UserDetails` via `CustomUserDetailsService`
5. Validates JWT matches the user
6. Sets `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`
7. Continues filter chain

#### 4.7.4 CustomUserDetailsService

Implements `UserDetailsService.loadUserByUsername(email)`:
- Looks up user by email via `UserRepository`
- Returns Spring Security `User` with authority `ROLE_CUSTOMER`, `ROLE_STAFF`, or `ROLE_ADMIN`

---

### 4.8 Configuration

#### DataSourceConfig (Read/Write Splitting)

The most architecturally interesting piece:

1. **`primaryDataSource()`**: Configured from `primary.datasource.*` properties (port 5432)
2. **`replicaDataSource()`**: Configured from `replica.datasource.*` properties (port 5433)
3. **`routingDataSource()`**:
   - Creates `AbstractRoutingDataSource` with two targets: "PRIMARY" and "REPLICA"
   - `determineCurrentLookupKey()` checks `TransactionSynchronizationManager.isCurrentTransactionReadOnly()`
   - If `@Transactional(readOnly = true)` → routes to REPLICA
   - Otherwise → routes to PRIMARY
4. **Wraps in `LazyConnectionDataSourceProxy`**: Defers actual connection acquisition until the first SQL statement executes. Without this, Spring would acquire the connection at `@Transactional` start (before `determineCurrentLookupKey` can decide the target).

**Important**: The `application.properties` uses `jdbc-url` (not `url`) for the custom datasource prefixes.

#### RedisConfig

- `RedisCacheConfiguration` with 10-minute TTL
- `GenericJackson2JsonRedisSerializer` for cache values
- Null values not cached

#### ServerPortFilter

- Simple `OncePerRequestFilter` that adds `X-Server-Port` response header
- Useful for debugging which instance handled the request in multi-instance setup

---

### 4.9 Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`):

| Exception | HTTP Status |
|---|---|
| `ResourceNotFoundException` | 404 |
| `InsufficientStockException` | 400 |
| `IllegalArgumentException` | 400 |
| `RuntimeException` (catch-all) | 500 |

All return: `{timestamp, status, error, message}`

---

### 4.10 Data Seeder (`DataSeeder.java`)

Implements `CommandLineRunner`:

**On first run** (when user count = 0):
- Seeds 3 users:
  - admin@bloomscafe.com / admin123 → ADMIN
  - staff@bloomscafe.com / staff123 → STAFF
  - john@example.com / customer123 → CUSTOMER
- Seeds 5 categories: Coffee, Pastries, Cakes, Tea, Sandwiches
- Seeds 20 products across all categories with prices, stock quantities, and image URLs

**On subsequent runs**:
- Updates missing image URLs for existing products

---

## 5. Frontend Overview

### 5.1 Tech Stack
- React 18 + TypeScript
- Vite 5 (dev server on :3000, proxies /api → :8080)
- Tailwind CSS 3
- Zustand (state management)
- React Router 6
- Axios (HTTP client)

### 5.2 Frontend Structure

```
frontend/src/
├── api/
│   ├── axiosClient.ts       # Axios instance with JWT interceptor
│   ├── cartApi.ts
│   ├── categoryApi.ts
│   ├── orderApi.ts
│   ├── productApi.ts
│   └── userApi.ts
├── components/
│   ├── layout/              # Navbar, Footer, PublicLayout
│   └── ui/                  # Pagination
├── pages/
│   ├── Home.tsx, Login.tsx, Register.tsx
│   ├── Menu.tsx, Cart.tsx, MyOrders.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── Dashboard.tsx
│       ├── Products.tsx
│       ├── Categories.tsx
│       ├── Orders.tsx
│       └── Users.tsx
├── router/index.tsx         # Route definitions
├── store/
│   ├── authStore.ts         # Zustand — login, register, logout, token management
│   └── cartStore.ts         # Zustand — cart operations (backend + local fallback)
├── types/index.ts           # TypeScript interfaces
└── utils/jwt.ts             # JWT decode + validation helpers
```

### 5.3 Key Frontend Patterns

**Auth Flow:**
- `authStore.login()` → POST `/api/auth/login` → stores JWT in `localStorage` → decodes JWT payload → sets user state
- `axiosClient` interceptor attaches `Authorization: Bearer <token>` to every request
- 401 response interceptor clears token and redirects to `/login`

**Cart Strategy:**
- Dual-mode: authenticated users sync cart with backend; unauthenticated users use local state (Zustand)
- On login, cart loads from backend
- Fallback to local state if API call fails

**Routing:**
- Public routes (`/`, `/login`, `/register`, `/menu`, `/cart`, `/my-orders`) wrapped in `PublicLayout` (Navbar + Footer)
- Admin routes (`/admin/*`) wrapped in `AdminLayout` (sidebar + header)

---

## 6. Infrastructure & Deployment

### 6.1 Nginx Config (`config/nginx-bloomscafe.conf`)

```nginx
upstream bloomscafe_backend {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 8080;
    server_name localhost;

    location / {
        proxy_pass http://bloomscafe_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header X-Upstream $upstream_addr;
    }
}
```

- Listens on port 8080
- Round-robins to 3 backend instances
- Adds `X-Upstream` header showing which instance handled the request

### 6.2 Makefile (`make run3`)

```bash
make run3:  # Kills existing, starts 3 JAR instances on 8081/8082/8083, starts Nginx on 8080
make stop:  # Kills all instances
```

---

## 7. Key Design Decisions & Trade-offs

### 7.1 Why Stateless JWT (not session auth)?
- **Pro**: No session store needed; any instance can handle any request → true horizontal scaling
- **Con**: Can't revoke individual tokens server-side (would need a blocklist)
- **Trade-off accepted**: 24-hour token expiry is acceptable for this use case

### 7.2 Why Read/Write Splitting?
- **Pro**: Offloads read queries to replica, primary stays free for writes
- **Con**: Slight replication lag (acceptable for a bakery)
- **Implementation**: Routing is transparent — developer just uses `@Transactional(readOnly = true)`

### 7.3 Why `LazyConnectionDataSourceProxy`?
Without it, Spring acquires the DB connection at transaction start (before the `AbstractRoutingDataSource` can check `isCurrentTransactionReadOnly()`). The lazy wrapper defers connection acquisition until the first actual query.

### 7.4 Why Redis Caching?
- Products and categories are read-heavy, write-light
- 10-minute TTL is appropriate — menu doesn't change every second
- `@CacheEvict(allEntries = true)` on writes ensures eventual consistency
- Without this, every page load would hit the database

### 7.5 Why `JOIN FETCH` Everywhere?
- All `@ManyToOne` and `@OneToMany` are `FetchType.LAZY` (default for `@OneToMany`, explicit for `@ManyToOne`)
- Without `JOIN FETCH`, each relationship access fires a separate SQL query → N+1
- See Section 8 for details

### 7.6 Why `countQuery` in ProductRepository?
Pagination (`Pageable`) needs a count. When using `JOIN FETCH`, Hibernate cannot derive the count query automatically (because JOIN FETCH changes the result set). A separate `countQuery` is required.

### 7.7 Why `DISTINCT` in OrderRepository?
`JOIN FETCH` on a collection (`OneToMany` on orderItems) produces duplicate parent rows in SQL. `DISTINCT` deduplicates the parent entities in memory.

### 7.8 Why BigDecimal for Prices?
`float`/`double` lose precision in financial calculations. `BigDecimal` with `precision=10, scale=2` is exact.

### 7.9 Why Constructor Injection (not @Autowired)?
- Immutability (final fields)
- Easier testing (no reflection)
- Clear dependencies at a glance

---

## 8. N+1 Query Problem & Fix

Full documentation at `docs/(N+1)QUERY.md`.

### What is N+1?

When Hibernate loads an entity with a LAZY association, it fires **1 query** for the parent and **N additional queries** for each child's association.

### Locations Found & Fixed

| Location | Problem | Fix | Before → After |
|---|---|---|---|
| `CartItemRepository.findByCartId()` | Each `cartItem.getProduct()` and `product.getCategory()` fires separate queries | `JOIN FETCH ci.product p JOIN FETCH p.category` | 7 queries → 1 |
| `ProductRepository.findAll()` and `findByCategoryId()` | Each `product.getCategory()` fires N queries | `JOIN FETCH p.category` + `countQuery` | 11 queries → 1 |
| `OrderRepository.findAll()` and `findByUserId()` | `order.getUser()`, `order.getOrderItems()`, `orderItem.getProduct()` — triple N+1 | `SELECT DISTINCT o JOIN FETCH o.user JOIN FETCH o.orderItems oi JOIN FETCH oi.product` | 26 queries → 1 |
| `OrderService.placeOrder()` | Loop over items calling `productRepository.findById()` each time | Batch `findAllById()` + Map lookup | 9 queries → 2 |

### Rules of Thumb (from docs)
- **Singular associations** (`@ManyToOne`, `@OneToOne`) → always use `JOIN FETCH`
- **Collection associations** (`@OneToMany`) → use `JOIN FETCH` with `DISTINCT` on `List` queries; for `Page` queries, use `@BatchSize` or separate query
- Always provide `countQuery` with `JOIN FETCH` + pagination

---

## 9. Complete API Reference

### Public Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| GET | `/api/products?page=0&size=10` | List products (paginated) | No |
| GET | `/api/products/category/{id}?page=0&size=10` | Products by category | No |
| GET | `/api/products/{id}` | Single product | No |
| GET | `/api/categories?page=0&size=10` | List categories (paginated) | No |
| GET | `/api/categories/{id}` | Single category | No |
| GET | `/actuator/**` | Health, metrics, prometheus | No |

### Authenticated Endpoints (JWT required)

| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/api/cart` | Get current user's cart | Any authenticated |
| POST | `/api/cart/items` | Add item to cart `{productId, quantity}` | Any authenticated |
| PUT | `/api/cart/items/{productId}` | Update item quantity `{quantity}` | Any authenticated |
| DELETE | `/api/cart/items/{productId}` | Remove item | Any authenticated |
| DELETE | `/api/cart` | Clear cart | Any authenticated |
| POST | `/api/orders` | Place order (body or empty = from cart) | Any authenticated |
| GET | `/api/orders/my-orders` | User's order history | Any authenticated |

### Admin Endpoints (JWT + ADMIN role)

| Method | Path | Description |
|---|---|---|
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| GET | `/api/orders` | All orders |
| PUT | `/api/orders/{id}/status?status=READY` | Update order status |
| GET | `/api/users?page=0&size=10` | List users |
| GET | `/api/users/{id}` | Single user |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

---

## 10. Interview Q&A — Top Questions & How to Answer

### Q1: "Tell me about this project"

> *"BloomsCafe is a full-stack e-commerce backend for a bakery cafe. I built it with Spring Boot 3 and Java 21. It handles product browsing, cart management, order placement with stock validation, and JWT-based auth with role-based access for Customers and Admins."*

*Then stop and let them ask follow-ups.*

### Q2: "What was the hardest technical problem?"

> *"The N+1 query problem. Hibernate was firing 20+ SQL queries per page load because of lazy-loaded relationships. I tracked down 4 locations — including a triple N+1 in orders — and fixed them all with JOIN FETCH. For paginated queries I had to add separate count queries since JOIN FETCH breaks Hibernate's automatic count."*

### Q3: "How does authentication work?"

> *"Stateless JWT. When a user logs in, the server validates credentials via Spring Security's AuthenticationManager, then generates a JWT with the user's email and role, signed with HMAC-SHA256 and a 24-hour expiry. Every subsequent request includes the token in the Authorization header. A OncePerRequestFilter intercepts each request, validates the JWT, and sets the security context so controllers can access the authenticated user."*

### Q4: "How did you handle scaling?"

> *"Three levels. Application: 3 Spring Boot instances behind Nginx round-robin — stateless JWT means any instance handles any request. Database: read/write splitting with AbstractRoutingDataSource — read-only queries go to a PostgreSQL replica, writes go to the primary. Cache: Redis with 10-minute TTL for products and categories, shared across all instances and invalidated on writes."*

### Q5: "How does the read/write splitting work?"

> *"I configured two DataSource beans for primary and replica PostgreSQL databases. An AbstractRoutingDataSource checks TransactionSynchronizationManager.isCurrentTransactionReadOnly() — if a service method is marked @Transactional(readOnly = true), queries route to the replica; otherwise to the primary. I wrapped it in LazyConnectionDataSourceProxy so the connection isn't acquired until the first actual query executes, which is when the routing decision is made."*

### Q6: "What's the cart flow?"

> *"Each user has exactly one cart, created on first use. When they add an item, the server checks product stock first. If the item already exists in the cart, it increments the quantity. The cart is persisted in PostgreSQL via CartItems. When they place an order from the cart, the system validates stock again, creates OrderItems with the current price, decrements stock, and clears the cart."*

### Q7: "How is a customer different from an admin?"

> *"There are three roles: CUSTOMER, STAFF, and ADMIN. SecurityConfig maps role-based rules — for example, any authenticated user can access the cart, but writing to products or categories requires ADMIN. The JWT contains the role, and Spring Security translates the ROLE_ authority to hasRole checks. The frontend also checks the decoded JWT to conditionally show admin UI elements."*

### Q8: "What would you improve if you had more time?"

> *"Three things: First, add optimistic locking with @Version on Product.stockQuantity to prevent overselling under concurrent requests. Second, add input validation with @Valid on all DTOs. Third, containerize with Docker and add a docker-compose.yml for one-command local setup. I'd also add refresh tokens and rate limiting."*

### Q9: "Why use Redis instead of an in-memory cache?"

> *"Because I'm running 3 app instances behind Nginx. An in-memory cache like Caffeine would be local to each instance, so one instance might serve stale data. Redis is shared across all instances, so all clients see the same cached data until it's evicted on writes."*

### Q10: "Explain the JWT filter chain step by step"

> *"The filter extends OncePerRequestFilter. Step 1: Extract the Authorization header. Step 2: If it's missing or doesn't start with 'Bearer ', skip and continue the chain. Step 3: Remove 'Bearer ' prefix to get the token. Step 4: Extract the username (email) from the JWT using JwtUtil. Step 5: Load the user from the database via CustomUserDetailsService. Step 6: Validate the JWT against the loaded user. Step 7: Create a UsernamePasswordAuthenticationToken and set it in SecurityContextHolder. Step 8: Continue the filter chain."*

---

## 11. How to Present the Project in an Interview

### The Script (30 seconds)

> *"BloomsCafe is a bakery e-commerce backend I built with Spring Boot 3 and Java 21. Customers can browse the menu, manage a cart, and place orders. Admins can manage products, categories, orders, and users. I focused on three areas: **security** with stateless JWT auth, **performance** by fixing N+1 queries and adding Redis caching, and **scalability** with horizontal scaling behind Nginx and read/write database splitting."*

### Don't Say Everything At Once

Let the interviewer pull information from you. Here's the order of disclosure:

1. **Start**: Project name + what it does + tech stack (30 seconds)
2. **If they ask about architecture**: 3-layer, JWT filter, routing datasource
3. **If they ask about challenges**: N+1 problem, read/write splitting complexity
4. **If they ask about scaling**: Nginx round-robin, Redis, replica
5. **If they ask about trade-offs**: JWT vs sessions, why BigDecimal, why LazyConnectionProxy

### Phrases That Impress

- *"I used `LazyConnectionDataSourceProxy` to defer connection acquisition until the actual query, so the routing datasource can correctly determine the target."*
- *"For paginated queries with JOIN FETCH, I had to supply a separate `countQuery` because Hibernate can't derive it automatically from a fetch-joined query."*
- *"The cart has a dual-mode fallback — authenticated users sync with the server, but if the API fails or the user isn't logged in, the Zustand store keeps it locally."*

---

## 12. Potential Improvements

These are good to mention when asked "What would you do differently?"

| Area | Current | Improvement |
|---|---|---|
| **Concurrency** | No stock locking | `@Version` optimistic locking on Product |
| **Validation** | Manual parsing in CartController | `@Valid` + DTO annotations |
| **Documentation** | None | OpenAPI / Swagger (springdoc-openapi) |
| **Testing** | No tests | Unit + integration tests (testcontainers) |
| **Containerization** | Manual `make run3` | Docker + docker-compose |
| **Refresh tokens** | Single JWT (24h) | Short-lived access + long-lived refresh |
| **Rate limiting** | None | Nginx limit_req or Bucket4j |
| **Image serving** | Static files | CDN (CloudFront/S3) |
| **Order pagination** | Returns all | Paginated order list |
| **CI/CD** | None | GitHub Actions build + deploy |

---

*End of report. This document fully describes the BloomsCafe project for interview preparation and LLM consumption.*
````