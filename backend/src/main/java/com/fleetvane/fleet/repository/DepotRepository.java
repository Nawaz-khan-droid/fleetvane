package com.fleetvane.fleet.repository;

import com.fleetvane.fleet.entity.Depot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepotRepository extends JpaRepository<Depot, Long> {
    List<Depot> findByIsActiveTrue();
}
