-- phpMyAdmin SQL Dump
-- version 4.0.6deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 03, 2016 at 09:15 AM
-- Server version: 5.5.37-0ubuntu0.13.10.1
-- PHP Version: 5.5.3-1ubuntu2.6

SET foreign_key_checks = 0;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `mlab`
--

-- --------------------------------------------------------

--
-- Table structure for table `component`
--

DROP TABLE IF EXISTS `component`;
CREATE TABLE IF NOT EXISTS `component` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL,
  `order_by` int(11) DEFAULT '0',
  `new_line` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `name_index` (`name`),
  KEY `enabled_index` (`enabled`),
  KEY `order_by` (`order_by`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=20 ;

--
-- Dumping data for table `component`
--

INSERT INTO `component` (`id`, `name`, `description`, `path`, `enabled`, `version`, `order_by`, `new_line`) VALUES
(1, 'Headline', 'Headline', 'h1', 1, 1, 2, 0),
(4, 'Image', 'Use this to add images', 'img', 1, 1, 6, 1),
(6, 'Bullet points', 'Use this to create a list of un-numbered bullet points ', 'ul', 1, 1, 5, 0),
(7, 'Paragraph', 'General paragraph', 'p', 1, 1, 3, 0),
(8, 'Numbered list', 'Numbered list', 'ol', 1, 1, 4, 0),
(9, 'qrcode', 'Lag en egen QR Code', 'qrcode', 0, 1, 0, 0),
(10, 'Youtube Video', 'Youtube Video', 'youtube', 1, 1, 8, 0),
(11, 'Chapter headline', 'Headline used to create index', 'chapter', 1, 1, 1, 0),
(12, 'App index', 'Index of chapters/pages', 'index', 1, 1, 12, 1),
(13, 'dummy', 'dummy', 'dummy', 1, 1, 0, 0),
(14, 'Video', 'Video', 'video', 0, 1, 9, 0),
(15, 'Google Maps', 'Google Maps', 'googlemap', 1, 1, 10, 1),
(16, 'Image and text', 'Use this to add a paragraph with an image in it', 'img_text', 1, 1, 7, 0),
(17, 'mysql_basic', 'mysql_basic', 'mysql_basic', 1, 1, 0, 0),
(18, 'quiz', 'quiz', 'quiz', 1, 1, 11, 1),
(19, 'Table', 'Table to edit', 'table', 0, 1, 0, 0);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

SET foreign_key_checks = 1;
