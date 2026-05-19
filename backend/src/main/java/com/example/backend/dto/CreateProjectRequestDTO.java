package com.example.backend.dto;

/**
 * CreateProjectRequestDTO: Captures incoming details for a new project.
 * Restricts input to fields specified by the user during creation.
 */
public class CreateProjectRequestDTO {

    private String name;
    private String description;

    // Default constructor required by Jackson for JSON decoding
    public CreateProjectRequestDTO() {}

    public CreateProjectRequestDTO(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
