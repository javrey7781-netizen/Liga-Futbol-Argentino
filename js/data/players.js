/* ============================================================
   LigaSim Argentina — Planteles y goleadores
   ------------------------------------------------------------
   Los planteles son generados de forma determinística para cada
   club. Alcanza para que la tabla de goleadores tenga nombres
   estables y creíbles sin depender de datos externos.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  const FIRST_NAMES = [
    'Lucas', 'Matías', 'Nicolás', 'Santiago', 'Julián', 'Franco', 'Tomás',
    'Facundo', 'Gonzalo', 'Emiliano', 'Bruno', 'Agustín', 'Joaquín', 'Ramiro',
    'Ezequiel', 'Leandro', 'Maximiliano', 'Gastón', 'Iván', 'Federico', 'Alan',
    'Lautaro', 'Thiago', 'Valentín', 'Benjamín', 'Enzo', 'Exequiel', 'Hernán',
    'Marcos', 'Diego', 'Alejandro', 'Cristian', 'Damián', 'Rodrigo', 'Ulises'
  ];

  const LAST_NAMES = [
    'Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Gómez',
    'Díaz', 'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores',
    'Acosta', 'Benítez', 'Medina', 'Herrera', 'Aguirre', 'Pereyra', 'Giménez',
    'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez', 'Luna', 'Cabrera',
    'Vega', 'Ríos', 'Ferreyra', 'Cáceres', 'Villalba', 'Mansilla', 'Ojeda',
    'Correa', 'Zárate', 'Bustos', 'Quiroga', 'Barrios', 'Maldonado', 'Figueroa'
  ];

  const LAYOUT = [
    { pos: 'ARQ', number: 1 }, { pos: 'ARQ', number: 12 },
    { pos: 'DEF', number: 2 }, { pos: 'DEF', number: 3 }, { pos: 'DEF', number: 4 },
    { pos: 'DEF', number: 6 }, { pos: 'DEF', number: 13 }, { pos: 'DEF', number: 15 },
    { pos: 'MED', number: 5 }, { pos: 'MED', number: 8 }, { pos: 'MED', number: 10 },
    { pos: 'MED', number: 14 }, { pos: 'MED', number: 16 }, { pos: 'MED', number: 17 },
    { pos: 'DEL', number: 7 }, { pos: 'DEL', number: 9 }, { pos: 'DEL', number: 11 },
    { pos: 'DEL', number: 18 }
  ];

  const GOAL_WEIGHT = { DEL: 7, MED: 3, DEF: 1, ARQ: 0.03 };

  const cache = new Map();

  function buildSquad(teamId) {
    const rng = LAS.rng.createRng(LAS.rng.hashString('squad:' + teamId));
    const used = new Set();
    return LAYOUT.map((slot, index) => {
      let name;
      let guard = 0;
      do {
        name = FIRST_NAMES[rng.int(0, FIRST_NAMES.length - 1)][0] + '. ' +
          LAST_NAMES[rng.int(0, LAST_NAMES.length - 1)];
        guard++;
      } while (used.has(name) && guard < 80);
      used.add(name);
      return {
        id: teamId + '-p' + index,
        teamId,
        name,
        pos: slot.pos,
        number: slot.number,
        rating: rng.int(64, 86)
      };
    });
  }

  LAS.getSquad = function (teamId) {
    if (!cache.has(teamId)) cache.set(teamId, buildSquad(teamId));
    return cache.get(teamId);
  };

  LAS.pickScorer = function (teamId, rng) {
    const squad = LAS.getSquad(teamId);
    const total = squad.reduce((sum, p) => sum + (GOAL_WEIGHT[p.pos] || 1), 0);
    let roll = rng.next() * total;
    for (const player of squad) {
      roll -= GOAL_WEIGHT[player.pos] || 1;
      if (roll <= 0) return player;
    }
    return squad[squad.length - 1];
  };

  LAS.computeScorers = function (state) {
    const table = new Map();
    Object.values(state.results).forEach((result) => {
      (result.scorers || []).forEach((goal) => {
        let row = table.get(goal.playerId);
        if (!row) {
          row = { playerId: goal.playerId, name: goal.name, teamId: goal.teamId, goals: 0 };
          table.set(goal.playerId, row);
        }
        row.goals++;
      });
    });
    return Array.from(table.values()).sort(
      (a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'es')
    );
  };
})();
