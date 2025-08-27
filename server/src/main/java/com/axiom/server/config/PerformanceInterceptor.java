package com.axiom.server.config;

import com.axiom.server.services.PerformanceMonitoringService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class PerformanceInterceptor implements HandlerInterceptor {

    private final PerformanceMonitoringService performanceMonitoringService;
    private static final String START_TIME_ATTRIBUTE = "startTime";

    @Override
    public boolean preHandle(HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler, Exception ex) {

        Long startTime = (Long) request.getAttribute(START_TIME_ATTRIBUTE);
        if (startTime != null) {
            long responseTime = System.currentTimeMillis() - startTime;
            String endpoint = getEndpointPath(request);

            if (response.getStatus() >= 400) {
                performanceMonitoringService.recordError(endpoint);
            }

            performanceMonitoringService.recordRequest(endpoint, responseTime);

            log.debug("Request completed: {} {} - {}ms - Status: {}", request.getMethod(), endpoint, responseTime,
                    response.getStatus());
        }
    }

    private String getEndpointPath(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if (path.contains("?")) {
            path = path.substring(0, path.indexOf("?"));
        }

        path = normalizePath(path);

        return method + " " + path;
    }

    private String normalizePath(String path) {
        return path.replaceAll("/\\d+", "/{id}")
                .replaceAll("/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}", "/{uuid}");
    }
}
