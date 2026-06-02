// =====================================================================
// Field Map (Ladakh) — interactive topographic atlas.
//
// Eight hand-placed pins over a hand-drawn topographic SVG of Ladakh.
// Hover any pin: a small lens preview opens. Click: a detail panel opens
// below the map (never covers it) with photos, a field-recorder audio
// player, and a field note. Keyboard ←/→ to jump between pins, Esc to
// close. The map stays fully visible at all times so you can hop
// between nearby pins without losing your bearings.
//
// Photos use the <image-slot> web component — drag-and-drop images into
// them and they persist via the project's sidecar.
//
// Audio: each pin points to a path like `audio/<pinId>.mp3`. If that
// file doesn't exist yet, the player shows a "field recording — pending
// upload" state. Upload your recordings into the audio/ folder and they
// will appear automatically.
// =====================================================================

const FIELD_MAP_BOUNDS = {
  // West–East and South–North bounds of the map's visible area.
  lonMin: 76.5, lonMax: 79.5,
  latMin: 33.5, latMax: 35.0,
};

// Mercator-naive projection. Ladakh sits at ~34°N where the lon/lat
// stretch is mild enough that a linear map reads as truthful. Good
// enough for an illustrative atlas; we're not building a GPS.
function projectToPercent(lat, lon) {
  const { lonMin, lonMax, latMin, latMax } = FIELD_MAP_BOUNDS;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * 100;
  const y = ((latMax - lat)  / (latMax - latMin)) * 100;
  return { left: x, top: y };
}

