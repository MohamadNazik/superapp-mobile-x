-- USER_GROUPS TABLE
CREATE TABLE IF NOT EXISTS user_groups (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,

    INDEX idx_user_groups_user (user_id),
    INDEX idx_user_groups_group (group_id),
    UNIQUE KEY uk_user_group (user_id, group_id),

    CONSTRAINT fk_user_groups_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_groups_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
