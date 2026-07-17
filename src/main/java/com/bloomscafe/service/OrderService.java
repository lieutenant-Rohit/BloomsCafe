package com.bloomscafe.service;

import com.bloomscafe.dto.OrderItemRequest;
import com.bloomscafe.dto.OrderRequest;
import com.bloomscafe.entity.Order;
import com.bloomscafe.entity.OrderItem;
import com.bloomscafe.entity.OrderStatus;
import com.bloomscafe.entity.Product;
import com.bloomscafe.entity.User;
import com.bloomscafe.repository.OrderRepository;
import com.bloomscafe.repository.ProductRepository;
import com.bloomscafe.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Order placeOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);

        // Status and CreatedAt are handled by your @PrePersist in the Order entity!

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getOrderItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemRequest.getProductId()));

            // Optional: Check if product has enough stock and deduct it here
            // if (product.getStockQuantity() < itemRequest.getQuantity()) { throw error... }
            // product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());

            // Convert product price to BigDecimal (Assuming your Product price is currently a Double)
            BigDecimal currentPrice = product.getPrice();
            orderItem.setPriceAtPurchase(currentPrice);

            // Calculate item total: price * quantity
            BigDecimal itemTotal = currentPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);
        order.setTotalPrice(totalAmount);

        return orderRepository.save(order);
    }

    public List<Order> getUserOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUserId(user.getId());
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }
}