const PINS = [
  {
    id: 'thang',
    name: 'Thang',
    kind: 'location',
    lat: 34.8500, lon: 76.7800,
    altitude: '2 700 m',
    nameAlign: 'left',
    note: 'The last village before the Line of Control — a single road, a watch-post, and a small school. Stories here move at the speed of permission slips.',
    caption: 'Field recording · Thang village, near dusk.',
    photos: [
      '../images/map/thang-2.jpg',
      '../images/map/thang-1.jpg',
      '../images/map/thang-3.jpg',
    ],
  },
  {
    id: 'turtuk',
    name: 'Turtuk',
    kind: 'location',
    lat: 34.8460, lon: 76.8300,
    altitude: '2 900 m',
    nameAlign: 'below',
    note: 'Balti-speaking villages reopened to outsiders in 2010. Apricot orchards, slate roofs, a quiet bilingualism of Urdu and Ladakhi.',
    caption: 'Conversation with an elder · Turtuk, morning light.',
    photos: [
      '../images/map/turtuk-2.jpg',
      '../images/map/turtuk-1.jpg',
      '../images/map/turtuk-3.jpg',
      '../images/map/turtuk-4.jpg',
      '../images/map/turtuk-5.jpg',
    ],
  },
  {
    id: 'khardung-la',
    name: 'Khardung La',
    kind: 'pass',
    lat: 34.2780, lon: 77.6040,
    altitude: '5 359 m',
    nameAlign: 'right',
    note: 'A mountain pass on the road from Leh into the Nubra valley. Once described as the world\'s highest motorable pass — a claim contested, but the wind here doesn\'t care.',
    caption: 'Wind & passing trucks · Khardung La summit.',
    photos: [
      '../images/map/khardung-la-1.jpg',
      '../images/map/khardung-la-2.jpg',
      '../images/map/khardung-la-3.jpg',
    ],
  },
  {
    id: 'khardung-village',
    name: 'Khardung Village',
    kind: 'location',
    lat: 34.2200, lon: 77.5700,
    altitude: '3 900 m',
    nameAlign: 'left',
    note: 'A small settlement on the southern approach to Khardung La. Households here sit at the edge of two worlds — the quiet of the valley and the constant traffic of the pass above.',
    caption: 'Afternoon in a courtyard · Khardung Village.',
    photos: [
      { src: '../images/map/khardung-village-1.jpg', position: '50% 78%' },
      '../images/map/khardung-village-2.jpg',
      '../images/map/khardung-village-3.jpg',
    ],
  },
  {
    id: 'saspol',
    name: 'Saspol',
    kind: 'location',
    lat: 34.3050, lon: 77.2000,
    altitude: '3 200 m',
    nameAlign: 'left',
    note: 'Caves with eleventh-century frescoes above the Indus. The village below tends barley and ferries tourists across to the bank.',
    caption: 'Indus flow & a goat herd passing · Saspol.',
    photos: [
      '../images/map/saspol-3.jpg',
      '../images/map/saspol-1.jpg',
      '../images/map/saspol-2.jpg',
    ],
  },
  {
    id: 'leh',
    name: 'Leh',
    kind: 'location',
    lat: 34.1525, lon: 77.5770,
    altitude: '3 524 m',
    nameAlign: 'below',
    note: 'The capital and the gravitational centre of all fieldwork here. Markets, monasteries, the radio crackle of a regional bus stand.',
    caption: 'Leh market · evening azaan & Tibetan chant overlap.',
    photos: [
      { src: '../images/map/leh-4.jpg', position: '50% 90%' },
      { src: '../images/map/leh-1.jpg', position: '50% 75%' },
      '../images/map/leh-2.jpg',
      '../images/map/leh-3.jpg',
      '../images/map/leh-5.jpg',
    ],
  },
  {
    id: 'chang-la',
    name: 'Chang La',
    kind: 'pass',
    lat: 34.0500, lon: 77.9200,
    altitude: '5 360 m',
    nameAlign: 'right',
    note: 'The pass on the road east toward Pangong. Army tea-stall at the top, a small Shiva shrine, snow even in July.',
    caption: 'Tea-stall radio & wind · Chang La.',
    photos: [],
  },
  {
    id: 'upshi',
    name: 'Upshi',
    kind: 'location',
    lat: 33.8500, lon: 77.8500,
    altitude: '3 380 m',
    nameAlign: 'left',
    note: 'The junction where the Manali–Leh highway meets the road east. Truckers stop here for noodles and diesel; an arch announces both directions at once.',
    caption: 'Trucks idling at the checkpoint · Upshi.',
    photos: [],
  },
  {
    id: 'pangong-tso',
    name: 'Pangong Tso',
    kind: 'location',
    lat: 33.9000, lon: 78.7000,
    altitude: '4 250 m',
    nameAlign: 'above',
    note: 'A long salt-water lake straddling the India–China line. The water changes colour through the day; the silence does not.',
    caption: 'Lakeshore at first light · Pangong Tso.',
    photos: [],
  },
  {
    id: 'umling-la',
    name: 'Umling La',
    kind: 'pass',
    lat: 33.55, lon: 79.40,
    altitude: '5 799 m',
    nameAlign: 'left',
    note: 'The world\'s highest motorable road — 19,024 feet above sea level, in the Changthang plateau. The landscape at the top is not dramatic; it is simply total. No trees, no sound, just the road continuing.',
    caption: 'Wind at the summit · Umling La.',
    photos: [
      '../images/map/umling-la-2.jpg',
      '../images/map/umling-la-1.jpg',
      '../images/map/umling-la-3.jpg',
    ],
  },
];

// Format a decimal coordinate as a clean cardinal string.
function fmtCoord(lat, lon) {
  const N = (lat >= 0 ? 'N' : 'S');
  const E = (lon >= 0 ? 'E' : 'W');
  return `${Math.abs(lat).toFixed(4)}° ${N} / ${Math.abs(lon).toFixed(4)}° ${E}`;
}

// Try common audio extensions for a pin. We let the <audio> element
// itself decide by listing multiple <source>s; whichever decodes wins.
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'ogg', 'wav'];

Object.assign(window, { FieldMapPins: PINS, FieldMapBounds: FIELD_MAP_BOUNDS, projectToPercent, fmtCoord, AUDIO_EXTENSIONS });
