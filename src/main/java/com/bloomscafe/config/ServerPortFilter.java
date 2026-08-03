package com.bloomscafe.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ServerPortFilter extends OncePerRequestFilter {

    private final String port;

    public ServerPortFilter(Environment env) {
        this.port = env.getProperty("server.port", "8080");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        response.setHeader("X-Server-Port", port);
        filterChain.doFilter(request, response);
    }
}
