package com.axiom.server.repositories;

import com.axiom.server.models.Axiom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AxiomRepository extends JpaRepository<Axiom, Long> {
    List<Axiom> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    List<Axiom> findByUserIdOrderByConversationIdAscCreatedAtAsc(String userId);

    @Modifying
    @Query("DELETE FROM Axiom a WHERE a.conversationId = :conversationId")
    void deleteByConversationId(@Param("conversationId") String conversationId);
}
