import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Euro, Stethoscope, Train, ShoppingBag, MessageCircle, CreditCard, Landmark, Heart, Globe, Music, Gamepad2, Zap, Check, Move, ArrowLeft, type LucideIcon } from "lucide-react";
import heroImage from "@/assets/images/hero-lifestyle.jpg";

const iconMap: Record<string, LucideIcon> = {
  Betalen: Euro, Gezondheid: Stethoscope, Vervoer: Train, Berichten: MessageCircle,
  Services: Globe, Wallet: CreditCard, Overheid: Landmark, Winkelen: ShoppingBag,
  Welzijn: Heart, Entertainment: Music, Games: Gamepad2, Energie: Zap,
};

const defaultIcons = [
  { label: "Betalen", x: 6, y: 3, size: 34, color: "rgba(16, 185, 129, 0.5)" },
  { label: "Gezondheid", x: 78, y: 8, size: 30, color: "rgba(244, 63, 94, 0.5)" },
  { label: "Vervoer", x: 42, y: 5, size: 28, color: "rgba(245, 158, 11, 0.5)" },
  { label: "Berichten", x: 88, y: 35, size: 28, color: "rgba(56, 189, 248, 0.5)" },
  { label: "Services", x: 3, y: 16, size: 26, color: "rgba(168, 85, 247, 0.5)" },
  { label: "Wallet", x: 84, y: 57, size: 32, color: "rgba(20, 184, 166, 0.5)" },
  { label: "Overheid", x: 4, y: 42, size: 28, color: "rgba(99, 102, 241, 0.5)" },
  { label: "Winkelen", x: 60, y: 62, size: 26, color: "rgba(236, 72, 153, 0.5)" },
  { label: "Welzijn", x: 3, y: 55, size: 26, color: "rgba(239, 68, 68, 0.5)" },
  { label: "Entertainment", x: 86, y: 46, size: 24, color: "rgba(251, 146, 60, 0.5)" },
  { label: "Games", x: 30, y: 60, size: 24, color: "rgba(34, 211, 238, 0.5)" },
  { label: "Energie", x: 20, y: 64, size: 26, color: "rgba(250, 204, 21, 0.5)" },
];

export default function IconEditorPage() {
  const [, navigate] = useLocation();
  const areaRef = useRef<HTMLDivElement>(null);
  const [icons, setIcons] = useState(defaultIcons);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/icon-positions")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data)) {
          setIcons((prev) =>
            prev.map((icon) => {
              const m = data.find((s: any) => s.label === icon.label);
              return m ? { ...icon, x: m.x, y: m.y } : icon;
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selected === null || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(2, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(2, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
    setIcons((prev) => prev.map((p, i) => i === selected ? { ...p, x, y } : p));
    setSelected(null);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = icons.map(({ label, x, y }) => ({ label, x, y }));
    try {
      await fetch("/api/icon-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Opslaan mislukt");
    }
  };

  if (!loaded) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center">
      <div className="w-full max-w-lg bg-black/90 px-4 py-3 flex items-center gap-2 sticky top-0 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); navigate("/"); }}
          className="bg-white/10 active:bg-white/20 text-white p-2 rounded-lg shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 text-white text-sm">
          <Move className="w-5 h-5 text-yellow-400" />
          <span className="font-medium">
            {selected !== null
              ? `Tik waar "${icons[selected].label}" moet komen`
              : "Tik op een bol om te selecteren"}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="bg-emerald-600 active:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
          data-testid="button-save-positions"
        >
          {saved ? <><Check className="w-4 h-4" /> Opgeslagen!</> : "Opslaan"}
        </button>
      </div>

      <div className="w-full max-w-lg flex-1 relative" style={{ aspectRatio: "9/16" }}>
        <div
          ref={areaRef}
          className="relative w-full h-full overflow-hidden"
          onClick={handleAreaClick}
          style={{ cursor: selected !== null ? "crosshair" : "default" }}
        >
          <img
            src={heroImage}
            alt="Background"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75 pointer-events-none" />

          <div className="absolute w-full flex flex-col items-center pointer-events-none" style={{ top: "34%" }}>
            <span className="text-3xl font-light tracking-wide text-white/50 drop-shadow-lg">W€spr</span>
            <span className="text-sm text-white/30 font-medium">Jouw Europese super app</span>
          </div>

          {icons.map((icon, index) => {
            const Icon = iconMap[icon.label];
            const isSelected = selected === index;
            const displaySize = 44;
            return (
              <div
                key={icon.label}
                className="absolute"
                style={{
                  left: `${icon.x}%`,
                  top: `${icon.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isSelected ? 50 : 20,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(isSelected ? null : index);
                }}
              >
                <div
                  className={`rounded-full flex items-center justify-center transition-all duration-150 ${
                    isSelected
                      ? "ring-[3px] ring-yellow-400 scale-[1.3] shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                      : "ring-2 ring-white/50"
                  }`}
                  style={{
                    width: displaySize,
                    height: displaySize,
                    backgroundColor: icon.color,
                    backdropFilter: "blur(4px)",
                    cursor: "pointer",
                  }}
                >
                  {Icon && <Icon className="text-white pointer-events-none" style={{ width: 20, height: 20 }} />}
                </div>
                <div
                  className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none ${
                    isSelected ? "bg-yellow-500 text-black" : "bg-black/80 text-white"
                  }`}
                >
                  {icon.label}
                </div>
              </div>
            );
          })}

          {selected !== null && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-black text-sm font-bold px-4 py-2 rounded-full pointer-events-none animate-pulse">
              Tik ergens op het scherm
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
