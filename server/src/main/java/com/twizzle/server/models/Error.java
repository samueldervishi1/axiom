package com.twizzle.server.models;

import lombok.Getter;
import lombok.Setter;
import org.springframework.validation.annotation.Validated;

import java.util.Objects;

@Setter
@Getter
@Validated
public class Error {

    private String code = null;
    private String message = null;
    private String status = null;
    private String reason = null;
    private String hint = null;
    private String vibe = null;

    public Error code(String code) {
        this.code = code;
        return this;
    }

    public Error message(String message) {
        this.message = message;
        return this;
    }

    public Error status(String status) {
        this.status = status;
        return this;
    }

    public Error reason(String reason) {
        this.reason = reason;
        return this;
    }

    public Error hint(String hint) {
        this.hint = hint;
        return this;
    }

    public Error vibe(String vibe) {
        this.vibe = vibe;
        return this;
    }

    public static Error success(String message) {
        return new Error().code("200").message(message).reason(message).status("success").vibe("accomplished")
                .hint("Welcome aboard!");
    }

    public static Error badRequest(String message) {
        return new Error().code("400").message(message).status("error").vibe("not impressed").reason(message)
                .hint("Double-check your request");
    }

    public static Error unauthorized(String message) {
        return new Error().code("401").message("Who goes there?").status("error").reason(message).vibe("suspicious")
                .hint("Check your credentials");
    }

    public static Error forbidden(String message) {
        return new Error().code("403").message("Access denied").status("error").reason(message).vibe("protective")
                .hint("You need proper permissions");
    }

    public static Error notFound(String message) {
        return new Error().code("404").message("Nothing to see here").status("error").reason(message).vibe("confused")
                .hint("Check the URL or try searching");
    }

    public static Error serverError(String message) {
        return new Error().code("500").message("Server had a moment").status("error")
                .reason(message != null ? message : "We're looking into it").vibe("stressed")
                .hint("Try again in a bit");
    }

    public static Error custom(String code, String message, String status) {
        return new Error().code(code).message(message).status(status);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Error error = (Error) o;
        return Objects.equals(code, error.code) && Objects.equals(message, error.message)
                && Objects.equals(status, error.status) && Objects.equals(reason, error.reason)
                && Objects.equals(hint, error.hint) && Objects.equals(vibe, error.vibe);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, message, status, reason, hint, vibe);
    }

    @Override
    public String toString() {
        return "Error{" + "code='" + code + '\'' + ", message='" + message + '\'' + ", status='" + status + '\''
                + ", vibe='" + vibe + '\'' + '}';
    }
}
