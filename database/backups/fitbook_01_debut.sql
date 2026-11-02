-- MySQL dump 10.13  Distrib 8.4.7, for Win64 (x86_64)
--
-- Host: localhost    Database: fitbook
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `avis`
--

DROP TABLE IF EXISTS `avis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avis` (
  `id_avis` int NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int NOT NULL,
  `id_salle` int DEFAULT NULL,
  `id_coach` int DEFAULT NULL,
  `note` tinyint NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `date_avis` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_avis`),
  KEY `id_utilisateur` (`id_utilisateur`),
  KEY `id_salle` (`id_salle`),
  KEY `id_coach` (`id_coach`),
  CONSTRAINT `avis_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`),
  CONSTRAINT `avis_ibfk_2` FOREIGN KEY (`id_salle`) REFERENCES `salle` (`id_salle`),
  CONSTRAINT `avis_ibfk_3` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`),
  CONSTRAINT `avis_chk_1` CHECK ((`note` between 1 and 5)),
  CONSTRAINT `avis_chk_2` CHECK (((`id_salle` is null) <> (`id_coach` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avis`
--

LOCK TABLES `avis` WRITE;
/*!40000 ALTER TABLE `avis` DISABLE KEYS */;
INSERT INTO `avis` VALUES (1,5,1,NULL,4,'Séance très agréable, coach attentif et salle propre.','2026-11-02 12:39:12',1),(2,6,1,NULL,5,'Super ambiance, je recommande ce studio à tous !','2026-11-02 12:39:12',1),(3,7,NULL,2,5,'Coach motivant et pédagogue.','2026-11-02 12:39:12',1);
/*!40000 ALTER TABLE `avis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coach`
--

DROP TABLE IF EXISTS `coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach` (
  `id_coach` int NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int NOT NULL,
  `biographie` text COLLATE utf8mb4_unicode_ci,
  `tarif_horaire` decimal(6,2) NOT NULL,
  PRIMARY KEY (`id_coach`),
  UNIQUE KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `coach_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON DELETE CASCADE,
  CONSTRAINT `coach_chk_1` CHECK ((`tarif_horaire` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coach`
--

LOCK TABLES `coach` WRITE;
/*!40000 ALTER TABLE `coach` DISABLE KEYS */;
INSERT INTO `coach` VALUES (1,3,'Professeure de yoga certifiée, 8 ans d\'expérience.',35.00),(2,4,'Ancien boxeur amateur, coach depuis 5 ans.',40.00);
/*!40000 ALTER TABLE `coach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discipline`
--

DROP TABLE IF EXISTS `discipline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discipline` (
  `id_discipline` int NOT NULL AUTO_INCREMENT,
  `libelle` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_discipline`),
  UNIQUE KEY `libelle` (`libelle`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discipline`
--

LOCK TABLES `discipline` WRITE;
/*!40000 ALTER TABLE `discipline` DISABLE KEYS */;
INSERT INTO `discipline` VALUES (3,'Boxe'),(5,'Cardio'),(4,'Musculation'),(2,'Pilates'),(1,'Yoga');
/*!40000 ALTER TABLE `discipline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disponibilite`
--

DROP TABLE IF EXISTS `disponibilite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disponibilite` (
  `id_disponibilite` int NOT NULL AUTO_INCREMENT,
  `id_coach` int NOT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  PRIMARY KEY (`id_disponibilite`),
  KEY `id_coach` (`id_coach`),
  CONSTRAINT `disponibilite_ibfk_1` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`) ON DELETE CASCADE,
  CONSTRAINT `disponibilite_chk_1` CHECK ((`date_fin` > `date_debut`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disponibilite`
--

LOCK TABLES `disponibilite` WRITE;
/*!40000 ALTER TABLE `disponibilite` DISABLE KEYS */;
INSERT INTO `disponibilite` VALUES (1,1,'2026-11-05 09:00:00','2026-11-05 18:00:00'),(2,2,'2026-11-06 14:00:00','2026-11-06 20:00:00');
/*!40000 ALTER TABLE `disponibilite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoriser_coach`
--

DROP TABLE IF EXISTS `favoriser_coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoriser_coach` (
  `id_utilisateur` int NOT NULL,
  `id_coach` int NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_utilisateur`,`id_coach`),
  KEY `id_coach` (`id_coach`),
  CONSTRAINT `favoriser_coach_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON DELETE CASCADE,
  CONSTRAINT `favoriser_coach_ibfk_2` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoriser_coach`
--

LOCK TABLES `favoriser_coach` WRITE;
/*!40000 ALTER TABLE `favoriser_coach` DISABLE KEYS */;
INSERT INTO `favoriser_coach` VALUES (5,1,'2026-11-02 12:39:12'),(7,2,'2026-11-02 12:39:12');
/*!40000 ALTER TABLE `favoriser_coach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoriser_salle`
--

DROP TABLE IF EXISTS `favoriser_salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoriser_salle` (
  `id_utilisateur` int NOT NULL,
  `id_salle` int NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_utilisateur`,`id_salle`),
  KEY `id_salle` (`id_salle`),
  CONSTRAINT `favoriser_salle_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON DELETE CASCADE,
  CONSTRAINT `favoriser_salle_ibfk_2` FOREIGN KEY (`id_salle`) REFERENCES `salle` (`id_salle`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoriser_salle`
--

LOCK TABLES `favoriser_salle` WRITE;
/*!40000 ALTER TABLE `favoriser_salle` DISABLE KEYS */;
INSERT INTO `favoriser_salle` VALUES (5,1,'2026-11-02 12:39:12'),(6,2,'2026-11-02 12:39:12');
/*!40000 ALTER TABLE `favoriser_salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_contact`
--

DROP TABLE IF EXISTS `message_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_contact` (
  `id_message` int NOT NULL AUTO_INCREMENT,
  `donnees` json NOT NULL,
  `date_envoi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_message`),
  CONSTRAINT `chk_contact_json` CHECK (json_schema_valid(_utf8mb4'{\n    "type":"object",\n    "required":["nom","email","message"],\n    "properties":{\n      "nom":{"type":"string","minLength":2,"maxLength":80},\n      "email":{"type":"string","pattern":"^[^@ ]+@[^@ ]+\\\\.[^@ ]+$"},\n      "message":{"type":"string","minLength":10,"maxLength":1000}\n    },\n    "additionalProperties":false}',`donnees`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_contact`
--

LOCK TABLES `message_contact` WRITE;
/*!40000 ALTER TABLE `message_contact` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserver`
--

DROP TABLE IF EXISTS `reserver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserver` (
  `id_utilisateur` int NOT NULL,
  `id_seance` int NOT NULL,
  `date_reservation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('confirmee','en_attente','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmee',
  PRIMARY KEY (`id_utilisateur`,`id_seance`),
  KEY `id_seance` (`id_seance`),
  CONSTRAINT `reserver_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`),
  CONSTRAINT `reserver_ibfk_2` FOREIGN KEY (`id_seance`) REFERENCES `seance` (`id_seance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserver`
--

LOCK TABLES `reserver` WRITE;
/*!40000 ALTER TABLE `reserver` DISABLE KEYS */;
INSERT INTO `reserver` VALUES (5,1,'2026-11-02 12:39:12','confirmee'),(5,4,'2026-11-02 12:39:12','en_attente'),(6,1,'2026-11-02 12:39:12','confirmee'),(6,3,'2026-11-02 12:39:12','confirmee'),(7,3,'2026-11-02 12:39:12','confirmee');
/*!40000 ALTER TABLE `reserver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salle`
--

DROP TABLE IF EXISTS `salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salle` (
  `id_salle` int NOT NULL AUTO_INCREMENT,
  `id_gestionnaire` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut_validation` enum('en_attente','validee','refusee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  PRIMARY KEY (`id_salle`),
  KEY `id_gestionnaire` (`id_gestionnaire`),
  CONSTRAINT `salle_ibfk_1` FOREIGN KEY (`id_gestionnaire`) REFERENCES `utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salle`
--

LOCK TABLES `salle` WRITE;
/*!40000 ALTER TABLE `salle` DISABLE KEYS */;
INSERT INTO `salle` VALUES (1,2,'Studio Zen','Rue de la Paix 12','Ixelles','1050','validee'),(2,2,'Ring & Gloves','Rue des Palais 40','Anderlecht','1070','validee'),(3,2,'Souffle & Corps','Avenue Brugmann 5','Uccle','1180','validee'),(4,2,'Iron Club','Chaussée de Helmet 90','Schaerbeek','1030','en_attente');
/*!40000 ALTER TABLE `salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sauvegarde_journal`
--

DROP TABLE IF EXISTS `sauvegarde_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sauvegarde_journal` (
  `id_sauvegarde` int NOT NULL AUTO_INCREMENT,
  `fichier` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taille_octets` bigint DEFAULT NULL,
  `date_sauvegarde` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('ok','erreur') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ok',
  PRIMARY KEY (`id_sauvegarde`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sauvegarde_journal`
--

LOCK TABLES `sauvegarde_journal` WRITE;
/*!40000 ALTER TABLE `sauvegarde_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `sauvegarde_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seance`
--

DROP TABLE IF EXISTS `seance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seance` (
  `id_seance` int NOT NULL AUTO_INCREMENT,
  `id_coach` int NOT NULL,
  `id_salle` int NOT NULL,
  `id_discipline` int NOT NULL,
  `titre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_seance` enum('collective','individuelle') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'collective',
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `prix` decimal(6,2) NOT NULL,
  `places_max` smallint NOT NULL,
  `statut` enum('ouverte','annulee','terminee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ouverte',
  PRIMARY KEY (`id_seance`),
  KEY `id_coach` (`id_coach`),
  KEY `id_salle` (`id_salle`),
  KEY `id_discipline` (`id_discipline`),
  KEY `idx_seance_date` (`date_debut`),
  CONSTRAINT `seance_ibfk_1` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`),
  CONSTRAINT `seance_ibfk_2` FOREIGN KEY (`id_salle`) REFERENCES `salle` (`id_salle`),
  CONSTRAINT `seance_ibfk_3` FOREIGN KEY (`id_discipline`) REFERENCES `discipline` (`id_discipline`),
  CONSTRAINT `seance_chk_1` CHECK ((`prix` >= 0)),
  CONSTRAINT `seance_chk_2` CHECK ((`places_max` > 0)),
  CONSTRAINT `seance_chk_3` CHECK ((`date_fin` > `date_debut`))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seance`
--

LOCK TABLES `seance` WRITE;
/*!40000 ALTER TABLE `seance` DISABLE KEYS */;
INSERT INTO `seance` VALUES (1,1,1,1,'Yoga Vinyasa','collective','2026-11-07 10:00:00','2026-11-07 11:00:00',12.00,10,'ouverte'),(2,1,1,2,'Pilates doux','collective','2026-11-08 09:30:00','2026-11-08 10:30:00',12.00,8,'ouverte'),(3,1,1,1,'Yoga du soir','collective','2026-11-09 19:00:00','2026-11-09 20:00:00',12.00,2,'ouverte'),(4,2,2,3,'Boxe initiation','collective','2026-11-10 18:30:00','2026-11-10 19:30:00',12.00,12,'ouverte'),(5,2,2,5,'Cardio boxe','collective','2026-11-11 18:30:00','2026-11-11 19:30:00',11.00,12,'ouverte'),(6,1,3,1,'Yoga matinal','collective','2026-11-12 08:00:00','2026-11-12 09:00:00',10.00,15,'ouverte');
/*!40000 ALTER TABLE `seance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialiser`
--

DROP TABLE IF EXISTS `specialiser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialiser` (
  `id_coach` int NOT NULL,
  `id_discipline` int NOT NULL,
  PRIMARY KEY (`id_coach`,`id_discipline`),
  KEY `id_discipline` (`id_discipline`),
  CONSTRAINT `specialiser_ibfk_1` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`) ON DELETE CASCADE,
  CONSTRAINT `specialiser_ibfk_2` FOREIGN KEY (`id_discipline`) REFERENCES `discipline` (`id_discipline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialiser`
--

LOCK TABLES `specialiser` WRITE;
/*!40000 ALTER TABLE `specialiser` DISABLE KEYS */;
INSERT INTO `specialiser` VALUES (1,1),(1,2),(2,3),(2,5);
/*!40000 ALTER TABLE `specialiser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateur` (
  `id_utilisateur` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('sportif','coach','gestionnaire','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sportif',
  `email_confirme` tinyint(1) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_utilisateur`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateur`
--

LOCK TABLES `utilisateur` WRITE;
/*!40000 ALTER TABLE `utilisateur` DISABLE KEYS */;
INSERT INTO `utilisateur` VALUES (1,'Admin','Fit','admin@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','admin',1,'2026-11-02 12:39:12'),(2,'Dupont','Marie','gestionnaire@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','gestionnaire',1,'2026-11-02 12:39:12'),(3,'Martin','Camille','camille@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','coach',1,'2026-11-02 12:39:12'),(4,'Leroy','Marc','marc@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','coach',1,'2026-11-02 12:39:12'),(5,'Moreau','Léa','lea@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1,'2026-11-02 12:39:12'),(6,'Benali','Karim','karim@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1,'2026-11-02 12:39:12'),(7,'Claes','Sophie','sophie@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1,'2026-11-02 12:39:12');
/*!40000 ALTER TABLE `utilisateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'fitbook'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_ajouter_avis` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_ajouter_avis`(IN p_user INT, IN p_salle INT, IN p_coach INT, IN p_note INT, IN p_comm TEXT, OUT p_code VARCHAR(30))
BEGIN
  IF (p_salle IS NULL) = (p_coach IS NULL) THEN SET p_code='UNE_SEULE_CIBLE';
  ELSEIF p_note<1 OR p_note>5 THEN SET p_code='NOTE_INVALIDE';
  ELSEIF NOT EXISTS (
     SELECT 1 FROM reserver r JOIN seance s ON s.id_seance=r.id_seance
     WHERE r.id_utilisateur=p_user AND r.statut='confirmee' AND s.date_fin<NOW()
       AND ((p_salle IS NOT NULL AND s.id_salle=p_salle) OR (p_coach IS NOT NULL AND s.id_coach=p_coach))
  ) THEN SET p_code='SEANCE_NON_SUIVIE';
  ELSE
    INSERT INTO avis (id_utilisateur,id_salle,id_coach,note,commentaire) VALUES (p_user,p_salle,p_coach,p_note,p_comm);
    SET p_code='OK';
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_annuler_reservation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_annuler_reservation`(IN p_user INT, IN p_seance INT, OUT p_code VARCHAR(30))
BEGIN
  DECLARE v_debut DATETIME;
  SELECT date_debut INTO v_debut FROM seance WHERE id_seance=p_seance;
  IF v_debut IS NULL THEN SET p_code='SEANCE_INTROUVABLE';
  ELSEIF v_debut<=NOW() THEN SET p_code='TROP_TARD';
  ELSE
    UPDATE reserver SET statut='annulee' WHERE id_utilisateur=p_user AND id_seance=p_seance AND statut<>'annulee';
    SET p_code=IF(ROW_COUNT()=1,'OK','RESERVATION_INTROUVABLE');
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reserver_seance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_reserver_seance`(IN p_user INT, IN p_seance INT, OUT p_code VARCHAR(30))
BEGIN
  DECLARE v_max INT; DECLARE v_prises INT; DECLARE v_statut VARCHAR(20); DECLARE v_debut DATETIME;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; SET p_code='ERREUR_SQL'; END;
  START TRANSACTION;
  SELECT places_max, statut, date_debut INTO v_max, v_statut, v_debut FROM seance WHERE id_seance=p_seance FOR UPDATE;
  IF v_max IS NULL THEN SET p_code='SEANCE_INTROUVABLE';
  ELSEIF v_statut<>'ouverte' OR v_debut<=NOW() THEN SET p_code='SEANCE_FERMEE';
  ELSEIF EXISTS (SELECT 1 FROM reserver WHERE id_utilisateur=p_user AND id_seance=p_seance AND statut<>'annulee') THEN SET p_code='DEJA_RESERVEE';
  ELSE
    SELECT COUNT(*) INTO v_prises FROM reserver WHERE id_seance=p_seance AND statut<>'annulee';
    IF v_prises>=v_max THEN SET p_code='COMPLETE';
    ELSE
      INSERT INTO reserver (id_utilisateur,id_seance,statut) VALUES (p_user,p_seance,'confirmee')
        ON DUPLICATE KEY UPDATE statut='confirmee', date_reservation=NOW();
      SET p_code='OK';
    END IF;
  END IF;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 12:57:14
