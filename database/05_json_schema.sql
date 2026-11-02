USE fitbook;
-- Schéma JSON sur un formulaire hors connexion : préférences de recherche / contact
CREATE TABLE IF NOT EXISTS message_contact (
  id_message INT AUTO_INCREMENT PRIMARY KEY,
  donnees JSON NOT NULL,
  date_envoi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_contact_json CHECK (JSON_SCHEMA_VALID('{
    "type":"object",
    "required":["nom","email","message"],
    "properties":{
      "nom":{"type":"string","minLength":2,"maxLength":80},
      "email":{"type":"string","pattern":"^[^@ ]+@[^@ ]+\\\\.[^@ ]+$"},
      "message":{"type":"string","minLength":10,"maxLength":1000}
    },
    "additionalProperties":false}', donnees))
) ENGINE=InnoDB;
