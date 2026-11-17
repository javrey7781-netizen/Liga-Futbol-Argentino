/* ============================================================
   LigaSim Argentina — Aplicación
   ------------------------------------------------------------
   Estado, acciones de simulación, ruteo y eventos globales.
   ============================================================ */
(function () {
  const LAS = window.LAS;

  const uiState = {
    fixtureRound: null,
    teamsQuery: ''
  };

  let state = null;
  let ctx = null;
  const autoSaveTimers = {};

  /* ----------------------------- Estado ----------------------------- */
  function defaultTheme() {
    try {
      return window.localStorage.getItem('ligasim:theme') || 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  function createState(tournamentId, theme, overrides) {
    return {
      version: 1,
      tournamentId,
      seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
      createdAt: new Date().toISOString(),
      theme: theme === 'light' ? 'light' : 'dark',
      teams: overrides || {},
      results: {},
      playoffs: null,
      celebrated: false,
      tournamentHistory: [],
      copaResults: {},
      copaBracket: null,
      copaChampion: null
    };
  }

  function loadState() {
    try {
      const saved = LAS.storage.load();
      const clean = saved && saved.version === 1 ? LAS.storage.sanitize(saved) : null;
      if (clean) return clean;
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
    return createState(LAS.TOURNAMENTS[0].id, defaultTheme());
  }

  function applyTheme(theme) {
    try {
      document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
      window.localStorage.setItem('ligasim:theme', theme);
    } catch (error) {
      /* nada */
    }
  }

  function buildContext() {
    const tournament = LAS.getTournament(state.tournamentId);
    const fixtures = LAS.fixtures.build(tournament, state.seed);
    const standings = LAS.standings.compute(state, tournament, fixtures);
    const playoffs = LAS.playoffs.ensure(state, tournament, fixtures, standings);
    return { state, tournament, fixtures, standings, playoffs, ui: uiState };
  }

  function refresh(options) {
    try {
      // limpiar timers de auto-guardado pendientes (el DOM se va a reconstruir)
      Object.keys(autoSaveTimers).forEach((id) => {
        clearTimeout(autoSaveTimers[id]);
        delete autoSaveTimers[id];
      });
      ctx = buildContext();

      // Asegurar historial de temporada para promedios/descensos
      // (por si se carga una temporada ya finalizada desde storage)
      if (
        ctx.playoffs &&
        ctx.playoffs.champion &&
        !state.tournamentHistory.some((h) => h.season === ctx.tournament.season)
      ) {
        const seasonTeams = {};
        ctx.standings.forEach((group) => {
          group.rows.forEach((row) => {
            seasonTeams[row.teamId] = {
              pts: row.pts,
              pj: row.pj
            };
          });
        });
        state.tournamentHistory.push({
          season: ctx.tournament.season,
          teams: seasonTeams
        });
        LAS.storage.save(state);
      }

      LAS.storage.save(state);
      LAS.render.render(ctx);
      if (options && options.animate && options.animate.length) {
        LAS.dom.animateMatches(options.animate);
      }
    } catch (error) {
      console.error('Error en refresh:', error);
    }
  }

  function setTheme(theme) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    applyTheme(state.theme);
    LAS.storage.save(state);
    refresh();
  }

  /* --------------------------- Simulación --------------------------- */
  function afterSimulation(animatedIds) {
    try {
      if (state.playoffs && state.playoffs.champion && !state.celebrated) {
        state.celebrated = true;
        const champion = LAS.resolveTeam(state, state.playoffs.champion);
        LAS.dom.confetti(120);
        LAS.dom.toast('¡' + champion.name + ' es el campeón!', 'success');

        // Guardar historial de la temporada para promedios y descensos
        const ctx = buildContext();
        const seasonTeams = {};
        ctx.standings.forEach((group) => {
          group.rows.forEach((row) => {
            seasonTeams[row.teamId] = {
              pts: row.pts,
              pj: row.pj
            };
          });
        });
        state.tournamentHistory.push({
          season: ctx.tournament.season,
          teams: seasonTeams
        });
        LAS.storage.save(state);
      }
      refresh({ animate: animatedIds || [] });
    } catch (error) {
      console.error('Error en afterSimulation:', error);
    }
  }

  function simulateMatch(matchId) {
    try {
      if (state.results[matchId]) {
        LAS.dom.toast('Ese partido ya se jugó.', 'info');
        return;
      }

      const current = buildContext();
      const regular = LAS.fixtures.findMatch(current.fixtures, matchId);
      const playoff = regular ? null : LAS.playoffs.findMatch(state, matchId);
      const match = regular || playoff;
      if (!match) return;

      state.results[matchId] = LAS.sim.simulateMatch(state, match.home, match.away, {
        matchId,
        knockout: !!playoff,
        neutral: !!match.neutral
      });

      const hadPlayoffs = !!state.playoffs;
      const standings = LAS.standings.compute(state, current.tournament, current.fixtures);
      LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);

      if (!hadPlayoffs && state.playoffs) {
        LAS.dom.toast('Fase regular completa: ¡arrancan los playoffs!', 'success');
      }

      afterSimulation([matchId]);
    } catch (error) {
      console.error('Error simulando partido:', error);
      LAS.dom.toast('Error al simular el partido.', 'error');
    }
  }

  function simulateRound(roundNumber) {
    try {
      const current = buildContext();
      const round = current.fixtures[roundNumber - 1];
      if (!round) return;

      const pending = round.matches.filter((match) => !state.results[match.id]);
      if (!pending.length) {
        LAS.dom.toast('La ' + roundLabel(current).toLowerCase() + ' ' + roundNumber + ' ya está completa.', 'info');
        return;
      }

      pending.forEach((match) => {
        state.results[match.id] = LAS.sim.simulateMatch(state, match.home, match.away, { matchId: match.id });
      });

      const hadPlayoffs = !!state.playoffs;
      const standings = LAS.standings.compute(state, current.tournament, current.fixtures);
      LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);

      if (!hadPlayoffs && state.playoffs) {
        LAS.dom.toast('Fase regular completa: ¡arrancan los playoffs!', 'success');
      } else {
        const alreadyLoaded = round.matches.length - pending.length;
        LAS.dom.toast(
          'Fecha ' + roundNumber + ' simulada: ' + pending.length + ' partidos' +
          (alreadyLoaded ? ' (' + alreadyLoaded + ' ya tenían resultado)' : '') + '.',
          'success'
        );
      }

      afterSimulation(pending.map((match) => match.id));
    } catch (error) {
      console.error('Error simulando fecha:', error);
      LAS.dom.toast('Error al simular la fecha.', 'error');
    }
  }

  function simulateRemaining() {
    try {
      const current = buildContext();
      let count = 0;

      current.fixtures.forEach((round) => {
        round.matches.forEach((match) => {
          if (!state.results[match.id]) {
            state.results[match.id] = LAS.sim.simulateMatch(state, match.home, match.away, { matchId: match.id });
            count++;
          }
        });
      });

      const standings = LAS.standings.compute(state, current.tournament, current.fixtures);
      LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);

      if (!count) {
        LAS.dom.toast('No quedan partidos de fase regular.', 'info');
        return;
      }

      LAS.dom.toast('Se simularon ' + count + ' partidos de fase regular.', 'success');
      afterSimulation([]);
    } catch (error) {
      console.error('Error simulando lo restante:', error);
      LAS.dom.toast('Error al simular.', 'error');
    }
  }

  function simulatePlayoffs() {
    try {
      let current = buildContext();

      if (!current.playoffs) {
        LAS.dom.toast('Primero hay que terminar la fase regular.', 'error');
        return;
      }

      let count = 0;
      let guard = 0;

      while (current.playoffs && !current.playoffs.champion && guard < 12) {
        guard++;
        const pending = LAS.playoffs.pendingMatches(state);
        if (!pending.length) break;

        pending.forEach((match) => {
          if (!state.results[match.id]) {
            state.results[match.id] = LAS.sim.simulateMatch(state, match.home, match.away, {
              matchId: match.id,
              knockout: true,
              neutral: !!match.neutral
            });
            count++;
          }
        });

        const standings = LAS.standings.compute(state, current.tournament, current.fixtures);
        LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);
        current = buildContext();
      }

      if (!count) {
        LAS.dom.toast('No hay partidos de playoffs pendientes.', 'info');
        return;
      }

      LAS.dom.toast('Playoffs simulados: ' + count + ' partidos.', 'success');
      afterSimulation([]);
    } catch (error) {
      console.error('Error simulando playoffs:', error);
      LAS.dom.toast('Error al simular playoffs.', 'error');
    }
  }

  function simulateSeason() {
    try {
      const current = buildContext();

      if (current.playoffs && current.playoffs.champion) {
        LAS.dom.toast('La temporada ya terminó. Podés jugar otro torneo.', 'info');
        return;
      }

      let count = 0;

      current.fixtures.forEach((round) => {
        round.matches.forEach((match) => {
          if (!state.results[match.id]) {
            state.results[match.id] = LAS.sim.simulateMatch(state, match.home, match.away, { matchId: match.id });
            count++;
          }
        });
      });

      let standings = LAS.standings.compute(state, current.tournament, current.fixtures);
      LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);

      let guard = 0;
      while (state.playoffs && !state.playoffs.champion && guard < 12) {
        guard++;
        const pending = LAS.playoffs.pendingMatches(state);
        if (!pending.length) break;

        pending.forEach((match) => {
          if (!state.results[match.id]) {
            state.results[match.id] = LAS.sim.simulateMatch(state, match.home, match.away, {
              matchId: match.id,
              knockout: true,
              neutral: !!match.neutral
            });
            count++;
          }
        });

        standings = LAS.standings.compute(state, current.tournament, current.fixtures);
        LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);
      }

      LAS.dom.toast('Temporada simulada: ' + count + ' partidos.', 'success');
      afterSimulation([]);
    } catch (error) {
      console.error('Error simulando temporada:', error);
      LAS.dom.toast('Error al simular temporada.', 'error');
    }
  }

  /* ---------------------- Copa Argentina ---------------------- */
  function initCopa() {
    try {
      const tournament = LAS.getTournament('copa-argentina-2026');
      const teamIds = LAS.TEAMS.map((t) => t.id);
      const seed = state.seed;
      const bracket = LAS.copa.buildBracket(teamIds, seed);
      state.copaBracket = bracket;
      state.copaResults = {};
      state.copaChampion = null;
      LAS.storage.save(state);
      refresh();
      LAS.dom.toast('Copa Argentina: bracket generado.', 'success');
    } catch (error) {
      console.error('Error iniciando Copa Argentina:', error);
      LAS.dom.toast('Error al iniciar la Copa Argentina.', 'error');
    }
  }

  function simulateCopaMatch(matchId) {
    try {
      if (!state.copaBracket) return;
      if (state.copaResults[matchId]) {
        LAS.dom.toast('Ese partido ya se jugó.', 'info');
        return;
      }

      const match = findCopaMatch(matchId);
      if (!match) return;
      if (match.bye) {
        LAS.dom.toast('Este equipo tiene bye (avanza directo).', 'info');
        return;
      }

      const result = LAS.copa.simulateMatch(state, match);
      state.copaResults[matchId] = result;

      // Si el partido definió un ganador, propagar al siguiente partido
      advanceCopaWinner(matchId, result.winner);

      LAS.storage.save(state);
      refresh();
      LAS.dom.toast('Partido de Copa simulado.', 'success');
    } catch (error) {
      console.error('Error simulando partido de copa:', error);
      LAS.dom.toast('Error al simular partido de copa.', 'error');
    }
  }

  function findCopaMatch(matchId) {
    if (!state.copaBracket) return null;
    for (const round of state.copaBracket) {
      const found = round.matches.find((m) => m.id === matchId);
      if (found) return found;
    }
    return null;
  }

  function advanceCopaWinner(matchId, winnerId) {
    if (!state.copaBracket) return;
    const match = findCopaMatch(matchId);
    if (!match) return;

    // Encontrar el partido de la siguiente ronda que recibe a este ganador
    const nextRoundIndex = match.round; // ronda actual es 1-based, siguiente es match.round
    const nextRound = state.copaBracket.find((r) => r.matches.some((m) => m.round === nextRoundIndex + 1));
    if (!nextRound) {
      // No hay siguiente ronda, este es el campeón
      state.copaChampion = winnerId;
      return;
    }

    // Buscar un partido en la siguiente ronda que tenga un slot vacío (home o away no asignado)
    // Para simplicidad, asignamos al primer partido con home o away nulo
    // En una implementación completa, se mapearía correctamente por posición en el bracket
    const emptySlot = nextRound.matches.find((m) => !m.home || !m.away);
    if (emptySlot) {
      if (!emptySlot.home) emptySlot.home = winnerId;
      else if (!emptySlot.away) emptySlot.away = winnerId;
    }
  }

  function simulateAllCopa() {
    try {
      if (!state.copaBracket) {
        initCopa();
        return;
      }
      let count = 0;
      for (const round of state.copaBracket) {
        for (const match of round.matches) {
          if (!match.bye && !state.copaResults[match.id] && match.home && match.away) {
            state.copaResults[match.id] = LAS.copa.simulateMatch(state, match);
            advanceCopaWinner(match.id, state.copaResults[match.id].winner);
            count++;
          }
        }
      }
      // Determinar campeón si ya no hay partidos pendientes
      const hasPending = state.copaBracket.some((r) =>
        r.matches.some((m) => !m.bye && !state.copaResults[m.id] && m.home && m.away)
      );
      if (!hasPending && state.copaBracket.length > 0) {
        const lastRound = state.copaBracket[state.copaBracket.length - 1];
        const finalMatch = lastRound.matches[0];
        if (finalMatch && state.copaResults[finalMatch.id]) {
          state.copaChampion = state.copaResults[finalMatch.id].winner;
        }
      }

      LAS.storage.save(state);
      refresh();
      if (count > 0) {
        LAS.dom.toast('Copa Argentina: ' + count + ' partidos simulados.', 'success');
      } else {
        LAS.dom.toast('Copa Argentina: no quedan partidos pendientes.', 'info');
      }
    } catch (error) {
      console.error('Error simulando Copa Argentina:', error);
      LAS.dom.toast('Error al simular Copa Argentina.', 'error');
    }
  }

  function saveCopaResult(matchId, homeGoals, awayGoals, homePens, awayPens) {
    try {
      const match = findCopaMatch(matchId);
      if (!match) return;
      if (state.copaResults[matchId]) {
        LAS.dom.toast('Ese partido ya tiene resultado.', 'info');
        return;
      }

      let winner = null;
      let penalties = null;

      if (homeGoals > awayGoals) {
        winner = match.home;
      } else if (awayGoals > homeGoals) {
        winner = match.away;
      } else {
        // Empate → penales
        if (homePens === null || awayPens === null || homePens === awayPens) {
          LAS.dom.toast('Completá penales válidos (no pueden empatar).', 'error');
          return;
        }
        penalties = { home: homePens, away: awayPens };
        winner = homePens > awayPens ? match.home : match.away;
      }

      state.copaResults[matchId] = {
        homeId: match.home,
        awayId: match.away,
        homeGoals,
        awayGoals,
        penalties,
        winner,
        manual: true
      };

      advanceCopaWinner(matchId, winner);

      // Verificar si hay campeón
      const lastRound = state.copaBracket[state.copaBracket.length - 1];
      const finalMatch = lastRound.matches[0];
      if (finalMatch && state.copaResults[finalMatch.id]) {
        state.copaChampion = state.copaResults[finalMatch.id].winner;
      }

      LAS.storage.save(state);
      refresh();
      LAS.dom.toast('Resultado de Copa cargado a mano.', 'success');
    } catch (error) {
      console.error('Error guardando resultado de copa:', error);
      LAS.dom.toast('Error al guardar resultado de copa.', 'error');
    }
  }

  /* ---------------------- Resultados manuales ----------------------- */
  // Un mismo partido se renderiza en varias vistas (simulador, fixture, playoffs)
  // con el mismo id. getElementById devuelve siempre el primero del documento,
  // que puede estar en una vista oculta; priorizamos siempre el campo visible.
  function findManualInput(id) {
    const nodes = document.querySelectorAll('[id="' + id + '"]');
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].offsetParent !== null) return nodes[i];
    }
    return nodes[0] || null;
  }

  // Goles de un solo dígito (0-9). Los penales pueden superar 9, por eso
  // reciben un límite propio.
  function readGoals(input, max) {
    if (!input) return null;
    const limit = typeof max === 'number' ? max : 9;
    const raw = String(input.value || '').trim();
    if (raw === '') return null;
    // rechazar ceros a la izquierda (ej. "01", "007") pero permitir "0" solo
    if (raw.length > 1 && raw.charAt(0) === '0') return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > limit || Math.floor(value) !== value) return null;
    return value;
  }

  function buildManualScorers(matchId, homeId, awayId, homeGoals, awayGoals) {
    const rng = LAS.rng.createRng(LAS.rng.hashString('manual:' + matchId + ':' + state.seed));
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
    return scorers;
  }

  function loadManualResult(matchId) {
    try {
      const current = buildContext();
      const regular = LAS.fixtures.findMatch(current.fixtures, matchId);
      const playoff = regular ? null : LAS.playoffs.findMatch(state, matchId);
      const match = regular || playoff;

      if (!match) return;

      const homeInput = findManualInput('manual-home-' + matchId);
      const awayInput = findManualInput('manual-away-' + matchId);
      if (!homeInput || !awayInput) return;

      const homeGoals = readGoals(homeInput);
      const awayGoals = readGoals(awayInput);

      if (homeGoals === null || awayGoals === null) {
        LAS.dom.toast('Ingresá goles entre 0 y 9 (un solo dígito).', 'error');
        return;
      }

      let penalties = null;
      let winner = null;

      if (homeGoals > awayGoals) {
        winner = match.home;
      } else if (awayGoals > homeGoals) {
        winner = match.away;
      } else if (playoff) {
        const homePensInput = findManualInput('manual-pen-home-' + matchId);
        const awayPensInput = findManualInput('manual-pen-away-' + matchId);
        if (!homePensInput || !awayPensInput) return;

        const homePens = readGoals(homePensInput, 20);
        const awayPens = readGoals(awayPensInput, 20);

        if (homePens === null || awayPens === null) {
          LAS.dom.toast('Completá los penales con números entre 0 y 20 (sin ceros adelante).', 'error');
          return;
        }
        if (homePens === awayPens) {
          LAS.dom.toast('Los penales no pueden terminar empatados.', 'error');
          return;
        }

        penalties = { home: homePens, away: awayPens };
        winner = homePens > awayPens ? match.home : match.away;
      } else {
        // Empate en fase regular: se permite (no hay penales)
        winner = null;
      }

      const wasAlreadyPlayed = !!state.results[matchId];

      state.results[matchId] = {
        homeId: match.home,
        awayId: match.away,
        homeGoals,
        awayGoals,
        penalties,
        winner,
        scorers: buildManualScorers(matchId, match.home, match.away, homeGoals, awayGoals),
        manual: true
      };

      const hadPlayoffs = !!state.playoffs;
      const standings = LAS.standings.compute(state, current.tournament, current.fixtures);
      LAS.playoffs.ensure(state, current.tournament, current.fixtures, standings);

      if (!hadPlayoffs && state.playoffs) {
        LAS.dom.toast('Fase regular completa: ¡arrancan los playoffs!', 'success');
      } else if (wasAlreadyPlayed) {
        LAS.dom.toast('Resultado actualizado.', 'success');
      } else {
        LAS.dom.toast('Resultado cargado.', 'success');
      }
      // limpiar timers pendientes de este partido (el DOM se reconstruyó)
      if (autoSaveTimers[matchId]) {
        clearTimeout(autoSaveTimers[matchId]);
        delete autoSaveTimers[matchId];
      }
      afterSimulation([matchId]);
    } catch (error) {
      console.error('Error cargando resultado manual:', error);
      LAS.dom.toast('Error al guardar el resultado.', 'error');
    }
  }

  function autoSaveManual(matchId) {
    try {
      const current = buildContext();
      const regular = LAS.fixtures.findMatch(current.fixtures, matchId);
      const playoff = regular ? null : LAS.playoffs.findMatch(state, matchId);
      const match = regular || playoff;
      if (!match) return;

      const homeInput = findManualInput('manual-home-' + matchId);
      const awayInput = findManualInput('manual-away-' + matchId);
      if (!homeInput || !awayInput) return;
      const homeGoals = readGoals(homeInput);
      const awayGoals = readGoals(awayInput);

      if (homeGoals === null || awayGoals === null) return; // todavía no está completo

      if (playoff && homeGoals === awayGoals) {
        const homePensInput = findManualInput('manual-pen-home-' + matchId);
        const awayPensInput = findManualInput('manual-pen-away-' + matchId);
        if (!homePensInput || !awayPensInput) return;
        const homePens = readGoals(homePensInput, 20);
        const awayPens = readGoals(awayPensInput, 20);
        if (homePens === null || awayPens === null || homePens === awayPens) return;
      }

      loadManualResult(matchId);
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  }

  function heroPrimary() {
    try {
      const current = buildContext();
      if (current.playoffs && current.playoffs.champion) {
        location.hash = '#playoffs';
        return;
      }
      if (current.playoffs) {
        simulatePlayoffs();
        return;
      }
      const next = LAS.fixtures.nextRound(current.fixtures, state.results);
      if (next) simulateRound(next.number);
      else simulateSeason();
    } catch (error) {
      console.error('Error en hero primary:', error);
    }
  }

  function roundLabel(current) {
    return (current.tournament.ui && current.tournament.ui.roundLabel) || 'Fecha';
  }

  /* -------------------------- Torneo / reset ------------------------ */
  function startTournament(tournamentId) {
    try {
      const overrides = state.teams;
      const theme = state.theme;
      state = createState(tournamentId, theme, overrides);
      uiState.fixtureRound = null;
      uiState.teamsQuery = '';
      applyTheme(theme);
      refresh();
      LAS.dom.toast('Nuevo torneo: ' + LAS.getTournament(tournamentId).fullName, 'success');
    } catch (error) {
      console.error('Error iniciando torneo:', error);
    }
  }

  async function resetTournament() {
    try {
      const tournament = LAS.getTournament(state.tournamentId);
      const confirmed = await LAS.dom.confirmDialog({
        title: 'Reiniciar torneo',
        message: 'Se borrarán todos los resultados y playoffs de ' + tournament.fullName + '. Los equipos editados se mantienen.',
        confirmLabel: 'Sí, reiniciar',
        danger: true
      });
      if (!confirmed) return;

      const overrides = state.teams;
      const theme = state.theme;
      state = createState(state.tournamentId, theme, overrides);
      uiState.fixtureRound = null;
      uiState.teamsQuery = '';
      applyTheme(theme);
      refresh();
      LAS.dom.toast('Torneo reiniciado.', 'success');
    } catch (error) {
      console.error('Error reiniciando torneo:', error);
    }
  }

  function openNewTournament() {
    try {
      const body = '<div class="tournament-options">' +
        LAS.TOURNAMENTS.map((tournament) =>
          '<button type="button" class="tournament-option ' + (tournament.id === state.tournamentId ? 'is-active' : '') +
          '" data-pick-tournament="' + tournament.id + '">' +
            '<span class="tournament-flag">🇦🇷</span>' +
            '<span class="tournament-option-copy"><b>' + LAS.dom.esc(tournament.name) + '</b>' +
            '<small>' + LAS.dom.esc(tournament.description) + '</small></span>' +
            '<span class="pill">' + tournament.groups.length + ' zona(s)</span>' +
          '</button>'
        ).join('') +
      '</div>';

      LAS.dom.openModal({
        title: 'Elegir torneo',
        body,
        onMount(modal, close) {
          modal.querySelectorAll('[data-pick-tournament]').forEach((button) => {
            button.addEventListener('click', async () => {
              const id = button.dataset.pickTournament;
              const tournament = LAS.getTournament(id);
              close();
              const confirmed = await LAS.dom.confirmDialog({
                title: 'Empezar torneo',
                message: 'Vas a empezar ' + tournament.fullName + '. Se reiniciarán los resultados actuales (los equipos editados se mantienen).',
                confirmLabel: 'Empezar'
              });
              if (confirmed) startTournament(id);
            });
          });
        }
      });
    } catch (error) {
      console.error('Error abriendo selector de torneo:', error);
    }
  }

  /* ----------------------------- Ajustes ---------------------------- */
  function openSettings() {
    try {
      const tournament = LAS.getTournament(state.tournamentId);
      const body =
        '<div class="settings-block">' +
          '<h4>Tema</h4>' +
          '<div class="segmented">' +
            '<button type="button" class="seg-btn ' + (state.theme === 'dark' ? 'is-active' : '') + '" data-set-theme="dark">Oscuro</button>' +
            '<button type="button" class="seg-btn ' + (state.theme === 'light' ? 'is-active' : '') + '" data-set-theme="light">Claro</button>' +
          '</div>' +
        '</div>' +
        '<div class="settings-block">' +
          '<h4>Partida</h4>' +
          '<p class="muted">' + LAS.dom.esc(tournament.fullName) + ' · Semilla ' + state.seed + '</p>' +
          '<div class="settings-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-modal-action="export">' + LAS.dom.icon('download', 14) + ' Exportar JSON</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-modal-action="import">' + LAS.dom.icon('upload', 14) + ' Importar JSON</button>' +
            '<button type="button" class="btn btn-ghost btn-sm btn-danger" data-modal-action="reset">' + LAS.dom.icon('refresh', 14) + ' Reiniciar torneo</button>' +
          '</div>' +
        '</div>' +
        '<div class="settings-block">' +
          '<h4>Acerca de</h4>' +
          '<p class="muted">LigaSim Argentina es un simulador no oficial. Los planteles y resultados son ficticios y se generan con el motor del juego.</p>' +
        '</div>';

      LAS.dom.openModal({
        title: 'Ajustes de la partida',
        body,
        onMount(modal, close) {
          modal.querySelectorAll('[data-set-theme]').forEach((button) => {
            button.addEventListener('click', () => {
              setTheme(button.dataset.setTheme);
              modal.querySelectorAll('[data-set-theme]').forEach((item) => {
                item.classList.toggle('is-active', item.dataset.setTheme === state.theme);
              });
            });
          });

          modal.querySelectorAll('[data-modal-action]').forEach((button) => {
            button.addEventListener('click', () => {
              const action = button.dataset.modalAction;
              if (action === 'export') {
                LAS.storage.exportState(state);
                LAS.dom.toast('Partida exportada.', 'success');
              }
              if (action === 'import') {
                close();
                triggerImport();
              }
              if (action === 'reset') {
                close();
                resetTournament();
              }
            });
          });
        }
      });
    } catch (error) {
      console.error('Error abriendo ajustes:', error);
    }
  }

  /* --------------------------- Editor equipo ------------------------ */
  function openTeamEditor(teamId) {
    try {
      const team = LAS.resolveTeam(state, teamId);
      const hasOverride = !!(state.teams && state.teams[teamId]);

      const body =
        '<div class="edit-team-head">' + LAS.dom.badge(team, 'badge--lg') +
          '<div><b>' + LAS.dom.esc(team.name) + '</b><small>' + LAS.dom.esc(team.city) + ' · ' + LAS.dom.esc(team.stadium) + '</small></div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="edit-name">Nombre del club</label>' +
          '<input id="edit-name" type="text" maxlength="40" value="' + LAS.dom.esc(team.name) + '">' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="edit-short">Sigla</label>' +
            '<input id="edit-short" type="text" maxlength="4" value="' + LAS.dom.esc(team.short) + '"></div>' +
          '<div class="field"><label for="edit-city">Ciudad</label>' +
            '<input id="edit-city" type="text" maxlength="40" value="' + LAS.dom.esc(team.city) + '"></div>' +
        '</div>' +
        '<div class="field"><label for="edit-stadium">Estadio</label>' +
          '<input id="edit-stadium" type="text" maxlength="50" value="' + LAS.dom.esc(team.stadium) + '"></div>' +
        '<div class="field">' +
          '<label for="edit-rating">Fuerza <output id="edit-rating-out">' + Number(team.rating) + '</output></label>' +
          '<input id="edit-rating" type="range" min="1" max="99" value="' + Number(team.rating) + '">' +
          '<p class="hint">Más fuerza = más chances de ganar. Se aplica a los partidos que simules de ahora en adelante.</p>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="edit-color1">Color principal</label>' +
            '<input id="edit-color1" type="color" value="' + LAS.dom.safeColor(team.colors[0], '#333333') + '"></div>' +
          '<div class="field"><label for="edit-color2">Color secundario</label>' +
            '<input id="edit-color2" type="color" value="' + LAS.dom.safeColor(team.colors[1], '#111111') + '"></div>' +
        '</div>' +
        '<div class="edit-preview"><span>Vista previa</span><span id="edit-preview-badge">' + LAS.dom.badge(team) + '</span></div>';

      const actions = [
        { label: 'Cancelar', variant: 'ghost', onClick: ({ close }) => close() },
        {
          label: 'Guardar cambios',
          variant: 'primary',
          onClick: ({ modal, close }) => {
            const name = modal.querySelector('#edit-name').value.trim();
            const short = modal.querySelector('#edit-short').value.trim().toUpperCase();
            const city = modal.querySelector('#edit-city').value.trim();
            const stadium = modal.querySelector('#edit-stadium').value.trim();
            const rating = Number(modal.querySelector('#edit-rating').value);
            const color1 = modal.querySelector('#edit-color1').value;
            const color2 = modal.querySelector('#edit-color2').value;

            if (!name) {
              LAS.dom.toast('El nombre no puede estar vacío.', 'error');
              return;
            }
            if (!short) {
              LAS.dom.toast('La sigla no puede estar vacía.', 'error');
              return;
            }

            state.teams[teamId] = {
              name,
              short: short.slice(0, 4),
              city: city || team.city,
              stadium: stadium || team.stadium,
              rating: Math.max(1, Math.min(99, Number.isFinite(rating) ? rating : team.rating)),
              colors: [
                LAS.dom.safeColor(color1, '#333333'),
                LAS.dom.safeColor(color2, '#111111')
              ]
            };

            LAS.storage.save(state);
            refresh();
            close();
            LAS.dom.toast('Equipo actualizado.', 'success');
          }
        }
      ];

      if (hasOverride) {
        actions.unshift({
          label: 'Restablecer',
          variant: 'ghost',
          onClick: ({ close }) => {
            delete state.teams[teamId];
            LAS.storage.save(state);
            refresh();
            close();
            LAS.dom.toast('Equipo restablecido.', 'success');
          }
        });
      }

      LAS.dom.openModal({
        title: 'Editar equipo',
        body,
        actions,
        onMount(modal) {
          const range = modal.querySelector('#edit-rating');
          const output = modal.querySelector('#edit-rating-out');
          range.addEventListener('input', () => {
            output.textContent = range.value;
          });

          const updatePreview = () => {
            const preview = Object.assign({}, team, {
              short: modal.querySelector('#edit-short').value.toUpperCase() || team.short,
              colors: [
                modal.querySelector('#edit-color1').value,
                modal.querySelector('#edit-color2').value
              ]
            });
            modal.querySelector('#edit-preview-badge').innerHTML = LAS.dom.badge(preview);
          };

          ['#edit-short', '#edit-color1', '#edit-color2'].forEach((selector) => {
            modal.querySelector(selector).addEventListener('input', updatePreview);
          });
        }
      });
    } catch (error) {
      console.error('Error abriendo editor de equipo:', error);
    }
  }

  /* --------------------------- Import / export ---------------------- */
  function triggerImport() {
    try {
      const input = document.getElementById('import-input');
      if (!input) return;
      input.value = '';
      input.click();
    } catch (error) {
      console.error('Error disparando importación:', error);
    }
  }

  async function handleImport(file) {
    try {
      if (!file) return;

      const text = await file.text();
      const data = LAS.storage.parseImport(text);

      const confirmed = await LAS.dom.confirmDialog({
        title: 'Importar partida',
        message: 'Se reemplazará la partida actual por la del archivo. ¿Continuar?',
        confirmLabel: 'Importar'
      });
      if (!confirmed) return;

      state = data;
      state.teams = state.teams || {};
      state.results = state.results || {};
      state.playoffs = state.playoffs || null;
      state.theme = state.theme === 'light' ? 'light' : 'dark';
      state.celebrated = !!state.celebrated;

      uiState.fixtureRound = null;
      uiState.teamsQuery = '';
      applyTheme(state.theme);
      refresh();
      LAS.dom.toast('Partida importada.', 'success');
    } catch (error) {
      LAS.dom.toast('No se pudo importar: ' + error.message, 'error');
    }
  }

  /* ----------------------------- Acciones --------------------------- */
  function handleAction(action) {
    try {
      switch (action) {
        case 'hero-primary': heroPrimary(); break;
        case 'sim-season': simulateSeason(); break;
        case 'sim-playoffs': simulatePlayoffs(); break;
        case 'sim-remaining': simulateRemaining(); break;
        case 'go-playoffs': location.hash = '#playoffs'; break;
        case 'new-tournament': openNewTournament(); break;
        case 'export':
          LAS.storage.exportState(state);
          LAS.dom.toast('Partida exportada.', 'success');
          break;
        case 'import': triggerImport(); break;
        case 'reset': resetTournament(); break;
        case 'settings': openSettings(); break;
        case 'init-copa': initCopa(); break;
        case 'sim-all-copa': simulateAllCopa(); break;
        default: break;
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
    }
  }

  /* ------------------------------ Ruteo ----------------------------- */
  const VIEWS = ['simulador', 'fixture', 'tabla', 'playoffs', 'copa', 'equipos'];

  function route() {
    try {
      let view = (location.hash || '#simulador').replace('#', '');
      if (VIEWS.indexOf(view) === -1) view = 'simulador';

      document.querySelectorAll('.view').forEach((element) => {
        element.hidden = element.id !== 'view-' + view;
      });
      document.querySelectorAll('.main-nav a').forEach((link) => {
        link.classList.toggle('is-active', link.dataset.nav === view);
      });
      window.scrollTo(0, 0);
      refresh();
    } catch (error) {
      console.error('Error en route:', error);
    }
  }

  /* ----------------------------- Eventos ---------------------------- */
  function populateTournamentSelect() {
    try {
      const select = document.getElementById('tournament-select');
      if (!select) return;
      select.innerHTML = LAS.TOURNAMENTS.map((tournament) =>
        '<option value="' + tournament.id + '">' + LAS.dom.esc(tournament.name) + ' · ' + LAS.dom.esc(tournament.season) + '</option>'
      ).join('');
      select.value = state.tournamentId;
    } catch (error) {
      console.error('Error poblando selector de torneo:', error);
    }
  }

  function bindEvents() {
    try {
      document.addEventListener('click', (event) => {
        const target = event.target;

        const simMatch = target.closest('[data-sim-match]');
        if (simMatch) {
          event.preventDefault();
          simulateMatch(simMatch.dataset.simMatch);
          return;
        }

        const simCopaMatch = target.closest('[data-sim-copa-match]');
        if (simCopaMatch) {
          event.preventDefault();
          simulateCopaMatch(simCopaMatch.dataset.simCopaMatch);
          return;
        }

        const simRound = target.closest('[data-sim-round]');
        if (simRound) {
          event.preventDefault();
          simulateRound(Number(simRound.dataset.simRound));
          return;
        }

        const roundButton = target.closest('[data-round]');
        if (roundButton) {
          event.preventDefault();
          uiState.fixtureRound = Number(roundButton.dataset.round);
          refresh();
          return;
        }

        const editTeam = target.closest('[data-edit-team]');
        if (editTeam) {
          event.preventDefault();
          openTeamEditor(editTeam.dataset.editTeam);
          return;
        }

        const action = target.closest('[data-action]');
        if (action) {
          event.preventDefault();
          handleAction(action.dataset.action);
        }
      });

      document.addEventListener('input', (event) => {
        try {
          if (event.target && event.target.id === 'teams-search') {
            uiState.teamsQuery = event.target.value;
            if (ctx) LAS.render.renderTeamsGrid(ctx);
          }
          // Los goles se cargan con un solo dígito (0-9). Los penales
          // (manual-pen-*) quedan fuera de esta regla.
          if (event.target && /^manual-(home|away)-/.test(event.target.id || '')) {
            const input = event.target;
            let value = String(input.value || '').replace(/[^\d]/g, '');
            if (value.length > 1) value = value.replace(/^0+/, '');
            if (value.length > 1) value = value.slice(0, 1);
            if (value !== input.value) input.value = value;
          }
        } catch (error) {
          console.error('Error en input de búsqueda:', error);
        }
      });

      /* Guardado automático al cambiar un campo de resultado manual */
      const onManualField = (event) => {
        try {
          const target = event.target;
          const matchId = target && target.dataset && target.dataset.matchId;
          if (!matchId || !/^manual-/.test(target.id || '')) return;
          // debounce: evitar carreras entre cambios rápidos
          if (autoSaveTimers[matchId]) clearTimeout(autoSaveTimers[matchId]);
          autoSaveTimers[matchId] = setTimeout(() => {
            autoSaveManual(matchId);
            delete autoSaveTimers[matchId];
          }, 150);
        } catch (error) {
          console.error('Error en campo manual:', error);
        }
      };
      document.addEventListener('change', onManualField, true);

      const themeButton = document.getElementById('theme-toggle');
      if (themeButton) {
        themeButton.addEventListener('click', () => {
          setTheme(state.theme === 'dark' ? 'light' : 'dark');
        });
      }

      const settingsButton = document.getElementById('settings-btn');
      if (settingsButton) {
        settingsButton.addEventListener('click', openSettings);
      }

      const tournamentSelect = document.getElementById('tournament-select');
      if (tournamentSelect) {
        tournamentSelect.addEventListener('change', async () => {
          try {
            const id = tournamentSelect.value;
            if (id === state.tournamentId) return;

            const tournament = LAS.getTournament(id);
            const confirmed = await LAS.dom.confirmDialog({
              title: 'Cambiar de torneo',
              message: 'Vas a empezar ' + tournament.fullName + '. Se reiniciarán los resultados actuales (los equipos editados se mantienen).',
              confirmLabel: 'Empezar'
            });

            if (confirmed) {
              startTournament(id);
            } else {
              tournamentSelect.value = state.tournamentId;
            }
          } catch (error) {
            console.error('Error cambiando torneo:', error);
          }
        });
      }

      const importInput = document.getElementById('import-input');
      if (importInput) {
        importInput.addEventListener('change', () => {
          try {
            const file = importInput.files && importInput.files[0];
            handleImport(file);
          } catch (error) {
            console.error('Error importando:', error);
          }
        });
      }

      window.addEventListener('hashchange', route);
    } catch (error) {
      console.error('Error bindiendo eventos:', error);
    }
  }

  /* ------------------------------ Init ------------------------------ */
  function init() {
    try {
      state = loadState();
      applyTheme(state.theme);
      populateTournamentSelect();
      bindEvents();
      route();
    } catch (error) {
      console.error('Error inicializando aplicación:', error);
    }
  }

  LAS.app = {
    getState: () => state,
    getContext: () => ctx,
    refresh,
    simulateMatch,
    simulateRound,
    simulateSeason,
    simulatePlayoffs,
    startTournament,
    resetTournament
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();