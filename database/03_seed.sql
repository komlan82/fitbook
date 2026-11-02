USE fitbook;
-- mots de passe = "Fitbook2026!" (hash bcrypt)
INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role,email_confirme) VALUES
('Admin','Fit','admin@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','admin',1),
('Dupont','Marie','gestionnaire@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','gestionnaire',1),
('Martin','Camille','camille@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','coach',1),
('Leroy','Marc','marc@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','coach',1),
('Moreau','Léa','lea@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1),
('Benali','Karim','karim@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1),
('Claes','Sophie','sophie@fitbook.test','$2y$12$KKkbtZyLnYtrV708q0.WDO/lRYmOrowz9awwXAwtkTe.Xo10qQnni','sportif',1);
INSERT INTO discipline (libelle) VALUES ('Yoga'),('Pilates'),('Boxe'),('Musculation'),('Cardio');
INSERT INTO coach (id_utilisateur,biographie,tarif_horaire) VALUES
(3,'Professeure de yoga certifiée, 8 ans d''expérience.',35.00),
(4,'Ancien boxeur amateur, coach depuis 5 ans.',40.00);
INSERT INTO salle (id_gestionnaire,nom,adresse,ville,code_postal,statut_validation) VALUES
(2,'Studio Zen','Rue de la Paix 12','Ixelles','1050','validee'),
(2,'Ring & Gloves','Rue des Palais 40','Anderlecht','1070','validee'),
(2,'Souffle & Corps','Avenue Brugmann 5','Uccle','1180','validee'),
(2,'Iron Club','Chaussée de Helmet 90','Schaerbeek','1030','en_attente');
INSERT INTO specialiser VALUES (1,1),(1,2),(2,3),(2,5);
INSERT INTO disponibilite (id_coach,date_debut,date_fin) VALUES
(1,'2026-11-05 09:00','2026-11-05 18:00'),(2,'2026-11-06 14:00','2026-11-06 20:00');
INSERT INTO seance (id_coach,id_salle,id_discipline,titre,type_seance,date_debut,date_fin,prix,places_max) VALUES
(1,1,1,'Yoga Vinyasa','collective','2026-11-07 10:00','2026-11-07 11:00',12,10),
(1,1,2,'Pilates doux','collective','2026-11-08 09:30','2026-11-08 10:30',12,8),
(1,1,1,'Yoga du soir','collective','2026-11-09 19:00','2026-11-09 20:00',12,2),
(2,2,3,'Boxe initiation','collective','2026-11-10 18:30','2026-11-10 19:30',12,12),
(2,2,5,'Cardio boxe','collective','2026-11-11 18:30','2026-11-11 19:30',11,12),
(1,3,1,'Yoga matinal','collective','2026-11-12 08:00','2026-11-12 09:00',10,15);
INSERT INTO reserver (id_utilisateur,id_seance,statut) VALUES (5,1,'confirmee'),(6,1,'confirmee'),(5,4,'en_attente'),(7,3,'confirmee'),(6,3,'confirmee');
INSERT INTO favoriser_salle (id_utilisateur,id_salle) VALUES (5,1),(6,2);
INSERT INTO favoriser_coach (id_utilisateur,id_coach) VALUES (5,1),(7,2);
INSERT INTO avis (id_utilisateur,id_salle,id_coach,note,commentaire) VALUES
(5,1,NULL,4,'Séance très agréable, coach attentif et salle propre.'),
(6,1,NULL,5,'Super ambiance, je recommande ce studio à tous !'),
(7,NULL,2,5,'Coach motivant et pédagogue.');
