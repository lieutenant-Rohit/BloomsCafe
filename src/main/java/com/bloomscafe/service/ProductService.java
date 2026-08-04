package com.bloomscafe.service;

import com.bloomscafe.dto.ProductPageResponse;
import com.bloomscafe.entity.Category;
import com.bloomscafe.entity.Product;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.CategoryRepository;
import com.bloomscafe.repository.ProductRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository){
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Products (Paginated)
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "'all-' + #page + '-' + #size")
    public ProductPageResponse getAllProducts(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return new ProductPageResponse(productRepository.findAll(pageable));
    }

    //Fetch Product from a Specific Category (Paginated)
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "'category-' + #categoryId + '-' + #page + '-' + #size")
    public ProductPageResponse getProductsByCategory(Long categoryId, int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return new ProductPageResponse(productRepository.findByCategoryId(categoryId, pageable));
    }

    //Find a Specific Product By its ID
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "'id-' + #id")
    public Product getProductById(Long id){
        return productRepository.findWithCategoryById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product Not Found with ID: "+ id));
    }

    //Create a New Product
    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public Product createProduct(Product product){
        Long categoryId = product.getCategory().getId();

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot create product. Category Not Found with ID: "+ categoryId));

        product.setCategory(category);
        return productRepository.save(product);
    }

    //Delete a Product
    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id){
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }

    //Update an existing Product
    @Transactional
    @CacheEvict(value = "products", allEntries = true)
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