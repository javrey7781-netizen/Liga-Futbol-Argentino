/* ============================================================
   LigaSim Argentina — Helpers de interfaz
   ============================================================ */
(function () {
  const LAS = (window.LAS = window.LAS || {});

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8L19 12 8 5.6Z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    ball: '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.2Z"/><path d="M12 3v4.2M4.2 9.4l3.4 2.4M6.1 19l3.8-2.9M17.9 19l-3.8-2.9M19.8 9.4l-3.4 2.4"/></svg>'
  };

  function icon(name, size) {
    return (ICONS[name] || '').replace(/SIZE/g, size || 16);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function luminance(hex) {
    let clean = String(hex || '#000').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const channel = (start) => {
      const value = parseInt(clean.slice(start, start + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  }

  function contrastText(hex) {
    return luminance(hex) > 0.55 ? '#12100b' : '#ffffff';
  }

  /* Acepta solo colores hex (#rgb o #rrggbb). Evita inyectar CSS
     arbitrario desde una partida importada o editada a mano. */
  function safeColor(value, fallback) {
    const raw = String(value == null ? '' : value).trim();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return '#' + raw.slice(1).split('').map((c) => c + c).join('').toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
    return fallback;
  }

  function badge(team, extraClass) {
    const colors = team.colors || [];
    const c1 = safeColor(colors[0], '#333333');
    const c2 = safeColor(colors[1], '#111111');

    // Si el equipo tiene escudo original definido, usá la imagen.
    // Los archivos van en img/escudos/<id>.png (o .svg/.jpg).
    const shield = team.shield ? 'img/escudos/' + team.shield : null;

    if (shield) {
      return '<img class="badge ' + (extraClass || '') + '" src="' + shield +
        '" alt="' + esc(team.name) + '" title="' + esc(team.name) +
        '" width="32" height="32" loading="lazy">';
    }

    // Fallback: escudo genérico con sigla y colores (CSS)
    return '<span class="badge ' + (extraClass || '') + '" style="--c1:' + c1 +
      ';--c2:' + c2 + ';--badge-text:' + contrastText(c1) +
      '" title="' + esc(team.name) + '"><span>' + esc(team.short) + '</span></span>';
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ----------------------------- Toasts ----------------------------- */
  function toast(message, type) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    el.innerHTML = '<span class="toast-dot"></span><span>' + esc(message) + '</span>';
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 260);
    }, 3400);
  }

  /* ----------------------------- Modales ---------------------------- */
  let activeModal = null;

  function openModal(options) {
    if (activeModal) activeModal.close();

    const root = document.getElementById('modal-root');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', options.title || 'Diálogo');

    modal.innerHTML =
      '<div class="modal-head">' +
        '<h3>' + esc(options.title || '') + '</h3>' +
        '<button type="button" class="icon-btn icon-btn--sm" data-modal-close aria-label="Cerrar">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<div class="modal-body">' + (options.body || '') + '</div>' +
      '<div class="modal-actions"></div>';

    const actionsEl = modal.querySelector('.modal-actions');
    (options.actions || []).forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-sm ' + (
        action.variant === 'primary' ? 'btn-primary' :
        action.variant === 'danger' ? 'btn-danger' : 'btn-ghost'
      );
      button.innerHTML = action.label;
      button.addEventListener('click', () => action.onClick && action.onClick({ modal, close }));
      actionsEl.appendChild(button);
    });
    if (!actionsEl.children.length) actionsEl.remove();

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    document.body.classList.add('has-modal');

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      backdrop.classList.add('is-closing');
      setTimeout(() => backdrop.remove(), 170);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-modal');
      if (activeModal && activeModal.backdrop === backdrop) activeModal = null;
      if (options.onClose) options.onClose();
    }

    function onKey(event) {
      if (event.key === 'Escape') close();
    }

    modal.querySelector('[data-modal-close]').addEventListener('click', close);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close();
    });
    document.addEventListener('keydown', onKey);

    activeModal = { close, backdrop, modal };
    if (options.onMount) options.onMount(modal, close);

    const focusable = modal.querySelector('input, select, textarea, button');
    if (focusable) setTimeout(() => focusable.focus(), 50);

    return activeModal;
  }

  function confirmDialog(options) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      openModal({
        title: options.title || '¿Estás seguro?',
        body: '<p>' + esc(options.message || '') + '</p>',
        actions: [
          {
            label: options.cancelLabel || 'Cancelar',
            variant: 'ghost',
            onClick: ({ close }) => { finish(false); close(); }
          },
          {
            label: options.confirmLabel || 'Confirmar',
            variant: options.danger ? 'danger' : 'primary',
            onClick: ({ close }) => { finish(true); close(); }
          }
        ],
        onClose: () => finish(false)
      });
    });
  }

  /* ---------------------------- Confeti ----------------------------- */
  function confetti(count) {
    const root = document.getElementById('confetti-root');
    if (!root) return;
    const colors = ['#f0c040', '#c9a84c', '#fff3c4', '#ffffff', '#d21f2c', '#1b3f8b', '#3fbf7f'];
    const total = count || 90;

    for (let i = 0; i < total; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = (Math.random() * 100) + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2.2 + Math.random() * 2.4) + 's';
      piece.style.animationDelay = (Math.random() * 0.7) + 's';
      piece.style.width = (5 + Math.random() * 7) + 'px';
      piece.style.height = (9 + Math.random() * 11) + 'px';
      root.appendChild(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }

  function animateMatches(ids) {
    (ids || []).forEach((id, index) => {
      document.querySelectorAll('[data-match-id="' + id + '"]').forEach((el) => {
        el.style.animationDelay = (index * 32) + 'ms';
        el.classList.add('is-new');
      });
    });
  }

  LAS.dom = { icon, esc, badge, safeColor, contrastText, sleep, toast, openModal, confirmDialog, confetti, animateMatches };
})();
