package com.example.backend.repository;

import com.example.backend.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * MembershipRepository: Manages the relationship bridge between Users and Organizations.
 * This is the core of our Multi-tenant Permission system.
 */
@Repository
public interface MembershipRepository extends JpaRepository<Membership, UUID> {
    List<Membership> findByUserId(UUID userId);
    List<Membership> findByOrganizationId(UUID orgId);
    Optional<Membership> findByUserIdAndOrganizationId(UUID userId, UUID orgId);
}
