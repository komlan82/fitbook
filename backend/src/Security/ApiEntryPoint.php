<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

/** Réponse JSON 401 pour toute requête non authentifiée (au lieu d'une redirection). */
class ApiEntryPoint implements AuthenticationEntryPointInterface
{
    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        return new JsonResponse(['erreur' => 'Authentification requise.'], Response::HTTP_UNAUTHORIZED);
    }
}
