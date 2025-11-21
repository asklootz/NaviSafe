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
SET time_zone = "+00:00";


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

DROP TABLE IF EXISTS `organisation`;
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

DROP TABLE IF EXISTS `reporting`;
CREATE TABLE IF NOT EXISTS `reporting` (
  `regID` int(11) NOT NULL AUTO_INCREMENT,
  `lat` float NOT NULL,
  `lon` float NOT NULL,
  `altitude` float DEFAULT NULL,
  `accuracy` int(11) DEFAULT NULL,
  `shortDesc` varchar(50) DEFAULT NULL,
  `longDesc` varchar(255) DEFAULT NULL,
  `img` mediumblob DEFAULT NULL,
  `isSent` tinyint(1) NOT NULL,
  `state` enum('SENT','PENDING','REJECTED') NOT NULL,
  `rejectComment` varchar(255) DEFAULT NULL,
  `userID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`regID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `reporting`
--

INSERT INTO `reporting` (`regID`, `lat`, `lon`, `altitude`, `accuracy`, `shortDesc`, `longDesc`, `img`, `isSent`, `state`, `rejectComment`, `userID`, `creationDate`) VALUES
(1, 63.4298, 10.394, 33, 22, 'Building in Trondheim', 'PHT_pilot1 registered building during low altitude patrol near Trondheim', NULL, 1, 'SENT', 'Submitted', 4, '2025-11-08 15:57:50'),
(2, 59.917, 10.7611, 25, 15, 'Power line over Oslo fjord', 'LUFT_pilot2 registered power line due to poor visibility in harsh weather', NULL, 1, 'SENT', 'Pending', 3, '2025-10-27 00:00:00'),
(3, 58.1585, 8.0165, 12, 8, 'High tower near Kjevik Airport', 'NLA_pilot1 registered tower observed during landing', NULL, 1, 'SENT', 'Submitted', 2, '2025-10-28 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `userAuth`
--

DROP TABLE IF EXISTS `userAuth`;
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
(1, 'admin@kartverket.no', 'loodhHl1A1YABjm/4xD/hW2q/ZuCzWLop6g4361nD3Q=', 'PGgltVghys3nldsaJP5r3w=='),
(2, 'pilot@nla.no', 'lgFM6ogmbH1QhObvtrJhRKpJJzrzuzDS8Z+0iZxCYk4=', 'BRDgCz0DVguBDsC7wOAV8g=='),
(3, 'pilot@forsvaret.no', 'BzDuVukFeycwe2c1jxdebhOfl663fxEXEe5gHXHgD1I=', 'fzCGk9lA0PR+hEvb8uHjzA=='),
(4, 'pilot@politiet', '7kA1ghbxkuXDbzHjr0tVxB8wDfREsAOFH3S+IzPqJZE=', '4DBTxP+EUUmUhro+yJt2wA==');

-- --------------------------------------------------------

--
-- Table structure for table `userInfo`
--

DROP TABLE IF EXISTS `userInfo`;
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

DROP TABLE IF EXISTS `userRole`;
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
