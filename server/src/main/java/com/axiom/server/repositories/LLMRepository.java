package com.axiom.server.repositories;

import com.axiom.server.models.LLM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LLMRepository extends JpaRepository<LLM, Long> {
}
