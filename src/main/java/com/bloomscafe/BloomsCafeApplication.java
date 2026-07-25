package com.bloomscafe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class BloomsCafeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BloomsCafeApplication.class, args);
    }

}
