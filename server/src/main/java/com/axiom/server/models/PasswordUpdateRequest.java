package com.axiom.server.models;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class PasswordUpdateRequest {

    private String oldPassword;
    private String newPassword;
}
