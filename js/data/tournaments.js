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

  LAS.TOURNAMENTS = [
    {
      id: 'liga-profesional-2026',
      name: 'Liga Profesional',
      fullName: 'Liga Profesional Argentina 2026',
      season: '2026',
      country: 'Argentina',
      description: '30 clubes divididos en dos zonas, 15 fechas y playoffs con los cuatro mejores de cada zona.',
      format: 'groups_playoffs',
      rounds: 'single',
      points: { win: 3, draw: 1, loss: 0 },
      groups: [
        { name: 'Zona A', teamIds: ZONA_A },
        { name: 'Zona B', teamIds: ZONA_B }
      ],
      playoffs: {
        enabled: true,
        teamsPerGroup: 4,
        neutralFinal: true
      },
      internationalCups: {
        libertadores: 6,
        sudamericana: 6
      },
      ui: {
        roundLabel: 'Fecha',
        qualificationLabel: 'Playoffs'
      }
    },
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
      ui: {
        roundLabel: 'Fecha',
        qualificationLabel: 'Playoffs'
      }
    }
  ];

  LAS.getTournament = function (id) {
    return LAS.TOURNAMENTS.find((t) => t.id === id) || LAS.TOURNAMENTS[0];
  };
})();
