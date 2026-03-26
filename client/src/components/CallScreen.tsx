import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, VideoOff, Video, FlipHorizontal, MessageCircle } from "lucide-react";

type CallState = "ringing" | "connected" | "ended";

export function CallScreen({ name, avatar, onEnd }: { name: string; avatar?: string | null; onEnd: () => void }) {
  const [callState, setCallState] = useState<CallState>("ringing");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (callState === "ringing") {
      const timer = setTimeout(() => setCallState("connected"), 3500);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  useEffect(() => {
    if (callState === "connected") {
      const interval = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [callState]);

  useEffect(() => {
    if (isCameraOn && callState === "connected") {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (selfVideoRef.current) {
            selfVideoRef.current.srcObject = stream;
            selfVideoRef.current.play().catch(() => {});
          }
          setCameraError(false);
        })
        .catch(() => setCameraError(true));
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  }, [isCameraOn, callState]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEnd = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCallState("ended");
    setTimeout(onEnd, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-800 via-slate-900 to-black flex flex-col items-center justify-between py-16 px-8 text-white overflow-hidden"
      data-testid="call-screen"
    >
      {/* Animated background rings during ringing */}
      <AnimatePresence>
        {callState === "ringing" && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" exit={{ opacity: 0 }}>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/10"
                style={{ width: 120 + i * 80, height: 120 + i * 80 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Self camera corner */}
      <AnimatePresence>
        {isCameraOn && callState === "connected" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="absolute top-14 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl z-10 bg-slate-900"
          >
            {!cameraError ? (
              <video ref={selfVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" data-testid="self-video-call" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><VideoOff className="w-5 h-5 text-white/40" /></div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact info */}
      <div className="flex flex-col items-center gap-4 mt-8 relative z-10">
        <div className="relative">
          {callState === "ringing" && (
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400/20"
              animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
            />
          )}
          <motion.div animate={callState === "ringing" ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
            <Avatar className="h-32 w-32 rounded-full border-4 border-white/20 shadow-2xl relative z-10">
              {avatar && <AvatarImage src={avatar} className="object-cover" />}
              <AvatarFallback className="rounded-full bg-emerald-700 text-white text-4xl font-bold">{name.charAt(0)}</AvatarFallback>
            </Avatar>
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-1 mt-2">
          <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
          <p className="text-white/60 text-base font-medium">
            {callState === "ringing" && "Bellen…"}
            {callState === "connected" && formatDuration(duration)}
            {callState === "ended" && "Gesprek beëindigd"}
          </p>
          {callState === "connected" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Versleuteld gesprek</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-8 mb-4 relative z-10 w-full">
        {callState !== "ended" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-6 w-full">
            <ActionButton
              onClick={() => setIsMuted(!isMuted)}
              active={isMuted}
              icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              label={isMuted ? "Dempen uit" : "Dempen"}
              testId="call-mute-btn"
            />
            <ActionButton
              onClick={() => setIsSpeaker(!isSpeaker)}
              active={isSpeaker}
              icon={isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              label="Luidspreker"
              testId="call-speaker-btn"
            />
            <ActionButton
              onClick={() => setIsCameraOn(!isCameraOn)}
              active={isCameraOn}
              icon={isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              label={isCameraOn ? "Camera aan" : "Camera"}
              testId="call-camera-btn"
            />
          </motion.div>
        )}

        <motion.button
          onClick={handleEnd}
          whileTap={{ scale: 0.92 }}
          className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/40 transition-colors"
          data-testid="end-call-btn"
        >
          <PhoneOff className="w-8 h-8" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export function VideoCallScreen({ name, avatar, onEnd }: { name: string; avatar?: string | null; onEnd: () => void }) {
  const [callState, setCallState] = useState<CallState>("ringing");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState(false);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
      streamRef.current = stream;
      stream.getAudioTracks().forEach(t => { t.enabled = !isMutedRef.current; });
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
        selfVideoRef.current.play().catch(() => {});
      }
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  }, []);

  // Start camera IMMEDIATELY on mount (even during ringing)
  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line

  // Ringing → connected after 3.5s
  useEffect(() => {
    if (callState === "ringing") {
      const t = setTimeout(() => setCallState("connected"), 3500);
      return () => clearTimeout(t);
    }
  }, [callState]);

  // Timer
  useEffect(() => {
    if (callState === "connected") {
      const i = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(i);
    }
  }, [callState]);

  // Mute toggle
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
  }, [isMuted]);

  // Camera on/off toggle: when turning on, restart with current facingMode; when off, disable tracks
  const isCameraOnRef = useRef(isCameraOn);
  useEffect(() => {
    const prev = isCameraOnRef.current;
    isCameraOnRef.current = isCameraOn;
    if (!prev && isCameraOn) {
      // Camera turned back on — restart stream with current facing mode
      startCamera(facingMode);
    } else {
      streamRef.current?.getVideoTracks().forEach(t => { t.enabled = isCameraOn; });
    }
  }, [isCameraOn]); // eslint-disable-line

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEnd = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCallState("ended");
    setTimeout(onEnd, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col text-white"
      data-testid="video-call-screen"
    >
      {/* Background — dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Self camera — small corner (bottom-right) */}
      <AnimatePresence>
        {isCameraOn && !cameraError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-36 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/25 shadow-xl z-20 bg-slate-900"
          >
            <video
              ref={selfVideoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]"
              data-testid="self-video"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact avatar — center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            {callState === "ringing" && (
              <>
                <motion.div className="absolute inset-0 rounded-full bg-white/10" animate={{ scale: [1, 2.2], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }} />
                <motion.div className="absolute inset-0 rounded-full bg-white/10" animate={{ scale: [1, 2.2], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.6 }} />
              </>
            )}
            <Avatar className="h-28 w-28 rounded-full border-4 border-white/20 shadow-2xl relative z-10">
              {avatar && <AvatarImage src={avatar} className="object-cover" />}
              <AvatarFallback className="rounded-full bg-slate-700 text-white text-3xl font-bold">{name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </motion.div>
      </div>

      {/* Top info bar */}
      <div className="relative z-10 flex flex-col items-center pt-16 gap-1.5">
        <h2 className="text-2xl font-bold drop-shadow-xl">{name}</h2>
        <p className="text-white/70 text-sm font-medium drop-shadow">
          {callState === "ringing" && "Video verbinding…"}
          {callState === "connected" && formatDuration(duration)}
          {callState === "ended" && "Gesprek beëindigd"}
        </p>
        {callState === "connected" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-xs font-medium drop-shadow">Versleuteld videogesprek</span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 mt-auto mb-14 flex flex-col items-center gap-6">
        {callState !== "ended" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-5">
            <ActionButton
              onClick={() => setIsMuted(!isMuted)}
              active={isMuted}
              icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              label={isMuted ? "Mic uit" : "Dempen"}
              testId="video-call-mute-btn"
            />
            <ActionButton
              onClick={() => setIsCameraOn(!isCameraOn)}
              active={!isCameraOn}
              icon={isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              label={isCameraOn ? "Camera" : "Camera uit"}
              testId="video-call-camera-btn"
            />
            <ActionButton
              onClick={() => {
                const next = facingMode === "user" ? "environment" : "user";
                setFacingMode(next);
                // Only restart camera stream when camera is actually on
                if (isCameraOn) startCamera(next);
              }}
              active={false}
              icon={<FlipHorizontal className="w-6 h-6" />}
              label="Draaien"
              testId="video-call-flip-btn"
            />
          </motion.div>
        )}

        <motion.button
          onClick={handleEnd}
          whileTap={{ scale: 0.92 }}
          className="w-[72px] h-[72px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/40 transition-colors"
          data-testid="video-call-end-btn"
        >
          <PhoneOff className="w-8 h-8" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function ActionButton({ onClick, active, icon, label, testId }: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  testId: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.88 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          active ? "bg-white text-slate-900 shadow-lg" : "bg-white/15 hover:bg-white/25 text-white"
        }`}
        data-testid={testId}
      >
        {icon}
      </motion.button>
      <span className="text-white/50 text-[10px] font-medium">{label}</span>
    </div>
  );
}
