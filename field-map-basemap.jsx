// =====================================================================
// Field Map — the topographic SVG basemap of Ladakh.
// All coordinates here are in viewBox space (1200×700) and mapped from
// real geography via the bounds in field-map-data.jsx.
// =====================================================================

function FieldMapBasemap() {
  return (
    <svg className="basemap" viewBox="0 0 1200 700" preserveAspectRatio="none"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="hatch-mountain" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#9a7d4a" strokeWidth="0.7" opacity="0.55"/>
        </pattern>
        <pattern id="hatch-mountain-dense" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#7a5e35" strokeWidth="0.6" opacity="0.7"/>
        </pattern>
      </defs>

      {/* Subtle latitude/longitude graticule */}
      <g stroke="#c9bda5" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.6">
        {/* lon lines at 77°, 78°, 79° */}
        <line x1="200" y1="0" x2="200" y2="700"/>
        <line x1="600" y1="0" x2="600" y2="700"/>
        <line x1="1000" y1="0" x2="1000" y2="700"/>
        {/* lat lines at 34.5°, 34°, 33.5° */}
        <line x1="0" y1="233.3" x2="1200" y2="233.3"/>
        <line x1="0" y1="466.7" x2="1200" y2="466.7"/>
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#8a7f6e">
        <text x="204" y="14">77° E</text>
        <text x="604" y="14">78° E</text>
        <text x="1004" y="14">79° E</text>
        <text x="8" y="231">34°30′ N</text>
        <text x="8" y="464">34°00′ N</text>
      </g>

      {/* ===== Karakoram Range (north band) — densest hatching ===== */}
      <g>
        <path d="M 0 20 Q 120 5 250 30 Q 380 10 520 35 Q 660 15 820 40 Q 970 20 1110 45 Q 1170 50 1200 60
                 L 1200 175 Q 1080 165 950 180 Q 830 200 700 175 Q 560 195 430 175 Q 290 195 170 180 Q 60 195 0 185 Z"
              fill="url(#hatch-mountain-dense)" stroke="#7a5e35" strokeWidth="0.5" opacity="0.85"/>
        {/* Individual peak silhouettes inside Karakoram */}
        <g fill="none" stroke="#5e451f" strokeWidth="0.6" opacity="0.7">
          <path d="M 150 130 L 180 70 L 215 130 M 195 95 L 205 90"/>
          <path d="M 320 145 L 365 60 L 410 145 M 350 105 L 380 100"/>
          <path d="M 500 140 L 540 80 L 580 140 M 525 110 L 555 105"/>
          <path d="M 690 150 L 740 70 L 790 150 M 720 110 L 760 105"/>
          <path d="M 900 145 L 940 75 L 980 145 M 920 110 L 960 105"/>
        </g>
      </g>

      {/* ===== Ladakh Range (middle) — medium hatching ===== */}
      <g>
        <path d="M 0 270 Q 130 260 270 280 Q 410 270 550 290 Q 690 280 830 300 Q 970 290 1100 305 Q 1160 310 1200 318
                 L 1200 388 Q 1060 380 920 388 Q 780 400 640 380 Q 500 395 360 380 Q 220 390 90 380 Q 30 388 0 390 Z"
              fill="url(#hatch-mountain)" stroke="#9a7d4a" strokeWidth="0.45" opacity="0.75"/>
        <g fill="none" stroke="#6b5230" strokeWidth="0.5" opacity="0.6">
          <path d="M 200 360 L 232 305 L 260 360"/>
          <path d="M 400 365 L 432 308 L 470 365"/>
          <path d="M 620 365 L 660 305 L 700 365"/>
          <path d="M 820 365 L 855 310 L 890 365"/>
        </g>
      </g>

      {/* ===== Zanskar Range (south) — heavy mass ===== */}
      <g>
        <path d="M 0 555 Q 140 540 280 565 Q 420 555 560 580 Q 700 570 840 595 Q 980 585 1110 600 Q 1170 605 1200 610
                 L 1200 700 L 0 700 Z"
              fill="url(#hatch-mountain-dense)" stroke="#7a5e35" strokeWidth="0.5" opacity="0.85"/>
        <g fill="none" stroke="#5e451f" strokeWidth="0.6" opacity="0.7">
          <path d="M 100 640 L 140 575 L 180 640"/>
          <path d="M 300 645 L 348 565 L 390 645"/>
          <path d="M 530 645 L 580 570 L 625 645"/>
          <path d="M 760 645 L 805 575 L 850 645"/>
          <path d="M 980 645 L 1020 580 L 1060 645"/>
        </g>
      </g>

      {/* Contour lines for valleys between ranges (subtle paper relief) */}
      <g stroke="#c0a87a" strokeWidth="0.4" fill="none" opacity="0.5">
        <path d="M 0 200 Q 200 195 400 215 Q 600 205 800 225 Q 1000 215 1200 235"/>
        <path d="M 0 240 Q 200 232 400 252 Q 600 244 800 262 Q 1000 252 1200 272"/>
        <path d="M 0 405 Q 200 398 400 415 Q 600 408 800 425 Q 1000 415 1200 432"/>
        <path d="M 0 445 Q 200 438 400 455 Q 600 448 800 465 Q 1000 455 1200 472"/>
        <path d="M 0 500 Q 200 495 400 510 Q 600 505 800 522 Q 1000 515 1200 530"/>
      </g>

      {/* ===== Indus River — from the west through Leh, then south-east to the Manali road ===== */}
      <path d="M -10 400 Q 80 405 170 412 Q 250 418 280 422 Q 350 430 432 470 Q 480 510 540 570 Q 590 615 660 645 Q 750 680 880 690 L 1210 700"
            fill="none" stroke="#3a6a8e" strokeWidth="2.4" strokeLinecap="round" opacity="0.85"/>
      <path d="M -10 400 Q 80 405 170 412 Q 250 418 280 422 Q 350 430 432 470 Q 480 510 540 570 Q 590 615 660 645 Q 750 680 880 690 L 1210 700"
            fill="none" stroke="#4a87b2" strokeWidth="1.0" strokeLinecap="round" opacity="0.75"/>

      {/* ===== Shyok River — joins from the east (Pangong basin), flows NW through Nubra ===== */}
      <path d="M 880 510 Q 760 470 620 415 Q 500 360 380 285 Q 280 215 180 150 Q 130 110 100 80 L 80 60"
            fill="none" stroke="#3a6a8e" strokeWidth="2.0" strokeLinecap="round" opacity="0.8"/>
      <path d="M 880 510 Q 760 470 620 415 Q 500 360 380 285 Q 280 215 180 150 Q 130 110 100 80 L 80 60"
            fill="none" stroke="#4a87b2" strokeWidth="0.9" strokeLinecap="round" opacity="0.65"/>

      {/* ===== Pangong Tso — long thin saline lake ===== */}
      <path d="M 840 510 Q 905 502 985 510 Q 1075 517 1155 528 Q 1190 533 1198 545
               Q 1188 555 1130 552 Q 1040 548 950 540 Q 870 533 845 520 Z"
            fill="#5a8eaf" opacity="0.55" stroke="#3a6a8e" strokeWidth="0.6"/>
      {/* lake ripple */}
      <g stroke="#3a6a8e" strokeWidth="0.4" fill="none" opacity="0.4">
        <path d="M 880 520 Q 950 515 1020 521 Q 1080 525 1140 532"/>
        <path d="M 890 528 Q 960 525 1030 530 Q 1090 534 1150 540"/>
      </g>

      {/* ===== Geography labels — italic serif ===== */}
      <g fontFamily="Cormorant Garamond, serif" fontStyle="italic" fill="#4a3f2a">
        <text x="350" y="95" fontSize="26" opacity="0.78" letterSpacing="8">KARAKORAM RANGE</text>
        <text x="720" y="335" fontSize="20" opacity="0.78" letterSpacing="5">LADAKH RANGE</text>
        <text x="450" y="678" fontSize="20" opacity="0.78" letterSpacing="5">ZANSKAR RANGE</text>
        <text x="180" y="395" fontSize="14" opacity="0.85" fontStyle="italic">Indus</text>
        <text x="700" y="640" fontSize="14" opacity="0.85" fontStyle="italic">Indus</text>
        <text x="270" y="180" fontSize="14" opacity="0.85" fontStyle="italic">Shyok</text>
        <text x="975" y="498" fontSize="16" opacity="0.95" fontStyle="italic" letterSpacing="1.5">Pangong Tso</text>
        <text x="240" y="60" fontSize="12" opacity="0.7" fontStyle="italic" letterSpacing="2">Nubra Valley</text>
        <text x="660" y="495" fontSize="12" opacity="0.7" fontStyle="italic" letterSpacing="2">Changthang Plateau</text>
        <text x="170" y="475" fontSize="12" opacity="0.6" fontStyle="italic" letterSpacing="1">Sham Valley</text>
      </g>

      {/* Boundary / line-of-control trace, dashed */}
      <g stroke="#6b5230" strokeWidth="0.7" fill="none" opacity="0.55" strokeDasharray="6,4">
        <path d="M 35 38 Q 90 55 130 85 Q 175 120 220 165 Q 270 215 310 270"/>
        <path d="M 1140 290 Q 1150 380 1160 450 Q 1175 530 1190 600"/>
      </g>
      <text x="40" y="170" fontFamily="IBM Plex Mono, monospace" fontSize="8"
            fill="#6b5230" letterSpacing="1" opacity="0.65" transform="rotate(48 40 170)">LINE OF CONTROL</text>

      {/* Compass rose top-right */}
      <g transform="translate(1130, 80)">
        <circle r="26" fill="none" stroke="#3a342c" strokeWidth="0.6"/>
        <circle r="22" fill="none" stroke="#3a342c" strokeWidth="0.3" opacity="0.5"/>
        <path d="M 0 -22 L -6 0 L 0 -5 L 6 0 Z" fill="#3a342c"/>
        <path d="M 0 22 L -4 0 L 0 5 L 4 0 Z" fill="#3a342c" opacity="0.4"/>
        <path d="M -22 0 L 0 -4 L -5 0 L 0 4 Z" fill="#3a342c" opacity="0.4"/>
        <path d="M 22 0 L 0 -4 L 5 0 L 0 4 Z" fill="#3a342c" opacity="0.4"/>
        <text x="0" y="-30" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#3a342c">N</text>
      </g>

      {/* Scale bar bottom-right */}
      <g transform="translate(980, 660)" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#3a342c">
        <rect x="0" y="0" width="40" height="3" fill="#3a342c"/>
        <rect x="40" y="0" width="40" height="3" fill="none" stroke="#3a342c" strokeWidth="0.5"/>
        <rect x="80" y="0" width="40" height="3" fill="#3a342c"/>
        <text x="-2" y="-5">0</text>
        <text x="35" y="-5">40</text>
        <text x="75" y="-5">80</text>
        <text x="120" y="-5">120 km</text>
      </g>
    </svg>
  );
}

window.FieldMapBasemap = FieldMapBasemap;
