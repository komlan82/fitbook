<?php

namespace App\Tests\Unit;

use App\Service\ProcedureCodes;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ProcedureCodesTest extends TestCase
{
    #[DataProvider('codes')]
    public function testStatutHttp(string $code, int $attendu): void
    {
        $this->assertSame($attendu, ProcedureCodes::status($code));
    }

    public static function codes(): array
    {
        return [
            'reservation ok' => ['OK', 201],
            'seance complete' => ['COMPLETE', 409],
            'deja reservee' => ['DEJA_RESERVEE', 409],
            'seance fermee' => ['SEANCE_FERMEE', 409],
            'seance introuvable' => ['SEANCE_INTROUVABLE', 404],
            'annulation trop tard' => ['TROP_TARD', 409],
            'note invalide' => ['NOTE_INVALIDE', 422],
            'avis sans seance suivie' => ['SEANCE_NON_SUIVIE', 403],
            'erreur sql' => ['ERREUR_SQL', 500],
        ];
    }

    public function testCodeInconnuDonne500(): void
    {
        $this->assertSame(500, ProcedureCodes::status('N_IMPORTE_QUOI'));
        $this->assertSame(500, ProcedureCodes::status(null));
    }

    public function testSeulOkEstUnSucces(): void
    {
        $this->assertTrue(ProcedureCodes::isOk('OK'));
        $this->assertFalse(ProcedureCodes::isOk('COMPLETE'));
    }

    public function testMessageCompletEstLisible(): void
    {
        $this->assertSame('Cette séance est complète.', ProcedureCodes::message('COMPLETE'));
    }
}
