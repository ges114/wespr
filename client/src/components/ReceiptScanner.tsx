import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, X, Check, Loader2, RotateCcw, ScanLine, Receipt, Pencil, Trash2, Plus, FileDown, AlertCircle, Image } from "lucide-react";
import { Button } from "./ui/button";
import { createWorker } from "tesseract.js";

interface ReceiptItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface ParsedReceipt {
  merchant: { name: string; address: string; city: string; kvk: string; btw: string };
  items: ReceiptItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  note: string;
}

type ScanPhase = "camera" | "processing" | "review" | "edit";

function fmtCents(c: number) {
  const neg = c < 0;
  const abs = Math.abs(c);
  return `${neg ? "-" : ""}€${(abs / 100).toFixed(2)}`;
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 1);

  let merchantName = "";
  let address = "";
  let city = "";
  let kvk = "";
  let btw = "";
  const items: ReceiptItem[] = [];
  let total = 0;
  let subtotal = 0;
  let vatAmount = 0;
  let vatRate = 0;

  if (lines.length > 0) merchantName = lines[0];
  if (lines.length > 1 && !lines[1].match(/\d{1,3}[.,]\d{2}/)) {
    address = lines[1];
  }

  const kvkMatch = text.match(/KvK[:\s]*(\d+)/i);
  if (kvkMatch) kvk = kvkMatch[1];
  const btwMatch = text.match(/BTW[:\s]*(NL\w+)/i);
  if (btwMatch) btw = btwMatch[1];

  const priceRegex = /^(.+?)\s+(\d+)\s*[xX]\s*[\u20AC€]?\s*(\d+[.,]\d{2})\s+[\u20AC€]?\s*(\d+[.,]\d{2})$/;
  const simplePriceRegex = /^(.+?)\s{2,}[\u20AC€]?\s*(-?\d+[.,]\d{2})$/;
  const singlePriceRegex = /^(.+?)\s+[\u20AC€]\s*(-?\d+[.,]\d{2})$/;

  for (const line of lines) {
    const totalMatch = line.match(/(?:totaal|total|te betalen|betaald|pin)[:\s]*[\u20AC€]?\s*(\d+[.,]\d{2})/i);
    if (totalMatch) {
      total = Math.round(parseFloat(totalMatch[1].replace(",", ".")) * 100);
      continue;
    }
    const subMatch = line.match(/(?:subtotaal|subtotal)[:\s]*[\u20AC€]?\s*(\d+[.,]\d{2})/i);
    if (subMatch) {
      subtotal = Math.round(parseFloat(subMatch[1].replace(",", ".")) * 100);
      continue;
    }
    const vatMatch = line.match(/(?:BTW|VAT)\s*(?:\d+%)?[:\s]*[\u20AC€]?\s*(\d+[.,]\d{2})/i);
    if (vatMatch) {
      vatAmount = Math.round(parseFloat(vatMatch[1].replace(",", ".")) * 100);
      const rateMatch = line.match(/(\d+)\s*%/);
      if (rateMatch) vatRate = parseInt(rateMatch[1]);
      continue;
    }

    if (line.match(/^(datum|tijd|kassa|bon|kassier|terminal|pin|maestro|visa|master)/i)) continue;
    if (line.match(/^(bedankt|dank|welkom|openingstijden|www\.|tel)/i)) continue;

    let match = line.match(priceRegex);
    if (match) {
      const qty = parseInt(match[2]);
      const unitPrice = Math.round(parseFloat(match[3].replace(",", ".")) * 100);
      const lineTotal = Math.round(parseFloat(match[4].replace(",", ".")) * 100);
      items.push({ description: match[1].trim(), qty, unitPrice, total: lineTotal });
      continue;
    }

    match = line.match(simplePriceRegex);
    if (match) {
      const lineTotal = Math.round(parseFloat(match[2].replace(",", ".")) * 100);
      items.push({ description: match[1].trim(), qty: 1, unitPrice: lineTotal, total: lineTotal });
      continue;
    }

    match = line.match(singlePriceRegex);
    if (match) {
      const lineTotal = Math.round(parseFloat(match[2].replace(",", ".")) * 100);
      items.push({ description: match[1].trim(), qty: 1, unitPrice: lineTotal, total: lineTotal });
    }
  }

  if (items.length > 0 && total === 0) {
    total = items.reduce((s, i) => s + i.total, 0);
  }
  if (subtotal === 0) {
    subtotal = vatAmount > 0 ? total - vatAmount : total;
  }
  if (vatRate === 0 && vatAmount > 0 && subtotal > 0) {
    vatRate = Math.round((vatAmount / subtotal) * 100);
  }

  const cityMatch = text.match(/\b(\d{4}\s?[A-Z]{2})\s+(\w+)/);
  if (cityMatch) city = cityMatch[2];

  return {
    merchant: { name: merchantName, address, city, kvk, btw },
    items,
    subtotal,
    vatRate,
    vatAmount,
    total,
    note: "Bon gescand via W€spr Pay",
  };
}

