package com.example.backend.dto;

/**
 * CreateOrgRequestDTO: Captures the data sent by the client when creating a new team.
 */
public class CreateOrgRequestDTO {

    private String name;

    // Required by Jackson to instantiate the object from JSON
    public CreateOrgRequestDTO() {}

    public CreateOrgRequestDTO(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
