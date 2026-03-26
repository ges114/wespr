import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ScanLine, Copy, ExternalLink, CheckCircle2, RotateCcw, Camera, QrCode, AlertCircle, Zap } from "lucide-react";
import { Button } from "./ui/button";
import jsQR from "jsqr";

type ScanResult = {
  text: string;
  type: "url" | "text" | "payment" | "contact";
};

function classifyResult(text: string): ScanResult {
  if (text.startsWith("http://") || text.startsWith("https://")) {
    return { text, type: "url" };
  }
  if (text.startsWith("wespr://pay") || text.includes("payment") || text.includes("betaal")) {
    return { text, type: "payment" };
  }
  if (text.startsWith("BEGIN:VCARD") || text.includes("MECARD:")) {
    return { text, type: "contact" };
  }
  return { text, type: "text" };
}

const demoQRCodes = [
  { label: "Website Link", value: "https://w€spr-app.eu/promo", icon: "🌐", desc: "Open een website" },
  { label: "Betaling €12,50", value: "wespr://pay?amount=1250&to=sophie", icon: "💳", desc: "Betaal aan Sophie" },
  { label: "Contact toevoegen", value: "BEGIN:VCARD\nFN:Sophie Laurent\nTEL:+31612345678\nEND:VCARD", icon: "👤", desc: "Sla een contact op" },
  { label: "WiFi Netwerk", value: "WIFI:S:CafeAmsterdam;T:WPA;P:koffie2025;;", icon: "📶", desc: "Verbind met WiFi" },
  { label: "Evenement Ticket", value: "https://events.w€spr-app.eu/ticket/WESPR-2026-0224", icon: "🎫", desc: "Bekijk je ticket" },
];

function CameraScanner({ onScan, onError }: { onScan: (text: string) => void; onError: (msg: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [scanning, setScanning] = useState(true);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          scanLoop();
        }
      } catch (err: any) {
        if (!mounted) return;
        if (err.name === "NotAllowedError") {
          onError("Camera toegang geweigerd. Sta camera toegang toe in je browser instellingen.");
        } else if (err.name === "NotFoundError") {
          onError("Geen camera gevonden op dit apparaat.");
        } else if (err.name === "NotReadableError" || err.name === "AbortError") {
          onError("Camera is bezet door een andere app. Sluit andere apps die de camera gebruiken.");
        } else {
          onError("Kan de camera niet openen. Probeer het opnieuw of gebruik de demo modus.");
        }
      }
    }

    function scanLoop() {
      if (!mounted || !scanning) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
          setScanning(false);
          stopCamera();
          onScan(code.data);
          return;
        }
      } catch {}

      animFrameRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [onScan, onError, scanning, stopCamera]);

  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl" />
        <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-scan-line" />
      </div>
    </div>
  );
}

