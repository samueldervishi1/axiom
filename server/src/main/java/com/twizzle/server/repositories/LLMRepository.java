package com.twizzle.server.repositories;

import com.twizzle.server.models.LLM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LLMRepository extends JpaRepository<LLM, Long> {
}
