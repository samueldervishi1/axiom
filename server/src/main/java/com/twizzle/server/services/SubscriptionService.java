package com.twizzle.server.services;

import com.twizzle.server.models.SubscriptionPlan;
import com.twizzle.server.models.User;
import com.twizzle.server.repositories.SubscriptionPlanRepository;
import com.twizzle.server.repositories.UserRepository;
import com.twizzle.server.utils.JwtTokenUtil;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionCancelParams;
import com.stripe.param.checkout.SessionCreateParams;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class SubscriptionService {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final JwtTokenUtil jwtTokenUtil;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    public SubscriptionService(UserRepository userRepository, SubscriptionPlanRepository subscriptionPlanRepository,
            JwtTokenUtil jwtTokenUtil) {
        this.userRepository = userRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    private void initStripe() {
        Stripe.apiKey = stripeSecretKey;
    }

    public List<SubscriptionPlan> getActivePlans() {
        return subscriptionPlanRepository.findByActiveTrue();
    }

    public Map<String, String> createCheckoutSession(String token, String planType, String successUrl, String cancelUrl)
            throws Exception {
        initStripe();

        Claims claims = jwtTokenUtil.parseAndValidateToken(token.replace("Bearer ", ""));
        String username = claims.getSubject();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new Exception("User not found"));

        SubscriptionPlan plan = subscriptionPlanRepository.findByPlanType(planType)
                .orElseThrow(() -> new Exception("Plan not found"));

        String customerId = getOrCreateStripeCustomer(user);

        SessionCreateParams params = SessionCreateParams.builder().setCustomer(customerId)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}").setCancelUrl(cancelUrl)
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .addLineItem(SessionCreateParams.LineItem.builder().setPrice(plan.getStripePriceId()).setQuantity(1L)
                        .build())
                .putMetadata("userId", user.getId().toString()).putMetadata("planType", planType).build();

        Session session = Session.create(params);

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("url", session.getUrl());

        return response;
    }

    private String getOrCreateStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) {
            return user.getStripeCustomerId();
        }

        CustomerCreateParams params = CustomerCreateParams.builder().setEmail(user.getEmail())
                .setName(user.getFullName()).putMetadata("userId", user.getId().toString()).build();

        Customer customer = Customer.create(params);

        user.setStripeCustomerId(customer.getId());
        userRepository.save(user);

        return customer.getId();
    }

    public void cancelSubscription(String token) throws Exception {
        initStripe();

        Claims claims = jwtTokenUtil.parseAndValidateToken(token.replace("Bearer ", ""));
        String username = claims.getSubject();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new Exception("User not found"));

        if (user.getStripeCustomerId() == null) {
            throw new Exception("No active subscription found");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("customer", user.getStripeCustomerId());
        params.put("status", "active");

        for (Subscription subscription : Subscription.list(params).getData()) {
            SubscriptionCancelParams cancelParams = SubscriptionCancelParams.builder().build();
            subscription.cancel(cancelParams);
        }

        updateUserSubscription(user, "cancelled", "free");
        user.setIsVerified(false);
        userRepository.save(user);
    }

    public Map<String, Object> getSubscriptionStatus(String token) throws Exception {
        Claims claims = jwtTokenUtil.parseAndValidateToken(token.replace("Bearer ", ""));
        String username = claims.getSubject();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new Exception("User not found"));

        Map<String, Object> status = new HashMap<>();
        status.put("subscriptionStatus", user.getSubscriptionStatus());
        status.put("planType", user.getPlanType());
        status.put("role", user.getRole());

        if (user.getSubscriptionEndDate() != null) {
            status.put("subscriptionEndDate", user.getSubscriptionEndDate().toString());
        }

        return status;
    }

    public void handleWebhook(String payload, String sigHeader) throws Exception {
        initStripe();

        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

        System.out.println("DEBUG: Received webhook event: " + event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" :
                System.out.println("DEBUG: Processing checkout.session.completed event");
                handleCheckoutSessionCompleted(event);
                break;
            case "customer.subscription.updated" :
                System.out.println("DEBUG: Processing customer.subscription.updated event");
                handleSubscriptionUpdated(event);
                break;
            case "customer.subscription.deleted" :
                System.out.println("DEBUG: Processing customer.subscription.deleted event");
                handleSubscriptionDeleted(event);
                break;
            default :
                System.out.println("DEBUG: Unhandled event type: " + event.getType());
                break;
        }
    }

    private void handleCheckoutSessionCompleted(Event event) {
        try {
            Session session;

            try {
                session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            } catch (Exception e) {
                throw new Exception("Deserialization approach failed: " + e.getMessage());
            }
            if (session == null) {
                try {
                    String eventData = event.getData().toString();
                    if (eventData.contains("cs_test_") || eventData.contains("cs_live_")) {
                        String pattern = eventData.contains("cs_test_") ? "cs_test_" : "cs_live_";
                        int startIndex = eventData.indexOf(pattern);
                        if (startIndex != -1) {
                            int endIndex = eventData.indexOf("\"", startIndex);
                            String sessionId = eventData.substring(startIndex, endIndex);
                            session = Session.retrieve(sessionId);
                        }
                    }
                } catch (Exception e) {
                    throw new Exception("Deserialization approach failed: " + e.getMessage());
                }
            }

            if (session == null) {
                return;
            }

            String userIdStr = session.getMetadata().get("userId");
            String planType = session.getMetadata().get("planType");

            if (userIdStr == null || planType == null) {
                return;
            }

            Long userId = Long.parseLong(userIdStr);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                updateUserSubscription(user, "active", planType);
                updateUserRole(user, planType);
                user.setIsVerified(true);
                userRepository.save(user);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to handle checkout.session.completed event: " + e.getMessage());
        }
    }

    private void handleSubscriptionUpdated(Event event) {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
        if (subscription == null)
            return;

        Optional<User> userOpt = userRepository.findByStripeCustomerId(subscription.getCustomer());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String status = subscription.getStatus();

            LocalDateTime endDate = null;
            Long currentPeriodEnd = null;

            if (subscription.getItems() != null && !subscription.getItems().getData().isEmpty()) {
                currentPeriodEnd = subscription.getItems().getData().stream().map(SubscriptionItem::getCurrentPeriodEnd)
                        .filter(Objects::nonNull).max(Long::compareTo).orElse(null);
            }

            if (currentPeriodEnd != null) {
                endDate = LocalDateTime.ofInstant(Instant.ofEpochSecond(currentPeriodEnd), ZoneId.systemDefault());
            }

            String planType = "free";
            if (!subscription.getItems().getData().isEmpty()) {
                String priceId = subscription.getItems().getData().get(0).getPrice().getId();
                Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByStripePriceId(priceId);
                if (planOpt.isPresent()) {
                    planType = planOpt.get().getPlanType();
                }
            }

            user.setSubscriptionStatus(status);
            user.setSubscriptionEndDate(endDate);
            user.setPlanType(planType);

            if ("active".equals(status)) {
                updateUserRole(user, planType);
                user.setIsVerified(true);
            } else {
                user.setRole("simple_account");
                user.setIsVerified(false);
            }

            userRepository.save(user);
        }
    }

    private void handleSubscriptionDeleted(Event event) {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
        if (subscription == null)
            return;

        Optional<User> userOpt = userRepository.findByStripeCustomerId(subscription.getCustomer());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            updateUserSubscription(user, "cancelled", "free");
            updateUserRole(user, "free");
            user.setIsVerified(false);
            userRepository.save(user);
        }
    }

    private void updateUserSubscription(User user, String status, String planType) {
        user.setSubscriptionStatus(status);
        user.setPlanType(planType);

        if ("active".equals(status)) {
            user.setSubscriptionStartDate(LocalDateTime.now());
        }

        userRepository.save(user);
    }

    private void updateUserRole(User user, String planType) {
        String newRole = switch (planType.toLowerCase()) {
            case "pro" -> "pro_account";
            case "ultimate" -> "ultimate_account";
            default -> "simple_account";
        };

        user.setRole(newRole);
        userRepository.save(user);
    }
}
