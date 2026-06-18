import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useLanguage } from '@/contexts/LanguageContext';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// Camera barcode scanner (ZXing). Uses decodeFromConstraints — a single call
// that requests the camera (triggering the permission prompt), attaches the
// stream to the <video>, and decodes continuously. Prefers the rear camera.
// On any failure it shows a clear, retryable message; the user can always type
// the barcode instead.
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onDetected }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  const stopAll = useCallback(() => {
    try { controlsRef.current?.stop(); } catch { /* noop */ }
    controlsRef.current = null;
    // Belt-and-braces: release any stream still attached to the video.
    const v = videoRef.current;
    const s = v?.srcObject as MediaStream | null;
    if (s) { s.getTracks().forEach((tk) => { try { tk.stop(); } catch { /* noop */ } }); }
    if (v) v.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStarting(true);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(t('scan.notSupported') || 'Scanning needs a secure (https) connection and a camera.');
      setStarting(false);
      return;
    }

    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current!,
        (result, _err, ctrl) => {
          if (result) {
            const text = result.getText();
            try { ctrl.stop(); } catch { /* noop */ }
            stopAll();
            onDetected(text);
            onClose();
          }
        },
      );
      controlsRef.current = controls;
      setStarting(false);
    } catch (e: any) {
      const name = e?.name || '';
      let msg: string;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        msg = t('scan.permissionDenied') || 'Camera access is blocked. Allow camera permission for this site (and enable Camera for your browser in your system settings), then try again.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
        msg = t('scan.noCamera') || 'No camera found. Type the barcode instead.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = t('scan.cameraBusy') || 'The camera is in use by another app. Close it and try again.';
      } else {
        msg = e?.message || t('scan.cameraError') || 'Camera unavailable';
      }
      setError(msg);
      setStarting(false);
    }
  }, [t, onDetected, onClose, stopAll]);

  useEffect(() => {
    if (!isOpen) return;
    start();
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          {!error && !starting && <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />}
          {starting && !error && <span className="absolute text-white/70 text-sm">{t('scan.starting') || 'Starting camera…'}</span>}
        </div>

        {error ? (
          <>
            <p className="mt-3 text-sm text-red-300 text-center">{error}</p>
            <button onClick={start} className="mt-3 w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">
              {t('scan.retry') || 'Try again'}
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-white/80 text-center">{t('scan.aim') || 'Point the camera at a barcode'}</p>
        )}
        <button onClick={() => { stopAll(); onClose(); }} className="mt-3 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
          {t('common.cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
