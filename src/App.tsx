import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from '@/engine/Game';
import { LANGUAGES, changeLanguage, type Language } from '@/i18n';
import { useSettings } from '@/store/settings';

export default function App(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const { t } = useTranslation();
  const muted = useSettings((state) => state.muted);
  const language = useSettings((state) => state.language);
  const setMuted = useSettings((state) => state.setMuted);
  const setLanguage = useSettings((state) => state.setLanguage);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return;
    const game = new Game(canvasRef.current);
    gameRef.current = game;
    void game.start();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    void changeLanguage(language);
  }, [language]);

  useEffect(() => {
    document.title = t('meta.title');
  }, [t]);

  useEffect(() => {
    const onMuted = (event: Event): void => setMuted(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('ip-please:muted', onMuted);
    return () => window.removeEventListener('ip-please:muted', onMuted);
  }, [setMuted]);

  const toggleFullscreen = (): void => {
    type WebkitDocument = Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    const doc = document as WebkitDocument;
    const root = document.documentElement as WebkitElement;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
      void exit?.call(doc);
      return;
    }
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    const promise = request?.call(root);
    if (promise && typeof promise.then === 'function') {
      promise
        .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> } | undefined)?.lock?.('landscape'))
        .catch(() => {});
    }
  };

  type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
  const supportsFullscreen = Boolean(
    document.documentElement.requestFullscreen ||
      (document.documentElement as WebkitElement).webkitRequestFullscreen,
  );

  return (
    <>
      <canvas ref={canvasRef} width={640} height={360} aria-label="IP, PLEASE" />
      <div className="ui">
        <select
          aria-label={t('common.language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
        >
          {LANGUAGES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setMuted(!muted)}>
          {t(muted ? 'common.soundOff' : 'common.soundOn')}
        </button>
        {supportsFullscreen && (
          <button type="button" onClick={toggleFullscreen}>
            {t('common.fullscreen')}
          </button>
        )}
      </div>
      <div id="rotate" className={rotateDismissed ? '' : 'show'}>
        <div>{t('common.rotateTitle')}</div>
        <small>{t('common.rotateSub')}</small>
        <button type="button" onClick={() => setRotateDismissed(true)}>
          {t('common.rotatePlay')}
        </button>
      </div>
    </>
  );
}
