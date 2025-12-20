package com.cloudapp.socialforum.repository;

import com.cloudapp.socialforum.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    List<Post> findAllByOrderByCreatedAtDesc();
    
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<Post> findByShareToken(String shareToken);
    
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Post> searchByContent(@Param("query") String query);
    
    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :tag, '%'))")
    List<Post> searchByTag(@Param("tag") String tag);
}
