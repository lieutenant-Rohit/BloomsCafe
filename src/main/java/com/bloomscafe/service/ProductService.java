package com.bloomscafe.service;

import com.bloomscafe.entity.Category;
import com.bloomscafe.entity.Product;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.CategoryRepository;
import com.bloomscafe.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository){
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Products (Paginated)
    public Page<Product> getAllProducts(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findAll(pageable);
    }

    //Fetch Product from a Specific Category (Paginated)
    public Page<Product> getProductsByCategory(Long categoryId, int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByCategoryId(categoryId, pageable);
    }

    //Find a Specific Product By its ID
    public Product getProductById(Long id){
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product Not Found with ID: "+ id));
    }

    //Create a New Product
    public Product createProduct(Product product){
        Long categoryId = product.getCategory().getId();

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot create product. Category Not Found with ID: "+ categoryId));

        product.setCategory(category);
        return productRepository.save(product);
    }

    //Delete a Product
    public void deleteProduct(Long id){
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }

    //Update an existing Product
    public Product updateProduct(Long id, Product productDetails) {
        Product existingProduct = getProductById(id); // Re-uses method #3 to check if it exists

        existingProduct.setName(productDetails.getName());
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setStockQuantity(productDetails.getStockQuantity());
        existingProduct.setImageUrl(productDetails.getImageUrl());

        // If the admin is moving this product to a different category, verify the new one exists
        if (productDetails.getCategory() != null && productDetails.getCategory().getId() != null) {
            Category newCategory = categoryRepository.findById(productDetails.getCategory().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cannot update. New Category not found."));
            existingProduct.setCategory(newCategory);
        }

        return productRepository.save(existingProduct);
    }

}