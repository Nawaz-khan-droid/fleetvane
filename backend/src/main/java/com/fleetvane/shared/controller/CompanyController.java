package com.fleetvane.shared.controller;

import com.fleetvane.shared.dto.CompanyDto;
import com.fleetvane.shared.entity.Company;
import com.fleetvane.shared.repository.CompanyRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyRepository companyRepository;

    public CompanyController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @GetMapping
    public List<CompanyDto> getCompanies(@RequestParam(required = false) String type) {
        List<Company> companies;
        if (type != null && !type.isBlank()) {
            companies = companyRepository.findByType(type.toUpperCase());
        } else {
            companies = companyRepository.findAll();
        }
        
        return companies.stream()
                .map(c -> new CompanyDto(c.getId(), c.getName(), c.getType()))
                .collect(Collectors.toList());
    }
}