export function Scanner({ onBack, onOpenWallet }: { onBack: () => void; onOpenWallet?: () => void }) {
  const [mode, setMode] = useState<"choose" | "camera" | "demo">("choose");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScan = useCallback((text: string) => {
    setScanResult(classifyResult(text));
  }, []);

  const handleCameraError = useCallback((msg: string) => {
    setCameraError(msg);
  }, []);

  const handleDemoScan = (value: string) => {
    setScanResult(classifyResult(value));
  };

  const handleCopy = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult.text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setCameraError(null);
    setCopied(false);
    if (mode === "camera") {
      setMode("camera");
    }
  };

  const handleBackToChoose = () => {
    setScanResult(null);
    setCameraError(null);
    setCopied(false);
    setMode("choose");
  };

  return (
    <div className="flex flex-col min-h-full bg-black text-white">
      <header className="px-4 py-4 flex items-center justify-between shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={mode === "choose" ? onBack : handleBackToChoose}
          className="text-white hover:bg-white/20 rounded-full"
          data-testid="scanner-back"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="font-medium text-lg tracking-wide">QR Scanner</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-start px-5 pt-4 pb-8 overflow-y-auto">
        {scanResult ? (
          <div className="w-full">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-center mb-1">QR-code gescand!</h3>
              <p className="text-white/50 text-xs text-center mb-4 uppercase tracking-wider font-medium">
                {scanResult.type === "url" ? "Website Link" :
                 scanResult.type === "payment" ? "Betaling" :
                 scanResult.type === "contact" ? "Contact" : "Tekst"}
              </p>
              <div className="bg-black/30 rounded-xl p-4 mb-5 max-h-32 overflow-y-auto">
                <p className="text-sm text-white/80 break-all font-mono leading-relaxed">{scanResult.text}</p>
              </div>
              <div className="space-y-2">
                {scanResult.type === "url" && (
                  <Button onClick={() => window.open(scanResult.text, "_blank")} className="w-full rounded-xl bg-primary hover:bg-primary/90 gap-2 h-12" data-testid="scanner-open-url">
                    <ExternalLink className="w-4 h-4" /> Openen in browser
                  </Button>
                )}
                {scanResult.type === "payment" && (
                  <Button onClick={() => onOpenWallet?.()} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 h-12" data-testid="scanner-pay">
                    <ScanLine className="w-4 h-4" /> Betaling uitvoeren
                  </Button>
                )}
                <Button onClick={handleCopy} variant="outline" className="w-full rounded-xl border-white/20 text-white hover:bg-white/10 gap-2 h-12" data-testid="scanner-copy">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Gekopieerd!" : "Kopiëren"}
                </Button>
                <Button onClick={handleReset} variant="ghost" className="w-full rounded-xl text-white/70 hover:text-white hover:bg-white/10 gap-2 h-12" data-testid="scanner-reset">
                  <RotateCcw className="w-4 h-4" /> Opnieuw scannen
                </Button>
              </div>
            </div>
          </div>
        ) : mode === "choose" ? (
          <div className="w-full flex flex-col items-center gap-4 pt-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-2">
              <ScanLine className="w-10 h-10 text-white/60" />
            </div>
            <h2 className="text-xl font-bold">QR Scanner</h2>
            <p className="text-white/40 text-sm text-center mb-4">Kies hoe je wilt scannen</p>

            <button
              type="button"
              onClick={() => { setCameraError(null); setMode("camera"); }}
              className="w-full flex items-center gap-4 bg-white/10 rounded-2xl p-5 text-left active:bg-white/20 transition-colors border border-white/10"
              data-testid="scanner-choose-camera"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Camera gebruiken</p>
                <p className="text-xs text-white/50 mt-0.5">Scan een QR-code met je camera</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("demo")}
              className="w-full flex items-center gap-4 bg-white/10 rounded-2xl p-5 text-left active:bg-white/20 transition-colors border border-white/10"
              data-testid="scanner-choose-demo"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Demo QR-codes</p>
                <p className="text-xs text-white/50 mt-0.5">Test met voorbeeldcodes</p>
              </div>
            </button>
          </div>
        ) : mode === "camera" ? (
          <div className="w-full flex flex-col items-center gap-4">
            {cameraError ? (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-300 mb-1">Camera fout</p>
                    <p className="text-sm text-white/70">{cameraError}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => { setCameraError(null); setMode("camera"); }}
                    className="w-full rounded-xl bg-white/10 hover:bg-white/20 gap-2 h-11"
                    data-testid="scanner-retry-camera"
                  >
                    <RotateCcw className="w-4 h-4" /> Opnieuw proberen
                  </Button>
                  <Button
                    onClick={() => setMode("demo")}
                    variant="ghost"
                    className="w-full rounded-xl text-white/70 hover:text-white hover:bg-white/10 gap-2 h-11"
                    data-testid="scanner-switch-demo"
                  >
                    <QrCode className="w-4 h-4" /> Gebruik demo modus
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-white/50 text-sm mb-2">Richt je camera op een QR-code</p>
                <CameraScanner onScan={handleScan} onError={handleCameraError} />
                <p className="text-white/30 text-xs mt-3">Scannen gebeurt automatisch</p>
                <Button
                  onClick={() => setMode("demo")}
                  variant="ghost"
                  className="mt-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl gap-2"
                  data-testid="scanner-to-demo"
                >
                  <QrCode className="w-4 h-4" /> Gebruik demo codes
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8 text-white/60" />
              </div>
              <h2 className="text-lg font-bold">Demo QR-codes</h2>
              <p className="text-white/40 text-sm mt-1">Tik op een code om te scannen</p>
            </div>
            <div className="space-y-2.5">
              {demoQRCodes.map((qr) => (
                <button
                  key={qr.label}
                  type="button"
                  onClick={() => handleDemoScan(qr.value)}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-xl p-4 text-left active:bg-white/20 transition-colors border border-white/10"
                  data-testid={`demo-qr-${qr.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <span className="text-2xl">{qr.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{qr.label}</p>
                    <p className="text-xs text-white/50">{qr.desc}</p>
                  </div>
                  <ScanLine className="w-5 h-5 text-white/30 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
