package com.bloomscafe.dto;

import com.bloomscafe.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String address;
    private Role role;
}