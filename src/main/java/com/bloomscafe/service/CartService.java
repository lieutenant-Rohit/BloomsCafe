package com.bloomscafe.service;

import com.bloomscafe.dto.CartResponse;
import com.bloomscafe.entity.Cart;
import com.bloomscafe.entity.CartItem;
import com.bloomscafe.entity.Product;
import com.bloomscafe.entity.User;
import com.bloomscafe.exception.InsufficientStockException;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.CartItemRepository;
import com.bloomscafe.repository.CartRepository;
import com.bloomscafe.repository.ProductRepository;
import com.bloomscafe.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public CartResponse getCart(String email) {
        Cart cart = getOrCreateCart(email);
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartResponse.CartItemResponse> itemResponses = items.stream()
                .map(i -> new CartResponse.CartItemResponse(i.getId(), i.getProduct(), i.getQuantity()))
                .toList();
        return new CartResponse(cart.getId(), itemResponses);
    }

    @Transactional
    public CartResponse addItem(String email, Long productId, int quantity) {
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException("Insufficient stock for: " + product.getName());
        }

        CartItem existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId).orElse(null);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            cartItemRepository.save(existing);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(email);
    }

    @Transactional
    public CartResponse updateItemQuantity(String email, Long productId, int quantity) {
        Cart cart = getOrCreateCart(email);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(email);
    }

    @Transactional
    public CartResponse removeItem(String email, Long productId) {
        Cart cart = getOrCreateCart(email);
        cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .ifPresent(cartItemRepository::delete);
        return getCart(email);
    }

    @Transactional
    public void clearCart(String email) {
        Cart cart = getOrCreateCart(email);
        cartItemRepository.findByCartId(cart.getId()).forEach(cartItemRepository::delete);
    }

    private Cart getOrCreateCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }
}
