-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mariaContainer:3306
-- Generation Time: Nov 18, 2025 at 03:09 PM
-- Server version: 11.8.3-MariaDB-ubu2404
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET GLOBAL time_zone = "CET";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mariaDatabase`
--
CREATE DATABASE IF NOT EXISTS `mariaDatabase` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `mariaDatabase`;

-- --------------------------------------------------------

--
-- Table structure for table `organisation`
--

-- DROP TABLE IF EXISTS `organisation`;
CREATE TABLE IF NOT EXISTS `organisation` (
  `orgNr` int(11) NOT NULL AUTO_INCREMENT,
  `orgName` varchar(255) NOT NULL,
  PRIMARY KEY (`orgNr`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `organisation`
--

INSERT INTO `organisation` (`orgNr`, `orgName`) VALUES
(1, 'Kartverket'),
(2, 'Norsk Luftambulanse'),
(3, 'Luftforsvaret'),
(4, 'Politiets Helikoptertjeneste');

-- --------------------------------------------------------

--
-- Table structure for table `reporting`
--

-- DROP TABLE IF EXISTS `reporting`;
CREATE TABLE IF NOT EXISTS `reporting` (
  `regID` int(11) NOT NULL AUTO_INCREMENT,
  `lat` float NOT NULL,
  `lon` float NOT NULL,
  `altitude` float DEFAULT NULL,
  `accuracy` int(11) DEFAULT NULL,
  `shortDesc` varchar(50) DEFAULT NULL,
  `longDesc` varchar(255) DEFAULT NULL,
  `img` varchar(50) DEFAULT NULL,
  `isSent` bool NOT NULL,
  `state` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `rejectComment` varchar(255) DEFAULT NULL,
  `userID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `geoJSON` JSON DEFAULT NULL,
  PRIMARY KEY (`regID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `reporting`
--

 INSERT INTO `reporting` (`regID`, `lat`, `lon`, `altitude`, `accuracy`, `shortDesc`, `longDesc`, `img`, `isSent`, `state`, `rejectComment`, `userID`, `creationDate`, `geoJSON`) VALUES
 (1, 59.1816, 7.55859, 69, NULL, 'Jesus', 'Our lord and saviour', '/images/TallJesus.jpg', true, 'REJECTED', 'He is not real >:(', 4, '2025-11-26 12:24:46', '{"type":"Feature","geometry":{"type":"Point","coordinates":[7.558593750000001,59.18155722094256]},"properties":{"source":"marker"}}'),
 (2, 58.1465, 7.99509, 420, NULL, 'Tree', 'Jolly good christmas tree', '/images/Tree.jpg', true, 'PENDING', 'Will approve if sender is on the nice list ;D', 2, '2025-11-26 12:06:44', '{"type":"Feature","geometry":{"type":"Point","coordinates":[7.9950857162475595,58.14652207802879]},"properties":{"source":"marker"}}'),
 (3, 58.8027, 5.67667, 666, NULL, 'CatZilla', 'Giant scary killer kitty cat', '/images/CatZilla.jpeg', true, 'APPROVED', 'Oh hell yeah! Pspspspspsps :3', 3, '2025-11-26 12:38:38', '{"type":"Feature","geometry":{"type":"Point","coordinates":[5.676675438880921,58.80270370916149]},"properties":{"source":"marker"}}'),
 (4, 58.9403, 5.70661, 210, 89, 'Ullanhaugstaarnet', 'Admins can also make registrations', '/images/1_20251201T154634318.webp', true, 'APPROVED', 'I am admin, I wanna approve my own stuff', 1, '2025-12-01 16:52:03', '{"type":"Feature","geometry":{"type":"Point","coordinates":[6.973571777343751,59.13156769674785]},"properties":{"source":"marker"}}'),
 (5, 59.1316, 6.97357, 500, NULL, 'A really tall pole', NULL, NULL, 1, 'PENDING', NULL, 2, '2025-12-01 15:52:03', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[6.973571777343751,59.13156769674785]},\"properties\":{\"source\":\"marker\"}}'),
 (6, 58.1456, 7.99904, 89.99, 94, 'Building', 'A new skyscraper', NULL, 1, 'PENDING', NULL, 2, '2025-12-01 15:52:59', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[7.99903605465667,58.14561409530386]},\"properties\":{\"source\":\"live\"}}'),
 (7, 58.1458, 7.99921, NULL, 128, 'Tree', 'I think I MAYBE saw a tree, gonna save as draft for now', '/images/3_20251201T161020672.webp', 0, 'PENDING', NULL, 3, '2025-12-01 16:10:20', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[7.999210622317597,58.14578929828326]},\"properties\":{\"source\":\"live\"}}'),
 (8, 60.3798, 5.19061, 50, NULL, 'Wind Turbine', NULL, '/images/3_20251201T161504426.jpg', 1, 'PENDING', NULL, 3, '2025-12-01 16:15:04', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[5.190610885620118,60.379805554936084]},\"properties\":{\"source\":\"marker\"}}'),
 (9, 58.1456, 7.99904, 77, 94, 'Power Line', 'Powerful powerlines powering everything', '/images/4_20251201T161845457.png', 1, 'PENDING', NULL, 4, '2025-12-01 16:18:45', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[7.99903605465667,58.14561409530386]},\"properties\":{\"source\":\"live\"}}'),
 (10, 70.0206, 22.8516, NULL, NULL, 'Wind Turbine', NULL, NULL, 1, 'PENDING', NULL, 4, '2025-12-01 16:19:31', '{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[22.851562500000004,70.02058730174062]},\"properties\":{\"source\":\"marker\"}}');
                  

-- --------------------------------------------------------

--
-- Table structure for table `userAuth`
--

-- DROP TABLE IF EXISTS `userAuth`;
CREATE TABLE IF NOT EXISTS `userAuth` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(70) NOT NULL,
  `passHash` varchar(255) DEFAULT NULL,
  `passSalt` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `userAuth`
--

INSERT INTO `userAuth` (`userID`, `username`, `passHash`, `passSalt`) VALUES
(1, 'admin@kartverket.no', '$2a$12$Ba.jhfeB6LIpCqRIIxEbh.MA.9EbftVLvPbwC8WJ/5WSiu4Rsrlci', '$2a$12$Ba.jhfeB6LIpCqRIIxEbh.'),
(2, 'pilot@nla.no', '$2a$12$S9.2S.LWO8yBqSN9SvzOO.UUxu8KeluJ0yJZ2Aw1lGUaoWSk/YOTW', '$2a$12$S9.2S.LWO8yBqSN9SvzOO.'),
(3, 'pilot@forsvaret.no', '$2a$12$m88vO3/D3M1oJlBOYT01DuiD9gTawkd/N6SIXKsLzh5ZJYhU3kWh.', '$2a$12$m88vO3/D3M1oJlBOYT01Du'),
(4, 'pilot@politiet.no', '$2a$12$qLHFfrGcnL6YgU0wptsUouKRWYP85tXWfnSffEYRMFmCkJ0j7lOxi', '$2a$12$qLHFfrGcnL6YgU0wptsUou');

-- --------------------------------------------------------

--
-- Table structure for table `userInfo`
--

-- DROP TABLE IF EXISTS `userInfo`;
CREATE TABLE IF NOT EXISTS `userInfo` (
  `userID` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `orgNr` int(11) NOT NULL,
  `roleID` char(5) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userID`),
  KEY `orgNr` (`orgNr`),
  KEY `roleID` (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `userInfo`
--

INSERT INTO `userInfo` (`userID`, `firstName`, `lastName`, `email`, `phone`, `orgNr`, `roleID`, `creationDate`) VALUES
(1, 'Yonathan', 'Admin', 'admin@kartverket.no', '40000000', 1, 'ADM', ' 2025-11-21 02:56:46'),
(2, 'Ola', 'Nordmann', 'pilot@nla.no', '41000001', 2, 'PIL', '2025-11-21 02:59:18'),
(3, 'Kari', 'Nordmann', 'pilot@forsvaret.no', '41000002', 3, 'PIL', ' 2025-11-21 03:06:35'),
(4, 'Die', 'Polizie', 'pilot@politiet.no', '42000003', 4, 'PIL', '2025-11-21 03:11:09');

-- --------------------------------------------------------

--
-- Table structure for table `userRole`
--

-- DROP TABLE IF EXISTS `userRole`;
CREATE TABLE IF NOT EXISTS `userRole` (
  `roleID` char(3) NOT NULL,
  `rolePermissions` enum('ADMIN','PILOT') NOT NULL,
  `permissionsDescription` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `userRole`
--

INSERT INTO `userRole` (`roleID`, `rolePermissions`, `permissionsDescription`) VALUES
('ADM', 'ADMIN', 'Full system access, including management and configuration'),
('PIL', 'PILOT', 'Limited access to flight and operational data');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `reporting`
--
ALTER TABLE `reporting`
  ADD CONSTRAINT `reporting_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `userInfo` (`userID`);

--
-- Constraints for table `userInfo`
--
ALTER TABLE `userInfo`
  ADD CONSTRAINT `userinfo_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `userAuth` (`userID`),
  ADD CONSTRAINT `userinfo_ibfk_2` FOREIGN KEY (`orgNr`) REFERENCES `organisation` (`orgNr`),
  ADD CONSTRAINT `userinfo_ibfk_3` FOREIGN KEY (`roleID`) REFERENCES `userRole` (`roleID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
