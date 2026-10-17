package com.example.pokemon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Entry point. This project only starts a web server that serves the frontend
// found in src/main/resources/static (index.html, css/, js/).
@SpringBootApplication
public class PokemonApplication {

    public static void main(String[] args) {
        SpringApplication.run(PokemonApplication.class, args);
    }
}
