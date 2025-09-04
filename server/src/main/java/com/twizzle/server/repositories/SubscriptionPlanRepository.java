package com.twizzle.server.repositories;

import com.twizzle.server.models.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    List<SubscriptionPlan> findByActiveTrue();

    Optional<SubscriptionPlan> findByPlanType(String planType);

    Optional<SubscriptionPlan> findByStripePriceId(String stripePriceId);
}
