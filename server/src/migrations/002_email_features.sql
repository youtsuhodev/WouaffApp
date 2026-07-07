SET @emailVerifiedExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profiles' AND COLUMN_NAME='emailVerified');
SET @sql1 = IF(@emailVerifiedExists=0, 'ALTER TABLE profiles ADD COLUMN emailVerified TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

CREATE TABLE IF NOT EXISTS email_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  token VARCHAR(64) NOT NULL,
  type ENUM('verify','reset') NOT NULL,
  expiresAt BIGINT NOT NULL,
  used TINYINT(1) DEFAULT 0,
  createdAt BIGINT NOT NULL,
  INDEX idx_email_tokens_token (token),
  INDEX idx_email_tokens_uid (uid)
);
