<?php

namespace App\Tests\Unit;

use App\Entity\Utilisateur;
use PHPUnit\Framework\TestCase;

class UtilisateurTest extends TestCase
{
    public function testRoleSportifParDefautEtNonConfirme(): void
    {
        $u = new Utilisateur();
        $this->assertSame('sportif', $u->getRole());
        $this->assertFalse($u->isEmailConfirme());
        $this->assertContains('ROLE_SPORTIF', $u->getRoles());
        $this->assertNotContains('ROLE_ADMIN', $u->getRoles());
    }

    public function testRoleAdmin(): void
    {
        $u = (new Utilisateur())->setRole('admin');
        $this->assertContains('ROLE_ADMIN', $u->getRoles());
    }

    public function testIdentifiantEstLEmail(): void
    {
        $u = (new Utilisateur())->setEmail('lea@fitbook.test');
        $this->assertSame('lea@fitbook.test', $u->getUserIdentifier());
    }

    public function testHashJamaisSerialiseEnClair(): void
    {
        $u = (new Utilisateur())->setMotDePasse('$2y$12$HASHSECRET');
        $this->assertStringNotContainsString('HASHSECRET', serialize($u));
    }
}
