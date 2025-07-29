package com.axiom.server.repositories;

import com.axiom.server.models.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SearchRepository extends JpaRepository<User, String> {

    @Query("SELECT u FROM User u WHERE " + "UPPER(u.username) LIKE UPPER(CONCAT('%', :query, '%')) OR "
            + "UPPER(u.fullName) LIKE UPPER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(@Param("query") String query, Pageable pageable);
}
