-- phpMyAdmin SQL Dump
-- version 4.0.6deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 24, 2015 at 10:48 AM
-- Server version: 5.5.37-0ubuntu0.13.10.1
-- PHP Version: 5.5.3-1ubuntu2.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `mlab`
--
CREATE DATABASE IF NOT EXISTS `mlab` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `mlab`;

-- --------------------------------------------------------

--
-- Table structure for table `app`
--

CREATE TABLE IF NOT EXISTS `app` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_1` int(11) DEFAULT NULL,
  `category_2` int(11) DEFAULT NULL,
  `category_3` int(11) DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `updatedby_id` int(11) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `keywords` longtext COLLATE utf8_unicode_ci,
  `active_version` float DEFAULT NULL,
  `created` date NOT NULL,
  `updated` datetime NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `published` int(11) DEFAULT '0',
  `uid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name_index` (`name`),
  KEY `path_index` (`path`),
  KEY `version_index` (`active_version`),
  KEY `created_index` (`created`),
  KEY `updated_index` (`updated`),
  KEY `enabled_index` (`enabled`),
  KEY `IDX_C96E70CF9BAE1BDD` (`category_1`),
  KEY `IDX_C96E70CF2A74A67` (`category_2`),
  KEY `IDX_C96E70CF75A07AF1` (`category_3`),
  KEY `IDX_C96E70CF5DA0FB8` (`template_id`),
  KEY `IDX_C96E70CFA76ED395` (`user_id`),
  KEY `IDX_C96E70CFA43E35E8` (`updatedby_id`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=59 ;


-- --------------------------------------------------------

--
-- Table structure for table `apps_groups`
--

CREATE TABLE IF NOT EXISTS `apps_groups` (
  `app_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`app_id`,`group_id`),
  KEY `IDX_4ADA29A77987212D` (`app_id`),
  KEY `IDX_4ADA29A7FE54D947` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `app_version`
--

