package com.bloomscafe.service;

import com.bloomscafe.entity.Category;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository){
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Categories (Now with Pagination!)
    public Page<Category> getAllCategories(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return categoryRepository.findAll(pageable);
    }

    //Create a New Category
    public Category createCategory(Category category){
        return categoryRepository.save(category);
    }

    //Find Category by ID
    public Category getCategoryById(Long id)
    {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));
    }

    public Category updateCategory(Long id, Category categoryDetails){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));

        existingCategory.setName(categoryDetails.getName());

        return categoryRepository.save(existingCategory);
    }

    public void deleteCategory(Long id){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));

        categoryRepository.delete(existingCategory);
    }
}