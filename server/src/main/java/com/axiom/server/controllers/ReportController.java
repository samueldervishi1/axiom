package com.axiom.server.controllers;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.Report;
import com.axiom.server.services.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/report")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<Report> reportPost(@RequestBody Report report) {
        try {
            Report savedReport = reportService.report(report);
            return ResponseEntity.ok(savedReport);
        } catch (Exception e) {
            throw new CustomException(500, "Failed to create report");
        }
    }
}
