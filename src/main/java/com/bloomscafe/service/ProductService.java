package com.bloomscafe.service;

import com.bloomscafe.entity.Category;
import com.bloomscafe.entity.Product;
import com.bloomscafe.repository.CategoryRepository;
import com.bloomscafe.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository){
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Products
    public List<Product> getAllProduct(){
        return productRepository.findAll();
    }

    //Fetch Product from a Specific Category
    public List<Product> getProductsByCategory(Long categoryId){
        return productRepository.findByCategoryId(categoryId);
    }

    //Find a Specific Product By its ID
    public Product getProductById(Long id){
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product Not Found with ID: "+ id));
    }

    //Create a New Product
    public Product createProduct(Product product){
        Long categoryId = product.getCategory().getId();

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Cannot create product. Category Not Found with ID: "+ categoryId));

        product.setCategory(category);
        return productRepository.save(product);
    }

    //Delete a Product
    public void deleteProduct(Long id){
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }



}
