/* ============================================================
   LigaSim Argentina — Tablas de posiciones
   ------------------------------------------------------------
   Se calcula todo desde los resultados guardados, así que la
   tabla siempre queda consistente y es fácil de re-simular.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  function emptyRow(teamId) {
    return {
      teamId,
      pj: 0, pg: 0, pe: 0, pp: 0,
      gf: 0, gc: 0, dg: 0, pts: 0,
      form: []
    };
  }

  function compute(state, tournament, fixtures) {
    return tournament.groups.map((group, groupIndex) => {
      const rows = group.teamIds.map(emptyRow);
      const byTeam = new Map(rows.map((row) => [row.teamId, row]));

      fixtures.forEach((round) => {
        round.matches.forEach((match) => {
          if (match.groupIndex !== groupIndex) return;
          const result = state.results[match.id];
          if (!result) return;

          const home = byTeam.get(match.home);
          const away = byTeam.get(match.away);
          if (!home || !away) return;

          home.pj++;
          away.pj++;
          home.gf += result.homeGoals;
          home.gc += result.awayGoals;
          away.gf += result.awayGoals;
          away.gc += result.homeGoals;

          if (result.homeGoals > result.awayGoals) {
            home.pg++;
            home.pts += tournament.points.win;
            away.pp++;
            away.pts += tournament.points.loss;
            home.form.push('G');
            away.form.push('P');
          } else if (result.homeGoals < result.awayGoals) {
            away.pg++;
            away.pts += tournament.points.win;
            home.pp++;
            home.pts += tournament.points.loss;
            away.form.push('G');
            home.form.push('P');
          } else {
            home.pe++;
            away.pe++;
            home.pts += tournament.points.draw;
            away.pts += tournament.points.draw;
            home.form.push('E');
            away.form.push('E');
          }
        });
      });

      rows.forEach((row) => {
        row.dg = row.gf - row.gc;
        row.form = row.form.slice(-5);
      });

      rows.sort((a, b) =>
        b.pts - a.pts ||
        b.dg - a.dg ||
        b.gf - a.gf ||
        b.pg - a.pg ||
        a.teamId.localeCompare(b.teamId)
      );

      const qualifiers = tournament.playoffs && tournament.playoffs.enabled
        ? tournament.playoffs.teamsPerGroup
        : 0;

      rows.forEach((row, index) => {
        row.rank = index + 1;
        row.qualified = index < qualifiers;
      });

      const legs = tournament.rounds === 'double' ? 2 : 1;
      const total = rows.length * (rows.length - 1) / 2 * legs;
      const played = rows.reduce((sum, row) => sum + row.pj, 0) / 2;

      return {
        index: groupIndex,
        name: group.name,
        rows,
        qualifiers,
        played,
        total
      };
    });
  }

  LAS.standings = { compute };
})();
