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

    const totalRounds = Math.max.apply(null, perGroup.map((g) => g.length));
    const rounds = [];

    for (let r = 0; r < totalRounds; r++) {
      const matches = [];
      perGroup.forEach((groupRounds) => {
        if (groupRounds[r]) matches.push.apply(matches, groupRounds[r]);
      });
      rounds.push({ number: r + 1, matches });
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
