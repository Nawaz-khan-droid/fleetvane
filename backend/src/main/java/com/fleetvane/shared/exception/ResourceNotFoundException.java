package com.fleetvane.shared.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super("%s not found with %s: %s".formatted(resourceName, fieldName, fieldValue));
    }
}
