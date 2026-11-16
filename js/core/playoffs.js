/* ============================================================
   LigaSim Argentina — Fase final (playoffs)
   ------------------------------------------------------------
   Se arma sola cuando termina la fase regular. Soporta:
   - 1 zona  -> 1º vs 8º, 4º vs 5º, 2º vs 7º, 3º vs 6º
   - 2 zonas -> cruces A1-B4, B1-A4, A2-B3, B2-A3
   Partidos únicos; si empatan, penales.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  function isRegularComplete(state, fixtures) {
    return fixtures.every((round) =>
      round.matches.every((match) => !!state.results[match.id])
    );
  }

  function seedLabel(group, rank) {
    const zone = /^Zona\s+([A-Z])/i.exec(group.name);
    if (zone) return zone[1].toUpperCase() + rank;
    return rank + 'º';
  }

  function qualifiers(standings, perGroup) {
    return standings.map((group) =>
      group.rows.slice(0, perGroup).map((row) => ({
        teamId: row.teamId,
        rank: row.rank,
        groupIndex: group.index,
        label: seedLabel(group, row.rank)
      }))
    );
  }

  function buildPairs(groups) {
    if (groups.length === 1) {
      const q = groups[0];
      if (q.length >= 8) {
        return [
          [q[0], q[7]],
          [q[3], q[4]],
          [q[1], q[6]],
          [q[2], q[5]]
        ];
      }
      if (q.length === 4) {
        return [
          [q[0], q[3]],
          [q[1], q[2]]
        ];
      }
      return [];
    }

    const a = groups[0];
    const b = groups[1];
    const per = Math.min(a.length, b.length);
    const pairs = [];

    for (let i = 0; i < Math.floor(per / 2); i++) {
      pairs.push([a[i], b[per - 1 - i]]);
      pairs.push([b[i], a[per - 1 - i]]);
    }

    return pairs;
  }

  function roundName(teamCount) {
    if (teamCount >= 8) return 'Cuartos de final';
    if (teamCount === 4) return 'Semifinales';
    return 'Final';
  }

  function create(state, tournament, standings) {
    const groups = qualifiers(standings, tournament.playoffs.teamsPerGroup);
    const pairs = buildPairs(groups).filter((pair) => pair[0] && pair[1]);

    const matches = pairs.map((pair, index) => {
      const a = pair[0];
      const b = pair[1];
      const swap = a.rank > b.rank;
      const home = swap ? b : a;
      const away = swap ? a : b;
      return {
        id: 'po-0-' + index,
        roundIndex: 0,
        home: home.teamId,
        away: away.teamId,
        homeLabel: home.label,
        awayLabel: away.label,
        homeRank: home.rank,
        awayRank: away.rank,
        neutral: false,
        isFinal: false
      };
    });

    return {
      rounds: [{ name: roundName(matches.length * 2), matches }],
      champion: null,
      createdAt: Date.now()
    };
  }

  function advance(state, tournament) {
    let guard = 0;

    while (guard < 10) {
      guard++;
      const playoffs = state.playoffs;
      if (!playoffs || playoffs.champion) break;

      const last = playoffs.rounds[playoffs.rounds.length - 1];
      const complete = last.matches.every((match) => !!state.results[match.id]);
      if (!complete) break;

      if (last.matches.length === 1) {
        playoffs.champion = state.results[last.matches[0].id].winner;
        break;
      }

      const winners = last.matches.map((match) => {
        const result = state.results[match.id];
        const homeWon = result.winner === match.home;
        return {
          teamId: result.winner,
          rank: homeWon ? match.homeRank : match.awayRank,
          label: homeWon ? match.homeLabel : match.awayLabel
        };
      });

      const nextMatches = [];
      for (let i = 0; i < winners.length; i += 2) {
        const a = winners[i];
        const b = winners[i + 1];
        if (!b) break;
        const swap = a.rank > b.rank;
        const home = swap ? b : a;
        const away = swap ? a : b;
        nextMatches.push({
          id: 'po-' + playoffs.rounds.length + '-' + (i / 2),
          roundIndex: playoffs.rounds.length,
          home: home.teamId,
          away: away.teamId,
          homeLabel: home.label,
          awayLabel: away.label,
          homeRank: home.rank,
          awayRank: away.rank,
          neutral: false,
          isFinal: false
        });
      }

      if (nextMatches.length === 1) {
        nextMatches[0].isFinal = true;
        nextMatches[0].neutral = !!(tournament.playoffs && tournament.playoffs.neutralFinal);
      }

      playoffs.rounds.push({
        name: roundName(nextMatches.length * 2),
        matches: nextMatches
      });
    }

    return state.playoffs;
  }

  function ensure(state, tournament, fixtures, standings) {
    if (!tournament.playoffs || !tournament.playoffs.enabled) return null;
    if (!isRegularComplete(state, fixtures)) return null;
    if (!state.playoffs) state.playoffs = create(state, tournament, standings);
    advance(state, tournament);
    return state.playoffs;
  }

  function findMatch(state, matchId) {
    if (!state.playoffs) return null;
    for (const round of state.playoffs.rounds) {
      const found = round.matches.find((match) => match.id === matchId);
      if (found) return found;
    }
    return null;
  }

  function pendingMatches(state) {
    if (!state.playoffs) return [];
    const pending = [];
    state.playoffs.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (!state.results[match.id]) pending.push(match);
      });
    });
    return pending;
  }

  LAS.playoffs = {
    ensure,
    advance,
    isRegularComplete,
    findMatch,
    pendingMatches
  };
})();
