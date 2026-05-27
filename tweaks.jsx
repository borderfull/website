// Tweaks for the portfolio
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "design": "gallery",
  "theme": "parchment",
  "accent": "#b15a3a",
  "density": "standard",
  "cursorMode": "cartographer",
  "showContour": true
}/*EDITMODE-END*/;

const ACCENT_NAME = {
  "#b15a3a": "terracotta",
  "#4a6d8c": "horizon",
  "#6d7d4a": "moss",
  "#1c1814": "ink",
};

function PortfolioTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply to body
  React.useEffect(() => {
    document.body.setAttribute('data-design', t.design);
    document.body.setAttribute('data-theme', t.theme);
    document.body.setAttribute('data-accent', ACCENT_NAME[t.accent] || 'terracotta');
    document.body.setAttribute('data-density', t.density);
    document.body.setAttribute('data-cursor-mode', t.cursorMode);
    const contour = document.querySelector('.hero-contour');
    if (contour) contour.style.display = t.showContour ? '' : 'none';
    // When switching INTO a design mode, immediately reveal anything
    // already in the viewport so it doesn't flash invisible.
    if (t.design !== 'original') {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
          el.classList.add('is-in');
        }
      });
    }
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Design">
        <TweakRadio
          label="Direction"
          value={t.design}
          onChange={(v) => setTweak('design', v)}
          options={[
            { value: 'original', label: 'Original' },
            { value: 'snow', label: 'Snow' },
            { value: 'chapters', label: 'Chapters' },
            { value: 'gallery', label: 'Gallery' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Theme">
        <TweakRadio
          label="Mood"
          value={t.theme}
          onChange={(v) => setTweak('theme', v)}
          options={[
            { value: 'parchment', label: 'Paper' },
            { value: 'ivory', label: 'Ivory' },
            { value: 'midnight', label: 'Night' },
          ]}
        />
        <TweakColor
          label="Accent"
          value={t.accent}
          onChange={(v) => setTweak('accent', v)}
          options={["#b15a3a", "#4a6d8c", "#6d7d4a", "#1c1814"]}
        />
      </TweakSection>

      <TweakSection label="Layout">
        <TweakRadio
          label="Density"
          value={t.density}
          onChange={(v) => setTweak('density', v)}
          options={[
            { value: 'tight', label: 'Tight' },
            { value: 'standard', label: 'Standard' },
            { value: 'airy', label: 'Airy' },
          ]}
        />
        <TweakToggle
          label="Hero contour map"
          value={t.showContour}
          onChange={(v) => setTweak('showContour', v)}
        />
      </TweakSection>

      <TweakSection label="Cursor">
        <TweakRadio
          label="Mode"
          value={t.cursorMode}
          onChange={(v) => setTweak('cursorMode', v)}
          options={[
            { value: 'cartographer', label: 'Cartographer' },
            { value: 'off', label: 'Off' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const __twkRoot = ReactDOM.createRoot(document.getElementById('tweaks-root'));
__twkRoot.render(<PortfolioTweaks />);
