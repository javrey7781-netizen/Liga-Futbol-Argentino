/* ============================================================
   LigaSim Argentina — Base de equipos
   ------------------------------------------------------------
   Para agregar un equipo nuevo alcanza con sumar un objeto acá
   y referenciar su id en js/data/tournaments.js.
   `rating` es la fuerza general (1-100) que usa el simulador.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  LAS.TEAMS = [
    { id: 'river-plate',          name: 'River Plate',             short: 'RIV', city: 'Buenos Aires',       stadium: 'Monumental',                    rating: 86, colors: ['#ffffff', '#d21f2c'] },
    { id: 'boca-juniors',         name: 'Boca Juniors',            short: 'BOC', city: 'Buenos Aires',       stadium: 'La Bombonera',                  rating: 85, colors: ['#10336b', '#f2b705'] },
    { id: 'racing-club',          name: 'Racing Club',             short: 'RAC', city: 'Avellaneda',         stadium: 'Presidente Perón',              rating: 84, colors: ['#6cb7e6', '#ffffff'] },
    { id: 'independiente',        name: 'Independiente',           short: 'IND', city: 'Avellaneda',         stadium: 'Libertadores de América',       rating: 82, colors: ['#d21f26', '#ffffff'] },
    { id: 'estudiantes',          name: 'Estudiantes (LP)',        short: 'EST', city: 'La Plata',           stadium: 'UNO',                           rating: 82, colors: ['#d21f26', '#ffffff'] },
    { id: 'velez',                name: 'Vélez Sarsfield',         short: 'VEL', city: 'Buenos Aires',       stadium: 'Amalfitani',                    rating: 82, colors: ['#ffffff', '#1b3f8b'] },
    { id: 'san-lorenzo',          name: 'San Lorenzo',             short: 'SLO', city: 'Buenos Aires',       stadium: 'Nuevo Gasómetro',               rating: 80, colors: ['#1b3f8b', '#c8102e'] },
    { id: 'talleres',             name: 'Talleres',                short: 'TAL', city: 'Córdoba',            stadium: 'Mario Kempes',                  rating: 80, colors: ['#1b3f8b', '#ffffff'] },
    { id: 'rosario-central',      name: 'Rosario Central',         short: 'CEN', city: 'Rosario',            stadium: 'Gigante de Arroyito',           rating: 80, colors: ['#1b3f8b', '#f2b705'] },
    { id: 'lanus',                name: 'Lanús',                   short: 'LAN', city: 'Lanús',              stadium: 'Ciudad de Lanús',               rating: 79, colors: ['#7a1f2b', '#ffffff'] },
    { id: 'argentinos',           name: 'Argentinos Juniors',      short: 'ARG', city: 'Buenos Aires',       stadium: 'Diego Maradona',                rating: 78, colors: ['#c8102e', '#ffffff'] },
    { id: 'huracan',              name: 'Huracán',                 short: 'HUR', city: 'Buenos Aires',       stadium: 'Tomás Ducó',                    rating: 78, colors: ['#ffffff', '#d21f26'] },
    { id: 'newells',              name: "Newell's Old Boys",       short: 'NOB', city: 'Rosario',            stadium: 'Marcelo Bielsa',                rating: 77, colors: ['#c8102e', '#000000'] },
    { id: 'defensa-justicia',     name: 'Defensa y Justicia',      short: 'DEF', city: 'Florencio Varela',   stadium: 'Norberto Tomaghello',           rating: 77, colors: ['#1f7a3f', '#f2b705'] },
    { id: 'godoy-cruz',           name: 'Godoy Cruz',              short: 'GOD', city: 'Mendoza',            stadium: 'Malvinas Argentinas',           rating: 76, colors: ['#1b3f8b', '#ffffff'] },
    { id: 'union',                name: 'Unión',                   short: 'UNI', city: 'Santa Fe',           stadium: '15 de Abril',                   rating: 76, colors: ['#c8102e', '#ffffff'] },
    { id: 'tigre',                name: 'Tigre',                   short: 'TIG', city: 'Victoria',           stadium: 'José Dellagiovanna',            rating: 75, colors: ['#c8102e', '#1b3f8b'] },
    { id: 'belgrano',             name: 'Belgrano',                short: 'BEL', city: 'Córdoba',            stadium: 'Gigante de Alberdi',            rating: 75, colors: ['#6cb7e6', '#ffffff'] },
    { id: 'instituto',            name: 'Instituto',               short: 'INS', city: 'Córdoba',            stadium: 'Monumental Alta Córdoba',       rating: 74, colors: ['#c8102e', '#ffffff'] },
    { id: 'gimnasia',             name: 'Gimnasia (LP)',           short: 'GIM', city: 'La Plata',           stadium: 'Juan Carmelo Zerillo',          rating: 74, colors: ['#ffffff', '#1b3f8b'] },
    { id: 'banfield',             name: 'Banfield',                short: 'BAN', city: 'Banfield',           stadium: 'Florencio Sola',                rating: 73, colors: ['#1f7a3f', '#ffffff'] },
    { id: 'atletico-tucuman',     name: 'Atlético Tucumán',        short: 'ATU', city: 'San Miguel de Tucumán', stadium: 'José Fierro',                rating: 73, colors: ['#6cb7e6', '#ffffff'] },
    { id: 'independiente-rivadavia', name: 'Independiente Rivadavia', short: 'IRV', city: 'Mendoza',         stadium: 'Bautista Gargantini',           rating: 73, colors: ['#1b3f8b', '#ffffff'] },
    { id: 'barracas-central',     name: 'Barracas Central',        short: 'BAR', city: 'Buenos Aires',       stadium: 'Claudio Chiqui Tapia',          rating: 72, colors: ['#c8102e', '#ffffff'] },
    { id: 'platense',             name: 'Platense',                short: 'PLA', city: 'Vicente López',      stadium: 'Ciudad de Vicente López',       rating: 72, colors: ['#6b4a2f', '#ffffff'] },
    { id: 'central-cordoba',      name: 'Central Córdoba (SdE)',   short: 'CCO', city: 'Santiago del Estero', stadium: 'Único Madre de Ciudades',      rating: 72, colors: ['#000000', '#ffffff'] },
    { id: 'sarmiento',            name: 'Sarmiento',               short: 'SAR', city: 'Junín',              stadium: 'Eva Perón',                     rating: 71, colors: ['#1f7a3f', '#ffffff'] },
    { id: 'san-martin-sj',        name: 'San Martín (SJ)',         short: 'SMJ', city: 'San Juan',           stadium: 'Hilario Sánchez',               rating: 71, colors: ['#1f7a3f', '#000000'] },
    { id: 'aldosivi',             name: 'Aldosivi',                short: 'ALD', city: 'Mar del Plata',      stadium: 'José María Minella',            rating: 70, colors: ['#f2b705', '#1f7a3f'] },
    { id: 'riestra',              name: 'Deportivo Riestra',       short: 'RIE', city: 'Buenos Aires',       stadium: 'Guillermo Laza',                rating: 70, colors: ['#ffffff', '#000000'] }
  ];

  LAS.TEAM_MAP = Object.fromEntries(LAS.TEAMS.map((t) => [t.id, t]));

  /* Sesgo fijo de ataque/defensa por equipo (determinístico, para que
     dos equipos con igual rating no sean idénticos). */
  const biasCache = new Map();
  LAS.getTeamBias = function (teamId) {
    if (biasCache.has(teamId)) return biasCache.get(teamId);
    const rng = LAS.rng.createRng(LAS.rng.hashString('bias:' + teamId));
    const bias = { atk: rng.int(-4, 4), def: rng.int(-4, 4) };
    biasCache.set(teamId, bias);
    return bias;
  };

  /* Devuelve el equipo con los cambios que haya hecho el usuario. */
  LAS.resolveTeam = function (state, teamId) {
    const base = LAS.TEAM_MAP[teamId];
    if (!base) return null;
    const override = (state && state.teams && state.teams[teamId]) || {};
    const bias = LAS.getTeamBias(teamId);

    const text = (value, fallback) => {
      const str = value == null ? '' : String(value).trim();
      return str || fallback;
    };
    const rating = Number(override.rating);
    const colors = Array.isArray(override.colors) ? override.colors : base.colors;

    return Object.assign({}, base, override, {
      name: text(override.name, base.name),
      short: text(override.short, base.short).slice(0, 4).toUpperCase(),
      city: text(override.city, base.city),
      stadium: text(override.stadium, base.stadium),
      rating: Number.isFinite(rating) ? Math.max(1, Math.min(99, rating)) : base.rating,
      colors: [
        String(colors[0] || base.colors[0]),
        String(colors[1] || base.colors[1])
      ],
      atkBonus: bias.atk,
      defBonus: bias.def
    });
  };

  LAS.resolveTeams = function (state) {
    const map = {};
    LAS.TEAMS.forEach((t) => {
      map[t.id] = LAS.resolveTeam(state, t.id);
    });
    return map;
  };
})();
