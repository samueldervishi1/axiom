package com.axiom.server.repositories;

import com.axiom.server.models.Axiom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AxiomRepository extends JpaRepository<Axiom, Long> {
    List<Axiom> findByConversationIdOrderByCreatedAtAsc(String conversationId);
}
