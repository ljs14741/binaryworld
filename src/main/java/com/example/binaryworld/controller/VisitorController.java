package com.example.binaryworld.controller;

import com.example.binaryworld.entity.DailyVisitor;
import com.example.binaryworld.entity.TotalVisitor;
import com.example.binaryworld.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visit")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;

    @GetMapping("/today")
    public List<DailyVisitor> getTodayVisitors() {
        return visitorService.getTodayAllVisitors();
    }

    @GetMapping("/total")
    public List<TotalVisitor> getTotalVisitors() {
        return visitorService.getAllTotalVisitors();
    }
}