export default function ReceiptScanner({ tx, onBack, onSave }: {
  tx: any | null;
  onBack: () => void;
  onSave: (receiptData: ParsedReceipt) => void;
}) {
  const isStandalone = !tx;
  const [phase, setPhase] = useState<ScanPhase>("camera");
  const [imageData, setImageData] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1920 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError("Camera niet beschikbaar. Gebruik de knop om een foto te uploaden.");
    }
  }, []);

  useEffect(() => {
    if (phase === "camera") startCamera();
    return () => stopCamera();
  }, [phase, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera is nog niet klaar. Probeer opnieuw.");
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    setImageData(dataUrl);
    processImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      stopCamera();
      setImageData(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (dataUrl: string) => {
    setPhase("processing");
    setOcrProgress(0);
    setError(null);
    try {
      const worker = await createWorker("nld+eng", undefined, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(dataUrl);
      await worker.terminate();
      setRawText(data.text);
      const parsed = parseReceiptText(data.text);
      setReceipt(parsed);
      setPhase("review");
    } catch {
      setError("OCR verwerking mislukt. Probeer opnieuw met een duidelijkere foto.");
      setPhase("camera");
    }
  };

  const retake = () => {
    setImageData(null);
    setRawText("");
    setReceipt(null);
    setError(null);
    setPhase("camera");
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
    if (!receipt) return;
    const newItems = [...receipt.items];
    if (field === "description") {
      newItems[index] = { ...newItems[index], description: value };
    } else {
      const num = Math.round(parseFloat(value.replace(",", ".")) * (field === "qty" ? 1 : 100)) || 0;
      newItems[index] = { ...newItems[index], [field]: num };
      if (field === "qty" || field === "unitPrice") {
        newItems[index].total = newItems[index].qty * newItems[index].unitPrice;
      }
    }
    const newTotal = newItems.reduce((s, i) => s + i.total, 0);
    setReceipt({ ...receipt, items: newItems, total: newTotal, subtotal: newTotal - receipt.vatAmount });
  };

  const removeItem = (index: number) => {
    if (!receipt) return;
    const newItems = receipt.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((s, i) => s + i.total, 0);
    setReceipt({ ...receipt, items: newItems, total: newTotal, subtotal: newTotal - receipt.vatAmount });
  };

  const addItem = () => {
    if (!receipt) return;
    setReceipt({ ...receipt, items: [...receipt.items, { description: "Nieuw item", qty: 1, unitPrice: 0, total: 0 }] });
    setEditingItem(receipt.items.length);
  };

  const canSave = receipt && receipt.items.length > 0;

  const saveReceipt = () => {
    if (canSave) onSave(receipt);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="flex flex-col h-full bg-background relative"
    >
      <header className="px-4 py-3 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onBack(); }} className="text-white hover:bg-white/20 rounded-full -ml-2" data-testid="receipt-scanner-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight flex-1">Bon Scannen</h1>
        {phase === "camera" && (
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-white hover:bg-white/20 rounded-full" data-testid="receipt-upload-btn">
            <Image className="w-5 h-5" />
          </Button>
        )}
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} data-testid="receipt-file-input" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === "camera" && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <div className="flex-1 relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[70%] border-2 border-white/40 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-emerald-400/60"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <p className="text-white/80 text-xs bg-black/50 rounded-full px-4 py-2">Richt de camera op de bon</p>
                </div>
              </div>
              <div className="p-4 bg-background">
                {error && (
                  <div className="mb-3 p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform gap-2"
                    onClick={capturePhoto}
                    data-testid="btn-capture-receipt"
                  >
                    <Camera className="w-5 h-5" />
                    Maak foto
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl px-5 font-semibold active:scale-[0.98] transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="btn-upload-receipt"
                  >
                    <Image className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full px-6 py-12">
              {imageData && (
                <div className="w-32 h-40 rounded-xl overflow-hidden shadow-lg mb-6 border-2 border-emerald-200">
                  <img src={imageData} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <h2 className="text-lg font-bold mb-2">Bon wordt verwerkt...</h2>
              <p className="text-sm text-muted-foreground text-center mb-4">Tesseract OCR herkent de tekst op je bon</p>
              <div className="w-full max-w-[240px] h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ width: `${ocrProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{ocrProgress}% verwerkt</p>
            </motion.div>
          )}

          {(phase === "review" || phase === "edit") && receipt && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
              {imageData && (
                <div className="rounded-xl overflow-hidden shadow-sm border border-border/40 max-h-32">
                  <img src={imageData} alt="" className="w-full object-cover max-h-32" />
                </div>
              )}

              <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">Winkelgegevens</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setPhase("edit")} data-testid="btn-edit-merchant">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {phase === "edit" ? (
                  <div className="space-y-2">
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder="Winkelnaam"
                      value={receipt.merchant.name}
                      onChange={e => setReceipt({ ...receipt, merchant: { ...receipt.merchant, name: e.target.value } })}
                      data-testid="input-merchant-name"
                    />
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder="Adres"
                      value={receipt.merchant.address}
                      onChange={e => setReceipt({ ...receipt, merchant: { ...receipt.merchant, address: e.target.value } })}
                      data-testid="input-merchant-address"
                    />
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
                        placeholder="Plaats"
                        value={receipt.merchant.city}
                        onChange={e => setReceipt({ ...receipt, merchant: { ...receipt.merchant, city: e.target.value } })}
                        data-testid="input-merchant-city"
                      />
                      <input
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
                        placeholder="KvK"
                        value={receipt.merchant.kvk}
                        onChange={e => setReceipt({ ...receipt, merchant: { ...receipt.merchant, kvk: e.target.value } })}
                        data-testid="input-merchant-kvk"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold">{receipt.merchant.name || "Onbekende winkel"}</p>
                    {receipt.merchant.address && <p className="text-xs text-muted-foreground">{receipt.merchant.address}{receipt.merchant.city ? `, ${receipt.merchant.city}` : ""}</p>}
                    {receipt.merchant.kvk && <p className="text-[10px] text-muted-foreground/60 mt-0.5">KvK: {receipt.merchant.kvk}</p>}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ScanLine className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">Artikelen ({receipt.items.length})</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-emerald-600" onClick={addItem} data-testid="btn-add-item">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {receipt.items.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Geen artikelen herkend</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Tik op + om handmatig toe te voegen</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {receipt.items.map((item, i) => (
                      <div key={i} className={`rounded-lg ${editingItem === i ? 'bg-emerald-50 p-3' : 'p-2 hover:bg-muted/30'}`}>
                        {editingItem === i ? (
                          <div className="space-y-2">
                            <input
                              className="w-full px-2 py-1.5 rounded border border-border text-xs"
                              value={item.description}
                              onChange={e => updateItem(i, "description", e.target.value)}
                              autoFocus
                              data-testid={`input-item-desc-${i}`}
                            />
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground">Aantal</label>
                                <input
                                  className="w-full px-2 py-1 rounded border border-border text-xs"
                                  type="number"
                                  value={item.qty}
                                  onChange={e => updateItem(i, "qty", e.target.value)}
                                  data-testid={`input-item-qty-${i}`}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground">Prijs</label>
                                <input
                                  className="w-full px-2 py-1 rounded border border-border text-xs"
                                  value={(item.unitPrice / 100).toFixed(2)}
                                  onChange={e => updateItem(i, "unitPrice", e.target.value)}
                                  data-testid={`input-item-price-${i}`}
                                />
                              </div>
                              <div className="flex gap-1 pt-3">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => setEditingItem(null)} data-testid={`btn-item-done-${i}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => { removeItem(i); setEditingItem(null); }} data-testid={`btn-item-delete-${i}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingItem(i)} data-testid={`item-row-${i}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground truncate">{item.description}</p>
                              {item.qty > 1 && <p className="text-[10px] text-muted-foreground">{item.qty}x {fmtCents(item.unitPrice)}</p>}
                            </div>
                            <span className="text-xs font-semibold whitespace-nowrap">{fmtCents(item.total)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-dashed border-border/40 space-y-1">
                  {receipt.subtotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">Subtotaal</span>
                      <span className="text-[11px] font-medium">{fmtCents(receipt.subtotal)}</span>
                    </div>
                  )}
                  {receipt.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">BTW ({receipt.vatRate}%)</span>
                      <span className="text-[11px] font-medium">{fmtCents(receipt.vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-emerald-200">
                    <span className="text-sm font-bold text-emerald-700">Totaal</span>
                    <span className="text-sm font-bold text-emerald-700">{fmtCents(receipt.total)}</span>
                  </div>
                </div>
              </div>

              {rawText && (
                <details className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                  <summary className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/30">
                    Ruwe OCR-tekst bekijken
                  </summary>
                  <div className="px-4 pb-3">
                    <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">{rawText}</pre>
                  </div>
                </details>
              )}

              <div className="space-y-2 pt-2 pb-4">
                <Button
                  className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform gap-2 disabled:opacity-50"
                  onClick={saveReceipt}
                  disabled={!canSave}
                  data-testid="btn-save-scanned-receipt"
                >
                  <Check className="w-5 h-5" />
                  {isStandalone ? "Bon koppelen aan transactie" : "Bon opslaan bij transactie"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-2xl font-semibold gap-2 active:scale-[0.98] transition-transform"
                  onClick={retake}
                  data-testid="btn-retake-receipt"
                >
                  <RotateCcw className="w-4 h-4" />
                  Opnieuw scannen
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
