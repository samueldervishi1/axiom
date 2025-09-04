package com.twizzle.server.services;

import com.twizzle.server.models.User;
import com.twizzle.server.repositories.SearchRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class SearchService {

    private final SearchRepository searchRepository;

    public SearchService(SearchRepository searchRepository) {
        this.searchRepository = searchRepository;
    }

    public List<User> searchUsers(String query) {
        if (!StringUtils.hasText(query) || query.trim().length() < 2) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, 20);

        return searchRepository.searchUsers(query.trim(), pageable);
    }
}
