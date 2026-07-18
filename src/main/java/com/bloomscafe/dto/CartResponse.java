package com.bloomscafe.dto;

import com.bloomscafe.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CartResponse {
    private Long cartId;
    private List<CartItemResponse> items;

    @Data
    @AllArgsConstructor
    public static class CartItemResponse {
        private Long id;
        private Product product;
        private int quantity;
    }
}
