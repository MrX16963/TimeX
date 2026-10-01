import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function LandingPage() {
  const baseUrl = import.meta.env.BASE_URL;
  const appHref = `${baseUrl}app.html`;
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installError, setInstallError] = useState(false);
  const guideCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";

    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstallGuide(false);
    };
    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (showInstallGuide) guideCloseRef.current?.focus();
  }, [showInstallGuide]);

  async function installTimeX() {
    setInstallError(false);
    if (installed) {
      window.location.assign(appHref);
      return;
    }
    if (!installPrompt) {
      setShowInstallGuide(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === "accepted") setInstalled(true);
    } catch (error) {
      console.error("TimeX installation prompt failed.", error);
      setInstallPrompt(null);
      setInstallError(true);
    }
  }

  return (
    <div className="marketing-site">
      <header className="site-header">
        <a className="site-brand" href={baseUrl} aria-label="TimeX home">
          <span className="site-brand-mark">t.</span>
          <span>TimeX</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#download">Download</a>
        </nav>
        <a className="site-header-link" href={appHref}>Open the app <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="site-hero">
          <div className="site-hero-copy">
            <span className="site-kicker"><span /> A calmer way to get things done</span>
            <h1>Your time.<br />Your priorities.<br /><span>Your pace.</span></h1>
            <p className="site-hero-description">
              Meet a thoughtful planner that helps you focus on what matters,
              one small step at a time.
            </p>
            <div className="site-hero-actions">
              <button className="site-primary-button" type="button" onClick={() => void installTimeX()}>
                <span aria-hidden="true">{installed ? "↗" : "↓"}</span>
                {installed ? "Open TimeX" : "Install TimeX"}
              </button>
              <a className="site-secondary-button" href={appHref}>Explore the app <span aria-hidden="true">↗</span></a>
            </div>
            <div className="site-platform-note">
              <span aria-hidden="true">▣</span> For Windows &amp; Android · Free · No account needed
            </div>
          </div>
          <div className="site-hero-visual" aria-label="Preview of the TimeX daily planner">
            <div className="site-orbit site-orbit-one" />
            <div className="site-orbit site-orbit-two" />
            <div className="preview-window">
              <div className="preview-topbar">
                <span className="preview-brand"><span>t.</span> TimeX</span>
                <span className="preview-avatar">S</span>
              </div>
              <div className="preview-content">
                <div className="preview-date">WEDNESDAY, OCTOBER 1</div>
                <h2>Make room for what matters.</h2>
                <p>Choose one thing and begin there.</p>
                <div className="preview-stats">
                  <div><span>In progress</span><strong>03</strong></div>
                  <div><span>Completed</span><strong>02</strong></div>
                  <div><span>Momentum</span><strong>20</strong></div>
                </div>
                <div className="preview-task-heading"><strong>Today's focus</strong><span>03 tasks</span></div>
                <div className="preview-task"><i className="preview-check checked">✓</i><span>Set an intention for today</span><b>Done</b></div>
                <div className="preview-task"><i className="preview-check" /><span>Make progress on the big idea</span><b className="preview-tag">Important</b></div>
                <div className="preview-task"><i className="preview-check" /><span>Take a proper lunch break</span><b className="preview-tag peach">Today</b></div>
                <div className="preview-focus">
                  <span>◷ &nbsp; A LITTLE FOCUS GOES A LONG WAY</span>
                  <strong>24:18</strong>
                  <i><span /></i>
                  <b>Keep going</b>
                </div>
              </div>
            </div>
            <div className="floating-note"><span>✳</span><div><strong>One step at a time</strong><small>Your progress counts.</small></div></div>
            <div className="visual-spark visual-spark-one">✳</div>
            <div className="visual-spark visual-spark-two">✦</div>
          </div>
        </section>

        <section className="site-trustbar" aria-label="TimeX highlights">
          <span><i>✓</i> Your data stays on your device</span>
          <span><i>◉</i> Works offline after your first visit</span>
          <span><i>文</i> Arabic &amp; English</span>
          <span><i>✦</i> Free to use</span>
        </section>

        <section className="site-section features-section" id="features">
          <div className="site-section-heading">
            <span className="site-kicker">A little more intention</span>
            <h2>Everything you need.<br /><span>Nothing getting in the way.</span></h2>
            <p>Simple tools, thoughtfully brought together to help you make your time your own.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-icon lavender">▦</span>
              <h3>Know what matters</h3>
              <p>Sort tasks by importance and urgency. Decide what to do now, plan, delegate, or let go.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon peach">◷</span>
              <h3>Find your focus</h3>
              <p>Settle into a gentle 25-minute focus session, one thing at a time.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon mint">✦</span>
              <h3>Celebrate progress</h3>
              <p>Every completed task earns points. Small wins deserve to feel like wins.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon butter">✳</span>
              <h3>Make a plan</h3>
              <p>Turn a big goal into a handful of smaller steps with a private, guided planner.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon mint">▤</span>
              <h3>Keep your thoughts</h3>
              <p>Capture notes, reminders, and ideas alongside the rest of your day.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon lavender">◐</span>
              <h3>Make it feel like yours</h3>
              <p>Choose a calming color theme and switch between Arabic and English whenever you like.</p>
            </article>
          </div>
        </section>

        <section className="site-how-section" id="how-it-works">
          <div className="site-section-heading">
            <span className="site-kicker">A fresh start, in three steps</span>
            <h2>Start small. <span>Find your flow.</span></h2>
          </div>
          <div className="steps-grid">
            <article><span className="step-index">01</span><h3>Get it on your device</h3><p>Install TimeX from your browser on Windows or Android. No store account required.</p></article>
            <article><span className="step-index">02</span><h3>Choose what matters</h3><p>Add a task, capture an idea, or ask the guided planner to help you find a first step.</p></article>
            <article><span className="step-index">03</span><h3>Make a little progress</h3><p>Focus for a while, celebrate what you finish, and let the rest wait its turn.</p></article>
          </div>
        </section>

        <section className="site-download-section" id="download">
          <div className="download-glow" />
          <div className="download-copy">
            <span className="site-kicker">A little more room in your day</span>
            <h2>Make time for what matters.</h2>
            <p>Install TimeX on Windows or Android and bring your calm workspace along. It is free, private, and ready when you are.</p>
            {installError && <p className="download-error" role="alert">Your browser could not open the install prompt. Use its menu to install TimeX instead.</p>}
          </div>
          <div className="download-options">
            <article className="download-card">
              <span className="download-device-icon" aria-hidden="true">▱</span>
              <div><h3>For Windows</h3><p>Install from Chrome or Edge</p></div>
              <button type="button" onClick={() => void installTimeX()} aria-label={installed ? "Open TimeX on Windows" : "Install TimeX on Windows"}>{installed ? "↗" : "↓"}</button>
            </article>
            <article className="download-card">
              <span className="download-device-icon android-icon" aria-hidden="true">▯</span>
              <div><h3>For Android</h3><p>Install from Chrome</p></div>
              <button type="button" onClick={() => void installTimeX()} aria-label={installed ? "Open TimeX on Android" : "Install TimeX on Android"}>{installed ? "↗" : "↓"}</button>
            </article>
            <span className="download-footnote">Secure browser install · No APK or EXE download · Always free</span>
          </div>
        </section>

        <section className="site-privacy-note">
          <span className="privacy-mark" aria-hidden="true">⌑</span>
          <div><strong>Your day is yours.</strong><p>Your tasks, notes, and plans stay in your browser on this device. TimeX does not require an account or send your personal data to a server.</p></div>
          <a href={appHref}>Take a look around <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="site-brand" href={import.meta.env.BASE_URL} aria-label="TimeX home"><span className="site-brand-mark">t.</span><span>TimeX</span></a>
        <span>Created by MrX OSA</span>
        <a href={appHref}>Open TimeX <span aria-hidden="true">↗</span></a>
      </footer>

      {showInstallGuide && (
        <div
          className="site-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowInstallGuide(false);
          }}
        >
          <section
            className="site-install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-guide-heading"
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowInstallGuide(false);
            }}
          >
            <button
              ref={guideCloseRef}
              className="site-modal-close"
              type="button"
              aria-label="Close"
              onClick={() => setShowInstallGuide(false)}
            >×</button>
            <span className="site-brand-mark modal-brand-mark">t.</span>
            <h2 id="install-guide-heading">Install TimeX on your device</h2>
            <p>TimeX installs securely from your browser and opens like a regular app. Your data stays in your browser on this device.</p>
            <div className="install-instructions">
              <article><span>▱</span><div><strong>Windows</strong><p>In Chrome or Edge, select the install icon in the address bar, or choose “Install TimeX” from the browser menu.</p></div></article>
              <article><span>▯</span><div><strong>Android</strong><p>In Chrome, open the menu and choose “Install app” or “Add to Home screen.”</p></div></article>
              <article><span>⌑</span><div><strong>iPhone &amp; iPad</strong><p>In Safari, tap Share, then choose “Add to Home Screen.”</p></div></article>
            </div>
            <button className="site-primary-button modal-done" type="button" onClick={() => setShowInstallGuide(false)}>Got it</button>
          </section>
        </div>
      )}
    </div>
  );
}
