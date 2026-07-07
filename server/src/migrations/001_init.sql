CREATE TABLE IF NOT EXISTS profiles (
  uid VARCHAR(128) PRIMARY KEY,
  pseudo VARCHAR(100) DEFAULT '',
  bio TEXT DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  passwordHash VARCHAR(255) DEFAULT NULL,
  avatar TEXT DEFAULT NULL,
  banner TEXT DEFAULT NULL,
  wouaffId VARCHAR(50) DEFAULT NULL,
  publicKey TEXT DEFAULT NULL,
  status ENUM('online','offline','idle') DEFAULT 'offline',
  lastSeen BIGINT DEFAULT 0,
  createdAt BIGINT DEFAULT 0,
  UNIQUE KEY uk_email (email)
);

CREATE TABLE IF NOT EXISTS contacts (
  uid VARCHAR(128) NOT NULL,
  contactUid VARCHAR(128) NOT NULL,
  addedAt BIGINT DEFAULT 0,
  PRIMARY KEY (uid, contactUid)
);

CREATE TABLE IF NOT EXISTS wouaff_id_index (
  wouaffId VARCHAR(50) PRIMARY KEY,
  uid VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  convId VARCHAR(256) NOT NULL,
  msgKey VARCHAR(100) NOT NULL,
  fromUid VARCHAR(128) NOT NULL,
  text TEXT DEFAULT NULL,
  type VARCHAR(20) DEFAULT 'text',
  time BIGINT NOT NULL,
  seen BIGINT DEFAULT 0,
  deleted TINYINT(1) DEFAULT 0,
  edited TINYINT(1) DEFAULT 0,
  replyTo VARCHAR(100) DEFAULT NULL,
  messageTheme VARCHAR(50) DEFAULT NULL,
  encrypted TINYINT(1) DEFAULT 0,
  ct TEXT DEFAULT NULL,
  iv VARCHAR(255) DEFAULT NULL,
  imageData TEXT DEFAULT NULL,
  fileData TEXT DEFAULT NULL,
  fileName TEXT DEFAULT NULL,
  audioData TEXT DEFAULT NULL,
  duration INT DEFAULT NULL,
  contactData TEXT DEFAULT NULL,
  pendingFrom VARCHAR(128) DEFAULT NULL,
  senderName VARCHAR(100) DEFAULT NULL,
  reactions TEXT DEFAULT NULL,
  INDEX idx_messages_convId (convId),
  INDEX idx_messages_time (time)
);

CREATE TABLE IF NOT EXISTS groups_table (
  gid VARCHAR(128) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  icon TEXT DEFAULT NULL,
  privacy VARCHAR(20) DEFAULT 'public',
  createdAt BIGINT DEFAULT 0,
  createdBy VARCHAR(128) DEFAULT NULL,
  reported TINYINT(1) DEFAULT 0,
  reportedBy VARCHAR(128) DEFAULT NULL,
  reportedAt BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS group_members (
  gid VARCHAR(128) NOT NULL,
  uid VARCHAR(128) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joinedAt BIGINT DEFAULT 0,
  PRIMARY KEY (gid, uid)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  gid VARCHAR(128) NOT NULL,
  msgKey VARCHAR(100) NOT NULL,
  fromUid VARCHAR(128) NOT NULL,
  text TEXT DEFAULT NULL,
  type VARCHAR(20) DEFAULT 'text',
  time BIGINT NOT NULL,
  deleted TINYINT(1) DEFAULT 0,
  edited TINYINT(1) DEFAULT 0,
  replyTo VARCHAR(100) DEFAULT NULL,
  messageTheme VARCHAR(50) DEFAULT NULL,
  encrypted TINYINT(1) DEFAULT 0,
  ct TEXT DEFAULT NULL,
  iv VARCHAR(255) DEFAULT NULL,
  imageData TEXT DEFAULT NULL,
  fileData TEXT DEFAULT NULL,
  fileName TEXT DEFAULT NULL,
  audioData TEXT DEFAULT NULL,
  duration INT DEFAULT NULL,
  senderName VARCHAR(100) DEFAULT NULL,
  reactions TEXT DEFAULT NULL,
  INDEX idx_group_msgs_gid (gid),
  INDEX idx_group_msgs_time (time)
);

CREATE TABLE IF NOT EXISTS group_invites (
  inviteId VARCHAR(100) PRIMARY KEY,
  gid VARCHAR(128) NOT NULL,
  createdBy VARCHAR(128) DEFAULT NULL,
  createdAt BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  storyId VARCHAR(100) NOT NULL,
  media LONGTEXT DEFAULT NULL,
  type VARCHAR(20) DEFAULT 'image',
  createdAt BIGINT DEFAULT 0,
  expiresAt BIGINT DEFAULT 0,
  UNIQUE KEY uk_storyId (storyId),
  INDEX idx_stories_uid (uid)
);

CREATE TABLE IF NOT EXISTS story_views (
  storyId VARCHAR(100) NOT NULL,
  viewedBy VARCHAR(128) NOT NULL,
  viewedAt BIGINT DEFAULT 0,
  PRIMARY KEY (storyId, viewedBy)
);

CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) DEFAULT NULL,
  icon TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  uid VARCHAR(128) NOT NULL,
  badgeId VARCHAR(50) NOT NULL,
  sortOrder INT DEFAULT 0,
  PRIMARY KEY (uid, badgeId)
);

