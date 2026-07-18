package com.bloomscafe;

import com.bloomscafe.entity.Category;
import com.bloomscafe.entity.Product;
import com.bloomscafe.entity.Role;
import com.bloomscafe.entity.User;
import com.bloomscafe.repository.CategoryRepository;
import com.bloomscafe.repository.ProductRepository;
import com.bloomscafe.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class
DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, CategoryRepository categoryRepository, ProductRepository productRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            seedUsers();
            seedCategories();
        } else {
            updateProductImages();
        }
    }

    private void updateProductImages() {
        Map<String, String> imageMap = Map.ofEntries(
            Map.entry("Espresso", "/images/products/espresso.jpg"),
            Map.entry("Latte", "/images/products/latte.jpg"),
            Map.entry("Cappuccino", "/images/products/cappuccino.jpg"),
            Map.entry("Mocha", "/images/products/mocha.jpg"),
            Map.entry("Cold Brew", "/images/products/cold-brew.jpg"),
            Map.entry("Croissant", "/images/products/croissant.jpg"),
            Map.entry("Blueberry Muffin", "/images/products/blueberry-muffin.jpg"),
            Map.entry("Cinnamon Roll", "/images/products/cinnamon-roll.jpg"),
            Map.entry("Scone", "/images/products/scone.jpg"),
            Map.entry("Chocolate Cake", "/images/products/chocolate-cake.jpg"),
            Map.entry("Cheesecake", "/images/products/cheesecake.jpg"),
            Map.entry("Carrot Cake", "/images/products/carrot-cake.jpg"),
            Map.entry("Tiramisu", "/images/products/tiramisu.jpg"),
            Map.entry("Earl Grey", "/images/products/earl-grey.jpg"),
            Map.entry("Green Tea", "/images/products/green-tea.jpg"),
            Map.entry("Chai Latte", "/images/products/chai-latte.jpg"),
            Map.entry("Matcha Latte", "/images/products/matcha-latte.jpg"),
            Map.entry("Grilled Cheese", "/images/products/grilled-cheese.jpg"),
            Map.entry("Turkey Club", "/images/products/turkey-club.jpg"),
            Map.entry("Veggie Wrap", "/images/products/veggie-wrap.jpg")
        );
        for (Product product : productRepository.findAll()) {
            if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
                String url = imageMap.get(product.getName());
                if (url != null) {
                    product.setImageUrl(url);
                    productRepository.save(product);
                }
            }
        }
    }

    private void seedUsers() {
        User admin = new User();
        admin.setName("Admin");
        admin.setEmail("admin@bloomscafe.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setAddress("123 Admin St");
        admin.setRole(Role.ADMIN);

        User staff = new User();
        staff.setName("Staff");
        staff.setEmail("staff@bloomscafe.com");
        staff.setPassword(passwordEncoder.encode("staff123"));
        staff.setAddress("456 Staff Ave");
        staff.setRole(Role.STAFF);

        User customer = new User();
        customer.setName("John Doe");
        customer.setEmail("john@example.com");
        customer.setPassword(passwordEncoder.encode("customer123"));
        customer.setAddress("789 Customer Rd");
        customer.setRole(Role.CUSTOMER);

        userRepository.saveAll(List.of(admin, staff, customer));
    }

    private void seedCategories() {
        Category coffee = new Category();
        coffee.setName("Coffee");

        Category pastries = new Category();
        pastries.setName("Pastries");

        Category cakes = new Category();
        cakes.setName("Cakes");

        Category tea = new Category();
        tea.setName("Tea");

        Category sandwiches = new Category();
        sandwiches.setName("Sandwiches");

        categoryRepository.saveAll(List.of(coffee, pastries, cakes, tea, sandwiches));

        seedProducts(coffee, pastries, cakes, tea, sandwiches);
    }

    private void seedProducts(Category coffee, Category pastries, Category cakes, Category tea, Category sandwiches) {
        List<Product> products = List.of(
                createProduct("Espresso", new BigDecimal("3.50"), 100, coffee, "/images/products/espresso.jpg"),
                createProduct("Latte", new BigDecimal("4.50"), 80, coffee, "/images/products/latte.jpg"),
                createProduct("Cappuccino", new BigDecimal("4.00"), 75, coffee, "/images/products/cappuccino.jpg"),
                createProduct("Mocha", new BigDecimal("5.00"), 60, coffee, "/images/products/mocha.jpg"),
                createProduct("Cold Brew", new BigDecimal("4.75"), 50, coffee, "/images/products/cold-brew.jpg"),

                createProduct("Croissant", new BigDecimal("3.00"), 40, pastries, "/images/products/croissant.jpg"),
                createProduct("Blueberry Muffin", new BigDecimal("3.50"), 35, pastries, "/images/products/blueberry-muffin.jpg"),
                createProduct("Cinnamon Roll", new BigDecimal("4.00"), 30, pastries, "/images/products/cinnamon-roll.jpg"),
                createProduct("Scone", new BigDecimal("3.25"), 25, pastries, "/images/products/scone.jpg"),

                createProduct("Chocolate Cake", new BigDecimal("6.00"), 20, cakes, "/images/products/chocolate-cake.jpg"),
                createProduct("Cheesecake", new BigDecimal("6.50"), 15, cakes, "/images/products/cheesecake.jpg"),
                createProduct("Carrot Cake", new BigDecimal("5.50"), 18, cakes, "/images/products/carrot-cake.jpg"),
                createProduct("Tiramisu", new BigDecimal("7.00"), 12, cakes, "/images/products/tiramisu.jpg"),

                createProduct("Earl Grey", new BigDecimal("3.00"), 60, tea, "/images/products/earl-grey.jpg"),
                createProduct("Green Tea", new BigDecimal("3.00"), 55, tea, "/images/products/green-tea.jpg"),
                createProduct("Chai Latte", new BigDecimal("4.25"), 45, tea, "/images/products/chai-latte.jpg"),
                createProduct("Matcha Latte", new BigDecimal("5.00"), 40, tea, "/images/products/matcha-latte.jpg"),

                createProduct("Grilled Cheese", new BigDecimal("6.50"), 25, sandwiches, "/images/products/grilled-cheese.jpg"),
                createProduct("Turkey Club", new BigDecimal("7.50"), 20, sandwiches, "/images/products/turkey-club.jpg"),
                createProduct("Veggie Wrap", new BigDecimal("6.00"), 22, sandwiches, "/images/products/veggie-wrap.jpg")
        );

        productRepository.saveAll(products);
    }

    private Product createProduct(String name, BigDecimal price, int stock, Category category, String imageUrl) {
        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        product.setStockQuantity(stock);
        product.setCategory(category);
        product.setImageUrl(imageUrl);
        return product;
    }
}
