
ALTER TABLE  `components_groups` ADD  `access_state` TINYINT NOT NULL DEFAULT  '0', ADD INDEX (  `access_state` ) ;

CREATE TABLE IF NOT EXISTS `templates_groups_data` (
  `template_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `access_state` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`template_id`,`group_id`),
  KEY template_id (`template_id`),
  KEY group_id (`group_id`),
  KEY access_state (`access_state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `templates_groups`
--

INSERT INTO `templates_groups_data` (`template_id`, `group_id`, `access_state`) VALUES
(1, 1, 0),
(1, 2, 0),
(1, 3, 0);

ALTER TABLE  `grp` ADD  `categories` TEXT NULL ;

ALTER TABLE  `app` ADD  `tags` TEXT NOT NULL ;