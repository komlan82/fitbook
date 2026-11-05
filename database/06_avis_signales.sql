-- FB-36 : signalement des avis (modération par l'administrateur).
-- À exécuter UNE SEULE FOIS avec le compte root (l'utilisateur applicatif n'a pas le droit ALTER).
USE fitbook;
ALTER TABLE avis ADD COLUMN signale TINYINT(1) NOT NULL DEFAULT 0;
