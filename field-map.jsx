// =====================================================================
// FieldMap — top-level component.
// Composes the topographic basemap, pins, hover lens, and the detail
// panel that appears below the map.
// =====================================================================

function FieldMap() {
  const pins = window.FieldMapPins || [];
  const [activeId, setActiveId] = React.useState(null);
  const [hoverId, setHoverId] = React.useState(null);
  const stageRef = React.useRef(null);

  const active = pins.find((p) => p.id === activeId) || null;
  const hover = pins.find((p) => p.id === hoverId) || null;

  // Keyboard nav: ←/→ jump between pins, Esc closes
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {setActiveId(null);return;}
      if (!active) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const i = pins.findIndex((p) => p.id === active.id);
        const next = e.key === 'ArrowRight' ?
        (i + 1) % pins.length :
        (i - 1 + pins.length) % pins.length;
        setActiveId(pins[next].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, pins]);

  // When opening a pin, scroll the panel softly into view (only if it's
  // off-screen) — without yanking the page.
  React.useEffect(() => {
    if (!active) return;
    const panel = document.querySelector('.field-map-panel');
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    if (r.bottom > window.innerHeight) {
      window.scrollBy({ top: r.bottom - window.innerHeight + 32, behavior: 'smooth' });
    }
  }, [active && active.id]);

  return (
    <div className="field-map">
      <div className="field-map-head">
        <h3 data-i18n="map.title">Field, <span className="it">beyond the research.</span></h3>
        <div className="legend">
          <span className="swatch"><span className="dot"></span> <span data-i18n="map.legend.site">Village / Site</span></span>
          <span className="swatch"><span className="tri"></span> <span data-i18n="map.legend.pass">Mountain Pass</span></span>
        </div>
      </div>

      <div className="field-map-stage" ref={stageRef}>
        <window.FieldMapBasemap />

        {/* Overlay matches the SVG's coordinate area exactly (inset 6px
                  to clear the inner border), so pin %s map cleanly. */}
        <div className="field-map-overlay">
          {pins.map((p) => {
            const { left, top } = window.projectToPercent(p.lat, p.lon);
            return (
              <button key={p.id}
              className={`field-map-pin ${active && active.id === p.id ? 'is-active' : ''}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              data-kind={p.kind}
              data-name-align={p.nameAlign || 'right'}
              aria-label={`${p.name} — ${p.kind === 'pass' ? 'mountain pass' : 'field site'} at ${p.altitude}`}
              aria-pressed={active && active.id === p.id}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId((h) => h === p.id ? null : h)}
              onFocus={() => setHoverId(p.id)}
              onBlur={() => setHoverId((h) => h === p.id ? null : h)}
              onClick={() => setActiveId((id) => id === p.id ? null : p.id)}>
                <span className="glyph" aria-hidden="true">
                  {p.kind === 'pass' ?
                  <span className="tri"></span> :
                  <span className="dot"></span>}
                </span>
                <span className="name">{p.name}</span>
              </button>);

          })}

          {/* Hover lens preview — only when hovering AND no pin actively
                    open with that same id; never blocks pointer events. */}
          {hover && (!active || active.id !== hover.id) &&
          <HoverLens pin={hover} />
          }
        </div>

        {/* Cartouche — title block inside the map */}
        <div className="field-map-cartouche">
          <span className="t">Ladakh</span>
          Fieldwork Atlas
          <span className="l">N 33°30′ — 35°00′<br />E 76°30′ — 79°30′</span>
        </div>
      </div>

      {/* Detail panel — below the map, never covers the geography */}
      <DetailPanel pin={active} onClose={() => setActiveId(null)} />

      {/* Pin navigator strip — quick hop between sites */}
      <div className="field-map-nav" role="tablist">
        {pins.map((p) =>
        <button key={p.id}
        role="tab"
        data-kind={p.kind}
        aria-selected={active && active.id === p.id}
        className={active && active.id === p.id ? 'is-active' : ''}
        onClick={() => setActiveId((id) => id === p.id ? null : p.id)}>
            <span className="marker" aria-hidden="true"></span>
            {p.name}
          </button>
        )}
      </div>
    </div>);

}

function HoverLens({ pin }) {
  const { left, top } = window.projectToPercent(pin.lat, pin.lon);
  // Position the lens above the pin; flip below when near the top edge.
  const flipBelow = top < 22;
  return (
    <div className="field-map-lens"
    style={{
      left: `${left}%`,
      top: `${top}%`,
      transform: flipBelow ?
      'translate(-50%, 28px)' :
      'translate(-50%, calc(-100% - 18px))'
    }}>
      <div className="lens-name">{pin.name}</div>
      <div className="lens-meta">
        {pin.kind === 'pass' ? 'Mountain Pass' : 'Field Site'} · {pin.altitude}
      </div>
      <div className="lens-icons">
        <span className="ic">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="3.5" width="14" height="10" rx="0.5" />
            <circle cx="8" cy="8.5" r="2.6" />
            <path d="M11 3.5l0.7-1.2h2.6l0.7 1.2" />
          </svg>
          Photo
        </span>
        <span className="ic">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="5" y="2" width="6" height="9" rx="3" />
            <path d="M3 8.5a5 5 0 0010 0M8 13.5v1.5M5.5 15h5" />
          </svg>
          Audio
        </span>
        <span className="ic">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 2.5h10v11H3z" />
            <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" />
          </svg>
          Note
        </span>
      </div>
    </div>);

}

function DetailPanel({ pin, onClose }) {
  if (!pin) {
    return (
      <div className="field-map-panel is-empty">
        <div className="panel-empty">
          Click any marker to open photographs, audio, and a field note.
        </div>
      </div>);

  }
  return (
    <div className="field-map-panel">
      <div className="panel-left">
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="panel-head">
          <div>
            <div className="label">
              {pin.kind === 'pass' ? 'Mountain Pass' : 'Field Site'}
            </div>
            <h4 className="name">
              {pin.name}
            </h4>
          </div>
          <div className="coords">
            {window.fmtCoord(pin.lat, pin.lon)}
            <span className="alt">elev. {pin.altitude}</span>
          </div>
        </div>
        <p className="panel-note">{pin.note}</p>
        <window.FieldRecorderPlayer pin={pin} />
      </div>

      <div className="panel-right">
        <div className="panel-photos">
          <div className="photo-main">
            <image-slot id={`map-${pin.id}-1`}
            shape="rect"
            placeholder={`Drop a photograph of ${pin.name}`}
            style={{ width: '100%', height: '100%' }}>
            </image-slot>
          </div>
          <div className="photo-thumbs">
            <image-slot id={`map-${pin.id}-2`} shape="rect"
            placeholder=" "
            style={{ width: '100%', height: '100%' }}>
            </image-slot>
            <image-slot id={`map-${pin.id}-3`} shape="rect"
            placeholder=" "
            style={{ width: '100%', height: '100%' }}>
            </image-slot>
            <image-slot id={`map-${pin.id}-4`} shape="rect"
            placeholder=" "
            style={{ width: '100%', height: '100%' }}>
            </image-slot>
          </div>
        </div>
      </div>
    </div>);

}

// =====================================================================
// FieldMapPreview — a non-interactive, link-wrapped thumbnail of the
// atlas. Used on the main page to invite visitors into the full
// version, which lives on the Ladakh field-site sub-page.
// =====================================================================
function FieldMapPreview({ target }) {
  const pins = window.FieldMapPins || [];
  return (
    <a className="field-map field-map-preview" href={target || '#'} aria-label="Open the Ladakh field atlas">
      <div className="field-map-head">
        <h3 data-i18n="map.title">Field, <span className="it">beyond the research.</span></h3>
        <div className="legend">
          <span className="swatch"><span className="dot"></span> <span data-i18n="map.legend.site">Village / Site</span></span>
          <span className="swatch"><span className="tri"></span> <span data-i18n="map.legend.pass">Mountain Pass</span></span>
        </div>
      </div>
      <div className="field-map-stage is-preview">
        <window.FieldMapBasemap />
        <div className="field-map-overlay">
          {pins.map((p) => {
            const { left, top } = window.projectToPercent(p.lat, p.lon);
            return (
              <span key={p.id}
                    className="field-map-pin is-static"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    data-kind={p.kind}
                    data-name-align={p.nameAlign || 'right'}>
                <span className="glyph" aria-hidden="true">
                  {p.kind === 'pass'
                    ? <span className="tri"></span>
                    : <span className="dot"></span>}
                </span>
                <span className="name">{p.name}</span>
              </span>
            );
          })}
        </div>
        <div className="field-map-cartouche">
          <span className="t">Ladakh</span>
          <span data-i18n="map.preview.atlas">Fieldwork Atlas</span>
          <span className="l">N 33°30′ — 35°00′<br />E 76°30′ — 79°30′</span>
        </div>
        <div className="field-map-preview-cta" aria-hidden="true">
          <span data-i18n="map.preview.cta">Open the field atlas</span>
          <span className="arrow">→</span>
        </div>
      </div>
    </a>
  );
}

// Mount.
function mountFieldMap() {
  const root = document.getElementById('field-map-root');
  if (!root) return;
  const isPreview = root.getAttribute('data-preview') === 'true';
  const target = root.getAttribute('data-target') || '';
  ReactDOM.createRoot(root).render(
    isPreview ? <FieldMapPreview target={target} /> : <FieldMap />
  );
  // After React commits, re-apply current language so newly-rendered
  // [data-i18n] elements inside the map pick up their translations.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const lang = document.body.getAttribute('data-lang') || 'en';
      if (typeof window.applyLang === 'function') window.applyLang(lang);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountFieldMap);
} else {
  mountFieldMap();
}