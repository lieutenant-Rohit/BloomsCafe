package com.bloomscafe.service;

import com.bloomscafe.entity.Category;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.CategoryRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository){
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Categories (Now with Pagination!)
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'all_' + #page + '_' + #size")
    public Page<Category> getAllCategories(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        return categoryRepository.findAll(pageable);
    }

    //Create a New Category
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category createCategory(Category category){
        return categoryRepository.save(category);
    }

    //Find Category by ID
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#id")
    public Category getCategoryById(Long id)
    {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category updateCategory(Long id, Category categoryDetails){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));

        existingCategory.setName(categoryDetails.getName());

        return categoryRepository.save(existingCategory);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category Not Found with ID: "+ id));

        categoryRepository.delete(existingCategory);
    }
}