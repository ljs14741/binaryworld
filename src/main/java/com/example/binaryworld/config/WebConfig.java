package com.example.binaryworld.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 공용 헤더·푸터는 모든 서브도메인이 불러가서 메뉴 바꾸면 바로 보이게 매번 확인시킴 (안 바뀌었으면 304)
        registry.addResourceHandler("/common/**")
                .addResourceLocations("classpath:/static/common/")
                .setCacheControl(CacheControl.noCache());
    }
}
