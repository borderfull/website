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
    note: 'The last village before the Line of Control — a single road leading up to binoculars, guides, food, and the Line of Control (LoC).',
    caption: 'Construction underway · Thang village.',
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
    note: 'Reopened to tourism in 2010. Currently undergoing a tourism boom. Apricot orchards, vegetable farming, and the sincere sound of Balti language honor the place.',
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
    note: 'Once, the world\'s highest motorable road, it still charms tourists into visiting it irrespective of the altitude struggles and the excitement of "the" instagram story.',
    caption: 'Traffic maintenance at 5 359 m.',
    photos: [
      '../images/map/khardung-la-2.jpg',
      '../images/map/khardung-la-1.jpg',
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
    note: 'A small village that passes its name to the mighty pass of Khardung La. Farming women, road building workers, Buddhist prayers on elders\' lips, and the steady rush of vehicles enjoying coming down the pass.',
    caption: '',
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
    note: 'Caves with eleventh-century frescoes above the Indus. Apricot orchards, mulberry trees, sound of water streams, and a road.',
    caption: '',
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
    note: 'The capital and the gravitational centre of all fieldwork here. Markets, monasteries, and the chatter at bike rentals.',
    caption: 'Community dancing in the market · Leh.',
    photos: [
      { src: '../images/map/leh-4.jpg', position: '50% 90%' },
      { src: '../images/map/leh-1.jpg', position: '50% 75%' },
      '../images/map/leh-2.jpg',
      '../images/map/leh-3.jpg',
      '../images/map/leh-5.jpg',
    ],
  },
  {
    id: 'umling-la',
    name: 'Umling La',
    kind: 'pass',
    lat: 33.55, lon: 79.40,
    altitude: '5 799 m',
    nameAlign: 'left',
    note: 'The world\'s 2nd highest motorable road — 19,024 feet above sea level, in the Changthang plateau. No trees, no sound, just the road continuing. When at the top, you must ask, why here?',
    caption: '',
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
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'ogg', 'opus', 'wav'];

Object.assign(window, { FieldMapPins: PINS, FieldMapBounds: FIELD_MAP_BOUNDS, projectToPercent, fmtCoord, AUDIO_EXTENSIONS });
