/* ============================================================
   LigaSim Argentina — Copa Argentina
   ------------------------------------------------------------
   Torneo de eliminación directa (partido único, penales en empate).
   Genera un bracket con todos los equipos y permite simular
   o cargar resultados manuales.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  /* Mezcla Fisher-Yates determinística usando el RNG del torneo */
  function shuffleWithRng(arr, rng) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /* Genera el bracket de eliminación directa.
     Con 30 equipos: 2 tienen bye en 32avos, 28 juegan 14 partidos.
     Los 14 ganadores + 2 byes = 16 equipos para 16avos. */
  function buildBracket(teamIds, seed) {
    const rng = LAS.rng.createRng(LAS.rng.hashString('copa:' + seed));
    const shuffled = shuffleWithRng(teamIds, rng);

    const rounds = [];
    let current = shuffled.slice();

    // Ronda 1: 32avos (14 partidos + 2 byes)
    const r1Matches = [];
    for (let i = 0; i < current.length; i += 2) {
      const home = current[i];
      const away = current[i + 1];
      if (away) {
        r1Matches.push({
          id: 'c-0-' + r1Matches.length,
          round: 1,
          roundName: '32avos de final',
          home,
          away,
          homeLabel: null,
          awayLabel: null,
          neutral: true
        });
      } else {
        // Bye: el equipo avanza automáticamente
        r1Matches.push({
          id: 'c-0-' + r1Matches.length,
          round: 1,
          roundName: '32avos de final',
          home,
          away: null,
          homeLabel: null,
          awayLabel: null,
          neutral: true,
          bye: true
        });
      }
    }
    rounds.push({ name: '32avos de final', matches: r1Matches });

    // Rondas siguientes: 16avos, octavos, cuartos, semis, final
    const roundNames = ['16avos de final', 'Octavos de final', 'Cuartos de final', 'Semifinales', 'Final'];
    let roundIndex = 1;

    while (current.length > 1) {
      const next = [];
      const matches = [];
      // Los equipos con bye en r1 avanzan directamente
      const byeWinners = r1Matches.filter((m) => m.bye).map((m) => m.home);
      // Los ganadores de partidos de r1 se determinarán después, por ahora placeholder
      // Para simplificar, usamos los equipos actuales (sin resultados reales aún)
      // En la práctica, los ganadores se irán determinando a medida que se juegan los partidos

      // Para el bracket inicial, emparejamos los equipos actuales (sin bye)
      const nonBye = current.filter((t, i) => {
        const m = r1Matches[i];
        return m && !m.bye;
      });

      // Emparejar equipos restantes para la siguiente ronda
      // (en una implementación completa, aquí irían los ganadores reales)
      for (let i = 0; i < nonBye.length; i += 2) {
        const home = nonBye[i];
        const away = nonBye[i + 1];
        if (away) {
          matches.push({
            id: 'c-' + roundIndex + '-' + matches.length,
            round: roundIndex + 1,
            roundName: roundNames[roundIndex - 1] || 'Ronda ' + (roundIndex + 1),
            home,
            away,
            homeLabel: null,
            awayLabel: null,
            neutral: true
          });
        } else {
          next.push(home);
        }
      }

      // Agregar los byes de la ronda anterior al siguiente grupo
      byeWinners.forEach((t) => next.push(t));

      if (matches.length > 0) {
        rounds.push({ name: roundNames[roundIndex - 1] || 'Ronda ' + (roundIndex + 1), matches });
      }

      current = next;
      roundIndex++;
    }

    return rounds;
  }

  /* Simula un partido de la copa (partido único, empate → penales) */
  function simulateMatch(state, match) {
    const result = LAS.sim.simulateMatch(state, match.home, match.away, {
      matchId: match.id,
      knockout: true,
      neutral: true
    });
    return result;
  }

  /* Verifica si un partido ya tiene resultado */
  function hasResult(state, matchId) {
    return !!state.copaResults && !!state.copaResults[matchId];
  }

  LAS.copa = {
    buildBracket,
    simulateMatch,
    hasResult
  };
})();