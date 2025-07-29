package com.axiom.server.services;

import com.axiom.server.models.Hashtag;
import com.axiom.server.repositories.HashtagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class HashtagService {

    private final HashtagRepository repository;

    public HashtagService(HashtagRepository repository) {
        this.repository = repository;
    }

    public List<Hashtag> getAllHashtags() {
        return repository.findAll();
    }

    public Hashtag createHashtag(Hashtag hashtag) {
        Optional<Hashtag> existing = repository.findByNameIgnoreCase(hashtag.getName());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Hashtag with name '" + hashtag.getName() + "' already exists");
        }
        return repository.save(hashtag);
    }
}
