package com.fleetvane.ui.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/manager")
    public String managerDashboard() {
        return "manager";
    }

    @GetMapping("/driver")
    public String driverDashboard() {
        return "driver";
    }

    @GetMapping("/client")
    public String clientDashboard() {
        return "client";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }
}
