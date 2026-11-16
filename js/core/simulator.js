/* ============================================================
   LigaSim Argentina — Motor de simulación
   ------------------------------------------------------------
   Modelo simple pero con resultados creíbles:
   - Fuerza de ataque/defensa derivada del rating de cada club.
   - Ventaja de localía (salvo cancha neutral).
   - Goles por distribución de Poisson.
   - Penales automáticos en eliminatorias empatadas.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  const BASE_GOALS = 1.34;
  const HOME_BOOST = 1.15;
  const AWAY_BOOST = 0.92;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function expectedGoals(home, away, neutral) {
    const homeAttack = home.rating + home.atkBonus;
    const homeDefense = home.rating + home.defBonus;
    const awayAttack = away.rating + away.atkBonus;
    const awayDefense = away.rating + away.defBonus;

    const homeLambda = BASE_GOALS *
      Math.pow(homeAttack / Math.max(40, awayDefense), 2.05) *
      (neutral ? 1 : HOME_BOOST);
    const awayLambda = BASE_GOALS *
      Math.pow(awayAttack / Math.max(40, homeDefense), 2.05) *
      (neutral ? 1 : AWAY_BOOST);

    return {
      home: clamp(homeLambda, 0.15, 4.4),
      away: clamp(awayLambda, 0.15, 4.4)
    };
  }

  function shootout(home, away, rng) {
    const convHome = clamp(0.76 + (home.rating - 75) * 0.003, 0.64, 0.9);
    const convAway = clamp(0.76 + (away.rating - 75) * 0.003, 0.64, 0.9);
    let h = 0;
    let a = 0;

    for (let i = 0; i < 5; i++) {
      if (rng.chance(convHome)) h++;
      if (rng.chance(convAway)) a++;
    }

    let guard = 0;
    while (h === a && guard < 20) {
      guard++;
      if (rng.chance(convHome)) h++;
      if (rng.chance(convAway)) a++;
    }

    if (h === a) {
      if (rng.chance(0.5)) h++;
      else a++;
    }

    return { home: h, away: a };
  }

  function simulateMatch(state, homeId, awayId, options) {
    const opts = options || {};
    const home = LAS.resolveTeam(state, homeId);
    const away = LAS.resolveTeam(state, awayId);
    if (!home || !away) throw new Error('Equipo inexistente: ' + homeId + ' / ' + awayId);

    const seed = opts.seed != null
      ? opts.seed
      : LAS.rng.hashString((opts.matchId || homeId + awayId) + ':' + state.seed);
    const rng = LAS.rng.createRng(seed);

    const neutral = !!opts.neutral;
    const lambdas = expectedGoals(home, away, neutral);
    const formHome = 0.88 + rng.next() * 0.24;
    const formAway = 0.88 + rng.next() * 0.24;

    // Los marcadores se muestran con un solo dígito (0-9).
    const homeGoals = Math.min(9, rng.poisson(lambdas.home * formHome));
    const awayGoals = Math.min(9, rng.poisson(lambdas.away * formAway));

    const scorers = [];
    for (let i = 0; i < homeGoals; i++) {
      const player = LAS.pickScorer(homeId, rng);
      scorers.push({ playerId: player.id, name: player.name, teamId: homeId, minute: rng.int(1, 90) });
    }
    for (let i = 0; i < awayGoals; i++) {
      const player = LAS.pickScorer(awayId, rng);
      scorers.push({ playerId: player.id, name: player.name, teamId: awayId, minute: rng.int(1, 90) });
    }
    scorers.sort((a, b) => a.minute - b.minute);

    let winner = null;
    let penalties = null;

    if (homeGoals > awayGoals) {
      winner = homeId;
    } else if (awayGoals > homeGoals) {
      winner = awayId;
    } else if (opts.knockout) {
      penalties = shootout(home, away, rng);
      winner = penalties.home > penalties.away ? homeId : awayId;
    }

    return {
      homeId,
      awayId,
      homeGoals,
      awayGoals,
      penalties,
      winner,
      scorers
    };
  }

  LAS.sim = { simulateMatch, expectedGoals, shootout };
})();
