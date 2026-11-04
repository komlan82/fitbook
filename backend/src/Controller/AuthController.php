<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class AuthController extends ApiController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        UrlGeneratorInterface $urls,
        UriSigner $signer,
        MailerInterface $mailer,
    ): JsonResponse {
        $data = $this->body($request);
        // On ne lit que les champs prévus : le rôle ne peut JAMAIS être fourni par le client.
        $input = [
            'nom' => $data['nom'] ?? null,
            'prenom' => $data['prenom'] ?? null,
            'email' => isset($data['email']) && is_string($data['email']) ? strtolower(trim($data['email'])) : ($data['email'] ?? null),
            'password' => $data['password'] ?? null,
        ];
        $nomRegex = new Assert\Regex(pattern: "/^[\p{L}\p{M}' \-]{2,80}$/u", message: 'Lettres, espaces, apostrophes et tirets uniquement (2 à 80 caractères).');
        $violations = $validator->validate($input, new Assert\Collection([
            'nom' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Type('string'), $nomRegex],
            'prenom' => [new Assert\NotBlank(message: 'Le prénom est obligatoire.'), new Assert\Type('string'), $nomRegex],
            'email' => [new Assert\NotBlank(message: "L'email est obligatoire."), new Assert\Type('string'), new Assert\Email(message: "Adresse email invalide."), new Assert\Length(max: 180)],
            'password' => [
                new Assert\NotBlank(message: 'Le mot de passe est obligatoire.'),
                new Assert\Type('string'),
                new Assert\Length(min: 10, max: 72, minMessage: 'Au moins 10 caractères.', maxMessage: 'Au plus 72 caractères.'),
                new Assert\Regex(pattern: '/(?=.*\p{L})(?=.*\d)/u', message: 'Le mot de passe doit contenir au moins une lettre et un chiffre.'),
            ],
        ]));
        if (count($violations) > 0) {
            $details = [];
            foreach ($violations as $v) {
                $details[trim($v->getPropertyPath(), '[]')] = $v->getMessage();
            }

            return $this->erreur('Données invalides.', 422, $details);
        }

        if ($em->getRepository(Utilisateur::class)->findOneBy(['email' => $input['email']])) {
            return $this->erreur('Cette adresse email est déjà utilisée.', 409);
        }

        $user = (new Utilisateur())
            ->setNom($input['nom'])
            ->setPrenom($input['prenom'])
            ->setEmail($input['email'])
            ->setRole('sportif')
            ->setEmailConfirme(false);
        $user->setMotDePasse($hasher->hashPassword($user, $input['password']));
        $em->persist($user);
        $em->flush();

        $lien = $signer->sign(
            $urls->generate('api_confirm', ['id' => $user->getId()], UrlGeneratorInterface::ABSOLUTE_URL),
            new \DateTimeImmutable('+1 hour'),
        );
        try {
            // Version HTML : lien cliquable (bouton) ; la version texte reste pour les clients sans HTML.
            $prenomHtml = htmlspecialchars($user->getPrenom(), ENT_QUOTES);
            $lienHtml = htmlspecialchars($lien, ENT_QUOTES);
            $mailer->send((new Email())
                ->from('no-reply@fitbook.local')
                ->to($user->getEmail())
                ->subject('FitBook : confirmez votre adresse email')
                ->text("Bonjour {$user->getPrenom()},\n\nPour activer votre compte FitBook, ouvrez ce lien (valable 1 heure) :\n$lien\n")
                ->html("<p>Bonjour $prenomHtml,</p><p>Pour activer votre compte FitBook, cliquez sur le bouton (lien valable 1 heure) :</p><p><a href=\"$lienHtml\" style=\"background:#0B7A62;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold\">Confirmer mon adresse email</a></p><p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>$lienHtml</p>"));
        } catch (\Throwable) {
            // L'inscription reste valide même si le serveur de messagerie est indisponible.
        }

        $reponse = ['message' => 'Compte créé. Un email de confirmation vous a été envoyé.'];
        if ($this->getParameter('kernel.environment') === 'dev') {
            $reponse['lienConfirmationDev'] = $lien; // uniquement en développement (pas de serveur mail)
        }

        return new JsonResponse($reponse, 201);
    }

    #[Route('/api/confirm/{id}', name: 'api_confirm', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function confirm(int $id, Request $request, UriSigner $signer, EntityManagerInterface $em): RedirectResponse|JsonResponse
    {
        try {
            $valide = method_exists($signer, 'verify')
                ? ($signer->verify($request) ?? true)
                : $signer->checkRequest($request);
        } catch (\Throwable) {
            $valide = false;
        }
        if (!$valide) {
            return $this->erreur('Lien de confirmation invalide ou expiré.', 400);
        }
        $user = $em->find(Utilisateur::class, $id);
        if (!$user) {
            return $this->erreur('Utilisateur introuvable.', 404);
        }
        $user->setEmailConfirme(true);
        $em->flush();

        $front = $_SERVER['FRONTEND_URL'] ?? 'http://localhost:4200';

        return new RedirectResponse($front . '/connexion?confirme=1');
    }

    /** Le firewall (json_login) traite l'authentification ; ce contrôleur renvoie l'utilisateur connecté. */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?Utilisateur $user): JsonResponse
    {
        if (!$user) {
            return $this->erreur('Identifiants invalides.', 401);
        }

        return new JsonResponse($this->userArray($user));
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Géré par le firewall.');
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(#[CurrentUser] Utilisateur $user): JsonResponse
    {
        return new JsonResponse($this->userArray($user));
    }

    #[Route('/api/me', name: 'api_me_update', methods: ['PUT'])]
    public function updateMe(#[CurrentUser] Utilisateur $user, Request $request, ValidatorInterface $validator, EntityManagerInterface $em): JsonResponse
    {
        $data = $this->body($request);
        $input = ['nom' => $data['nom'] ?? null, 'prenom' => $data['prenom'] ?? null];
        $regex = new Assert\Regex(pattern: "/^[\p{L}\p{M}' \-]{2,80}$/u", message: 'Caractères non autorisés.');
        $violations = $validator->validate($input, new Assert\Collection([
            'nom' => [new Assert\NotBlank(), new Assert\Type('string'), $regex],
            'prenom' => [new Assert\NotBlank(), new Assert\Type('string'), $regex],
        ]));
        if (count($violations) > 0) {
            return $this->erreur('Données invalides.', 422);
        }
        $user->setNom($input['nom'])->setPrenom($input['prenom']);
        $em->flush();

        return new JsonResponse($this->userArray($user));
    }
}
