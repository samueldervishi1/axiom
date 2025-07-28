package com.chattr.server.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserInfo {
    private String username;
    private Long userId;
    private String status;
    private String message;
}
