package com.example.backend.repository;
import com.example.backend.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByOrganizationIdAndAcceptedFalse(UUID organizationId);
    Optional<Invitation> findByEmailAndOrganizationIdAndAcceptedFalse(String email, UUID organizationId);
}