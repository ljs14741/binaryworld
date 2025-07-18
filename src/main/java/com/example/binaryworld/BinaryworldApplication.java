package com.example.binaryworld;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class BinaryworldApplication {

	public static void main(String[] args) {
		SpringApplication.run(BinaryworldApplication.class, args);
	}

}
