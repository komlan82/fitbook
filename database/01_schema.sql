-- FitBook - schéma MySQL 8 (dérivé du MCD/MLD : 7 entités, 13 associations)
CREATE DATABASE IF NOT EXISTS fitbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitbook;

CREATE TABLE utilisateur (
  id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('sportif','coach','gestionnaire','admin') NOT NULL DEFAULT 'sportif',
  email_confirme TINYINT(1) NOT NULL DEFAULT 0,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE discipline (
  id_discipline INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE coach (
  id_coach INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL UNIQUE,
  biographie TEXT,
  tarif_horaire DECIMAL(6,2) NOT NULL CHECK (tarif_horaire >= 0),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE salle (
  id_salle INT AUTO_INCREMENT PRIMARY KEY,
  id_gestionnaire INT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  adresse VARCHAR(150) NOT NULL,
  ville VARCHAR(60) NOT NULL,
  code_postal VARCHAR(10) NOT NULL,
  statut_validation ENUM('en_attente','validee','refusee') NOT NULL DEFAULT 'en_attente',
  FOREIGN KEY (id_gestionnaire) REFERENCES utilisateur(id_utilisateur)
) ENGINE=InnoDB;

CREATE TABLE specialiser (
  id_coach INT NOT NULL, id_discipline INT NOT NULL,
  PRIMARY KEY (id_coach,id_discipline),
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach) ON DELETE CASCADE,
  FOREIGN KEY (id_discipline) REFERENCES discipline(id_discipline)
) ENGINE=InnoDB;

CREATE TABLE disponibilite (
  id_disponibilite INT AUTO_INCREMENT PRIMARY KEY,
  id_coach INT NOT NULL,
  date_debut DATETIME NOT NULL, date_fin DATETIME NOT NULL,
  CHECK (date_fin > date_debut),
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE seance (
  id_seance INT AUTO_INCREMENT PRIMARY KEY,
  id_coach INT NOT NULL, id_salle INT NOT NULL, id_discipline INT NOT NULL,
  titre VARCHAR(100) NOT NULL,
  type_seance ENUM('collective','individuelle') NOT NULL DEFAULT 'collective',
  date_debut DATETIME NOT NULL, date_fin DATETIME NOT NULL,
  prix DECIMAL(6,2) NOT NULL CHECK (prix >= 0),
  places_max SMALLINT NOT NULL CHECK (places_max > 0),
  statut ENUM('ouverte','annulee','terminee') NOT NULL DEFAULT 'ouverte',
  CHECK (date_fin > date_debut),
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach),
  FOREIGN KEY (id_salle) REFERENCES salle(id_salle),
  FOREIGN KEY (id_discipline) REFERENCES discipline(id_discipline),
  INDEX idx_seance_date (date_debut)
) ENGINE=InnoDB;

CREATE TABLE reserver (
  id_utilisateur INT NOT NULL, id_seance INT NOT NULL,
  date_reservation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('confirmee','en_attente','annulee') NOT NULL DEFAULT 'confirmee',
  PRIMARY KEY (id_utilisateur,id_seance),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
  FOREIGN KEY (id_seance) REFERENCES seance(id_seance)
) ENGINE=InnoDB;

CREATE TABLE favoriser_salle (
  id_utilisateur INT NOT NULL, id_salle INT NOT NULL,
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_utilisateur,id_salle),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_salle) REFERENCES salle(id_salle) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favoriser_coach (
  id_utilisateur INT NOT NULL, id_coach INT NOT NULL,
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_utilisateur,id_coach),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE avis (
  id_avis INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_salle INT NULL, id_coach INT NULL,
  note TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date_avis DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  CHECK ((id_salle IS NULL) <> (id_coach IS NULL)),   -- contrainte {xor}
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
  FOREIGN KEY (id_salle) REFERENCES salle(id_salle),
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach)
) ENGINE=InnoDB;

-- Journal des sauvegardes (message visible côté client)
CREATE TABLE sauvegarde_journal (
  id_sauvegarde INT AUTO_INCREMENT PRIMARY KEY,
  fichier VARCHAR(200) NOT NULL,
  taille_octets BIGINT NULL,
  date_sauvegarde DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('ok','erreur') NOT NULL DEFAULT 'ok'
) ENGINE=InnoDB;
