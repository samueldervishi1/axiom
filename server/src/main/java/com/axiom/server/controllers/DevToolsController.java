package com.axiom.server.controllers;

import com.axiom.server.services.DevToolsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dev")
public class DevToolsController {

    private final DevToolsService devToolsService;

    public DevToolsController(DevToolsService devToolsService) {
        this.devToolsService = devToolsService;
    }

    @GetMapping("/horoscope/{sign}")
    public Map<String, Object> getRealHoroscope(@PathVariable String sign) {
        return devToolsService.getHoroscope(sign);
    }

    @GetMapping("/easter-egg")
    public Map<String, String> getEasterEgg() {
        return devToolsService.getEasterEgg();
    }

    @GetMapping("/server-mood")
    public Map<String, Object> getServerMood() {
        return devToolsService.getServerMood();
    }

    @GetMapping("/should-i-deploy")
    public Map<String, String> shouldIDeploy() {
        return devToolsService.shouldIDeploy();
    }

    @GetMapping("/rubber-duck")
    public Map<String, Object> rubberDuckDebugging() {
        return devToolsService.getRubberDuckDebugging();
    }
}
