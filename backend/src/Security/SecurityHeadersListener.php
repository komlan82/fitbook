<?php

namespace App\Security;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

/** En-têtes de sécurité HTTP sur chaque réponse (clickjacking, sniffing, fuite de référent). */
#[AsEventListener]
class SecurityHeadersListener
{
    public function __invoke(ResponseEvent $event): void
    {
        $h = $event->getResponse()->headers;
        $h->set('X-Content-Type-Options', 'nosniff');
        $h->set('X-Frame-Options', 'DENY');
        $h->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $h->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }
}
