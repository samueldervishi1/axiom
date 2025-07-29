package com.axiom.server.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserLiteDTO {

    private Long id;
    private String username;
    private String fullName;

    public UserLiteDTO(Long id, String username, String fullName) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
    }
}
