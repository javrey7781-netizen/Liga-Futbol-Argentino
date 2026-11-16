# Escudos originales de los equipos

Esta carpeta contiene las imágenes de los escudos de cada club. El código las busca automáticamente en `img/escudos/<id>.png` (o .svg/.jpg/.webp) usando el `id` del equipo definido en `js/data/teams.js`.

## Cómo agregar un escudo

1. Descargá la imagen del escudo del club (formato PNG, SVG, JPG o WebP).
2. Renombrala usando el `id` del equipo, por ejemplo:
   - `river-plate.png`
   - `boca-juniors.png`
   - `racing-club.png`
3. Colocala en esta carpeta (`img/escudos/`).

Si no hay imagen para un equipo, se muestra el escudo genérico (sigla + colores CSS).

## IDs de los 30 equipos

| ID | Equipo | Archivo sugerido |
|----|--------|------------------|
| river-plate | River Plate | river-plate.png |
| boca-juniors | Boca Juniors | boca-juniors.png |
| racing-club | Racing Club | racing-club.png |
| independiente | Independiente | independiente.png |
| estudiantes | Estudiantes (LP) | estudiantes.png |
| velez | Vélez Sarsfield | velez.png |
| san-lorenzo | San Lorenzo | san-lorenzo.png |
| talleres | Talleres | talleres.png |
| rosario-central | Rosario Central | rosario-central.png |
| lanus | Lanús | lanus.png |
| argentinos | Argentinos Juniors | argentinos.png |
| huracan | Huracán | huracan.png |
| newells | Newell's Old Boys | newells.png |
| defensa-justicia | Defensa y Justicia | defensa-justicia.png |
| godoy-cruz | Godoy Cruz | godoy-cruz.png |
| union | Unión | union.png |
| tigre | Tigre | tigre.png |
| belgrano | Belgrano | belgrano.png |
| instituto | Instituto | instituto.png |
| gimnasia | Gimnasia (LP) | gimnasia.png |
| banfield | Banfield | banfield.png |
| atletico-tucuman | Atlético Tucumán | atletico-tucuman.png |
| independiente-rivadavia | Independiente Rivadavia | independiente-rivadavia.png |
| barracas-central | Barracas Central | barracas-central.png |
| platense | Platense | platense.png |
| central-cordoba | Central Córdoba (SdE) | central-cordoba.png |
| sarmiento | Sarmiento | sarmiento.png |
| san-martin-sj | San Martín (SJ) | san-martin-sj.png |
| aldosivi | Aldosivi | aldosivi.png |
| riestra | Deportivo Riestra | riestra.png |

## Fuentes sugeridas para descargar escudos

- Wikimedia Commons (buscar "Escudo de [Club]")
- Sitios oficiales de cada club
- Packs de escudos de ligas argentinas en sitios como Soccerway, Flashscore, etc.

## Tamaño recomendado

512×512 px o mayor. La imagen se escala automáticamente a 32×32 px en la interfaz. Usá PNG con fondo transparente para mejores resultados.