-- Utilisateur applicatif NON root, avec mot de passe (à changer !)
CREATE USER IF NOT EXISTS 'fitbook_app'@'localhost' IDENTIFIED BY 'CHANGE_MOI_Fitbook#2026';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON fitbook.* TO 'fitbook_app'@'localhost';
-- Droits limités : pas de DROP / ALTER / GRANT pour l'application
FLUSH PRIVILEGES;
