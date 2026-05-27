// =====================================================================
// Field-recorder audio player.
//
// Tries to load <pin>.mp3 from audio/. If it can't load OR file is
// missing, renders the placeholder "pending upload" state with the
// player chrome still visible so the design intent is clear.
// =====================================================================

function FieldRecorderPlayer({ pin }) {
  const audioRef = React.useRef(null);
  const [state, setState] = React.useState({
    ready: false,
    missing: false,
    playing: false,
    time: 0,
    duration: 0,
  });

  // Error boundary inside the component — guards each render against
  // edge cases (stale refs, audio decode failures, etc).
  if (!pin || typeof pin !== 'object') return null;

  // Build a list of candidate URLs by extension so we don't have to
  // commit to a single format up-front. Audio base is configurable via
  // <meta name="field-map-audio-base" content="../audio/"> so the same
  // pin id resolves correctly whether the host page lives at the
  // project root or in a subfolder (e.g. border-regions/ladakh.html).
  const audioBase =
    document.querySelector('meta[name="field-map-audio-base"]')?.content
    || 'audio/';
  const sources = (window.AUDIO_EXTENSIONS || ['mp3','m4a','ogg','wav'])
    .map((ext) => `${audioBase}${pin.id}.${ext}`);

  React.useEffect(() => {
    // Reset state when pin changes
    setState({ ready: false, missing: false, playing: false, time: 0, duration: 0 });
    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      a.load();
    } catch (_) { /* element may be detaching */ }
  }, [pin.id]);

  const onLoaded = (e) => {
    const a = e.currentTarget;
    if (!a) return;
    if (!isFinite(a.duration) || a.duration <= 0) {
      setState((s) => ({ ...s, ready: false, missing: true }));
    } else {
      setState((s) => ({ ...s, ready: true, missing: false, duration: a.duration }));
    }
  };
  const onError = () => {
    setState((s) => ({ ...s, ready: false, missing: true }));
  };
  const onTime = (e) => {
    const a = e.currentTarget;
    if (!a) return;
    const t = a.currentTime;
    setState((s) => ({ ...s, time: isFinite(t) ? t : 0 }));
  };
  const onPlay  = () => setState((s) => ({ ...s, playing: true }));
  const onPause = () => setState((s) => ({ ...s, playing: false }));
  const onEnded = () => setState((s) => ({ ...s, playing: false, time: 0 }));

  const toggle = () => {
    const a = audioRef.current;
    if (!a || state.missing) return;
    try {
      if (state.playing) a.pause(); else a.play().catch(() => {});
    } catch (_) {}
  };

  const seek = (clientX, trackEl) => {
    const a = audioRef.current;
    if (!a || !state.ready || !trackEl) return;
    const r = trackEl.getBoundingClientRect();
    const t = ((clientX - r.left) / r.width) * state.duration;
    try {
      a.currentTime = Math.max(0, Math.min(state.duration, t));
    } catch (_) {}
  };

  const pct = state.duration > 0 ? (state.time / state.duration) * 100 : 0;

  return (
    <div className={`panel-audio ${state.playing ? 'is-playing' : ''}`}>
      <audio ref={audioRef}
             onLoadedMetadata={onLoaded}
             onError={onError}
             onTimeUpdate={onTime}
             onPlay={onPlay}
             onPause={onPause}
             onEnded={onEnded}
             preload="metadata">
        {sources.map((src) => <source key={src} src={src} />)}
      </audio>

      <div className="rec-head">
        <span className="left">
          <span className="rec-dot" aria-hidden="true"></span>
          <span>{state.playing ? 'REC · PLAYING' : 'FIELD RECORDING'}</span>
        </span>
        <span>{`R-07 · ${pin.id.toUpperCase()}`}</span>
      </div>

      <div className="rec-body">
        <div className="tape-reels" aria-hidden="true">
          <div className="tape-reel"></div>
          <div className="tape-reel"></div>
        </div>

        <div className="audio-scrub">
          {state.missing ? (
            <div className="audio-empty">
              Pending upload — drop&nbsp;
              <code style={{fontFamily:'var(--mono)',fontSize:'10px'}}>audio/{pin.id}.mp3</code>
              &nbsp;into the project
            </div>
          ) : (
            <>
              <div className="track"
                   role="slider"
                   tabIndex={0}
                   aria-label={`Audio scrubber: ${pin.name}`}
                   aria-valuemin={0}
                   aria-valuemax={Math.round(state.duration || 0)}
                   aria-valuenow={Math.round(state.time || 0)}
                   onClick={(e) => seek(e.clientX, e.currentTarget)}>
                <div className="progress" style={{ width: `${pct}%` }} />
                <div className="playhead" style={{ left: `${pct}%` }} />
              </div>
              <div className="timecode">
                <span>{formatTime(state.time)}</span>
                <span>{formatTime(state.duration)}</span>
              </div>
            </>
          )}
        </div>

        <button className={`audio-btn ${state.missing ? 'is-disabled' : ''}`}
                onClick={toggle}
                disabled={state.missing}
                aria-label={state.playing ? 'Pause' : 'Play'}>
          {state.playing ? (
            <span className="pause-bars" aria-hidden="true"><span/><span/></span>
          ) : (
            <span className="play-tri" aria-hidden="true"></span>
          )}
        </button>
      </div>

      {pin.caption ? <div className="audio-caption">{pin.caption}</div> : null}
    </div>
  );
}

function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}

window.FieldRecorderPlayer = FieldRecorderPlayer;
