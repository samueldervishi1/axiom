package com.axiom.server.repositories;

import com.axiom.server.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByUserIdAndPostId(String userId, Long postId);
}
