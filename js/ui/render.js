/* ============================================================
   LigaSim Argentina — Renderizado de vistas
   ------------------------------------------------------------
   Todo se arma desde el estado + configuración del torneo.
   No hay HTML de negocio duplicado en index.html.
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});
  const esc = LAS.dom.esc;
  const badge = LAS.dom.badge;
  const icon = LAS.dom.icon;

  function resolve(ctx, teamId) {
    return LAS.resolveTeam(ctx.state, teamId);
  }

  function regularMatches(ctx) {
    return LAS.fixtures.allMatches(ctx.fixtures);
  }

  function playedRegular(ctx) {
    return regularMatches(ctx).filter((match) => !!ctx.state.results[match.id]).length;
  }

  function championOf(ctx) {
    return ctx.playoffs && ctx.playoffs.champion ? resolve(ctx, ctx.playoffs.champion) : null;
  }

  function pct(value, total) {
    return total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  }

  function roundLabel(ctx) {
    return (ctx.tournament.ui && ctx.tournament.ui.roundLabel) || 'Fecha';
  }

  function qualificationLabel(ctx) {
    return (ctx.tournament.ui && ctx.tournament.ui.qualificationLabel) || 'Playoffs';
  }

  function formChips(form) {
    if (!form || !form.length) return '<span class="muted">—</span>';
    return form.map((result) => {
      const cls = result === 'G' ? 'w' : result === 'P' ? 'l' : 'd';
      return '<i class="' + cls + '">' + result + '</i>';
    }).join('');
  }

  /* ----------------------------- Header ----------------------------- */
  function renderHeader(ctx) {
    try {
      const select = document.getElementById('tournament-select');
      if (select) select.value = ctx.tournament.id;

      const themeButton = document.getElementById('theme-toggle');
      if (themeButton) {
        themeButton.innerHTML = icon(ctx.state.theme === 'dark' ? 'sun' : 'moon', 18);
        themeButton.setAttribute('aria-label', ctx.state.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        themeButton.setAttribute('title', ctx.state.theme === 'dark' ? 'Tema claro' : 'Tema oscuro');
      }

      const eyebrow = document.getElementById('hero-eyebrow');
      if (eyebrow) eyebrow.textContent = 'Simulador · Temporada ' + ctx.tournament.season;
    } catch (error) {
      console.error('Error renderizando header:', error);
    }
  }

  /* ------------------------------ Hero ------------------------------ */
  function renderHero(ctx) {
    try {
      const champion = championOf(ctx);
      const total = regularMatches(ctx).length;
      const played = playedRegular(ctx);
      const teamCount = ctx.tournament.groups.reduce((sum, group) => sum + group.teamIds.length, 0);

      const stats = [
        { value: teamCount, label: 'Equipos' },
        { value: ctx.fixtures.length, label: 'Fechas' },
        champion
          ? { value: champion.short, label: 'Campeón' }
          : { value: played, label: 'Jugados' }
      ];

      const statsEl = document.getElementById('hero-stats');
      if (statsEl) {
        statsEl.innerHTML = stats.map((stat) =>
          '<div class="stat"><b>' + esc(stat.value) + '</b><span>' + esc(stat.label) + '</span></div>'
        ).join('');
      }

      const nuevaBtn = document.getElementById('hero-nueva-btn');
      const cargarBtn = document.getElementById('hero-cargar-btn');

      if (nuevaBtn) {
        nuevaBtn.textContent = 'Nueva Temporada';
        nuevaBtn.dataset.action = 'nueva-temporada';
      }

      if (cargarBtn) {
        cargarBtn.textContent = 'Cargar Temporada';
        cargarBtn.dataset.action = 'cargar-temporada';
      }
    } catch (error) {
      console.error('Error renderizando hero:', error);
    }
  }

  /* --------------------------- Match rows --------------------------- */
  function matchRow(ctx, match) {
    const result = ctx.state.results[match.id];
    const home = resolve(ctx, match.home);
    const away = resolve(ctx, match.away);
    const playoff = match.id.indexOf('po-') === 0;

    const seedHome = playoff && match.homeLabel ? '<span class="seed">' + esc(match.homeLabel) + '</span>' : '';
    const seedAway = playoff && match.awayLabel ? '<span class="seed">' + esc(match.awayLabel) + '</span>' : '';

    const score = manualScoreHtml(match, playoff, result);

    const action = '<div class="match-actions">' +
        '<button type="button" class="mini-btn" data-sim-match="' + match.id + '" title="Simular partido" aria-label="Simular ' +
          esc(home.name) + ' contra ' + esc(away.name) + '">' + icon('play', 11) + '</button>' +
        '<span class="check ' + (result && result.manual ? 'check--manual' : '') + '" title="' +
          (result ? (result.manual ? 'Resultado cargado a mano - editable' : 'Partido simulado - editable') : 'Sin resultado') + '">' +
          (result ? (result.manual ? icon('edit', 11) : icon('check', 11)) : icon('edit', 11)) + '</span>' +
      '</div>';

    return '<div class="match ' + (result ? 'is-played' : '') + '" data-match-id="' + match.id + '">' +
      '<div class="team team--home">' + badge(home) + seedHome + '<span class="team-name">' + esc(home.name) + '</span></div>' +
      '<div class="score-wrap">' + score + '</div>' +
      '<div class="team team--away"><span class="team-name">' + esc(away.name) + '</span>' + seedAway + badge(away) + '</div>' +
      '<div class="match-action">' + action + '</div>' +
    '</div>';
  }

  function matchCard(ctx, options) {
    const matches = options.matches;
    const played = matches.filter((match) => !!ctx.state.results[match.id]).length;
    const total = matches.length;
    let list = '';
    let lastGroup = null;

    matches.forEach((match) => {
      if (options.showGroup && match.groupIndex !== lastGroup) {
        list += '<div class="zone-label">' + esc(match.group) + '</div>';
        lastGroup = match.groupIndex;
      }
      list += matchRow(ctx, match);
    });

    return '<section class="card card--matches">' +
      '<div class="card-head">' +
        '<div><span class="eyebrow">' + esc(options.eyebrow) + '</span><h3>' + esc(options.title) + '</h3></div>' +
        '<div class="card-tools">' +
          '<span class="pill">' + played + '/' + total + ' jugados</span>' +
          (options.actions || '') +
        '</div>' +
      '</div>' +
      '<div class="progress"><span style="width:' + pct(played, total) + '%"></span></div>' +
      '<div class="match-list">' + list + '</div>' +
    '</section>';
  }

  /* --------------------------- Dashboard ---------------------------- */
  function renderDashboard(ctx) {
    try {
      const champion = championOf(ctx);
      const banner = document.getElementById('champion-banner');

      if (banner) {
        banner.innerHTML = champion
          ? '<div class="champion-banner">' +
              '<div class="champion-banner-badge">' + badge(champion, 'badge--xl') + '</div>' +
              '<div class="champion-banner-copy">' +
                '<span class="eyebrow">Campeón ' + esc(ctx.tournament.season) + '</span>' +
                '<h2>' + esc(champion.name) + '</h2>' +
                '<p>' + esc(ctx.tournament.fullName) + '</p>' +
              '</div>' +
              '<div class="champion-banner-actions">' +
                '<a class="btn btn-ghost btn-sm" href="#playoffs">Ver playoffs</a>' +
                '<button type="button" class="btn btn-primary btn-sm" data-action="new-tournament">Otro torneo</button>' +
              '</div>' +
            '</div>'
          : '';
      }

      const dash = document.getElementById('dash-matches');
      if (!dash) return;

      /* Portada limpia: solo se muestra contenido cuando hay campeón o playoffs */
      if (champion) {
        dash.innerHTML = '<section class="card">' +
          '<div class="card-head"><div><span class="eyebrow">Temporada ' + esc(ctx.tournament.season) + '</span><h3>Temporada finalizada</h3></div>' +
          '<span class="pill pill--gold">' + esc(champion.name) + '</span></div>' +
          '<div class="card-cta">' +
            '<a class="btn btn-primary btn-sm" href="#playoffs">Ver playoffs</a>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="new-tournament">Jugar otro torneo</button>' +
          '</div>' +
        '</section>';
      } else if (ctx.playoffs) {
        const pendingRound = ctx.playoffs.rounds.find((round) =>
          round.matches.some((match) => !ctx.state.results[match.id])
        ) || ctx.playoffs.rounds[ctx.playoffs.rounds.length - 1];

        dash.innerHTML = matchCard(ctx, {
          eyebrow: 'Fase final',
          title: pendingRound.name,
          matches: pendingRound.matches,
          showGroup: false,
          actions: '<button type="button" class="btn btn-primary btn-sm" data-action="sim-playoffs">Simular ' +
            esc(pendingRound.name.toLowerCase()) + '</button>'
        });
      } else {
        // Portada vacía: solo se muestran los botones del hero
        dash.innerHTML = '';
      }
    } catch (error) {
      console.error('Error renderizando dashboard:', error);
    }
  }

  function countPlayoffMatches(ctx) {
    if (!ctx.playoffs) return 0;
    return ctx.playoffs.rounds.reduce((sum, round) => sum + round.matches.length, 0);
  }

  function miniTable(ctx, group) {
    try {
      const rows = group.rows.slice(0, 6).map((row) => {
        const team = resolve(ctx, row.teamId);
        return '<tr class="' + (row.qualified ? 'is-qualified' : '') + '">' +
          '<td class="pos">' + row.rank + '</td>' +
          '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
          '<td>' + row.pj + '</td>' +
          '<td>' + (row.dg > 0 ? '+' : '') + row.dg + '</td>' +
          '<td class="pts">' + row.pts + '</td>' +
        '</tr>';
      }).join('');

      return '<section class="card">' +
        '<div class="card-head"><div><span class="eyebrow">' + esc(group.name) + '</span><h3>Tabla</h3></div>' +
        '<a class="text-link" href="#tabla">Ver completa</a></div>' +
        '<div class="table-wrap"><table class="standings standings--mini">' +
        '<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DIF</th><th>PTS</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</section>';
    } catch (error) {
      console.error('Error renderizando mini tabla:', error);
      return '';
    }
  }

  /* ----------------------------- Fixture ---------------------------- */
  function renderFixture(ctx) {
    try {
      const container = document.getElementById('fixture-content');
      if (!container) return;

      // Actualizar título del page-head con el torneo actual
      const fixtureHead = document.querySelector('#view-fixture .page-head h2');
      if (fixtureHead) {
        const semestre = ctx.tournament.semester ? ctx.tournament.semester.split(' ')[0] : '';
        const torneoLabel = semestre ? 'Torneo ' + semestre : '';
        fixtureHead.textContent = torneoLabel ? 'Fixture y resultados - ' + torneoLabel : 'Fixture y resultados';
      }

      const next = LAS.fixtures.nextRound(ctx.fixtures, ctx.state.results);
      const selected = ctx.ui.fixtureRound || (next ? next.number : ctx.fixtures.length);
      const round = ctx.fixtures[selected - 1];
      if (!round) return;

      const played = round.matches.filter((match) => !!ctx.state.results[match.id]).length;
      const totalRegular = regularMatches(ctx).length;

      const nav = ctx.fixtures.map((item) => {
        const done = item.matches.every((match) => !!ctx.state.results[match.id]);
        const isNext = next && item.number === next.number;
        return '<button type="button" class="round-pill ' + (item.number === selected ? 'is-active ' : '') +
          (done ? 'is-done ' : '') + (isNext ? 'is-next' : '') +
          '" data-round="' + item.number + '" title="' + roundLabel(ctx) + ' ' + item.number + '">' +
          item.number + '</button>';
      }).join('');

      let list = '';
      let lastGroup = null;
      round.matches.forEach((match) => {
        if (match.groupIndex !== lastGroup) {
          list += '<div class="zone-label">' + esc(match.group) + '</div>';
          lastGroup = match.groupIndex;
        }
        list += matchRow(ctx, match);
      });

      const allRounds = ctx.fixtures.map((item) => {
        const itemPlayed = item.matches.filter((match) => !!ctx.state.results[match.id]).length;
        return '<div class="round-card">' +
          '<div class="round-card-head"><b>' + roundLabel(ctx) + ' ' + item.number + '</b>' +
          '<span>' + itemPlayed + '/' + item.matches.length + '</span></div>' +
          item.matches.map((match) => {
            const result = ctx.state.results[match.id];
            const home = resolve(ctx, match.home);
            const away = resolve(ctx, match.away);
            return '<div class="compact-match" title="' + esc(home.name) + ' vs ' + esc(away.name) + '">' +
              '<span class="compact-team">' + esc(home.short) + '</span>' +
              '<span class="compact-score">' + (result ? result.homeGoals + '-' + result.awayGoals : '–') + '</span>' +
              '<span class="compact-team">' + esc(away.short) + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      }).join('');

      container.innerHTML =
        '<div class="round-nav">' + nav + '</div>' +
        '<section class="card card--matches">' +
          '<div class="card-head">' +
            '<div><span class="eyebrow">' + roundLabel(ctx) + ' ' + selected + ' de ' + ctx.fixtures.length + ' · ' + esc(ctx.tournament.fullName) + '</span><h3>Fixture y resultados</h3></div>' +
            '<div class="card-tools">' +
              '<span class="pill">' + played + '/' + round.matches.length + ' jugados</span>' +
              '<button type="button" class="btn btn-primary btn-sm" data-sim-round="' + selected + '">Simular ' + esc(roundLabel(ctx).toLowerCase()) + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="progress"><span style="width:' + pct(played, round.matches.length) + '%"></span></div>' +
          '<div class="match-list">' + list + '</div>' +
        '</section>' +
        '<details class="all-rounds">' +
          '<summary>Calendario completo <span class="pill">' + totalRegular + ' partidos</span></summary>' +
          '<div class="all-rounds-grid">' + allRounds + '</div>' +
        '</details>';
    } catch (error) {
      console.error('Error renderizando fixture:', error);
    }
  }

  /* ----------------------------- Tabla ------------------------------ */
  function renderStandings(ctx) {
    try {
      const container = document.getElementById('standings-content');
      if (!container) return;

      const tableAnnual = ctx.state.tableAnnual || [];
      const rawChampions = ctx.state.semesterChampions || {};
      const champions = {
        apertura: rawChampions['liga-apertura-2026'],
        clausura: rawChampions['liga-clausura-2026'],
        copaArgentina: ctx.state.copaChampion
      };
      const cups = LAS.standings.computeInternationalCups(tableAnnual, champions);
      const libSet = new Set(cups.libertadores.map((c) => c.teamId));
      const sudSet = new Set(cups.sudamericana.map((c) => c.teamId));

      const cupBadge = (teamId) => {
        if (libSet.has(teamId)) return '<span class="cup cup--lib">L</span>';
        if (sudSet.has(teamId)) return '<span class="cup cup--sud">S</span>';
        return '';
      };

      const tables = ctx.standings.map((group) => {
        const rows = group.rows.map((row) => {
          const team = resolve(ctx, row.teamId);
          return '<tr class="' + (row.qualified ? 'is-qualified' : '') + '">' +
            '<td class="pos">' + row.rank + '</td>' +
            '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span>' + cupBadge(row.teamId) + '</td>' +
            '<td>' + row.pj + '</td>' +
            '<td>' + row.pg + '</td>' +
            '<td>' + row.pe + '</td>' +
            '<td>' + row.pp + '</td>' +
            '<td>' + row.gf + '</td>' +
            '<td>' + row.gc + '</td>' +
            '<td>' + (row.dg > 0 ? '+' : '') + row.dg + '</td>' +
            '<td class="pts">' + row.pts + '</td>' +
            '<td><span class="form">' + formChips(row.form) + '</span></td>' +
          '</tr>';
        }).join('');

        const legend = group.qualifiers
          ? '<div class="table-legend"><span class="legend-dot"></span> Los primeros ' + group.qualifiers +
            ' clasifican a ' + esc(qualificationLabel(ctx)) + '.</div>'
          : '';

        return '<section class="card">' +
          '<div class="card-head">' +
            '<div><span class="eyebrow">' + esc(group.name) + '</span><h3>Tabla de posiciones</h3></div>' +
            '<span class="pill">' + group.played + '/' + group.total + ' partidos</span>' +
          '</div>' +
          '<div class="table-wrap"><table class="standings">' +
          '<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th><th>Últimos 5</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
          '</table></div>' + legend +
        '</section>';
      }).join('');

      const scorers = LAS.computeScorers(ctx.state).slice(0, 20);
      const scorerRows = scorers.map((row, index) => {
        const team = resolve(ctx, row.teamId);
        return '<tr>' +
          '<td class="pos">' + (index + 1) + '</td>' +
          '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(row.name) + '</span></span></td>' +
          '<td class="muted-cell">' + esc(team.name) + '</td>' +
          '<td class="pts">' + row.goals + '</td>' +
        '</tr>';
      }).join('');
      const annualTableData = ctx.state.tableAnnual || [];
      const hasTableAnnualData = annualTableData.length > 0;

      let annualRows = '';
      if (hasTableAnnualData) {
        annualRows = annualTableData.map((row, index) => {
          const team = resolve(ctx, row.teamId);
          return '<tr>' +
            '<td class="pos">' + row.rank + '</td>' +
            '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
            '<td>' + row.pj + '</td>' +
            '<td>' + row.pg + '</td>' +
            '<td>' + row.pe + '</td>' +
            '<td>' + row.pp + '</td>' +
            '<td>' + row.gf + '</td>' +
            '<td>' + row.gc + '</td>' +
            '<td>' + (row.dg > 0 ? '+' : '') + row.dg + '</td>' +
            '<td class="pts">' + row.pts + '</td>' +
          '</tr>';
        }).join('');
      } else {
        annualRows = '<tr><td colspan="11" class="muted-cell">Simulá partidos para ver la tabla anual acumulada.</td></tr>';
      }

      container.innerHTML =
        '<section class="card relegation-card">' +
          '<div class="card-head"><div><span class="eyebrow">Tabla Anual Acumulada</span><h3>Posiciones del Año</h3></div>' +
          '<span class="pill">' + annualTableData.length + ' equipos</span></div>' +
          '<div class="table-wrap"><table class="standings relegation-table">' +
          '<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th></tr></thead>' +
          '<tbody>' + annualRows + '</tbody>' +
          '</table></div>' +
        '</section>' +
        '<section class="card scorers-card">' +
          '<div class="card-head"><div><span class="eyebrow">Goleadores</span><h3>Tabla de artilleros</h3></div>' +
          '<span class="pill">' + scorers.length + ' jugadores</span></div>' +
          (scorers.length
            ? '<div class="table-wrap"><table class="standings scorers-table">' +
                '<thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead>' +
                '<tbody>' + scorerRows + '</tbody>' +
              '</table></div>'
            : '<p class="muted">Todavía no hay goles en el torneo.</p>') +
        '</section>';
    } catch (error) {
      console.error('Error renderizando tabla:', error);
    }
  }

  function cupsSectionHtml(ctx, cups) {
    if (!ctx.tournament.internationalCups) return '';

    const libRows = cups.libertadores.map((c, i) => {
      const team = resolve(ctx, c.teamId);
      return '<tr>' +
        '<td class="pos">' + (i + 1) + '</td>' +
        '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
        '<td class="pts cup-reason">' + (c.reason === 'Campeón' ? 'Campeón' : 'Tabla anual') + '</td>' +
      '</tr>';
    }).join('');

    const sudRows = cups.sudamericana.map((c, i) => {
      const team = resolve(ctx, c.teamId);
      return '<tr>' +
        '<td class="pos">' + (i + 1) + '</td>' +
        '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
        '<td class="pts cup-reason">' + (c.reason === 'Campeón' ? 'Campeón' : 'Tabla anual') + '</td>' +
      '</tr>';
    }).join('');

    return '<section class="card cups-card">' +
      '<div class="card-head"><div><span class="eyebrow">Copas internacionales</span><h3>Clasificaciones</h3></div></div>' +
      '<div class="cups-grid">' +
      '<div class="cup-group cup-group--lib">' +
        '<h4>' + icon('trophy', 16) + ' Copa Libertadores</h4>' +
        '<div class="table-wrap"><table class="standings cups-table">' +
        '<thead><tr><th>#</th><th>Equipo</th><th>Clasificación</th></tr></thead>' +
        '<tbody>' + (libRows || '<tr><td colspan="3" class="muted-cell">Sin clasificados aún</td></tr>') + '</tbody>' +
        '</table></div>' +
      '</div>' +
      '<div class="cup-group cup-group--sud">' +
        '<h4>' + icon('trophy', 16) + ' Copa Sudamericana</h4>' +
        '<div class="table-wrap"><table class="standings cups-table">' +
        '<thead><tr><th>#</th><th>Equipo</th><th>Clasificación</th></tr></thead>' +
        '<tbody>' + (sudRows || '<tr><td colspan="3" class="muted-cell">Sin clasificados aún</td></tr>') + '</tbody>' +
        '</table></div>' +
      '</div>' +
      '</div>' +
    '</section>';
  }

  function renderRelegationHtml(ctx, cups) {
    const rel = ctx.tournament.relegation;
    if (!rel || !rel.enabled) return '';

    const relegation = LAS.standings.computeRelegation(ctx.state, ctx.tournament, ctx.standings);
    if (!relegation || !relegation.teams.length) return '';

    const desc = new Set(relegation.teams.map((t) => t.teamId));

    const rows = relegation.allAverages.map((r) => {
      const team = resolve(ctx, r.teamId);
      const willDescend = desc.has(r.teamId);
      return '<tr class="' + (willDescend ? 'is-relegated' : '') + '">' +
        '<td class="pos">' + (r.pts === 0 && r.pj === 0 ? '—' : relegation.allAverages.indexOf(r) + 1) + '</td>' +
        '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span>' +
        (willDescend ? '<span class="cup cup--desc">D</span>' : '') + '</td>' +
        '<td>' + r.pj + '</td>' +
        '<td>' + r.pts + '</td>' +
        '<td class="pts">' + r.avg.toFixed(3) + '</td>' +
      '</tr>';
    }).join('');

    return '<section class="card relegation-card">' +
      '<div class="card-head"><div><span class="eyebrow">Promedios y descensos</span><h3>Tabla de promedios (últimos ' + rel.years + ' años)</h3></div>' +
      '<span class="pill">' + rel.teams.length + ' descienden</span></div>' +
      '<div class="table-wrap"><table class="standings relegation-table">' +
      '<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>Pts</th><th>Promedio</th><th>Estado</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</section>';
  }

  /* ---------------------------- Playoffs ---------------------------- */
  function renderPlayoffs(ctx) {
    try {
      const container = document.getElementById('playoffs-content');
      if (!container) return;

      if (!ctx.tournament.playoffs || !ctx.tournament.playoffs.enabled) {
        container.innerHTML = '<section class="card empty-state">' +
          '<div class="empty-icon">' + icon('trophy', 40) + '</div>' +
          '<h3>Este torneo no tiene fase final</h3>' +
          '<p>Se define por la tabla de posiciones de la fase regular.</p>' +
        '</section>';
        return;
      }

      if (!ctx.playoffs) {
        const total = regularMatches(ctx).length;
        const played = playedRegular(ctx);
        const remaining = total - played;
        container.innerHTML = '<section class="card empty-state">' +
          '<div class="empty-icon">' + icon('trophy', 42) + '</div>' +
          '<h3>La fase final todavía no arrancó</h3>' +
          '<p>Cuando terminen los ' + total + ' partidos de la fase regular se armará el bracket con los mejores de cada zona.</p>' +
          '<div class="progress progress--wide"><span style="width:' + pct(played, total) + '%"></span></div>' +
          '<p class="muted">' + played + ' de ' + total + ' partidos jugados · faltan ' + remaining + '.</p>' +
          '<div class="card-cta">' +
            '<button type="button" class="btn btn-primary btn-sm" data-action="sim-remaining">Simular lo que resta</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="sim-season">Simular temporada completa</button>' +
          '</div>' +
        '</section>';
        return;
      }

      const champion = championOf(ctx);
      const bracket = ctx.playoffs.rounds.map((round) =>
        '<div class="bracket-col">' +
          '<div class="bracket-col-head"><h4>' + esc(round.name) + '</h4><span>' + round.matches.length + ' partido(s)</span></div>' +
          round.matches.map((match) => bracketMatch(ctx, match)).join('') +
        '</div>'
      ).join('');

      const championCard = champion
        ? '<section class="champion-card">' +
            '<div class="champion-glow"></div>' +
            '<div class="champion-trophy">' + icon('trophy', 54) + '</div>' +
            '<span class="eyebrow">Campeón ' + esc(ctx.tournament.season) + '</span>' +
            '<div class="champion-team">' + badge(champion, 'badge--xl') + '<h2>' + esc(champion.name) + '</h2></div>' +
            '<p>' + esc(ctx.tournament.fullName) + '</p>' +
            '<div class="card-cta">' +
              '<button type="button" class="btn btn-primary btn-sm" data-action="new-tournament">Jugar otro torneo</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-action="export">Exportar partida</button>' +
            '</div>' +
          '</section>'
        : '';

      container.innerHTML = championCard +
        '<div class="playoffs-head">' +
          '<div><span class="eyebrow">Fase final</span><h3>' + (champion ? 'Camino al título' : 'Bracket') + '</h3></div>' +
          '<div class="card-tools">' +
            '<span class="pill pill--gold">' + (champion ? 'Campeón definido' : 'En juego') + '</span>' +
            (champion
              ? '<button type="button" class="btn btn-ghost btn-sm" data-action="new-tournament">Nuevo torneo</button>'
              : '<button type="button" class="btn btn-primary btn-sm" data-action="sim-playoffs">Simular pendientes</button>') +
          '</div>' +
        '</div>' +
        '<div class="bracket bracket--' + ctx.playoffs.rounds.length + '" style="--cols:' +
          ctx.playoffs.rounds.length + '">' + bracket + '</div>';
    } catch (error) {
      console.error('Error renderizando playoffs:', error);
    }
  }

  function manualScoreHtml(match, playoff, result) {
    try {
      const hg = result ? result.homeGoals : 0;
      const ag = result ? result.awayGoals : 0;
      let html = '<div class="manual-combos">' +
        '<input type="number" id="manual-home-' + match.id + '" class="manual-input" data-match-id="' + match.id + '" min="0" max="9" step="1" value="' + hg + '" aria-label="Goles local">' +
        '<span class="manual-sep">:</span>' +
        '<input type="number" id="manual-away-' + match.id + '" class="manual-input" data-match-id="' + match.id + '" min="0" max="9" step="1" value="' + ag + '" aria-label="Goles visitante">';
      // En playoffs los penales se muestran siempre que el partido esté sin
      // jugar (para poder cargar un empate a mano) o cuando ya hubo penales.
      if (playoff && (!result || result.penalties)) {
        const ph = result && result.penalties ? result.penalties.home : 0;
        const pa = result && result.penalties ? result.penalties.away : 0;
        html += '<span class="manual-sep">-</span>' +
          '<input type="number" id="manual-pen-home-' + match.id + '" class="manual-input manual-input--pen" data-match-id="' + match.id + '" min="0" max="20" step="1" value="' + ph + '" aria-label="Penales local">' +
          '<span class="manual-sep">-</span>' +
          '<input type="number" id="manual-pen-away-' + match.id + '" class="manual-input manual-input--pen" data-match-id="' + match.id + '" min="0" max="20" step="1" value="' + pa + '" aria-label="Penales visitante">';
      }
      html += '</div>';
      return html;
    } catch (error) {
      console.error('Error en manualScoreHtml:', error);
      return '<div class="manual-combos"></div>';
    }
  }

  function bracketMatch(ctx, match) {
    try {
      const result = ctx.state.results[match.id];
      const home = resolve(ctx, match.home);
      const away = resolve(ctx, match.away);
      const homeWon = result && result.winner === match.home;
      const awayWon = result && result.winner === match.away;

      return '<div class="bracket-match ' + (match.isFinal ? 'is-final' : '') + (result ? ' is-played' : '') + '" data-match-id="' + match.id + '">' +
        '<div class="bracket-match-head">' +
          '<span>' + esc(match.homeLabel) + ' · ' + esc(match.awayLabel) + '</span>' +
          (match.isFinal ? '<span class="pill pill--gold">Final</span>' : '') +
        '</div>' +
        manualScoreHtml(match, true, result) +
        '<div class="bracket-team ' + (homeWon ? 'is-winner' : '') + '">' + badge(home, 'badge--xs') +
          '<span>' + esc(home.name) + '</span><b>' + (result ? result.homeGoals : '–') + '</b></div>' +
        '<div class="bracket-team ' + (awayWon ? 'is-winner' : '') + '">' + badge(away, 'badge--xs') +
          '<span>' + esc(away.name) + '</span><b>' + (result ? result.awayGoals : '–') + '</b></div>' +
        (result && result.penalties
          ? '<div class="bracket-pen">Penales ' + result.penalties.home + ' - ' + result.penalties.away + '</div>'
          : '') +
        '<div class="bracket-actions">' +
          '<button type="button" class="mini-btn bracket-play" data-sim-match="' + match.id + '" title="Simular partido">' +
            icon('play', 11) + '<span>Simular</span></button>' +
          '<span class="check ' + (result && result.manual ? 'check--manual' : '') + '" title="' +
            (result ? (result.manual ? 'Resultado cargado a mano - editable' : 'Partido simulado - editable') : 'Sin resultado') + '">' +
            (result ? (result.manual ? icon('edit', 11) : icon('check', 11)) : icon('edit', 11)) + '</span>' +
        '</div>' +
      '</div>';
    } catch (error) {
      console.error('Error renderizando bracketMatch:', error);
      return '';
    }
  }

  /* ----------------------------- Equipos ---------------------------- */
  /* ---------------------------- Copa Argentina ---------------------------- */
  /* ---------------------------- Tabla Anual ---------------------------- */
  function renderTableAntigua(ctx) {
    try {
      const container = document.getElementById('table-annual-content');
      if (!container) return;

      const tableAnnual = ctx.state.tableAnnual || [];
      const champions = {
        apertura: (ctx.state.semesterChampions || {})['liga-apertura-2026'],
        clausura: (ctx.state.semesterChampions || {})['liga-clausura-2026'],
        copaArgentina: ctx.state.copaChampion
      };
      const cups = LAS.standings.computeInternationalCups(tableAnnual, champions);
      const libSet = new Set(cups.libertadores.map((c) => c.teamId));
      const sudSet = new Set(cups.sudamericana.map((c) => c.teamId));
      const hasData = tableAnnual.length > 0;

      const libRows = (cups.libertadores.length ? cups.libertadores.map((c, i) => {
        const team = resolve(ctx, c.teamId);
        const row = tableAnnual.find((r) => r.teamId === c.teamId);
        return '<tr>' +
          '<td class="pos">' + (i + 1) + '</td>' +
          '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
          '<td>' + (row ? row.pts : '-') + '</td>' +
          '<td>' + (row ? row.dg : '-') + '</td>' +
          '<td class="pts cup-reason">' + c.reason + '</td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="5" class="muted-cell">Sin clasificados aún</td></tr>');

      const sudRows = (cups.sudamericana.length ? cups.sudamericana.map((c, i) => {
        const team = resolve(ctx, c.teamId);
        const row = tableAnnual.find((r) => r.teamId === c.teamId);
        return '<tr>' +
          '<td class="pos">' + (i + 1) + '</td>' +
          '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span></td>' +
          '<td>' + (row ? row.pts : '-') + '</td>' +
          '<td>' + (row ? row.dg : '-') + '</td>' +
          '<td class="pts cup-reason">' + c.reason + '</td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="5" class="muted-cell">Sin clasificados aún</td></tr>');

      const allRows = (tableAnnual.length ? tableAnnual.map((row, index) => {
        const team = resolve(ctx, row.teamId);
        const inLib = libSet.has(row.teamId);
        const inSud = sudSet.has(row.teamId);
        let cupStatus = '';
        if (inLib) cupStatus = '<span class="cup cup--lib">L</span>';
        else if (inSud) cupStatus = '<span class="cup cup--sud">S</span>';
        return '<tr>' +
          '<td class="pos">' + row.rank + '</td>' +
          '<td><span class="team-inline">' + badge(team, 'badge--xs') + '<span>' + esc(team.name) + '</span></span>' + cupStatus + '</td>' +
          '<td>' + row.pj + '</td>' +
          '<td>' + row.pg + '</td>' +
          '<td>' + row.pe + '</td>' +
          '<td>' + row.pp + '</td>' +
          '<td>' + row.gf + '</td>' +
          '<td>' + row.gc + '</td>' +
          '<td>' + (row.dg > 0 ? '+' : '') + row.dg + '</td>' +
          '<td class="pts">' + row.pts + '</td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="11" class="muted-cell">Simulá Apertura y Clausura para ver la tabla anual acumulada.</td></tr>');

      const champA = champions.apertura ? resolve(ctx, champions.apertura) : null;
      const champC = champions.clausura ? resolve(ctx, champions.clausura) : null;

      container.innerHTML =
        '<div class="cups-grid">' +
        '<div class="cup-group cup-group--lib">' +
          '<h4>' + icon('trophy', 16) + ' Copa Libertadores</h4>' +
          '<div class="table-wrap"><table class="standings cups-table">' +
          '<thead><tr><th>#</th><th>Equipo</th><th>Pts</th><th>DIF</th><th>Vía</th></tr></thead>' +
          '<tbody>' + libRows + '</tbody>' +
          '</table></div>' +
        '</div>' +
        '<div class="cup-group cup-group--sud">' +
          '<h4>' + icon('trophy', 16) + ' Copa Sudamericana</h4>' +
          '<div class="table-wrap"><table class="standings cups-table">' +
          '<thead><tr><th>#</th><th>Equipo</th><th>Pts</th><th>DIF</th><th>Vía</th></tr></thead>' +
          '<tbody>' + sudRows + '</tbody>' +
          '</table></div>' +
        '</div>' +
        '</div>' +

        '<section class="card relegation-card" style="margin-top:22px">' +
          '<div class="card-head"><div><span class="eyebrow">Tabla Anual Acumulada</span><h3>Posiciones del Año</h3></div>' +
          '<span class="pill">' + annualTableData.length + ' equipos</span></div>' +
          '<div class="table-wrap"><table class="standings relegation-table">' +
          '<thead><tr><th>#</th><th>Equipo</th><th>Copas</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th></tr></thead>' +
          '<tbody>' + allRows + '</tbody>' +
          '</table></div>' +
        '</section>' +

        '<section class="card champions-card" style="margin-top:22px">' +
          '<div class="card-head"><div><span class="eyebrow">Campeones Semestrales</span><h3>Títulos 2026</h3></div>' +
          '<div class="champions-row">' +
          (champA ? '<div class="champ-item"><div class="champ-badge">' + badge(champA, 'badge--lg') + '</div><div><div class="champ-name">' + esc(champA.name) + '</div><div class="champ-sub">Campeón Apertura 2026</div></div></div>' :
            '<div class="champ-item"><div class="champ-badge badge--lg" style="background:var(--bg2);border-color:var(--border-soft);color:var(--text2)"><span>?</span></div><div><div class="champ-name">—</div><div class="champ-sub">Campeón Apertura 2026</div></div></div>') +
          (champC ? '<div class="champ-item"><div class="champ-badge">' + badge(champC, 'badge--lg') + '</div><div><div class="champ-name">' + esc(champC.name) + '</div><div class="champ-sub">Campeón Clausura 2026</div></div></div>' :
            '<div class="champ-item"><div class="champ-badge badge--lg" style="background:var(--bg2);border-color:var(--border-soft);color:var(--text2)"><span>?</span></div><div><div class="champ-name">—</div><div class="champ-sub">Campeón Clausura 2026</div></div></div>') +
          '</div>' +
        '</section>';
    } catch (error) {
      console.error('Error renderizando tabla anual:', error);
      container.innerHTML = '<section class="card empty-state"><h3>Error renderizando tabla anual</h3><p>' + esc(error.message) + '</p></section>';
    }
  }

  function renderCopa(ctx) {
    try {
      const container = document.getElementById('copa-content');
      const actions = document.getElementById('copa-actions');
      if (!container) return;

      const tournament = ctx.tournament;
      const st = ctx.state;
      const hasBracket = !!st.copaBracket && st.copaBracket.length > 0;
      const champion = st.copaChampion;

      if (!hasBracket) {
        container.innerHTML = '<section class="card empty-state">' +
          '<div class="empty-icon">' + icon('trophy', 42) + '</div>' +
          '<h3>La Copa Argentina todavía no arrancó</h3>' +
          '<p>Generá el bracket para comenzar a simular los partidos de eliminación directa.</p>' +
          '<div class="card-cta">' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="init-copa">Generar bracket</button>' +
          '</div>' +
        '</section>';
        if (actions) actions.innerHTML = '';
        return;
      }

      // Acciones: generar nuevo bracket o simular todos
      if (actions) {
        const btnText = champion ? 'Nuevo torneo' : 'Simular todos';
        const btnAction = champion ? 'new-tournament' : 'sim-all-copa';
        actions.innerHTML = '<div class="card-tools">' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="' + btnAction + '">' + btnText + '</button>' +
          (champion ? '<button type="button" class="btn btn-ghost btn-sm" data-action="new-tournament">Otro torneo</button>' : '') +
          '</div>';
      }

      const roundsHtml = st.copaBracket.map((round) => {
        const matchesHtml = round.matches.map((match) => {
          const result = st.copaResults && st.copaResults[match.id];
          const home = resolve(ctx, match.home);
          const away = match.away ? resolve(ctx, match.away) : null;
          const homeWon = result && result.winner === match.home;
          const awayWon = result && result.winner === match.away;

          if (match.bye) {
            return '<div class="bracket-match">' +
              '<div class="bracket-match-head"><span>Bye</span></div>' +
              '<div class="bracket-team is-winner">' + badge(home, 'badge--xs') + '<span>' + esc(home.name) + '</span><b>–</b></div>' +
              '<div class="bracket-team"><span>Avanza directo</span></div>' +
            '</div>';
          }

          return '<div class="bracket-match">' +
            '<div class="bracket-match-head"><span>' + esc(round.name) + '</span></div>' +
            '<div class="bracket-team ' + (homeWon ? 'is-winner' : '') + '">' + badge(home, 'badge--xs') + '<span>' + esc(home.name) + '</span><b>' + (result ? result.homeGoals : '–') + '</b></div>' +
            '<div class="bracket-team ' + (awayWon ? 'is-winner' : '') + '">' + (away ? badge(away, 'badge--xs') + '<span>' + esc(away.name) + '</span>' : '<span>TBD</span>') + '<b>' + (result ? result.awayGoals : '–') + '</b></div>' +
            '<div class="bracket-actions">' +
            (!result ? '<button type="button" class="mini-btn bracket-play" data-sim-copa-match="' + match.id + '" title="Simular partido">' + icon('play', 11) + '<span>Simular</span></button>' : '') +
            '</div>' +
            '</div>';
        }).join('');

        return '<div class="bracket-col">' +
          '<div class="bracket-col-head"><h4>' + esc(round.name) + '</h4><span>' + round.matches.length + ' partido(s)</span></div>' +
          matchesHtml +
        '</div>';
      }).join('');

      const championHtml = champion
        ? '<section class="champion-card">' +
          '<div class="champion-glow"></div>' +
          '<div class="champion-trophy">' + icon('trophy', 54) + '</div>' +
          '<span class="eyebrow">Campeón Copa Argentina</span>' +
          '<div class="champion-team">' + badge(resolve(ctx, champion), 'badge--xl') + '<h2>' + esc(resolve(ctx, champion).name) + '</h2></div>' +
          '<p>Clasificado a la Copa Libertadores.</p>' +
          '</section>'
        : '';

      container.innerHTML = championHtml +
        '<div class="bracket bracket--' + st.copaBracket.length + '" style="--cols:' + st.copaBracket.length + '">' +
        roundsHtml +
        '</div>';
    } catch (error) {
      console.error('Error renderizando Copa Argentina:', error);
      container.innerHTML = '<section class="card empty-state"><h3>Error renderizando Copa Argentina</h3><p>' + esc(error.message) + '</p></section>';
    }
  }

  function renderTeams(ctx) {
    try {
      const container = document.getElementById('teams-content');
      if (!container) return;

      const totalMatches = regularMatches(ctx).length;
      const tournament = ctx.tournament;

      container.innerHTML =
        '<section class="card info-card">' +
          '<div class="info-card-main">' +
            '<span class="eyebrow">Torneo activo</span>' +
            '<h3>' + esc(tournament.fullName) + '</h3>' +
            '<p>' + esc(tournament.description || '') + '</p>' +
            '<div class="info-chips">' +
              '<span class="pill">' + tournament.groups.length + ' zona(s)</span>' +
              '<span class="pill">' + ctx.fixtures.length + ' fechas</span>' +
              '<span class="pill">' + totalMatches + ' partidos</span>' +
              '<span class="pill">' + (tournament.playoffs && tournament.playoffs.enabled ? 'Con playoffs' : 'Sin playoffs') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="info-card-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="export">' + icon('download', 14) + ' Exportar</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="import">' + icon('upload', 14) + ' Importar</button>' +
            '<button type="button" class="btn btn-ghost btn-sm btn-danger" data-action="reset">' + icon('refresh', 14) + ' Reiniciar</button>' +
          '</div>' +
        '</section>' +
        '<div class="teams-toolbar">' +
          '<input id="teams-search" class="search-input" type="search" placeholder="Buscar club o ciudad…" value="' + esc(ctx.ui.teamsQuery || '') + '" aria-label="Buscar club">' +
          '<span class="pill" id="teams-count">' + (LAS.TEAMS ? LAS.TEAMS.length : 0) + ' clubes</span>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="settings">' + icon('gear', 14) + ' Ajustes</button>' +
        '</div>' +
        '<div class="teams-grid" id="teams-grid"></div>';

      renderTeamsGrid(ctx);
    } catch (error) {
      console.error('Error renderizando equipos:', error);
    }
  }

  function renderTeamsGrid(ctx) {
    try {
      const grid = document.getElementById('teams-grid');
      if (!grid) return;

      const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const query = normalize((ctx.ui && ctx.ui.teamsQuery) || '');
      const teams = (LAS.TEAMS || [])
        .map((team) => LAS.resolveTeam(ctx.state, team.id))
        .filter((team) => team &&
          (!query ||
            normalize(team.name).indexOf(query) !== -1 ||
            normalize(team.city).indexOf(query) !== -1))
        .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'es'));

      grid.innerHTML = teams.length
        ? teams.map((team) =>
            '<button type="button" class="team-card" data-edit-team="' + team.id + '">' +
              badge(team) +
              '<span class="team-card-copy">' +
                '<h4>' + esc(team.name) + '</h4>' +
                '<p>' + esc(team.city) + ' · ' + esc(team.stadium) + '</p>' +
              '</span>' +
              '<span class="rating">' + team.rating + '</span>' +
            '</button>'
          ).join('')
        : '<p class="muted">No encontramos clubes con esa búsqueda.</p>';

      const count = document.getElementById('teams-count');
      if (count) count.textContent = teams.length + ' clubes';
    } catch (error) {
      console.error('Error renderizando grid de equipos:', error);
    }
  }

  /* ------------------------------ Footer ---------------------------- */
  function renderFooter(ctx) {
    try {
      const tournament = document.getElementById('footer-tournament');
      if (tournament) tournament.textContent = ctx.tournament.fullName;
      const year = document.getElementById('footer-year');
      if (year) year.textContent = new Date().getFullYear();
    } catch (error) {
      console.error('Error renderizando footer:', error);
    }
  }

  function render(ctx) {
    renderHeader(ctx);
    renderHero(ctx);
    renderDashboard(ctx);
    renderFixture(ctx);
    renderStandings(ctx);
    renderPlayoffs(ctx);
    renderCopa(ctx);
    renderStandings(ctx);
    renderTeams(ctx);
    renderFooter(ctx);
  }

  LAS.render = { render, renderTeamsGrid };
})();