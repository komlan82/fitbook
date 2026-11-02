<?php

namespace App\Security;

use App\Entity\Utilisateur;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/** Refuse la connexion tant que l'adresse email n'est pas confirmée. */
class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if ($user instanceof Utilisateur && !$user->isEmailConfirme()) {
            throw new CustomUserMessageAccountStatusException('Veuillez confirmer votre adresse email avant de vous connecter.');
        }
    }

    public function checkPostAuth(UserInterface $user, $token = null): void
    {
    }
}
