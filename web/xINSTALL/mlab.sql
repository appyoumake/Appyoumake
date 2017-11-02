-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: 02. Nov, 2017 11:11 AM
-- Server-versjon: 5.7.20-0ubuntu0.16.04.1
-- PHP Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mlab`
--

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `app`
--

CREATE TABLE `app` (
  `id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `updatedby_id` int(11) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `keywords` longtext COLLATE utf8_unicode_ci,
  `active_version` double DEFAULT '1',
  `created` date NOT NULL,
  `updated` datetime NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `published` int(11) DEFAULT '0',
  `uid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `tags` text COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `apps_groups`
--

CREATE TABLE `apps_groups` (
  `app_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `app_version`
--

CREATE TABLE `app_version` (
  `id` int(11) NOT NULL,
  `app_id` int(11) DEFAULT NULL,
  `version` double NOT NULL DEFAULT '1',
  `enabled` int(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `component`
--

CREATE TABLE `component` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL,
  `order_by` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `components_groups`
--

CREATE TABLE `components_groups` (
  `id` int(11) NOT NULL,
  `component_id` int(11) DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `credential` text COLLATE utf8_unicode_ci,
  `access_state` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `grp`
--

CREATE TABLE `grp` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci,
  `is_default` tinyint(1) DEFAULT '0',
  `enabled` tinyint(1) DEFAULT '1',
  `roles` longtext COLLATE utf8_unicode_ci NOT NULL COMMENT '(DC2Type:array)',
  `categories` text COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dataark for tabell `grp`
--

INSERT INTO `grp` (`id`, `name`, `description`, `is_default`, `enabled`, `roles`, `categories`) VALUES
(1, 'Generell22', 'Generell gruppe for app tilgang', 1, 1, 'a:0:{}', '[{"text":"1","children":[{"text":"1.1"},{"text":"1.2"}]},{"text":"2"},{"text":"3","children":[{"text":"3.1","children":[{"text":"3.1.1"},{"text":"3.1.2"}]},{"text":"3.2"}]}]'),
(2, 'Notemplate', 'test', NULL, 1, 'a:0:{}', ''),
(3, 'werwer', 'werwer', NULL, 1, 'N;', '');

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `help`
--

CREATE TABLE `help` (
  `id` int(11) NOT NULL,
  `route` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dataark for tabell `help`
--

INSERT INTO `help` (`id`, `route`, `message`) VALUES
(1, 'admin_apps', 'Help for admin of apps'),
(2, 'admin_users', 'Help for user admin page'),
(3, 'system', 'Help for system admin'),
(4, 'index', 'Help for front page (prelogin as well as logged in)'),
(5, 'app_builder_index', '<!DOCTYPE html>\r\n<!--\r\nTo change this license header, choose License Headers in Project Properties.\r\nTo change this template file, choose Tools | Templates\r\nand open the template in the editor.\r\n-->\r\n<html>\r\n    <head>\r\n        <title>Image</title>\r\n        <meta charset="UTF-8">\r\n        <meta name="viewport" content="width=device-width">\r\n    </head>\r\n    <body>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_icon.png">\r\n  		<div class="mlab_dt_text" style="padding-top: 10px;">Med denne komponenten legger du til et bilde med en beskrivende tekst i appen.</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_upload_icon.jpg">\r\n        <div class="mlab_dt_text">For å velge et bilde klikk på tannhjulet </div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <div class="mlab_dt_text">Du vil da få opp en dialogboks: </div>\r\n        <img class="mlab_dt_picture" style="width: 250px;" src="/img/comphelp/img_upload3.jpg">\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <div class="mlab_dt_text">Her velger du enten et bilde du har lastet opp før fra nedtrekksmenyen eller laster opp et bilde fra din maskin ved å klikke på "Velg fil".</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_size_img.jpg">\r\n        <div class="mlab_dt_text">Med disse knappene kan du gjøre bildet større eller mindre.</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_size_text.jpg">\r\n        <div class="mlab_dt_text">Med disse knappene kan du gjøre bildetexten større eller mindre.</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_lineing_tools.jpg">\r\n        <div class="mlab_dt_text">Med disse knappene kan du velge hvor du ønsker å plasere bidet ditt - til venstre, i midten eller til høyre.</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n        <img class="mlab_dt_picture" src="/img/comphelp/img_default_tools.jpg">\r\n        <div class="mlab_dt_text">Alle komponentene har noen felles verktøy. Med pilene kan du bytte på rekkefølgen til komponenten ved å flytte den opp eller ned. Med det røde krysset kan du slette komponenten. Spørsmålstegnet har du alt klikket på for å få opp denne hjelpen. De tre nederste knappene kan du klippe ut, copiere eller lime inn komponenten</div>\r\n        <div class="mlab_dt_tiny_new_line">&nbsp;</div>\r\n    </body>\r\n</html>\r\n'),
(6, 'app_builder_editor', 'Main app editing page');

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `menu`
--

CREATE TABLE `menu` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dataark for tabell `menu`
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
-- Tabellstruktur for tabell `template`
--

CREATE TABLE `template` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `compatible_with` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `version` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `templates_groups`
--

CREATE TABLE `templates_groups` (
  `template_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `templates_groups_data`
--

CREATE TABLE `templates_groups_data` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `access_state` tinyint(4) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `tracking`
--

CREATE TABLE `tracking` (
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
-- Tabellstruktur for tabell `users_groups`
--

CREATE TABLE `users_groups` (
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dataark for tabell `users_groups`
--

INSERT INTO `users_groups` (`user_id`, `group_id`) VALUES
(3, 1),
(3, 3),
(4, 1),
(4, 3),
(15, 1),
(16, 1),
(19, 1),
(20, 1),
(22, 1),
(22, 2),
(23, 2),
(24, 3);

-- --------------------------------------------------------

--
-- Tabellstruktur for tabell `usr`
--

CREATE TABLE `usr` (
  `id` int(11) NOT NULL,
  `email` varchar(180) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `salt` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `updated` datetime NOT NULL,
  `username` varchar(180) COLLATE utf8_unicode_ci NOT NULL,
  `username_canonical` varchar(180) COLLATE utf8_unicode_ci NOT NULL,
  `email_canonical` varchar(180) COLLATE utf8_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `locked` tinyint(1) NOT NULL,
  `expired` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `confirmation_token` varchar(180) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password_requested_at` datetime DEFAULT NULL,
  `roles` longtext COLLATE utf8_unicode_ci NOT NULL COMMENT '(DC2Type:array)',
  `credentials_expired` tinyint(1) NOT NULL,
  `credentials_expire_at` datetime DEFAULT NULL,
  `locale` varchar(6) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dataark for tabell `usr`
--

INSERT INTO `usr` (`id`, `email`, `password`, `salt`, `created`, `updated`, `username`, `username_canonical`, `email_canonical`, `enabled`, `last_login`, `locked`, `expired`, `expires_at`, `confirmation_token`, `password_requested_at`, `roles`, `credentials_expired`, `credentials_expire_at`, `locale`) VALUES
(3, 'arild.bergh@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2017-11-02 10:48:21', 'arild', 'arild', 'arild.bergh@ffi.no', 1, '2017-11-02 10:48:21', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:16:"ROLE_SUPER_ADMIN";}', 0, NULL, 'en_GB'),
(4, 'Cecilie.Jackbo.Gran@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2016-10-10 12:30:35', 'cecilie', 'cecilie', 'cecilie.jackbo.gran@ffi.no', 1, '2014-01-26 02:27:10', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL, NULL),
(15, 'mil1@ffi.no', 'HbsCt5NO1fLr4VAr9SrCxVKyxZl9YXoXXeNYEZa5wrMo5W72Y0vJRPg20zKFkj73rR+MBL21PSr89d9x29FxBA==', 'ijndw26m9m0occcs8k4g4c88gwsckoo', '2015-03-04', '2016-10-10 12:30:35', 'mil1@ffi.no', 'mil1@ffi.no', 'mil1@ffi.no', 1, '2015-03-09 09:19:30', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:9:"ROLE_USER";}', 0, NULL, NULL),
(16, 'mil2@ffi.no', '7LJVJyx3oAotVO4JHmi7dOPZVakPxbs7FtY7Jk7uKiQDxnOlAp34pHOmAG5pgrv4/VJyXitor/dU/ht2naRpbQ==', '87e75y3sehwk4swg848ccockkwocw8s', '2015-03-04', '2016-10-10 12:30:35', 'mil2@ffi.no', 'mil2@ffi.no', 'mil2@ffi.no', 1, '2015-03-09 10:16:52', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:9:"ROLE_USER";}', 0, NULL, NULL),
(19, 'test@fest.com', 'Qjh40ukB15xyOyzqOYHEja0FVwz0qF/BP+LMocOdDbGZhAokVhOtdkBivh3k0QUxNtqcJGTBlKcXjN4DBdvHMA==', 'tmdwkw6c9y8koc80gc8cg40sosg08ok', '2016-02-26', '2016-02-29 11:22:04', 'nestor', 'nestor', 'test@fest.com', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:9:"ROLE_USER";}', 0, NULL, NULL),
(20, 'a@b.com', 'jirDquzBVnyzWessrvfl+jjklysxi4iuF567dnuczIyXo6TmlE+0rZ75Uc+oJSDwV46B5gBfOXY0L61jz0lsww==', 'g47qa380sdsscos00k0k4k4g0cs4kk0', '2016-02-26', '2016-02-29 11:22:04', 'testy', 'testy', 'a@b.com', 1, '2016-02-26 13:43:49', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:16:"ROLE_SUPER_ADMIN";}', 0, NULL, NULL),
(22, 'lk@gf.no', 'rlR61k7/T+4GeWSXUCvNgAlEMt9E3ll29Z/TIOS4vr2tpAkEtvmJy5NLFcXaTXpyFzvV6Xv+q8+8fqDdceLUfQ==', 'mqht5505ffkk48wskswgcc804s08004', '2016-10-06', '2016-10-06 15:51:26', 'lk@gf.no', 'lk@gf.no', 'lk@gf.no', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL, NULL),
(23, 'post@mail.com', 'WT5on/L7HStxJgJI7Q3FmHI0zkUDFZAmy102cUzX3VajwbIJW50/MhV1irGoC8SFqAW+b070KFDyb0zNWAlI2w==', 'kkklo9nq1o0sc0c00ocg4wsg0wcw08o', '2016-10-10', '2016-10-10 12:29:43', 'Snoozername', 'snoozername', 'post@mail.com', 1, NULL, 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL, NULL),
(24, 'waade@fsks.mil.no', '9rUaEWrKv7vhEzJmeXeBKzsd2QDf1Riko7Ct+uzdSWz2OO+1a+SQNMW5Mdf7aEdYPHqHWhV4wtUpMVaqsAUCMw==', 'qcjboez2pv4sks0s0swcwgo04gc888o', '2016-10-13', '2017-06-21 09:02:34', 'Stig W.', 'stig w.', 'waade@fsks.mil.no', 1, '2017-06-21 09:02:34', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:"ROLE_ADMIN";}', 0, NULL, 'nb_NO');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app`
--
ALTER TABLE `app`
  ADD PRIMARY KEY (`id`),
  ADD KEY `name_index` (`name`),
  ADD KEY `path_index` (`path`),
  ADD KEY `created_index` (`created`),
  ADD KEY `updated_index` (`updated`),
  ADD KEY `enabled_index` (`enabled`),
  ADD KEY `active_version_index` (`active_version`),
  ADD KEY `updatedby_id_index` (`updatedby_id`),
  ADD KEY `template_id_index` (`template_id`),
  ADD KEY `user_id_index` (`user_id`),
  ADD KEY `uid_index` (`uid`);

--
-- Indexes for table `apps_groups`
--
ALTER TABLE `apps_groups`
  ADD PRIMARY KEY (`app_id`,`group_id`),
  ADD KEY `IDX_4ADA29A77987212D` (`app_id`),
  ADD KEY `IDX_4ADA29A7FE54D947` (`group_id`);

--
-- Indexes for table `app_version`
--
ALTER TABLE `app_version`
  ADD PRIMARY KEY (`id`),
  ADD KEY `app_index` (`app_id`),
  ADD KEY `enabled_index` (`enabled`),
  ADD KEY `version_index` (`version`);

--
-- Indexes for table `component`
--
ALTER TABLE `component`
  ADD PRIMARY KEY (`id`),
  ADD KEY `name_index` (`name`),
  ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `components_groups`
--
ALTER TABLE `components_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `component_index` (`component_id`),
  ADD KEY `group_index` (`group_id`);

--
-- Indexes for table `grp`
--
ALTER TABLE `grp`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_FFD56EFF5E237E06` (`name`),
  ADD KEY `name_index` (`name`),
  ADD KEY `is_default_index` (`is_default`),
  ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `help`
--
ALTER TABLE `help`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_index` (`route`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id_index` (`parent_id`),
  ADD KEY `order_by_index` (`order_by`),
  ADD KEY `filter_role_index` (`filter_role`),
  ADD KEY `filter_url_index` (`filter_url`);

--
-- Indexes for table `template`
--
ALTER TABLE `template`
  ADD PRIMARY KEY (`id`),
  ADD KEY `name_index` (`name`),
  ADD KEY `compatible_with_index` (`compatible_with`),
  ADD KEY `enabled_index` (`enabled`);

--
-- Indexes for table `templates_groups`
--
ALTER TABLE `templates_groups`
  ADD PRIMARY KEY (`template_id`,`group_id`),
  ADD KEY `IDX_F43FD2D35DA0FB8` (`template_id`),
  ADD KEY `IDX_F43FD2D3FE54D947` (`group_id`);

--
-- Indexes for table `templates_groups_data`
--
ALTER TABLE `templates_groups_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `template_id` (`template_id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `access_state` (`access_state`);

--
-- Indexes for table `tracking`
--
ALTER TABLE `tracking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_A87C621CE2ABAFFF` (`component_id`),
  ADD UNIQUE KEY `UNIQ_A87C621CA76ED395` (`user_id`),
  ADD UNIQUE KEY `UNIQ_A87C621C7987212D` (`app_id`),
  ADD KEY `created_index` (`created`),
  ADD KEY `action_index` (`action`);

--
-- Indexes for table `users_groups`
--
ALTER TABLE `users_groups`
  ADD PRIMARY KEY (`user_id`,`group_id`),
  ADD KEY `IDX_FF8AB7E0A76ED395` (`user_id`),
  ADD KEY `IDX_FF8AB7E0FE54D947` (`group_id`);

--
-- Indexes for table `usr`
--
ALTER TABLE `usr`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_1762498C92FC23A8` (`username_canonical`),
  ADD UNIQUE KEY `UNIQ_1762498CA0D96FBF` (`email_canonical`),
  ADD UNIQUE KEY `UNIQ_1762498CC05FB297` (`confirmation_token`),
  ADD KEY `email_index` (`email`),
  ADD KEY `password_index` (`password`),
  ADD KEY `created_index` (`created`),
  ADD KEY `updated_index` (`updated`),
  ADD KEY `username_index` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app`
--
ALTER TABLE `app`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;
--
-- AUTO_INCREMENT for table `app_version`
--
ALTER TABLE `app_version`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `component`
--
ALTER TABLE `component`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT for table `components_groups`
--
ALTER TABLE `components_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT for table `grp`
--
ALTER TABLE `grp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `help`
--
ALTER TABLE `help`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT for table `template`
--
ALTER TABLE `template`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `templates_groups_data`
--
ALTER TABLE `templates_groups_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `tracking`
--
ALTER TABLE `tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `usr`
--
ALTER TABLE `usr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
--
-- Begrensninger for dumpede tabeller
--

--
-- Begrensninger for tabell `app`
--
ALTER TABLE `app`
  ADD CONSTRAINT `FK_C96E70CF5DA0FB8` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`),
  ADD CONSTRAINT `FK_C96E70CFA43E35E8` FOREIGN KEY (`updatedby_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_C96E70CFA76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`);

--
-- Begrensninger for tabell `apps_groups`
--
ALTER TABLE `apps_groups`
  ADD CONSTRAINT `FK_4ADA29A77987212D` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`),
  ADD CONSTRAINT `FK_4ADA29A7FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Begrensninger for tabell `app_version`
--
ALTER TABLE `app_version`
  ADD CONSTRAINT `FK_111` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`);

--
-- Begrensninger for tabell `components_groups`
--
ALTER TABLE `components_groups`
  ADD CONSTRAINT `FK_178B28C3E2ABAFFF` FOREIGN KEY (`component_id`) REFERENCES `component` (`id`),
  ADD CONSTRAINT `FK_178B28C3FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Begrensninger for tabell `templates_groups`
--
ALTER TABLE `templates_groups`
  ADD CONSTRAINT `FK_F43FD2D35DA0FB8` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`),
  ADD CONSTRAINT `FK_F43FD2D3FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

--
-- Begrensninger for tabell `tracking`
--
ALTER TABLE `tracking`
  ADD CONSTRAINT `FK_A87C621C7987212D` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`),
  ADD CONSTRAINT `FK_A87C621CA76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_A87C621CE2ABAFFF` FOREIGN KEY (`component_id`) REFERENCES `component` (`id`);

--
-- Begrensninger for tabell `users_groups`
--
ALTER TABLE `users_groups`
  ADD CONSTRAINT `FK_FF8AB7E0A76ED395` FOREIGN KEY (`user_id`) REFERENCES `usr` (`id`),
  ADD CONSTRAINT `FK_FF8AB7E0FE54D947` FOREIGN KEY (`group_id`) REFERENCES `grp` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
