package com.bloomscafe.controller;

import com.bloomscafe.dto.OrderRequest;
import com.bloomscafe.entity.Order;
import com.bloomscafe.entity.OrderStatus;
import com.bloomscafe.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // 1. Submit a New Order (For Logged In Customers)
    @PostMapping
    public ResponseEntity<Order> placeOrder(Authentication authentication, @RequestBody(required = false) OrderRequest request) {
        String userEmail = authentication.getName();
        Order newOrder = request != null
                ? orderService.placeOrder(userEmail, request)
                : orderService.placeOrderFromCart(userEmail);
        return ResponseEntity.ok(newOrder);
    }

    // 2. View My Order History (For Logged In Customers)
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(orderService.getUserOrders(userEmail));
    }

    // 3. View ALL Orders (For ADMIN only - protected by SecurityConfig)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // 4. Update Order Status (For ADMIN only)
    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {

        Order updatedOrder = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(updatedOrder);
    }
}