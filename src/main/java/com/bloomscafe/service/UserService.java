package com.bloomscafe.service;

import com.bloomscafe.entity.User;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 1. Fetch All Users (Paginated)
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    // 2. Find User by ID
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found with ID: " + id));
    }

    // 3. Create a New User
    @Transactional
    public User createUser(User user) {
        return userRepository.save(user);
    }

    // 4. Update an Existing User
    @Transactional
    public User updateUser(Long id, User userDetails) {
        User existingUser = getUserById(id); // Reuses method #2 to check if they exist

        existingUser.setName(userDetails.getName());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        existingUser.setAddress(userDetails.getAddress());
        existingUser.setRole(userDetails.getRole());

        return userRepository.save(existingUser);
    }

    // 5. Delete a User
    @Transactional
    public void deleteUser(Long id) {
        User existingUser = getUserById(id);
        userRepository.delete(existingUser);
    }
}