SET @exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'players'
    AND COLUMN_NAME = 'position_on_field'
);
SET @stmt = IF(@exists = 0,
  'ALTER TABLE `players` ADD COLUMN `position_on_field` VARCHAR(50) NOT NULL DEFAULT ''UNKNOWN'' AFTER `rating`',
  'SELECT 1'
);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;
