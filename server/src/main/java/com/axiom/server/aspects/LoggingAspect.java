package com.axiom.server.aspects;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Pointcut("within(com.axiom.server..*) && " + "!within(com.axiom.server.utils.JwtAuthenticationFilter) && "
            + "!within(com.axiom.server.utils.JwtTokenUtil) && "
            + "!execution(* com.axiom.server.services.*.findAndValidateUser(..)) && "
            + "!execution(* com.axiom.server.services.*.verifyPassword(..)) && "
            + "!execution(* com.axiom.server.services.ProfileService.getProfileImage(..)) && "
            + "!execution(* com.axiom.server.services.ProfileService.getProfileImageContentType(..)) && "
            + "!execution(* com.axiom.server.services.DBService.getPostImageData(..)) && "
            + "!execution(* com.axiom.server.services.DBService.createPostWithImage(..))")
    public void applicationPackagePointcut() {
    }

    @Around("applicationPackagePointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        Object[] args = joinPoint.getArgs();

        log.info("Entering {} with arguments: {}", method, formatArguments(args));
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;

            log.info("Exiting {} with result: {} ({} ms)", method, formatResult(result), duration);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;

            log.error("Exception in {} with cause = {} ({} ms)", method,
                    ex.getCause() != null ? ex.getCause() : ex.getMessage(), duration);

            throw ex;
        }
    }

    private String formatArguments(Object[] args) {
        if (args == null)
            return "null";

        Object[] formattedArgs = new Object[args.length];
        for (int i = 0; i < args.length; i++) {
            formattedArgs[i] = formatObject(args[i]);
        }
        return Arrays.toString(formattedArgs);
    }

    private String formatResult(Object result) {
        return formatObject(result);
    }

    private String formatObject(Object obj) {
        if (obj == null)
            return "null";

        if (obj instanceof byte[] byteArray) {
            return String.format("<byte array of length %d>", byteArray.length);
        }

        return obj.toString();
    }
}
