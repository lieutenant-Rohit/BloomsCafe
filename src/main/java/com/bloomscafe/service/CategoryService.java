package com.bloomscafe.service;

import com.bloomscafe.entity.Category;
import com.bloomscafe.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository){
        this.categoryRepository = categoryRepository;
    }

    //Fetch All Categories
    public List<Category> getAllCategories(){
        return categoryRepository.findAll();
    }

    //Create a New Category
    public Category createCategory(Category category){
        return categoryRepository.save(category);
    }

    //Find Category by ID
    public Category getCategoryById(Long id)
    {
        return categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category Not Found with ID: "+ id));
    }

    public Category updateCategory(Long id, Category categoryDetails){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category Not Found with ID: "+ id));

        existingCategory.setName(categoryDetails.getName());

        return categoryRepository.save(existingCategory);
    }

    public void deleteCategory(Long id){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Category Not Found with ID: "+ id));

        categoryRepository.delete(existingCategory);
    }
}
