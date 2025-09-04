package com.twizzle.server.repositories;

import com.twizzle.server.models.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
}
