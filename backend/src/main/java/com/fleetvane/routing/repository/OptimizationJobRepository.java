package com.fleetvane.routing.repository;

import com.fleetvane.routing.entity.OptimizationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OptimizationJobRepository extends JpaRepository<OptimizationJob, UUID> {
}
