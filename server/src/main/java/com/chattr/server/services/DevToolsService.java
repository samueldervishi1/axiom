package com.chattr.server.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class DevToolsService {

    private static final Logger logger = LoggerFactory.getLogger(DevToolsService.class);

    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getHoroscope(String sign) {
        List<String> validSigns = Arrays.asList(validSignsProperty.split(","));
        if (!validSigns.contains(sign.toLowerCase().trim())) {
            return Map.of("error", "Invalid sign. Valid signs: " + validSigns);
        }

        String sanitizedSign = sign.toLowerCase().replaceAll("[^a-z]", "");

        if (!validSigns.contains(sanitizedSign)) {
            return Map.of("error", "Invalid sign after sanitization");
        }

        try {
            String url = UriComponentsBuilder.fromUriString(horoscopeApiBaseUrl).path("/daily")
                    .queryParam("sign", sanitizedSign).queryParam("day", "today").encode().toUriString();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {
                    });

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                return Map.of("sign", sanitizedSign.toUpperCase(), "horoscope",
                        responseBody.getOrDefault("data", "Stars are aligned for you today"), "date",
                        LocalDate.now().toString());
            }
        } catch (Exception e) {
            logger.error("Horoscope service error: {}", e.getMessage());
            return Map.of("error", "Horoscope service unavailable");
        }

        return Map.of("error", "Could not fetch horoscope");
    }

    public Map<String, String> getEasterEgg() {
        return Map.of("message", "You found the secret API!", "developer", "Built by " + projectTeam, "coffee",
                "This API was built on " + getCoffeeCount() + " cups of coffee", "energy_drinks",
                "Powered by " + getEnergyDrinkCount() + " energy drinks", "total_caffeine",
                "Total caffeine consumed: " + getTotalCaffeineLevel() + "mg", "project_age",
                "Project running for " + getDaysSinceStart() + " days", "version", projectVersion);
    }

    public Map<String, Object> getServerMood() {
        List<String> moodsList = List.of(serverMoods.split(","));
        List<String> activitiesList = List.of(serverActivities.split(","));

        return Map.of("mood", moodsList.get(random.nextInt(moodsList.size())), "current_activity",
                activitiesList.get(random.nextInt(activitiesList.size())), "uptime_human", serverUptimeMessage,
                "temperature", random.nextInt(40) + 20 + "°C", "energy_level", random.nextInt(100) + 1 + "%",
                "last_reboot", serverLastReboot);
    }

    public Map<String, String> shouldIDeploy() {
        List<String> answersList = List.of(deployAnswers.split(","));
        List<String> confidenceList = List.of(deployConfidenceLevels.split(","));
        List<String> actionsList = List.of(deployActions.split(","));

        return Map.of("answer", answersList.get(random.nextInt(answersList.size())), "confidence",
                confidenceList.get(random.nextInt(confidenceList.size())), "recommended_action",
                actionsList.get(random.nextInt(actionsList.size())), "disclaimer", deployDisclaimer);
    }

    public Map<String, Object> getRubberDuckDebugging() {
        try {
            String advice = getRandomAdvice();

            String activitySuggestion = getActivitySuggestion();

            List<String> duckAdviceList = Arrays.asList(debuggingAdvice.split("\\|"));
            List<String> moodsList = Arrays.asList(duckMoods.split(","));
            List<String> personalitiesList = Arrays.asList(duckPersonalities.split(","));

            String selectedAdvice = duckAdviceList.get(random.nextInt(duckAdviceList.size()));
            String selectedMood = moodsList.get(random.nextInt(moodsList.size()));
            String selectedPersonality = personalitiesList.get(random.nextInt(personalitiesList.size()));

            return Map.of("duck_says", selectedAdvice, "duck_mood", selectedMood, "duck_personality",
                    selectedPersonality, "session_id", "rubber-duck-" + System.currentTimeMillis(), "general_wisdom",
                    advice != null ? advice : fallbackWisdom, "break_suggestion",
                    activitySuggestion != null ? activitySuggestion : fallbackBreakSuggestion, "debug_level",
                    random.nextInt(10) + 1, "rubber_duck_tip", rubberDuckTip);

        } catch (Exception e) {
            logger.error("Error in rubber duck debugging service: {}", e.getMessage());
            return getRubberDuckFallbackResponse();
        }
    }

    private String getRandomAdvice() {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(adviceApiUrl, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {
                    });

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                Object slipObj = responseBody.get("slip");
                if (slipObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> slip = (Map<String, Object>) slipObj;
                    return (String) slip.get("advice");
                }
            }

        } catch (Exception e) {
            logger.debug("Advice API unavailable: {}", e.getMessage());
        }

        return null;
    }

    private String getActivitySuggestion() {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(boredApiUrl, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {
                    });

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                String activity = (String) responseBody.get("activity");

                if (activity != null) {
                    return "When you need a break: " + activity.toLowerCase();
                }
            }

        } catch (Exception e) {
            logger.debug("Bored API unavailable: {}", e.getMessage());
        }

        return null;
    }

    private Map<String, Object> getRubberDuckFallbackResponse() {
        List<String> personalitiesList = Arrays.asList(duckPersonalities.split(","));
        String fallbackPersonality = personalitiesList.isEmpty()
                ? "The Understanding Duck"
                : personalitiesList.get(random.nextInt(personalitiesList.size()));

        return Map.of("duck_says", "Even I'm having technical difficulties! But that's debugging for you 🦆",
                "duck_mood", "sympathetic", "duck_personality", fallbackPersonality, "session_id",
                "rubber-duck-" + System.currentTimeMillis(), "general_wisdom", fallbackWisdom, "break_suggestion",
                fallbackBreakSuggestion, "debug_level", 5, "rubber_duck_tip", rubberDuckTip);
    }

    private int getCoffeeCount() {
        LocalDate projectStart = LocalDate.parse(projectStartDate);
        long daysSinceStart = ChronoUnit.DAYS.between(projectStart, LocalDate.now());
        return (int) (daysSinceStart * coffeePerDay);
    }

    private long getDaysSinceStart() {
        LocalDate projectStart = LocalDate.parse(projectStartDate);
        return ChronoUnit.DAYS.between(projectStart, LocalDate.now());
    }

    private int getEnergyDrinkCount() {
        LocalDate projectStart = LocalDate.parse(projectStartDate);
        long daysSinceStart = ChronoUnit.DAYS.between(projectStart, LocalDate.now());
        return (int) (daysSinceStart * energyDrinksPerDay);
    }

    private int getTotalCaffeineLevel() {
        return (getCoffeeCount() * coffeeMg) + (getEnergyDrinkCount() * energyDrinkMg);
    }

    @Value("${horoscope.api.base-url}")
    private String horoscopeApiBaseUrl;

    @Value("${horoscope.api.valid-signs}")
    private String validSignsProperty;

    @Value("${easter-egg.server.moods}")
    private String serverMoods;

    @Value("${easter-egg.server.activities}")
    private String serverActivities;

    @Value("${easter-egg.server.uptime-message}")
    private String serverUptimeMessage;

    @Value("${easter-egg.server.last-reboot}")
    private String serverLastReboot;

    @Value("${easter-egg.deploy.answers}")
    private String deployAnswers;

    @Value("${easter-egg.deploy.confidence-levels}")
    private String deployConfidenceLevels;

    @Value("${easter-egg.deploy.actions}")
    private String deployActions;

    @Value("${easter-egg.deploy.disclaimer}")
    private String deployDisclaimer;

    @Value("${easter-egg.project.start-date}")
    private String projectStartDate;

    @Value("${easter-egg.project.version}")
    private String projectVersion;

    @Value("${easter-egg.project.team}")
    private String projectTeam;

    @Value("${easter-egg.caffeine.coffee-per-day}")
    private double coffeePerDay;

    @Value("${easter-egg.caffeine.energy-drinks-per-day}")
    private double energyDrinksPerDay;

    @Value("${easter-egg.caffeine.coffee-mg}")
    private int coffeeMg;

    @Value("${easter-egg.caffeine.energy-drink-mg}")
    private int energyDrinkMg;

    @Value("${rubber-duck.advice-api.url}")
    private String adviceApiUrl;

    @Value("${rubber-duck.bored-api.url}")
    private String boredApiUrl;

    @Value("${rubber-duck.advice.debugging}")
    private String debuggingAdvice;

    @Value("${rubber-duck.moods}")
    private String duckMoods;

    @Value("${rubber-duck.personalities}")
    private String duckPersonalities;

    @Value("${rubber-duck.fallback.wisdom}")
    private String fallbackWisdom;

    @Value("${rubber-duck.fallback.break-suggestion}")
    private String fallbackBreakSuggestion;

    @Value("${rubber-duck.tip}")
    private String rubberDuckTip;
}
