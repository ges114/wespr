import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ScanLine } from "lucide-react";
import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";

const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";

interface KassaData {
  session: string;
  merchantName: string;
  merchantLocation: string;
  merchantKvk: string;
  amount: number;
  items: { name: string; quantity: number; price: number }[];
  qrData: string;
}

function EuStars({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill={EU_YELLOW}>
            ★
          </text>
        );
      })}
    </svg>
  );
}

export default function KassaTerminalScreen({
  kassaData,
  onScan,
  onClose,
}: {
  kassaData: KassaData;
  onScan: () => void;
  onClose: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const fmtAmount = (cents: number) =>
    `€\u00A0${Math.floor(cents / 100).toLocaleString("nl-NL")},${(cents % 100).toString().padStart(2, "0")}`;

  const handleScan = () => {
    setScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(onScan, 300);
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60 text-xs font-medium">Kassamodule actief</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1a3a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="px-5 pt-5 pb-3 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Betaalterminal</p>
                <p className="text-white font-bold text-lg leading-tight">{kassaData.merchantName}</p>
                <p className="text-white/40 text-[11px]">{kassaData.merchantLocation}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: EU_BLUE }}>
                  <EuStars size={32} />
                </div>
                <span className="text-[9px] font-bold" style={{ color: EU_YELLOW }}>eIDAS 2.0</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 flex flex-col items-center">
            <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Scan om te betalen</p>

            <div className="relative">
              <div className="bg-white rounded-2xl p-3 shadow-lg">
                <QRCodeSVG
                  value={kassaData.qrData}
                  size={200}
                  fgColor={EU_BLUE}
                  bgColor="white"
                  level="M"
                />
              </div>

              {scanning && (
                <motion.div
                  className="absolute left-3 right-3 h-0.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${EU_BLUE}, transparent)`, top: `calc(12px + ${scanProgress * 1.76}px)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/40 text-xs mb-0.5">Totaalbedrag</p>
              <p className="text-white text-4xl font-black tracking-tight">{fmtAmount(kassaData.amount)}</p>
            </div>

            {kassaData.items.length > 0 && (
              <div className="mt-3 w-full space-y-1">
                {kassaData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-white/40">{item.quantity}× {item.name}</span>
                    <span className="text-white/60">€ {(item.price / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 pb-5">
            <Button
              className="w-full h-13 rounded-2xl font-bold text-sm gap-2 border-0"
              style={{ background: EU_BLUE, color: "white" }}
              onClick={handleScan}
              disabled={scanning}
              data-testid="btn-scan-kassa-qr"
            >
              <ScanLine className="w-4 h-4" />
              {scanning ? `Scannen… ${scanProgress}%` : "Scan met W€spr Pay"}
            </Button>

            <div className="flex items-center justify-center gap-2 mt-3">
              <EuStars size={18} />
              <span className="text-[10px] text-white/30">EUDI Wallet · OpenID4VP · TLS 1.3</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/25 text-[10px] mt-3">
          Sessie: {kassaData.session} · KvK {kassaData.merchantKvk}
        </p>
      </motion.div>
    </div>
  );
}
