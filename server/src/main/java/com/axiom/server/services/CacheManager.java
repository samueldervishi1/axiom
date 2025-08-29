package com.axiom.server.services;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class CacheManager {

    private final Map<String, Cache<?, ?>> caches = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <K, V> Cache<K, V> getCache(String cacheName) {
        return (Cache<K, V>) caches.computeIfAbsent(cacheName, name -> Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS).maximumSize(500).recordStats().build());
    }

    @SuppressWarnings("unchecked")
    public <K, V> Cache<K, V> getCache(String cacheName, long ttlSeconds, long maxSize) {
        return (Cache<K, V>) caches.computeIfAbsent(cacheName, name -> Caffeine.newBuilder()
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS).maximumSize(maxSize).recordStats().build());
    }

    public void clearCache(String cacheName) {
        Cache<?, ?> cache = caches.get(cacheName);
        if (cache != null) {
            cache.invalidateAll();
        }
    }

}
