package com.smartpc.modules.ruleengine.entity;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "compat_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompatRule {

    @Id
    @Column(name = "rule_id", length = 36, nullable = false)
    private String ruleId;

    @Column(name = "rule_name", length = 255, nullable = false)
    private String ruleName;

    @Column(name = "source_category", length = 50, nullable = false)
    private String sourceCategory;

    @Column(name = "target_category", length = 50, nullable = false)
    private String targetCategory;

    @Column(name = "source_spec_key", length = 100, nullable = false)
    private String sourceSpecKey;

    @Column(name = "target_spec_key", length = 100, nullable = false)
    private String targetSpecKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "operator", length = 20, nullable = false)
    private RuleOperator operator;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false)
    private RuleSeverity severity;

    @Column(name = "error_message_template", columnDefinition = "text", nullable = false)
    private String errorMessageTemplate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.ruleId == null || this.ruleId.isBlank()) {
            this.ruleId = UUID.randomUUID().toString();
        }
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.priority == null) {
            this.priority = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
