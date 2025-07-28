package com.chattr.server.repositories;

import com.chattr.server.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByUserIdAndPostId(String userId, Long postId);
}