CREATE TABLE IF NOT EXISTS staff (
  uid VARCHAR(128) PRIMARY KEY,
  addedAt BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fcm_tokens (
  uid VARCHAR(128) NOT NULL,
  token TEXT NOT NULL,
  createdAt BIGINT DEFAULT 0,
  PRIMARY KEY (uid, token(255))
);

CREATE TABLE IF NOT EXISTS sessions (
  sessionId VARCHAR(64) PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  createdAt BIGINT DEFAULT 0,
  INDEX idx_sessions_uid (uid)
);

CREATE TABLE IF NOT EXISTS deleted_convs (
  uid VARCHAR(128) NOT NULL,
  convId VARCHAR(256) NOT NULL,
  deletedAt BIGINT DEFAULT 0,
  PRIMARY KEY (uid, convId)
);

ALTER TABLE stories MODIFY COLUMN media LONGTEXT DEFAULT NULL;
ALTER TABLE profiles MODIFY COLUMN avatar LONGTEXT DEFAULT NULL;
ALTER TABLE profiles MODIFY COLUMN banner LONGTEXT DEFAULT NULL;
ALTER TABLE messages MODIFY COLUMN imageData LONGTEXT DEFAULT NULL;
ALTER TABLE messages MODIFY COLUMN fileData LONGTEXT DEFAULT NULL;
ALTER TABLE messages MODIFY COLUMN audioData LONGTEXT DEFAULT NULL;
ALTER TABLE messages MODIFY COLUMN contactData LONGTEXT DEFAULT NULL;
ALTER TABLE group_messages MODIFY COLUMN imageData LONGTEXT DEFAULT NULL;
ALTER TABLE group_messages MODIFY COLUMN fileData LONGTEXT DEFAULT NULL;
ALTER TABLE group_messages MODIFY COLUMN audioData LONGTEXT DEFAULT NULL;

SET @storyAudioDataExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stories' AND COLUMN_NAME='audioData');
SET @sql1 = IF(@storyAudioDataExists=0, 'ALTER TABLE stories ADD COLUMN audioData LONGTEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;
SET @storyAudioNameExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stories' AND COLUMN_NAME='audioName');
SET @sql2 = IF(@storyAudioNameExists=0, 'ALTER TABLE stories ADD COLUMN audioName VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
SET @storyAudioStartTimeExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stories' AND COLUMN_NAME='audioStartTime');
SET @sql3 = IF(@storyAudioStartTimeExists=0, 'ALTER TABLE stories ADD COLUMN audioStartTime FLOAT DEFAULT 0', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
SET @storyExtractDurationExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stories' AND COLUMN_NAME='audioExtractDuration');
SET @sql4 = IF(@storyExtractDurationExists=0, 'ALTER TABLE stories ADD COLUMN audioExtractDuration INT DEFAULT NULL', 'SELECT 1');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;
SET @storyDescriptionExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stories' AND COLUMN_NAME='description');
SET @sql5 = IF(@storyDescriptionExists=0, 'ALTER TABLE stories ADD COLUMN description TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(36) PRIMARY KEY,
  callerUid VARCHAR(128) NOT NULL,
  calleeUid VARCHAR(128) NOT NULL,
  startTime BIGINT,
  endTime BIGINT,
  duration INT DEFAULT 0,
  status ENUM('missed','completed','rejected') DEFAULT 'completed',
  INDEX idx_caller (callerUid),
  INDEX idx_callee (calleeUid)
);

SET @socialLinksExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profiles' AND COLUMN_NAME='social_links');
SET @sql6 = IF(@socialLinksExists=0, 'ALTER TABLE profiles ADD COLUMN social_links TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

SET @groupBannerExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='groups_table' AND COLUMN_NAME='banner');
SET @sql7 = IF(@groupBannerExists=0, 'ALTER TABLE groups_table ADD COLUMN banner TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt7 FROM @sql7;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

SET @bioIsUtf8mb3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profiles' AND COLUMN_NAME='bio' AND CHARACTER_SET_NAME='utf8');
SET @sql8 = IF(@bioIsUtf8mb3>0, 'ALTER TABLE profiles MODIFY COLUMN bio TEXT CHARACTER SET utf8mb4 DEFAULT NULL', 'SELECT 1');
PREPARE stmt8 FROM @sql8;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

SET @msgTextIsUtf8mb3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='messages' AND COLUMN_NAME='text' AND CHARACTER_SET_NAME='utf8');
SET @sql14 = IF(@msgTextIsUtf8mb3>0, 'ALTER TABLE messages MODIFY COLUMN text TEXT CHARACTER SET utf8mb4 DEFAULT NULL', 'SELECT 1');
PREPARE stmt14 FROM @sql14;
EXECUTE stmt14;
DEALLOCATE PREPARE stmt14;

SET @groupMsgTextIsUtf8mb3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_messages' AND COLUMN_NAME='text' AND CHARACTER_SET_NAME='utf8');
SET @sql15 = IF(@groupMsgTextIsUtf8mb3>0, 'ALTER TABLE group_messages MODIFY COLUMN text TEXT CHARACTER SET utf8mb4 DEFAULT NULL', 'SELECT 1');
PREPARE stmt15 FROM @sql15;
EXECUTE stmt15;
DEALLOCATE PREPARE stmt15;

SET @msgReactionsIsUtf8mb3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='messages' AND COLUMN_NAME='reactions' AND CHARACTER_SET_NAME='utf8');
SET @sql16 = IF(@msgReactionsIsUtf8mb3>0, 'ALTER TABLE messages MODIFY COLUMN reactions TEXT CHARACTER SET utf8mb4 DEFAULT NULL', 'SELECT 1');
PREPARE stmt16 FROM @sql16;
EXECUTE stmt16;
DEALLOCATE PREPARE stmt16;

SET @groupMsgReactionsIsUtf8mb3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_messages' AND COLUMN_NAME='reactions' AND CHARACTER_SET_NAME='utf8');
SET @sql17 = IF(@groupMsgReactionsIsUtf8mb3>0, 'ALTER TABLE group_messages MODIFY COLUMN reactions TEXT CHARACTER SET utf8mb4 DEFAULT NULL', 'SELECT 1');
PREPARE stmt17 FROM @sql17;
EXECUTE stmt17;
DEALLOCATE PREPARE stmt17;

CREATE TABLE IF NOT EXISTS blocks (
  uid VARCHAR(128) NOT NULL,
  blockedUid VARCHAR(128) NOT NULL,
  blockedAt BIGINT DEFAULT 0,
  PRIMARY KEY (uid, blockedUid)
);

CREATE TABLE IF NOT EXISTS user_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reportedUid VARCHAR(128) NOT NULL,
  reporterUid VARCHAR(128) NOT NULL,
  reason TEXT DEFAULT NULL,
  createdAt BIGINT DEFAULT 0,
  INDEX idx_user_reports_reported (reportedUid)
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fromUid VARCHAR(128) NOT NULL,
  toUid VARCHAR(128) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  createdAt BIGINT DEFAULT 0,
  UNIQUE KEY uk_contact_request (fromUid, toUid),
  INDEX idx_contact_requests_to (toUid, status)
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  adminUid VARCHAR(128) NOT NULL,
  action VARCHAR(255) NOT NULL,
  targetType VARCHAR(50) DEFAULT NULL,
  targetId VARCHAR(128) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  createdAt BIGINT DEFAULT 0,
  INDEX idx_admin_logs_time (createdAt)
);

SET @seenByExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_messages' AND COLUMN_NAME='seenBy');
SET @sql9 = IF(@seenByExists=0, 'ALTER TABLE group_messages ADD COLUMN seenBy TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt9 FROM @sql9;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

SET @pinnedMsgsExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='messages' AND COLUMN_NAME='pinned');
SET @sql10 = IF(@pinnedMsgsExists=0, 'ALTER TABLE messages ADD COLUMN pinned TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt10 FROM @sql10;
EXECUTE stmt10;
DEALLOCATE PREPARE stmt10;

SET @pinnedGroupMsgsExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_messages' AND COLUMN_NAME='pinned');
SET @sql11 = IF(@pinnedGroupMsgsExists=0, 'ALTER TABLE group_messages ADD COLUMN pinned TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt11 FROM @sql11;
EXECUTE stmt11;
DEALLOCATE PREPARE stmt11;

SET @fwdMsgsExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='messages' AND COLUMN_NAME='forwardedFrom');
SET @sql12 = IF(@fwdMsgsExists=0, 'ALTER TABLE messages ADD COLUMN forwardedFrom VARCHAR(128) DEFAULT NULL', 'SELECT 1');
PREPARE stmt12 FROM @sql12;
EXECUTE stmt12;
DEALLOCATE PREPARE stmt12;

SET @fwdGroupMsgsExists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_messages' AND COLUMN_NAME='forwardedFrom');
SET @sql13 = IF(@fwdGroupMsgsExists=0, 'ALTER TABLE group_messages ADD COLUMN forwardedFrom VARCHAR(128) DEFAULT NULL', 'SELECT 1');
PREPARE stmt13 FROM @sql13;
EXECUTE stmt13;
DEALLOCATE PREPARE stmt13;

CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  videoPath VARCHAR(500) NOT NULL,
  thumbnailPath VARCHAR(500) DEFAULT NULL,
  caption TEXT DEFAULT NULL,
  duration FLOAT DEFAULT 0,
  location JSON DEFAULT NULL,
  likesCount INT DEFAULT 0,
  commentsCount INT DEFAULT 0,
  createdAt BIGINT DEFAULT 0,
  INDEX idx_videos_uid (uid),
  INDEX idx_videos_created (createdAt)
);

CREATE TABLE IF NOT EXISTS video_likes (
  uid VARCHAR(128) NOT NULL,
  videoId VARCHAR(36) NOT NULL,
  createdAt BIGINT DEFAULT 0,
  PRIMARY KEY (uid, videoId)
);

CREATE TABLE IF NOT EXISTS video_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  videoId VARCHAR(36) NOT NULL,
  uid VARCHAR(128) NOT NULL,
  text TEXT NOT NULL,
  createdAt BIGINT DEFAULT 0,
  INDEX idx_vc_video (videoId)
);
