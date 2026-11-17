/* ============================================================
   LigaSim Argentina — Generación de fixtures
   ------------------------------------------------------------
   Round-robin por zonas (método del círculo). Soporta cantidad
   impar de equipos (con fecha libre) y torneos de ida y vuelta.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  function roundRobin(ids) {
    const list = ids.slice();
    if (list.length % 2 !== 0) list.push(null);
    const n = list.length;
    const rounds = [];

    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = list[i];
        const b = list[n - 1 - i];
        if (a !== null && b !== null) pairs.push([a, b]);
      }
      rounds.push(pairs);
      list.splice(1, 0, list.pop());
    }
    return rounds;
  }

  function build(tournament, seed) {
    const rng = LAS.rng.createRng(LAS.rng.hashString(tournament.id + ':' + seed));

    const perGroup = tournament.groups.map((group, groupIndex) => {
      const shuffled = rng.shuffle(group.teamIds.slice());
      let groupRounds = roundRobin(shuffled);

      if (tournament.rounds === 'double') {
        const reverse = groupRounds.map((pairs) => pairs.map(([home, away]) => [away, home]));
        groupRounds = groupRounds.concat(reverse);
      }

      return groupRounds.map((pairs, roundIndex) =>
        pairs.map(([a, b], matchIndex) => {
          let home = a;
          let away = b;
          if ((roundIndex + matchIndex) % 2 === 1) {
            home = b;
            away = a;
          }
          return {
            id: 'm-' + groupIndex + '-' + roundIndex + '-' + matchIndex,
            round: roundIndex + 1,
            groupIndex,
            group: group.name,
            home,
            away
          };
        })
      );
    });

    const regularRounds = tournament.regularRounds || perGroup[0].length;
    const rounds = [];

    // Fechas regulares (intra-zona): 14 fechas
    for (let r = 0; r < regularRounds; r++) {
      const matches = [];
      perGroup.forEach((groupRounds) => {
        if (groupRounds[r]) matches.push.apply(matches, groupRounds[r]);
      });
      rounds.push({ number: r + 1, matches, type: 'regular' });
    }

    // Fecha interzonal (usando configuración del torneo)
    if (tournament.interzonales && tournament.interzonales.length) {
      const interMatches = tournament.interzonales.map((pair, i) =>
        ({
          id: 'm-9-0-' + i,
          round: regularRounds + 1,
          groupIndex: -1,
          group: 'Interzonal',
          home: pair[0],
          away: pair[1]
        })
      );
      rounds.push({ number: regularRounds + 1, matches: interMatches, type: 'interzonal' });
    }

    // Fecha de clásicos (usando configuración del torneo)
    if (tournament.clasicos && tournament.clasicos.length) {
      const clasicosMatches = tournament.clasicos.map((pair, i) =>
        ({
          id: 'm-10-0-' + i,
          round: regularRounds + 2,
          groupIndex: -1,
          group: 'Clásicos',
          home: pair[0],
          away: pair[1]
        })
      );
      rounds.push({ number: regularRounds + 2, matches: clasicosMatches, type: 'clasicos' });
    }

    return rounds;
  }

  function allMatches(fixtures) {
    return fixtures.reduce((acc, round) => acc.concat(round.matches), []);
  }

  function findMatch(fixtures, matchId) {
    for (const round of fixtures) {
      const found = round.matches.find((m) => m.id === matchId);
      if (found) return found;
    }
    return null;
  }

  function nextRound(fixtures, results) {
    for (const round of fixtures) {
      if (round.matches.some((m) => !results[m.id])) return round;
    }
    return null;
  }

  function isRoundComplete(fixtures, results, roundNumber) {
    const round = fixtures[roundNumber - 1];
    return !!round && round.matches.every((m) => results[m.id]);
  }

  LAS.fixtures = { build, allMatches, findMatch, nextRound, isRoundComplete };
})();
