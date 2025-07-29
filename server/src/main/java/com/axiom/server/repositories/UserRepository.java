package com.axiom.server.repositories;

import com.axiom.server.models.User;
import com.axiom.server.models.UserLiteDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);

    @Query("SELECT u.username FROM User u WHERE u.id = :userId")
    Optional<String> findUsernameById(@Param("userId") Long userId);

    @Query("SELECT new com.axiom.server.models.UserLiteDTO(u.id, u.username, u.fullName) "
            + "FROM User u WHERE u.id IN :ids")
    List<UserLiteDTO> findUserLiteByIdIn(@Param("ids") List<Long> ids);

    @Query("SELECT u.followers FROM User u WHERE u.id = :userId")
    Optional<List<String>> findFollowersById(@Param("userId") Long userId);

    @Query("SELECT u.following FROM User u WHERE u.id = :userId")
    Optional<List<String>> findFollowingById(@Param("userId") Long userId);
}
