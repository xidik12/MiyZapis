import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useLanguage } from '@/contexts/LanguageContext';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// Camera barcode scanner (ZXing) — opens the device camera, reads 1D barcodes
// (EAN/UPC/Code128…) and returns the first decode. Works on the website and in
// the native app webview; requires camera permission + a secure (https) origin.
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onDetected }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let stopped = false;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, _err, ctrl) => {
            if (result && !stopped) {
              stopped = true;
              const text = result.getText();
              try { ctrl.stop(); } catch { /* noop */ }
              onDetected(text);
              onClose();
            }
          },
        );
        controlsRef.current = controls;
      } catch (e: any) {
        setError(e?.message || t('scan.cameraError') || 'Camera unavailable');
      }
    })();

    return () => {
      stopped = true;
      try { controlsRef.current?.stop(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!error && <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-300 text-center">{error}</p>
        ) : (
          <p className="mt-3 text-sm text-white/80 text-center">{t('scan.aim') || 'Point the camera at a barcode'}</p>
        )}
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
          {t('common.cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
