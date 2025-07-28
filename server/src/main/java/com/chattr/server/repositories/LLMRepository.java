package com.chattr.server.repositories;

import com.chattr.server.models.LLM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LLMRepository extends JpaRepository<LLM, Long> {
}
