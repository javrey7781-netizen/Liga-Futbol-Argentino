/* ============================================================
   LigaSim Argentina — Configuración de torneos
   ------------------------------------------------------------
   La idea es que agregar un campeonato nuevo sea SOLO agregar un
   objeto a este array. El motor (fixture, tabla y playoffs) se
   adapta a la configuración.

   Estructura de un torneo:
   {
     id, name, fullName, season, country, format: 'groups_playoffs',
     rounds: 'single' | 'double',
     points: { win, draw, loss },
     groups: [{ name, teamIds: [...] }],
     playoffs: { enabled, teamsPerGroup, neutralFinal },
     ui: { roundLabel, qualificationLabel }
   }
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  const ZONA_A = [
    'river-plate', 'estudiantes', 'velez', 'talleres', 'rosario-central',
    'huracan', 'newells', 'union', 'tigre', 'gimnasia', 'banfield',
    'barracas-central', 'platense', 'san-martin-sj', 'aldosivi'
  ];

  const ZONA_B = [
    'boca-juniors', 'racing-club', 'independiente', 'san-lorenzo', 'lanus',
    'argentinos', 'defensa-justicia', 'godoy-cruz', 'belgrano', 'instituto',
    'atletico-tucuman', 'independiente-rivadavia', 'central-cordoba',
    'sarmiento', 'riestra'
  ];

  const TODOS = LAS.TEAMS.map((t) => t.id);

  /* ----------------------------------------------------------------
     Clásicos y emparejamientos fijos para la fecha de clásicos.
     Cada par es [equipoZonaA, equipoZonaB] o [equipoA, equipoB] sin
     importar la zona; el motor los respeta tal cual.
     ---------------------------------------------------------------- */
  const CLASICOS = [
    ['river-plate', 'boca-juniors'],
    ['racing-club', 'independiente'],
    ['san-lorenzo', 'huracan'],
    ['newells', 'rosario-central'],
    ['belgrano', 'talleres'],
    ['gimnasia', 'estudiantes'],
    ['velez', 'tigre'],
    ['lanus', 'banfield'],
    ['godoy-cruz', 'independiente-rivadavia'],
    ['atletico-tucuman', 'san-martin-sj'],
    ['platense', 'argentinos'],
    ['barracas-central', 'defensa-justicia'],
    ['instituto', 'central-cordoba'],
    ['sarmiento', 'aldosivi'],
    ['union', 'riestra']
  ];

  /* Emparejamientos interzonales para la fecha interzonal (no son clásicos).
     Se usan para completar los 15 partidos de la fecha interzonal. */
  const INTERZONALES = [
    ['river-plate', 'racing-club'],
    ['boca-juniors', 'estudiantes'],
    ['velez', 'independiente'],
    ['talleres', 'san-lorenzo'],
    ['rosario-central', 'lanus'],
    ['huracan', 'argentinos'],
    ['newells', 'defensa-justicia'],
    ['union', 'godoy-cruz'],
    ['tigre', 'belgrano'],
    ['gimnasia', 'instituto'],
    ['banfield', 'atletico-tucuman'],
    ['barracas-central', 'independiente-rivadavia'],
    ['platense', 'central-cordoba'],
    ['san-martin-sj', 'sarmiento'],
    ['aldosivi', 'riestra']
  ];

  /* Genera la configuración de un semestre (Apertura o Clausura) */
  function semesterConfig(id, name, semesterLabel) {
    return {
      id,
      name,
      fullName: name,
      season: '2026',
      country: 'Argentina',
      description: '30 clubes en dos zonas (A y B) de 15 equipos. 15 fechas intra-zona + 1 fecha interzonal + 1 fecha de clásicos = 17 fechas. Clasifican los 8 mejores de cada zona a playoffs.',
      format: 'groups_playoffs',
      rounds: 'single',
      points: { win: 3, draw: 1, loss: 0 },
      totalRounds: 17,
      regularRounds: 15,
      groups: [
        { name: 'Zona A', teamIds: ZONA_A },
        { name: 'Zona B', teamIds: ZONA_B }
      ],
      playoffs: {
        enabled: true,
        teamsPerGroup: 8,
        neutralFinal: true,
        // Localía: octavos y cuartos = cancha del mejor ubicado; semifinales y final = neutral
        neutralRounds: ['semifinales', 'final']
      },
      internationalCups: {
        libertadores: 6,
        sudamericana: 6
      },
      relegation: {
        enabled: true,
        teams: 2,
        years: 3
      },
      clasicos: CLASICOS,
      interzonales: INTERZONALES,
      semester: semesterLabel,
      ui: {
        roundLabel: 'Fecha',
        qualificationLabel: 'Playoffs'
      }
    };
  }

  LAS.TOURNAMENTS = [
    semesterConfig(
      'liga-apertura-2026',
      'Liga Profesional — Apertura',
      'Apertura 2026'
    ),
    semesterConfig(
      'liga-clausura-2026',
      'Liga Profesional — Clausura',
      'Clausura 2026'
    ),
    {
      id: 'liga-unica-2026',
      name: 'Liga Única',
      fullName: 'Liga Profesional 2026 — Zona Única',
      season: '2026',
      country: 'Argentina',
      description: 'Los 30 clubes en una sola tabla, 29 fechas todos contra todos y los ocho mejores a la fase final.',
      format: 'groups_playoffs',
      rounds: 'single',
      points: { win: 3, draw: 1, loss: 0 },
      groups: [
        { name: 'Tabla única', teamIds: TODOS }
      ],
      playoffs: {
        enabled: true,
        teamsPerGroup: 8,
        neutralFinal: true
      },
      internationalCups: {
        libertadores: 6,
        sudamericana: 6
      },
      relegation: {
        enabled: true,
        teams: 2,
        years: 3
      },
      ui: {
        roundLabel: 'Fecha',
        qualificationLabel: 'Playoffs'
      }
    },
    {
      id: 'copa-argentina-2026',
      name: 'Copa Argentina',
      fullName: 'Copa Argentina 2026',
      season: '2026',
      country: 'Argentina',
      description: 'Torneo de eliminación directa con los 30 clubes de la liga. Partido único, empate se define por penales. El campeón clasifica a la Copa Libertadores.',
      format: 'knockout',
      rounds: 'single',
      points: { win: 3, draw: 1, loss: 0 },
      groups: [
        { name: 'Eliminación directa', teamIds: TODOS }
      ],
      playoffs: {
        enabled: false,
        teamsPerGroup: 0,
        neutralFinal: true
      },
      internationalCups: {
        libertadores: 1,
        sudamericana: 0
      },
      relegation: {
        enabled: false,
        teams: 0,
        years: 3
      },
      cup: {
        enabled: true,
        totalTeams: 32,
        rounds: ['32avos', '16avos', 'Octavos', 'Cuartos', 'Semifinales', 'Final']
      },
      ui: {
        roundLabel: 'Ronda',
        qualificationLabel: 'Clasificados'
      }
    }
  ];

  LAS.getTournament = function (id) {
    return LAS.TOURNAMENTS.find((t) => t.id === id) || LAS.TOURNAMENTS[0];
  };

  /* Devuelve el ID del siguiente semestre (Apertura -> Clausura, Clausura -> null) */
  LAS.getNextSemester = function (tournamentId) {
    const idx = LAS.TOURNAMENTS.findIndex((t) => t.id === tournamentId);
    if (idx === -1) return null;
    const next = LAS.TOURNAMENTS[idx + 1];
    if (next && next.semester === 'Clausura 2026') return next.id;
    return null;
  };
})();
