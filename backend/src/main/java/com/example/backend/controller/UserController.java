package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder; // New import
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Constructor Injection->private final

    // 2. Inject the machine into the constructor
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public User createUser(@RequestBody User newUser) {
        // 3. Hash the plain text password from Postman
        String plainPassword = newUser.getPasswordHash();
        String hashedPassword = passwordEncoder.encode(plainPassword);
        
        // 4. Set the new scrambled password back onto the user
        newUser.setPasswordHash(hashedPassword);
        
        // 5. Save safely to the database!
        return userRepository.save(newUser);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}