package com.chattr.server.exceptions;

import com.chattr.server.models.Error;
import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {

    private final int code;
    private final Error faultObject;

    public CustomException(String message) {
        super(message);
        this.code = 400;
        this.faultObject = null;
    }

    public CustomException(int code, String message) {
        super(message);
        this.code = code;
        this.faultObject = null;
    }

    public CustomException(int code, Error faultObject) {
        super(faultObject != null ? faultObject.getMessage() : "Unknown error");
        this.code = code;
        this.faultObject = faultObject;
    }

    public CustomException(Error faultObject) {
        super(faultObject != null ? faultObject.getMessage() : "Unknown error");
        this.code = 400;
        this.faultObject = faultObject;
    }

    public CustomException(int code, String message, Error faultObject) {
        super(message);
        this.code = code;
        this.faultObject = faultObject;
    }
}
