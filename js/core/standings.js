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
          // Partido de zona regular: ambos equipos deben estar en esta zona
          // Partido especial (interzonal/clásicos, groupIndex === -1): contar
          // solo para el equipo que pertenece a esta zona
          const isSpecial = match.groupIndex === -1;
          if (!isSpecial && match.groupIndex !== groupIndex) return;

          const result = state.results[match.id];
          if (!result) return;

          const home = byTeam.get(match.home);
          const away = byTeam.get(match.away);
          const homeInZone = !!home;
          const awayInZone = !!away;

          // En partidos especiales, si ninguno de los dos está en esta zona, saltar
          if (isSpecial && !homeInZone && !awayInZone) return;

          // Partido intra-zona normal: ambos equipos cuentan
          if (homeInZone && awayInZone) {
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
          }
          // Partido especial con un equipo de la zona y otro de otra zona:
          // solo cuenta para el equipo de la zona
          else if (isSpecial && homeInZone && !awayInZone) {
            home.pj++;
            home.gf += result.homeGoals;
            home.gc += result.awayGoals;

            if (result.homeGoals > result.awayGoals) {
              home.pg++;
              home.pts += tournament.points.win;
              home.form.push('G');
            } else if (result.homeGoals < result.awayGoals) {
              home.pp++;
              home.pts += tournament.points.loss;
              home.form.push('P');
            } else {
              home.pe++;
              home.pts += tournament.points.draw;
              home.form.push('E');
            }
          } else if (isSpecial && !homeInZone && awayInZone) {
            away.pj++;
            away.gf += result.awayGoals;
            away.gc += result.homeGoals;

            if (result.awayGoals > result.homeGoals) {
              away.pg++;
              away.pts += tournament.points.win;
              away.form.push('G');
            } else if (result.awayGoals < result.homeGoals) {
              away.pp++;
              away.pts += tournament.points.loss;
              away.form.push('P');
            } else {
              away.pe++;
              away.pts += tournament.points.draw;
              away.form.push('E');
            }
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

  /* ----------------------- Tabla Anual ----------------------- */
  /* Suma los puntos de Apertura + Clausura para la tabla acumulada del año.
     standings debe ser un array con los resultados de cada semestre. */
  function computeTableAnnual(semestersStandings) {
    const teamMap = new Map();

    semestersStandings.forEach((semester) => {
      semester.groups.forEach((group) => {
        group.rows.forEach((row) => {
          if (!teamMap.has(row.teamId)) {
            teamMap.set(row.teamId, {
              teamId: row.teamId,
              pts: 0,
              pj: 0,
              pg: 0,
              pe: 0,
              pp: 0,
              gf: 0,
              gc: 0,
              semesters: []
            });
          }
          const t = teamMap.get(row.teamId);
          t.pts += row.pts;
          t.pj += row.pj;
          t.pg += row.pg;
          t.pe += row.pe;
          t.pp += row.pp;
          t.gf += row.gf;
          t.gc += row.gc;
          t.semesters.push({ season: semester.season, pts: row.pts, pj: row.pj });
        });
      });
    });

    const rows = Array.from(teamMap.values());
    rows.forEach((row) => {
      row.dg = row.gf - row.gc;
    });

    rows.sort((a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      b.pg - a.pg ||
      a.teamId.localeCompare(b.teamId)
    );

    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return rows;
  }

  /* ----------------------- Copas internacionales (CONMEBOL) ----------------------- */
  /* Clasificación según reglamento argentino:
     Libertadores (6 cupos):
       Cupo 1: Campeón Apertura (Fase de Grupos)
       Cupo 2: Campeón Clausura (Fase de Grupos)
       Cupo 3: Campeón Copa Argentina (Fase de Grupos)
       Cupos 4-5: Los 2 mejores de Tabla Anual que no sean campeones (Fase de Grupos)
       Cupo 6: 3° mejor de Tabla Anual (Fase 2 / Repechaje)
     Sudamericana (6 cupos):
       Los 6 mejores de Tabla Anual (puesto 4° al 9° general) no ya en Libertadores
     Desborde: si un campeón ocupa puesto alto en Tabla Anual, libera su cupo y corre al siguiente.
  */
  function computeInternationalCups(tableAnnual, champions) {
    const cups = { libertadores: 6, sudamericana: 6 };
    const libertadores = [];
    const sudamericana = [];
    const qualified = new Set();

    // Función auxiliar para agregar a Libertadores
    const addLib = (teamId, reason) => {
      if (teamId && !qualified.has(teamId) && libertadores.length < cups.libertadores) {
        libertadores.push({ teamId, reason });
        qualified.add(teamId);
      }
    };

    // Función auxiliar para agregar a Sudamericana
    const addSud = (teamId, reason) => {
      if (teamId && !qualified.has(teamId) && sudamericana.length < cups.sudamericana) {
        sudamericana.push({ teamId, reason });
        qualified.add(teamId);
      }
    };

    // Cupo 1: Campeón Apertura
    if (champions.apertura) addLib(champions.apertura, 'Campeón Apertura');

    // Cupo 2: Campeón Clausura
    if (champions.clausura) addLib(champions.clausura, 'Campeón Clausura');

    // Cupo 3: Campeón Copa Argentina
    if (champions.copaArgentina) addLib(champions.copaArgentina, 'Campeón Copa Argentina');

    // Cupos 4-5: 2 mejores de Tabla Anual que no sean campeones
    // Cupo 6: 3° mejor de Tabla Anual (Fase 2 / Repechaje)
    let libFromTable = 0;
    for (const row of tableAnnual) {
      if (qualified.has(row.teamId)) continue;
      if (libFromTable < 2) {
        addLib(row.teamId, 'Tabla anual (Fase de Grupos)');
        libFromTable++;
      } else if (libFromTable === 2) {
        addLib(row.teamId, 'Tabla anual (Fase 2 / Repechaje)');
        libFromTable++;
      } else {
        break;
      }
    }

    // Sudamericana: 6 mejores de Tabla Anual no ya en Libertadores
    // (del puesto 4° al 9° de la general acumulada, desbordando si es necesario)
    for (const row of tableAnnual) {
      if (qualified.has(row.teamId)) continue;
      addSud(row.teamId, 'Tabla anual');
      if (sudamericana.length >= cups.sudamericana) break;
    }

    return { libertadores, sudamericana };
  }

  /* ----------------------- Promedios y descensos ----------------------- */
  function computeRelegation(state, tournament, standings) {
    const rel = tournament.relegation;
    if (!rel || !rel.enabled) return { teams: [], history: [] };

    const history = state.tournamentHistory || [];
    if (!history.length) return { teams: [], history: [] };

    const years = rel.years || 3;
    const recent = history.slice(-years);

    // Acumular puntos y partidos por equipo en los últimos N años
    const teamStats = {};
    recent.forEach((season) => {
      Object.entries(season.teams || {}).forEach(([teamId, stats]) => {
        if (!teamStats[teamId]) {
          teamStats[teamId] = { pts: 0, pj: 0 };
        }
        teamStats[teamId].pts += stats.pts || 0;
        teamStats[teamId].pj += stats.pj || 0;
      });
    });

    // Calcular promedios y ordenar (peor promedio primero = desciende)
    const relegationTeams = Object.entries(teamStats)
      .map(([teamId, stats]) => ({
        teamId,
        pts: stats.pts,
        pj: stats.pj,
        avg: stats.pj > 0 ? stats.pts / stats.pj : 0
      }))
      .sort((a, b) => a.avg - b.avg || a.pts - b.pts || b.pj - a.pj);

    const descenden = relegationTeams.slice(0, rel.teams || 2);

    return {
      teams: descenden,
      history: recent,
      allAverages: relegationTeams
    };
  }

  LAS.standings = { compute, computeInternationalCups, computeRelegation, computeTableAnnual };
})();
