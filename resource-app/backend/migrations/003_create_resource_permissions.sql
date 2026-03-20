-- RESOURCE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS `resource_permissions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `resource_id` VARCHAR(36) NOT NULL,
    `group_id` VARCHAR(36) NOT NULL,
    `permission_type` VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_resource_permissions_resource` (`resource_id`),
    INDEX `idx_resource_permissions_group` (`group_id`),
    UNIQUE KEY `uk_resource_group_permission` (`resource_id`, `group_id`, `permission_type`),

    CONSTRAINT `fk_resource_permissions_resource`
        FOREIGN KEY (`resource_id`)
        REFERENCES `resources`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `fk_resource_permissions_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