CREATE TABLE IF NOT EXISTS `app_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_id` int(11) NOT NULL,
  `version` float NOT NULL,
  `enabled` int(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `app_id` (`app_id`),
  KEY `version` (`version`),
  KEY `enabled` (`enabled`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=20 ;


-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE IF NOT EXISTS `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `system` tinyint(1) DEFAULT '0',
  `lft` int(11) NOT NULL,
  `rgt` int(11) NOT NULL,
  `root` int(11) DEFAULT NULL,
  `lvl` int(11) NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `IDX_64C19C1727ACA70` (`parent_id`),
  KEY `name_index` (`name`),
  KEY `enabled_index` (`enabled`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=29 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `parent_id`, `name`, `system`, `lft`, `rgt`, `root`, `lvl`, `enabled`) VALUES
(14, NULL, 'Land', 1, 1, 10, 14, 0, NULL),
(15, NULL, 'Luft', 1, 1, 10, 15, 0, NULL),
(16, NULL, 'Sjø', 1, 1, 10, 16, 0, NULL),
(17, 14, 'Sanitet', 1, 2, 3, 14, 1, NULL),
(18, 15, 'Sanitet', 1, 2, 3, 15, 1, NULL),
(19, 16, 'Sanitet', 1, 2, 3, 16, 1, NULL),
(20, 14, 'Opplæring', 1, 4, 9, 14, 1, NULL),
(21, 15, 'Opplæring', 1, 4, 9, 15, 1, NULL),
(22, 16, 'Opplæring', 1, 4, 9, 16, 1, NULL),
(23, 20, 'Kadett', 1, 5, 6, 14, 2, NULL),
(24, 21, 'Kadett', 1, 5, 6, 15, 2, NULL),
(25, 22, 'Kadett', 1, 5, 6, 16, 2, NULL),
(26, 20, 'Offiser', 1, 7, 8, 14, 2, NULL),
(27, 21, 'Offiser', 1, 7, 8, 15, 2, NULL),
(28, 22, 'Offiser', 1, 7, 8, 16, 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `component`
--

CREATE TABLE IF NOT EXISTS `component` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_index` (`name`),
  KEY `enabled_index` (`enabled`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=20 ;

--
-- Dumping data for table `component`
--

INSERT INTO `component` (`id`, `name`, `description`, `path`, `enabled`, `version`) VALUES
(1, 'Headline', 'Top level headline', 'h1', 1, 1),
(2, 'Sub headline', 'Medium level headline', 'h2', 1, 1),
(3, 'Lower headline', 'Lowest level headline', 'h3', 1, 1),
(4, 'Image', 'Use this to add images', 'img', 1, 1),
(6, 'Bullet points', 'Use this to create a list of un-numbered bullet points ', 'ul', 1, 1),
(7, 'Paragraph', 'General paragraph', 'p', 1, 1),
(8, 'Numbered list', 'Numbered list', 'ol', 1, 1),
(9, 'qrcode', 'Lag en egen QR Code', 'qrcode', 1, 1),
(10, 'Youtube Video', 'Youtube Video', 'youtube', 1, 1),
(11, 'Chapter headline', 'Headline used to create index', 'chapter', 1, 1),
(12, 'App index', 'Index of chapters/pages', 'index', 1, 1),
(13, 'dummy', 'dummy', 'dummy', 1, 1),
(14, 'Video', 'Video', 'video', 1, 1),
(15, 'Google Maps', 'Google Maps', 'googlemap', 1, 1),
(16, 'Image and text', 'Use this to add a paragraph with an image in it', 'img_text', 1, 1),
(17, 'mysql_dummy', 'mysql_dummy', 'mysql_dummy', 1, 1),
(18, 'quiz', 'quiz', 'quiz', 1, 1),
(19, 'Table', 'Table to edit', 'table', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `components_groups`
--

CREATE TABLE IF NOT EXISTS `components_groups` (
  `component_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`component_id`,`group_id`),
  KEY `IDX_178B28C3E2ABAFFF` (`component_id`),
  KEY `IDX_178B28C3FE54D947` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `components_groups`
--

INSERT INTO `components_groups` (`component_id`, `group_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1),
(13, 1),
(15, 1),
(16, 1),
(17, 1),
(18, 1),
(19, 1);

-- --------------------------------------------------------

--
-- Table structure for table `grp`
--

CREATE TABLE IF NOT EXISTS `grp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci,
  `is_default` tinyint(1) DEFAULT '0',
  `enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `name_index` (`name`),
  KEY `is_default_index` (`is_default`),
  KEY `enabled_index` (`enabled`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=2 ;

--
-- Dumping data for table `grp`
--

INSERT INTO `grp` (`id`, `name`, `description`, `is_default`, `enabled`) VALUES
(1, 'Generell', 'Generell gruppe for app tilgang', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `help`
--

CREATE TABLE IF NOT EXISTS `help` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `route_index` (`route`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE IF NOT EXISTS `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_html` longtext COLLATE utf8_unicode_ci,
  `class` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `help` longtext COLLATE utf8_unicode_ci,
  `parent_id` int(11) NOT NULL,
  `order_by` int(11) NOT NULL,
  `url` longtext COLLATE utf8_unicode_ci,
  `filter_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `content_php` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `filter_role` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id_index` (`parent_id`),
  KEY `filter_url` (`filter_url`),
  KEY `order_by_index` (`order_by`),
  KEY `filter_role_index` (`filter_role`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=32 ;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `content_html`, `class`, `help`, `parent_id`, `order_by`, `url`, `filter_url`, `content_php`, `filter_role`) VALUES
(4, 'Gå til', NULL, 'Gå til annen modul i MLAB', 0, 100, '', NULL, NULL, NULL),
(5, 'App', NULL, 'App', 0, 200, '', 'app-builder, app-build', NULL, NULL),
(6, 'Side', NULL, 'Sider', 0, 300, '', 'app-build', NULL, NULL),
(8, 'Forandre passord                                        ', NULL, 'Her kan du oppdatere passordet ditt', 3, 20, '/user/change-password', NULL, NULL, NULL),
(11, 'App Bygger', '', 'Lag eller rediger apper', 4, 10, '/app/builder/', NULL, NULL, NULL),
(12, 'App Bygger Admin', NULL, 'Administrer brukere, apper, maler, etc', 4, 20, '/admin/apps', NULL, NULL, NULL),
(15, 'Logg ut', NULL, 'Logg av MLAB', 3, 30, '/user/logout', NULL, NULL, NULL),
(17, 'Egenskaper', NULL, 'Oppdater egenskapene til denne appen', 5, 30, 'javascript: mlab_app_update();', 'app-build', NULL, NULL),
(18, 'Ny app', NULL, 'Start en ny app', 5, 20, 'javascript: mlab_app_new();', 'app-builder, app-build', NULL, NULL),
(19, 'Test app i nettleser', NULL, 'Dette vil åpne en ny side som ser ut som en smarttelefon hvor du kan se hvordan appen vil se ut til slutt', 5, 110, 'javascript: mlab_page_preview(); ', 'app-build', NULL, NULL),
(20, 'Test app på mobil enhet', NULL, 'Dette vil laste ned appen så du kan installere den på mobilen din for å teste den', 5, 120, 'javascript: mlab_app_download();', 'app-build', NULL, NULL),
(21, 'Send app til marked', NULL, 'Dette vil laste appen opp på markedet så den er tilgjengelig for alle andre', 5, 130, 'javascript: mlab_app_submit_to_market();', 'app-build', NULL, NULL),
(22, 'Tittel: <input type="text" id="mlab_curr_pagetitle" value="Sidens navn"/><br /><button onclick="mlab_update_page_title();">Oppdater</button><br />', NULL, 'Her kan du oppdatere tittelen på gjeldende side', 6, 10, '', 'app-build', NULL, NULL),
(23, '', NULL, 'Åpne andre sider i appen', 6, 20, 'javascript: mlab_page_open();', 'app-build', 'getAppPages', NULL),
(24, 'Lagre side', NULL, 'Her kan du lagre gjeldende side', 6, 30, 'javascript: mlab_page_save();', 'app-build', NULL, NULL),
(25, 'Slette side', NULL, 'Her kan du slette gjeldende side', 6, 50, 'javascript: mlab_page_delete();', 'app-build', NULL, NULL),
(26, 'Kopier side', NULL, 'Her kan du kopiere gjeldende side', 6, 36, 'javascript: mlab_page_copy();', 'app-build', NULL, NULL),
(27, 'Ny side', NULL, 'Her kan du lage en side', 6, 33, 'javascript: mlab_page_new();', 'app-build', NULL, NULL),
(28, '<hr>', NULL, '', 6, 40, '', 'app-build', NULL, NULL),
(29, '<hr>', NULL, '', 6, 60, '', 'app-build', NULL, NULL),
(30, 'Fjern låser', NULL, 'Her kan du fjerne gamle låser.', 6, 70, 'javascript: mlab_app_remove_locks();', 'app-build', NULL, NULL),
(31, 'Avslutt redigering', NULL, 'Går tilbake til app byggerens forside', 5, 180, '/app/builder/', 'app-build', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `template`
--

CREATE TABLE IF NOT EXISTS `template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `compatible_with` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_index` (`name`),
  KEY `compatible_with_index` (`compatible_with`),
  KEY `enabled_index` (`enabled`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=3 ;

--
-- Dumping data for table `template`
--

INSERT INTO `template` (`id`, `name`, `description`, `compatible_with`, `path`, `enabled`, `version`) VALUES
(1, 'Basismal', 'This is a new template that has everything you''ll ever want.', NULL, 'basic', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `templates_groups`
--

CREATE TABLE IF NOT EXISTS `templates_groups` (
  `template_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`template_id`,`group_id`),
  KEY `IDX_F43FD2D35DA0FB8` (`template_id`),
  KEY `IDX_F43FD2D3FE54D947` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `templates_groups`
--

INSERT INTO `templates_groups` (`template_id`, `group_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tracking`
--

CREATE TABLE IF NOT EXISTS `tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `component_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `app_id` int(11) DEFAULT NULL,
  `created` date NOT NULL,
  `action` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_A87C621CE2ABAFFF` (`component_id`),
  UNIQUE KEY `UNIQ_A87C621CA76ED395` (`user_id`),
  UNIQUE KEY `UNIQ_A87C621C7987212D` (`app_id`),
  KEY `created_index` (`created`),
  KEY `action_index` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `users_groups`
--

CREATE TABLE IF NOT EXISTS `users_groups` (
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`group_id`),
  KEY `IDX_FF8AB7E0A76ED395` (`user_id`),
  KEY `IDX_FF8AB7E0FE54D947` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users_groups`
--

INSERT INTO `users_groups` (`user_id`, `group_id`) VALUES
(1, 1),


-- --------------------------------------------------------

--
-- Table structure for table `usr`
--

CREATE TABLE IF NOT EXISTS `usr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_1` int(11) DEFAULT NULL,
  `category_2` int(11) DEFAULT NULL,
  `category_3` int(11) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `salt` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `updated` datetime NOT NULL,
  `username` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `username_canonical` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email_canonical` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `locked` tinyint(1) NOT NULL,
  `expired` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `confirmation_token` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password_requested_at` datetime DEFAULT NULL,
  `roles` longtext COLLATE utf8_unicode_ci NOT NULL COMMENT '(DC2Type:array)',
  `credentials_expired` tinyint(1) NOT NULL,
  `credentials_expire_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_1762498C92FC23A8` (`username_canonical`),
  UNIQUE KEY `UNIQ_1762498CA0D96FBF` (`email_canonical`),
  KEY `email_index` (`email`),
  KEY `password_index` (`password`),
  KEY `created_index` (`created`),
  KEY `updated_index` (`updated`),
  KEY `username_index` (`username`),
  KEY `IDX_1762498C9BAE1BDD` (`category_1`),
  KEY `IDX_1762498C2A74A67` (`category_2`),
  KEY `IDX_1762498C75A07AF1` (`category_3`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=17 ;

--
-- Dumping data for table `usr`
--

INSERT INTO `usr` (`id`, `category_1`, `category_2`, `category_3`, `email`, `password`, `salt`, `created`, `updated`, `username`, `username_canonical`, `email_canonical`, `enabled`, `last_login`, `locked`, `expired`, `expires_at`, `confirmation_token`, `password_requested_at`, `roles`, `credentials_expired`, `credentials_expire_at`) VALUES
(1, NULL, NULL, NULL, 'admin@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2015-07-17 11:59:14', 'admin', 'admin', 'admin@ffi.no', 1, '2015-07-17 11:59:14', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:16:"ROLE_SUPER_ADMIN";}', 0, NULL);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `app`
--
ALTER TABLE `app`
  ADD CONSTRAINT `FK_C96E70CF2A74A67` FOREIGN KEY (`category_2`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `FK_C96E70CF5DA0FB8` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`),
  ADD CONSTRAINT `FK_C96E70CF75A07AF1` FOREIGN KEY (`category_3`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `FK_C96E70CF9BAE1BDD` FOREIGN KEY (`category_1`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `FK_C96E70CFA43E35E8` FOREIGN KEY (`updatedby_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_C96E70CFA76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`);

--
-- Constraints for table `apps_groups`
--
ALTER TABLE `apps_groups`
  ADD CONSTRAINT `FK_4ADA29A77987212D` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`),
  ADD CONSTRAINT `FK_4ADA29A7FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Constraints for table `app_version`
--
ALTER TABLE `app_version`
  ADD CONSTRAINT `FK_111` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`);

--
-- Constraints for table `category`
--
ALTER TABLE `category`
  ADD CONSTRAINT `FK_64C19C1727ACA70` FOREIGN KEY (`parent_id`) REFERENCES `category` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `components_groups`
--
ALTER TABLE `components_groups`
  ADD CONSTRAINT `FK_178B28C3E2ABAFFF` FOREIGN KEY (`component_id`) REFERENCES `component` (`id`),
  ADD CONSTRAINT `FK_178B28C3FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Constraints for table `templates_groups`
--
ALTER TABLE `templates_groups`
  ADD CONSTRAINT `FK_F43FD2D35DA0FB8` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`),
  ADD CONSTRAINT `FK_F43FD2D3FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Constraints for table `tracking`
--
ALTER TABLE `tracking`
  ADD CONSTRAINT `FK_A87C621C7987212D` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`),
  ADD CONSTRAINT `FK_A87C621CA76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_A87C621CE2ABAFFF` FOREIGN KEY (`component_id`) REFERENCES `component` (`id`);

--
-- Constraints for table `users_groups`
--
ALTER TABLE `users_groups`
  ADD CONSTRAINT `FK_FF8AB7E0A76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_FF8AB7E0FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Constraints for table `usr`
--
ALTER TABLE `usr`
  ADD CONSTRAINT `FK_1762498C2A74A67` FOREIGN KEY (`category_2`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `FK_1762498C75A07AF1` FOREIGN KEY (`category_3`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `FK_1762498C9BAE1BDD` FOREIGN KEY (`category_1`) REFERENCES `category` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
