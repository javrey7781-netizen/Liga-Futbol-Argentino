# LigaSim Argentina

Simulador web de la Liga Profesional Argentina. Corre entero en el navegador, sin backend ni registro. Tiene dos torneos precargados, fixture completo, tabla de posiciones, goleadores, playoffs, editor de clubes y guardado automático.

La estética está inspirada en [futsimulator.com](https://futsimulator.com/es): fondo casi negro, dorado, tipografías Montserrat + Playfair Display y tarjetas con bordes suaves.

---

## Cómo abrirlo

### Opción 1: abrir el archivo directamente

Hacé doble clic en `index.html`. Como el proyecto usa `<script>` clásicos y el namespace global `window.LAS`, funciona con `file://` sin necesidad de servidor.

### Opción 2: servidor local (recomendado para desarrollo)

```powershell
cd C:\Users\Breanda\Documents\liga-argentina-sim
npx serve .
```

O cualquier servidor estático. Después entrá a la URL que te indique (por ejemplo `http://localhost:3000`).

> Las tipografías se cargan desde Google Fonts. Sin internet, el navegador usa las fuentes de respaldo (Georgia y system-ui) y el resto funciona igual.

---

## Funcionalidades

- **Dos torneos**: Liga Profesional 2026 (2 zonas × 15 clubes, 15 fechas, top 4 por zona) y Liga Única 2026 (30 clubes, 29 fechas, top 8).
- **Simulación rápida**: partido individual, fecha completa, lo que resta o temporada entera.
- **Carga manual de resultados**: en cada partido pendiente podés tocar el lápiz, cargar el marcador y guardarlo. En playoffs, si hay empate, también se cargan los penales. La simulación de la fecha solo juega los partidos que todavía no tienen resultado.
- **Fixture** por fecha, con resultados, botón para simular cada partido y botón para cargar el resultado a mano.
- **Tabla de posiciones** con desempate por diferencia de gol, goles a favor y nombre.
- **Goleadores** calculados a partir de los goles de cada partido.
- **Playoffs** con bracket automático, penales en caso de empate y tarjeta de campeón con confeti.
- **Editor de equipos**: nombre, sigla, ciudad, estadio, fuerza (rating) y colores.
- **Tema oscuro / claro**, persistente.
- **Guardado automático** en `localStorage`.
- **Exportar / importar** la partida como JSON.
- **Diseño responsive** para escritorio y mobile.

---

## Estructura del proyecto

```
liga-argentina-sim/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── core/
    │   ├── rng.js          # RNG determinístico + Poisson
    │   ├── fixtures.js     # Fixture round-robin por zonas
    │   ├── simulator.js    # Simulación de partidos
    │   ├── standings.js    # Tabla de posiciones
    │   ├── playoffs.js     # Bracket y avance de rondas
    │   └── storage.js      # Persistencia, export/import y sanitización
    ├── data/
    │   ├── teams.js        # Clubes, ratings, colores y overrides
    │   ├── tournaments.js  # Configuración de torneos
    │   └── players.js      # Planteles ficticios y goleadores
    ├── ui/
    │   ├── dom.js          # Helpers de DOM, modales, toast, confeti
    │   └── render.js       # Render de todas las vistas
    └── app.js              # Estado, acciones, ruteo y eventos
```

El orden de carga de los scripts está definido en `index.html`:

```
rng → teams → tournaments → players → fixtures → simulator
→ standings → playoffs → storage → dom → render → app
```

---

## Agregar un torneo nuevo

El motor está pensado para que agregar un campeonato sea, en la mayoría de los casos, agregar un objeto a `js/data/tournaments.js`.

### 1. Agregar clubes (si hacen falta)

Los clubes viven en `js/data/teams.js`. Cada equipo tiene:

```js
{
  id: 'river-plate',
  name: 'River Plate',
  short: 'RIV',
  city: 'Buenos Aires',
  stadium: 'Monumental',
  rating: 88,
  colors: ['#ffffff', '#d21f26']
}
```

El `id` es la clave estable: se usa en fixtures, resultados y playoffs. No lo cambies si ya hay partidas guardadas.

### 2. Agregar el torneo

En `js/data/tournaments.js`, sumá un objeto al array `LAS.TOURNAMENTS`:

```js
{
  id: 'copa-ejemplo-2026',
  name: 'Copa Ejemplo',
  fullName: 'Copa Ejemplo Argentina 2026',
  season: '2026',
  country: 'Argentina',
  description: 'Texto que se muestra al elegir el torneo.',
  format: 'groups_playoffs',
  rounds: 'single',              // 'single' | 'double'
  points: { win: 3, draw: 1, loss: 0 },
  groups: [
    { name: 'Zona A', teamIds: ['river-plate', 'boca-juniors', /* ... */] },
    { name: 'Zona B', teamIds: [/* ... */] }
  ],
  playoffs: {
    enabled: true,
    teamsPerGroup: 4,            // clasificados por zona
    neutralFinal: true           // la final se juega sin localía
  },
  ui: {
    roundLabel: 'Fecha',
    qualificationLabel: 'Playoffs'
  }
}
```

Campos importantes:

| Campo | Qué hace |
| --- | --- |
| `format` | Hoy el motor soporta `groups_playoffs`. |
| `rounds` | `single` = una rueda; `double` = ida y vuelta. |
| `points` | Puntos por victoria, empate y derrota. |
| `groups` | Una o más zonas. Cada zona tiene su propia tabla. |
| `playoffs.teamsPerGroup` | Cuántos clasifican por zona. Con 1 zona y 8 clasificados arma 1º-8º, 4º-5º, etc. Con 2 zonas arma cruces A1-B4, B1-A4, etc. |
| `playoffs.neutralFinal` | Si es `true`, la final no tiene ventaja de localía. |
| `ui.roundLabel` | Etiqueta visible para las fechas ("Fecha", "Jornada", etc.). |

No hace falta tocar el motor: el fixture, la tabla y el bracket se adaptan a la configuración.

### 3. Probar

Abrí la app, elegí el torneo nuevo en el selector y simulá una temporada completa. Si la cantidad de equipos por zona es impar, el fixture genera fecha libre automáticamente.

---

## Modelo de simulación

Cada partido calcula los goles esperados con un modelo de Poisson:

- La **fuerza** (`rating`) de cada club se combina con un sesgo fijo de ataque y defensa (`LAS.getTeamBias`).
- El local tiene una ventaja (`HOME_BOOST = 1.15`) y el visitante una pequeña penalización (`AWAY_BOOST = 0.92`), salvo en cancha neutral.
- La forma del día agrega una variación aleatoria.
- Los goles se sortean con distribución de Poisson y se limitan a un rango razonable.
- En eliminatorias, si hay empate se ejecuta una tanda de penales automática.

La semilla del torneo (`state.seed`) hace que el fixture y los resultados sean determinísticos: la misma semilla reproduce la misma temporada.

Los planteles y nombres de goleadores son **ficticios** y se generan de forma determinística a partir del `id` del club. No representan planteles reales.

---

## Persistencia y datos

- La partida se guarda en `localStorage` bajo la clave `ligasim:arg:v1`.
- El tema se guarda aparte en `ligasim:theme`.
- Hay **un solo slot de partida activa**. Cambiar de torneo o reiniciar conserva las ediciones de equipos, pero borra resultados y playoffs.
- **Exportar** descarga un JSON con la partida completa.
- **Importar** valida el archivo antes de reemplazar la partida:
  - rechaza JSON inválido o torneos desconocidos;
  - descarta resultados de partidos que no existen en el fixture;
  - acota goles, ratings y minutos;
  - valida penales y ganadores de playoffs;
  - recalcula el campeón desde el resultado de la final;
  - normaliza colores a hexadecimal y limpia etiquetas HTML de los textos.
- Los resultados cargados a mano se guardan con la marca `manual: true`, se distinguen con un lápiz en el fixture y sobreviven al guardado, exportación e importación.
- Una vez cargado, un resultado no se puede editar desde la interfaz: así no se rompen la tabla ni el bracket. Para rehacerlo, reiniciá el torneo o importá otra partida.
- **Simular fecha** (y también "Simular lo que resta" / "Simular temporada") omite los partidos que ya tienen resultado, sean simulados o manuales. El aviso indica cuántos partidos se jugaron y cuántos ya estaban cargados.

---

## Limitaciones conocidas

- Solo existe el formato `groups_playoffs` (fase regular + playoffs). No hay copa nacional, promoción/descenso ni torneos de eliminación directa pura.
- Los planteles y goleadores son ficticios.
- Los ratings son estáticos: el editor los cambia, pero no hay progresión entre temporadas.
- Hay un único slot de guardado. Para conservar varias partidas, exportá cada una a JSON.
- No hay sincronización entre dispositivos ni backend.
- Los escudos son genéricos (sigla + colores), sin imágenes externas.
- El fixture se genera al azar con la semilla, no respeta un calendario real.
- La app está pensada para un solo idioma (español rioplatense).

---

## Créditos

Proyecto no oficial. Los nombres de los clubes se usan con fines de simulación y entretenimiento. Los resultados, planteles y goleadores son ficticios.

Inspirado visualmente en [Fut Simulator](https://futsimulator.com/es).
