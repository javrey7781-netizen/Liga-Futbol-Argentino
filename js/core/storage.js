/* ============================================================
   LigaSim Argentina — Persistencia
   ------------------------------------------------------------
   Guarda el estado en localStorage y permite exportar/importar
   la partida como JSON. Si localStorage no está disponible,
   mantiene la partida en memoria.

   Todo lo que entra desde un archivo se normaliza antes de usarse:
   los resultados se validan contra el fixture real del torneo, así
   una partida editada a mano no puede romper la tabla, inyectar
   HTML/CSS ni inventar un campeón.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});
  const KEY = 'ligasim:arg:v1';
  let memoryState = null;

  const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

  function toInt(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(99, Math.round(number)));
  }

  function toGoal(value, max) {
    const limit = typeof max === 'number' ? max : 9;
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(limit, Math.round(number)));
  }

  function toTimestamp(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : Date.now();
  }

  function text(value, maxLength) {
    return String(value == null ? '' : value)
      .replace(/[<>]/g, '')
      .replace(/[\u0000-\u001f]/g, '')
      .slice(0, maxLength);
  }

  function toColor(value, fallback) {
    const raw = String(value == null ? '' : value).trim();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return '#' + raw.slice(1).split('').map((char) => char + char).join('').toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
    return fallback;
  }

  function sanitizeTeams(teams) {
    const out = {};
    if (!teams || typeof teams !== 'object') return out;

    Object.keys(teams).forEach((id) => {
      if (DANGEROUS_KEYS.indexOf(id) !== -1) return;
      const base = LAS.TEAM_MAP[id];
      if (!base) return;

      const override = teams[id];
      if (!override || typeof override !== 'object') return;

      const colors = Array.isArray(override.colors) ? override.colors : [];
      out[id] = {
        name: text(override.name, 40),
        short: text(override.short, 4),
        city: text(override.city, 40),
        stadium: text(override.stadium, 50),
        rating: toInt(override.rating, base.rating),
        colors: [
          toColor(colors[0], base.colors[0]),
          toColor(colors[1], base.colors[1])
        ]
      };
    });

    return out;
  }

  function sanitizeResults(results, matchIndex, playoffIndex) {
    const out = {};
    if (!results || typeof results !== 'object') return out;

    Object.keys(results).forEach((id) => {
      if (DANGEROUS_KEYS.indexOf(id) !== -1) return;

      const result = results[id];
      if (!result || typeof result !== 'object') return;

      // Solo se aceptan partidos que existan de verdad en el fixture
      // de este torneo (fase regular) o en el bracket importado.
      const match = matchIndex.get(id) || playoffIndex.get(id);
      if (!match) return;

      const homeGoals = toGoal(result.homeGoals);
      const awayGoals = toGoal(result.awayGoals);
      let penalties = null;
      let winner = null;

      if (homeGoals > awayGoals) {
        winner = match.home;
      } else if (awayGoals > homeGoals) {
        winner = match.away;
      } else if (match.knockout) {
        // En eliminatorias un empate necesita penales válidos; si no,
        // el partido se descarta y se puede volver a simular.
        const source = result.penalties;
        if (!source || typeof source !== 'object') return;
        const homePens = toGoal(source.home, 20);
        const awayPens = toGoal(source.away, 20);
        if (homePens === awayPens) return;
        penalties = { home: homePens, away: awayPens };
        winner = homePens > awayPens ? match.home : match.away;
      }

      // Los goleadores se reconstruyen con los nombres canónicos del
      // plantel para que un archivo no pueda inyectar texto arbitrario.
      const scorers = [];
      if (Array.isArray(result.scorers)) {
        result.scorers.slice(0, 40).forEach((goal) => {
          if (!goal || typeof goal !== 'object') return;
          if (goal.teamId !== match.home && goal.teamId !== match.away) return;

          const squad = LAS.getSquad(goal.teamId);
          const player = squad.find((item) => item.id === goal.playerId);
          if (!player) return;

          scorers.push({
            playerId: player.id,
            name: player.name,
            teamId: goal.teamId,
            minute: Math.max(1, Math.min(120, toInt(goal.minute, 1)))
          });
        });
      }
      scorers.sort((a, b) => a.minute - b.minute);
      scorers.length = Math.min(scorers.length, homeGoals + awayGoals);

      out[id] = {
        homeId: match.home,
        awayId: match.away,
        homeGoals,
        awayGoals,
        penalties,
        winner,
        scorers,
        manual: !!result.manual
      };
    });

    return out;
  }

  function sanitizePlayoffs(playoffs) {
    if (!playoffs || typeof playoffs !== 'object' || !Array.isArray(playoffs.rounds)) return null;
    if (!playoffs.rounds.length) return null;

    const rounds = [];
    const seen = new Set();

    for (let roundIndex = 0; roundIndex < playoffs.rounds.length; roundIndex++) {
      const round = playoffs.rounds[roundIndex];
      if (!round || typeof round !== 'object' || !Array.isArray(round.matches) || !round.matches.length) {
        return null;
      }

      const matches = [];
      for (const match of round.matches) {
        if (!match || typeof match !== 'object') return null;
        if (!/^po-\d+-\d+$/.test(String(match.id || ''))) return null;
        if (!LAS.TEAM_MAP[match.home] || !LAS.TEAM_MAP[match.away]) return null;
        if (seen.has(match.id)) return null;
        seen.add(match.id);

        matches.push({
          id: String(match.id),
          roundIndex,
          home: String(match.home),
          away: String(match.away),
          homeLabel: text(match.homeLabel, 12),
          awayLabel: text(match.awayLabel, 12),
          homeRank: toInt(match.homeRank, 1),
          awayRank: toInt(match.awayRank, 1),
          neutral: !!match.neutral,
          isFinal: !!match.isFinal
        });
      }

      rounds.push({ name: text(round.name, 40) || 'Ronda', matches });
    }

    return { rounds, champion: null, createdAt: toTimestamp(playoffs.createdAt) };
  }

  function sanitize(data) {
    if (!data || typeof data !== 'object') return null;
    if (!LAS.TOURNAMENTS.some((tournament) => tournament.id === data.tournamentId)) return null;

    const seed = Number(data.seed);
    if (!Number.isFinite(seed) || seed <= 0) return null;

    const tournament = LAS.getTournament(data.tournamentId);
    const fixtures = LAS.fixtures.build(tournament, seed);
    const matchIndex = new Map();
    LAS.fixtures.allMatches(fixtures).forEach((match) => {
      matchIndex.set(match.id, { home: match.home, away: match.away, knockout: false });
    });

    const playoffs = sanitizePlayoffs(data.playoffs);
    const playoffIndex = new Map();
    if (playoffs) {
      playoffs.rounds.forEach((round) => {
        round.matches.forEach((match) => {
          playoffIndex.set(match.id, { home: match.home, away: match.away, knockout: true });
        });
      });
    }

    const results = sanitizeResults(data.results, matchIndex, playoffIndex);

    // El campeón sale del resultado de la final, nunca del archivo.
    if (playoffs) {
      const lastRound = playoffs.rounds[playoffs.rounds.length - 1];
      const finalMatch = lastRound.matches.length === 1 ? lastRound.matches[0] : null;
      const finalResult = finalMatch ? results[finalMatch.id] : null;
      playoffs.champion = finalResult && finalResult.winner ? finalResult.winner : null;
    }

    return {
      version: 1,
      tournamentId: data.tournamentId,
      seed: seed >>> 0,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt.slice(0, 40) : new Date().toISOString(),
      theme: data.theme === 'light' ? 'light' : 'dark',
      teams: sanitizeTeams(data.teams),
      results,
      playoffs,
      celebrated: !!data.celebrated
    };
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return memoryState;
      return JSON.parse(raw);
    } catch (error) {
      return memoryState;
    }
  }

  function save(state) {
    memoryState = state;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      /* modo memoria */
    }
  }

  function clear() {
    memoryState = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch (error) {
      /* nada */
    }
  }

  function exportState(state) {
    const tournament = LAS.getTournament(state.tournamentId);
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ligasim-' + tournament.id + '-' + stamp + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function parseImport(rawText) {
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      throw new Error('El archivo no es un JSON válido.');
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('El archivo no es válido.');
    }
    if (!LAS.TOURNAMENTS.some((tournament) => tournament.id === data.tournamentId)) {
      throw new Error('El archivo no corresponde a un torneo conocido.');
    }
    if (!data.results || typeof data.results !== 'object') {
      throw new Error('El archivo no tiene resultados de partidos.');
    }
    if (!Number.isFinite(Number(data.seed)) || Number(data.seed) <= 0) {
      throw new Error('El archivo no tiene una semilla de torneo válida.');
    }

    const clean = sanitize(data);
    if (!clean) throw new Error('El archivo no se pudo interpretar.');
    return clean;
  }

  LAS.storage = { load, save, clear, exportState, parseImport, sanitize, KEY };
})();
