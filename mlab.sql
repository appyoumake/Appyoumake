-- phpMyAdmin SQL Dump
-- version 4.2.8
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Nov 22, 2014 at 06:05 AM
-- Server version: 5.5.35
-- PHP Version: 5.5.16

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
-- Table structure for table `app`
--

CREATE TABLE IF NOT EXISTS `app` (
`id` int(11) NOT NULL,
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
  `version` double NOT NULL,
  `created` date NOT NULL,
  `updated` datetime NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `published` int(11) DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `app`
--

INSERT INTO `app` (`id`, `category_1`, `category_2`, `category_3`, `template_id`, `user_id`, `updatedby_id`, `name`, `path`, `description`, `keywords`, `version`, `created`, `updated`, `enabled`, `published`) VALUES
(1, 2, 3, NULL, 1, 3, 3, 'Test app number 1', 'test_app_number_1', 'Test description', 'sdfsdfs sdf sd fsd fsf', 1, '2013-12-01', '2013-12-01 01:13:18', 1, 1),
(19, 2, 3, 8, 3, 3, 3, 'aaa', 'aaa', 'aaa', 'aaa', 1, '2014-02-18', '2014-02-18 12:37:22', NULL, 0),
(20, 2, 2, 2, 3, 3, 3, 'asxdv', 'asxdv', 'fgh', 'sdfsdf', 1, '2014-02-18', '2014-02-18 12:42:09', NULL, 0),
(21, 2, 2, 2, 3, 3, 3, 'ssss', 'ssss', 'ffff', 'sss', 1, '2014-02-18', '2014-02-18 12:47:15', NULL, 0),
(22, 2, 3, 8, 3, 3, 3, 'qqqq', 'qqqq', 'qqqqq', 'qqq', 1, '2014-04-03', '2014-04-03 12:42:15', NULL, 0),
(23, 2, 2, 2, 3, 3, 3, 'index', 'index', 'index', 'index', 1, '2014-04-04', '2014-04-04 14:38:15', NULL, 0),
(24, 2, 3, 8, 3, 3, 3, 'Test Ny Side Lagring', 'test_ny_side_lagring', 'Test Ny Side Lagring', 'Test Ny Side Lagring', 1, '2014-05-07', '2014-05-07 11:24:14', NULL, 0),
(25, NULL, NULL, NULL, 3, 3, 3, 'testcompx', 'testcompx', 'sdfsdf', 'sdfsdf', 1, '2014-10-01', '2014-11-20 06:17:49', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `apps_groups`
--

CREATE TABLE IF NOT EXISTS `apps_groups` (
  `app_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `apps_groups`
--

INSERT INTO `apps_groups` (`app_id`, `group_id`) VALUES
(1, 1),
(19, 1),
(19, 2),
(20, 1),
(20, 2),
(21, 1),
(21, 2),
(22, 1),
(22, 2),
(23, 1),
(23, 2),
(24, 1),
(24, 2),
(25, 1),
(25, 2);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE IF NOT EXISTS `category` (
`id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `system` tinyint(1) DEFAULT '0',
  `lft` int(11) NOT NULL,
  `rgt` int(11) NOT NULL,
  `root` int(11) DEFAULT NULL,
  `lvl` int(11) NOT NULL,
  `enabled` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `parent_id`, `name`, `system`, `lft`, `rgt`, `root`, `lvl`, `enabled`) VALUES
(2, NULL, 'TestyParent2', 1, 1, 4, 2, 0, 1),
(3, NULL, 'Testy2', 1, 1, 4, 3, 0, 1),
(8, NULL, 'Testy2 child2', 0, 4, 7, 3, 1, 1),
(10, 3, 'sdfsfsdf', 0, 2, 3, 3, 1, NULL),
(12, 2, 'yyyyy', 0, 2, 3, 2, 1, NULL),
(13, 8, 'Test level 3', 0, 5, 6, 3, 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `component`
--

CREATE TABLE IF NOT EXISTS `component` (
`id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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
(11, 'Google Map', 'Google Map', 'googlemap', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `components_groups`
--

CREATE TABLE IF NOT EXISTS `components_groups` (
  `component_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
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
(11, 1);

-- --------------------------------------------------------

--
-- Table structure for table `grp`
--

CREATE TABLE IF NOT EXISTS `grp` (
`id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci,
  `is_default` tinyint(1) DEFAULT '0',
  `enabled` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `grp`
--

INSERT INTO `grp` (`id`, `name`, `description`, `is_default`, `enabled`) VALUES
(1, 'Testy', 'Festy', 0, 1),
(2, 'dfgdfgdfgdfg', 'dfgdfgdfgdfg', 0, 0),
(3, 'edfw', 'werwer', 1, 1),
(4, 'Snurky', 'Burky', 0, 1),
(6, 'sdfsdf', 'sdfsdf', 0, 0),
(12, 'dsdfdsf', 'sdfsdfsdf', 0, 0),
(13, 'TestAddUser', 'sdfsdfsdf', 0, 1),
(14, 'TestAddUser2', 'TestAddUser2', 0, 1),
(15, 'Tes3', 'Test', 0, 1),
(16, 'test4', 'test4', 0, 1),
(17, 'test5', 'test5', 0, 1),
(18, 'Testy7', 'Testy7', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `help`
--

CREATE TABLE IF NOT EXISTS `help` (
`id` int(11) NOT NULL,
  `route` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `help`
--

INSERT INTO `help` (`id`, `route`, `message`) VALUES
(2, 'mlab', 'This is a test'),
(3, 'sdsdf', 'sdfsdf'),
(5, 'ddddd', 'aaaa');

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE IF NOT EXISTS `menu` (
`id` int(11) NOT NULL,
  `content_html` longtext COLLATE utf8_unicode_ci,
  `class` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `help` longtext COLLATE utf8_unicode_ci,
  `parent_id` int(11) NOT NULL,
  `order_by` int(11) NOT NULL,
  `url` longtext COLLATE utf8_unicode_ci,
  `filter_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `content_php` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `filter_role` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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
`id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `compatible_with` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `template`
--

INSERT INTO `template` (`id`, `name`, `description`, `compatible_with`, `path`, `enabled`, `version`) VALUES
(1, 'mlabFFIDemo', 'This is a new template that has everything you''ll ever want.', NULL, 'mlabFFIDemo', 1, NULL),
(3, 'basic', 'This is a new template that has everything you''ll ever want.', NULL, 'basic', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `templates_groups`
--

CREATE TABLE IF NOT EXISTS `templates_groups` (
  `template_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `templates_groups`
--

INSERT INTO `templates_groups` (`template_id`, `group_id`) VALUES
(1, 1),
(1, 2),
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 6),
(3, 12);

-- --------------------------------------------------------

--
-- Table structure for table `tracking`
--

CREATE TABLE IF NOT EXISTS `tracking` (
`id` int(11) NOT NULL,
  `component_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `app_id` int(11) DEFAULT NULL,
  `created` date NOT NULL,
  `action` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_groups`
--

CREATE TABLE IF NOT EXISTS `users_groups` (
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users_groups`
--

INSERT INTO `users_groups` (`user_id`, `group_id`) VALUES
(3, 1),
(3, 2),
(4, 1),
(4, 2),
(4, 18),
(7, 1),
(7, 18),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1),
(13, 2),
(14, 3);

-- --------------------------------------------------------

--
-- Table structure for table `usr`
--

CREATE TABLE IF NOT EXISTS `usr` (
`id` int(11) NOT NULL,
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
  `credentials_expire_at` datetime DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `usr`
--

INSERT INTO `usr` (`id`, `category_1`, `category_2`, `category_3`, `email`, `password`, `salt`, `created`, `updated`, `username`, `username_canonical`, `email_canonical`, `enabled`, `last_login`, `locked`, `expired`, `expires_at`, `confirmation_token`, `password_requested_at`, `roles`, `credentials_expired`, `credentials_expire_at`) VALUES
(3, NULL, NULL, NULL, 'arild.bergh@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2014-11-18 21:32:47', 'arild', 'arild', 'arild.bergh@ffi.no', 1, '2014-11-18 21:32:47', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:16:"ROLE_SUPER_ADMIN";}', 0, NULL),
(4, NULL, NULL, NULL, 'Cecilie.Jackbo.Gran@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2014-08-26 11:36:51', 'cecilie', 'cecilie', 'cecilie.jackbo.gran@ffi.no', 1, '2014-01-26 02:27:10', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL),
(7, 2, 2, 2, 'test@test.com', 'e+qqNLhIDWFo3wW/sKn4vH8HFF1nGXq239arDSexjkYMwVgUT1ZdWWINbSl1HlGYLVhRFUOjZ761C1sTtzhOxw==', 'ma6ja813m6o84wgow0wwoksso0ck4cg', '2013-11-29', '2014-08-26 11:36:51', 'testy', 'testy', 'test@test.com', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:16:"ROLE_SUPER_ADMIN";}', 0, NULL),
(8, 2, NULL, NULL, 'arild.bergh2@ffi.no', 'QCIQQPYF/D0MiI9MtclhOESYWv6J2GbldkNw0x8pmlaY0r1KuabW5EXMdL7Wqy+iWbSTX5OeOYBIIcLZ2UTblQ==', 'ks72q4ri8qowcsowc0kwg0sw8s84w44', '2014-08-25', '2014-08-25 09:18:59', 'arild.bergh2@ffi.no', 'arild.bergh2@ffi.no', 'arild.bergh2@ffi.no', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:0:{}', 0, NULL),
(9, NULL, NULL, NULL, 'a@b.com', 'UgcNmXdmUm2k/L2SrSK1HljTcqE/n5w6yj9QzOISFgN+6fPooTe91xfJvJyRh43KY7XOlK6jLX9Dv2+Kyuim5A==', 'n141id73xlccogkoswc0wg4k4cgo4ck', '2014-08-25', '2014-08-25 09:20:33', 'a@b.com', 'a@b.com', 'a@b.com', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL),
(10, 2, NULL, NULL, 'arild.berg23h@ffi.no', 'sDMmD9Wr0AG9K3S5p9e2GxHEuKiOX1JS6B7xyfe+P7bkV9qfdWx0GvdWJZ1pJK1cUt272HFXMt5WLbFRHQs6Ug==', '2v31dvru6um8sk04wkg4scccgokks0k', '2014-08-25', '2014-08-25 09:32:16', 'arild.berg23h@ffi.no', 'arild.berg23h@ffi.no', 'arild.berg23h@ffi.no', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:0:{}', 0, NULL),
(11, 2, NULL, NULL, 'arild.ber4gh@ffi.no', 'iV8+RD1ysKn/AewgAM5fL5wke9GNk3ckG1NuwzvDozpzwn9Fiy2ijY0xGkND1SaksYpkyv1pXo3wbEakGgmFUQ==', '6sf727b9qi8880ocwgc04o0oc8gc4w0', '2014-08-25', '2014-08-25 09:48:57', 'arild.ber4gh@ffi.no', 'arild.ber4gh@ffi.no', 'arild.ber4gh@ffi.no', 1, '2014-08-25 09:48:57', 0, 0, NULL, NULL, NULL, 'a:0:{}', 0, NULL),
(12, 2, NULL, NULL, 'x@x.com', 'jXxunqYvFVs6dTufcn1QL7m9VToUU6Rxy5Dqt2EQ39eXktVd1AybcIzjdHOJxmmpzXJUX5kH0LcvkwTgTnlCrA==', 'r7cr23ki1c04cgcg4cc8swoo44oscoo', '2014-08-25', '2014-08-25 12:17:45', 'x@x.com', 'x@x.com', 'x@x.com', 1, '2014-08-25 12:17:45', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:9:"ROLE_USER";}', 0, NULL),
(13, 2, NULL, NULL, 'arild.berddgh@ffi.no', '9DleWhWHP1b2w99Btjz9DufhnbMtamEd8AohKFnaLI+Gdxe80WiPPPp5ZKciTuCzhI7jgrzDcLAP6oDot/+r5A==', 'h85414lha5w8ss4kwkw8s44ko0kcwco', '2014-08-25', '2014-08-25 10:19:37', 'arild.berddgh@ffi.no', 'arild.berddgh@ffi.no', 'arild.berddgh@ffi.no', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:0:{}', 0, NULL),
(14, 2, NULL, NULL, 'y@y.com', 'JWETP+M3bbm9mjUzpa/z5qZ7DDwZIJZX7wdYSlFAgIj2tJ9Hm5j+BaiTtDQF1k6i+L/Lp20WuXC2+7Skz5ynXg==', 'lieuve33utwossos0g4osso4sskc84k', '2014-08-25', '2014-08-25 12:29:19', 'y@y.com', 'y@y.com', 'y@y.com', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:0:{}', 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app`
--
ALTER TABLE `app`
 ADD PRIMARY KEY (`id`), ADD KEY `name_index` (`name`), ADD KEY `path_index` (`path`), ADD KEY `version_index` (`version`), ADD KEY `created_index` (`created`), ADD KEY `updated_index` (`updated`), ADD KEY `enabled_index` (`enabled`), ADD KEY `IDX_C96E70CF9BAE1BDD` (`category_1`), ADD KEY `IDX_C96E70CF2A74A67` (`category_2`), ADD KEY `IDX_C96E70CF75A07AF1` (`category_3`), ADD KEY `IDX_C96E70CF5DA0FB8` (`template_id`), ADD KEY `IDX_C96E70CFA76ED395` (`user_id`), ADD KEY `IDX_C96E70CFA43E35E8` (`updatedby_id`);

--
-- Indexes for table `apps_groups`
--
ALTER TABLE `apps_groups`
 ADD PRIMARY KEY (`app_id`,`group_id`), ADD KEY `IDX_4ADA29A77987212D` (`app_id`), ADD KEY `IDX_4ADA29A7FE54D947` (`group_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
 ADD PRIMARY KEY (`id`), ADD KEY `IDX_64C19C1727ACA70` (`parent_id`), ADD KEY `name_index` (`name`), ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `component`
--
ALTER TABLE `component`
 ADD PRIMARY KEY (`id`), ADD KEY `name_index` (`name`), ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `components_groups`
--
ALTER TABLE `components_groups`
 ADD PRIMARY KEY (`component_id`,`group_id`), ADD KEY `IDX_178B28C3E2ABAFFF` (`component_id`), ADD KEY `IDX_178B28C3FE54D947` (`group_id`);

--
-- Indexes for table `grp`
--
ALTER TABLE `grp`
 ADD PRIMARY KEY (`id`), ADD KEY `name_index` (`name`), ADD KEY `is_default_index` (`is_default`), ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `help`
--
ALTER TABLE `help`
 ADD PRIMARY KEY (`id`), ADD KEY `route_index` (`route`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
 ADD PRIMARY KEY (`id`), ADD KEY `parent_id_index` (`parent_id`), ADD KEY `filter_url` (`filter_url`), ADD KEY `order_by_index` (`order_by`), ADD KEY `filter_role_index` (`filter_role`);

--
-- Indexes for table `template`
--
ALTER TABLE `template`
 ADD PRIMARY KEY (`id`), ADD KEY `name_index` (`name`), ADD KEY `compatible_with_index` (`compatible_with`), ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `templates_groups`
--
ALTER TABLE `templates_groups`
 ADD PRIMARY KEY (`template_id`,`group_id`), ADD KEY `IDX_F43FD2D35DA0FB8` (`template_id`), ADD KEY `IDX_F43FD2D3FE54D947` (`group_id`);

--
-- Indexes for table `tracking`
--
ALTER TABLE `tracking`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `UNIQ_A87C621CE2ABAFFF` (`component_id`), ADD UNIQUE KEY `UNIQ_A87C621CA76ED395` (`user_id`), ADD UNIQUE KEY `UNIQ_A87C621C7987212D` (`app_id`), ADD KEY `created_index` (`created`), ADD KEY `action_index` (`action`);

--
-- Indexes for table `users_groups`
--
ALTER TABLE `users_groups`
 ADD PRIMARY KEY (`user_id`,`group_id`), ADD KEY `IDX_FF8AB7E0A76ED395` (`user_id`), ADD KEY `IDX_FF8AB7E0FE54D947` (`group_id`);

--
-- Indexes for table `usr`
--
ALTER TABLE `usr`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `UNIQ_1762498C92FC23A8` (`username_canonical`), ADD UNIQUE KEY `UNIQ_1762498CA0D96FBF` (`email_canonical`), ADD KEY `email_index` (`email`), ADD KEY `password_index` (`password`), ADD KEY `created_index` (`created`), ADD KEY `updated_index` (`updated`), ADD KEY `username_index` (`username`), ADD KEY `IDX_1762498C9BAE1BDD` (`category_1`), ADD KEY `IDX_1762498C2A74A67` (`category_2`), ADD KEY `IDX_1762498C75A07AF1` (`category_3`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app`
--
ALTER TABLE `app`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=26;
--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=14;
--
-- AUTO_INCREMENT for table `component`
--
ALTER TABLE `component`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=12;
--
-- AUTO_INCREMENT for table `grp`
--
ALTER TABLE `grp`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=19;
--
-- AUTO_INCREMENT for table `help`
--
ALTER TABLE `help`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT for table `template`
--
ALTER TABLE `template`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `tracking`
--
ALTER TABLE `tracking`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `usr`
--
ALTER TABLE `usr`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=15;
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
