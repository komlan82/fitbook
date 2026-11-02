<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/** Entité mappée sur la table existante `utilisateur` (créée par database/01_schema.sql). */
#[ORM\Entity]
#[ORM\Table(name: 'utilisateur')]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_utilisateur', type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(length: 80)]
    private string $nom = '';

    #[ORM\Column(length: 80)]
    private string $prenom = '';

    #[ORM\Column(length: 180, unique: true)]
    private string $email = '';

    #[ORM\Column(name: 'mot_de_passe', length: 255)]
    private string $motDePasse = '';

    #[ORM\Column(length: 20)]
    private string $role = 'sportif';

    #[ORM\Column(name: 'email_confirme', type: 'boolean')]
    private bool $emailConfirme = false;

    #[ORM\Column(name: 'date_creation', type: 'datetime_immutable')]
    private \DateTimeImmutable $dateCreation;

    public function __construct()
    {
        $this->dateCreation = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getPrenom(): string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getPassword(): ?string { return $this->motDePasse; }
    public function setMotDePasse(string $hash): static { $this->motDePasse = $hash; return $this; }
    public function getRole(): string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }
    public function isEmailConfirme(): bool { return $this->emailConfirme; }
    public function setEmailConfirme(bool $v): static { $this->emailConfirme = $v; return $this; }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /** sportif -> ROLE_SPORTIF, coach -> ROLE_COACH, gestionnaire -> ROLE_GESTIONNAIRE, admin -> ROLE_ADMIN */
    public function getRoles(): array
    {
        return ['ROLE_USER', 'ROLE_' . strtoupper($this->role)];
    }

    public function eraseCredentials(): void
    {
    }

    /** Ne jamais stocker le hash complet dans la session. */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0" . self::class . "\0motDePasse"] = hash('crc32c', $this->motDePasse);

        return $data;
    }
}
