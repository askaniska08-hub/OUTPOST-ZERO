import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Microscope, Sparkles, Wrench, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ActiveMiniGame } from '../types/game';

interface MiniGameModalProps {
  miniGame: ActiveMiniGame;
  onComplete: (success: boolean) => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({ miniGame, onComplete }) => {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState(25);
  const [targetFocus] = useState(() => 62 + Math.floor(Math.random() * 20));
  const [specimen, setSpecimen] = useState<'micro_crop' | 'hydro_root' | 'martian_soil'>('micro_crop');
  const [stain, setStain] = useState(false);
  const [lightLevel, setLightLevel] = useState(70);

  // Circuit / Assembly / Grid sliders & toggles
  const [nodes, setNodes] = useState<boolean[]>([false, false, false, false]);
  const [sliderA, setSliderA] = useState(30);
  const [sliderB, setSliderB] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive Optical Microscope Renderer
  useEffect(() => {
    if (miniGame.type !== 'microscopy') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blurAmt = Math.abs(focus - targetFocus) * 0.22;
    ctx.clearRect(0, 0, 260, 260);

    // Circular optical field
    ctx.save();
    ctx.beginPath();
    ctx.arc(130, 130, 122, 0, Math.PI * 2);
    ctx.clip();

    const bright = 0.4 + (lightLevel / 100) * 0.6;
    ctx.fillStyle = specimen === 'martian_soil' ? `rgba(120, 65, 45, ${bright})` : `rgba(18, 45, 58, ${bright})`;
    ctx.fillRect(0, 0, 260, 260);

    ctx.filter = `blur(${blurAmt.toFixed(1)}px)`;

    // Draw realistic cellular / crystalline microstructures
    for (let i = 0; i < 16; i++) {
      const cx = 40 + ((i * 53) % 185);
      const cy = 40 + ((i * 79) % 185);
      const r = 14 + (i % 4) * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (specimen === 'micro_crop') {
        ctx.fillStyle = stain ? 'rgba(56, 189, 248, 0.45)' : 'rgba(74, 222, 128, 0.5)';
        ctx.strokeStyle = '#bbf7d0';
      } else if (specimen === 'hydro_root') {
        ctx.fillStyle = stain ? 'rgba(168, 85, 247, 0.45)' : 'rgba(45, 212, 191, 0.5)';
        ctx.strokeStyle = '#99f6e4';
      } else {
        ctx.fillStyle = 'rgba(251, 146, 60, 0.55)';
        ctx.strokeStyle = '#fed7aa';
      }
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Nucleus / crystal core
      ctx.beginPath();
      ctx.arc(cx + 3, cy - 2, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = stain ? '#f472b6' : '#fef08a';
      ctx.fill();
    }

    ctx.filter = 'none';
    // Eyepiece reticle
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(130, 10);
    ctx.lineTo(130, 250);
    ctx.moveTo(10, 130);
    ctx.lineTo(250, 130);
    ctx.stroke();
    ctx.restore();
  }, [miniGame.type, focus, targetFocus, specimen, stain, lightLevel]);

  const focusSharp = Math.abs(focus - targetFocus) <= 5;
  const allNodesConnected = nodes.every(Boolean);
  const slidersBalanced = Math.abs(sliderA - 72) <= 10 && Math.abs(sliderB - 65) <= 10;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-cyan-300/35 bg-[#11192a] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            {miniGame.type === 'microscopy' ? (
              <Microscope className="h-5 w-5 text-emerald-400" />
            ) : (
              <Wrench className="h-5 w-5 text-cyan-400" />
            )}
            <h3 className="text-base font-extrabold text-white">{miniGame.title}</h3>
          </div>
          <button
            onClick={() => onComplete(false)}
            className="rounded-xl bg-white/10 p-1.5 text-slate-300 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {miniGame.type === 'microscopy' ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {(['micro_crop', 'hydro_root', 'martian_soil'] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => {
                    soundEngine.playMicroscopeClick();
                    setSpecimen(sp);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    specimen === sp ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {sp === 'micro_crop' ? '🌱 Micro-Crop' : sp === 'hydro_root' ? '🌿 Hydro-Root' : '🪨 Mars Soil'}
                </button>
              ))}
            </div>

            <div className="relative rounded-full border-4 border-slate-700 bg-black p-1 shadow-inner">
              <canvas ref={canvasRef} width={260} height={260} className="rounded-full" />
              {focusSharp && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-extrabold text-slate-950">
                  CRYSTAL FOCUS LOCKED
                </div>
              )}
            </div>

            <div className="w-full space-y-2.5 text-xs font-bold text-slate-300">
              <label className="flex items-center justify-between gap-3">
                <span>Focus Knob</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focus}
                  onChange={(e) => {
                    soundEngine.playMicroscopeClick();
                    setFocus(Number(e.target.value));
                  }}
                  className="w-56 accent-emerald-400"
                />
                <span className="w-10 text-right tabular-nums text-emerald-300">{focus}%</span>
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Illumination</span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={lightLevel}
                  onChange={(e) => setLightLevel(Number(e.target.value))}
                  className="w-56 accent-cyan-400"
                />
                <span className="w-10 text-right tabular-nums text-cyan-300">{lightLevel}%</span>
              </label>
              <div className="flex justify-between pt-1">
                <button
                  onClick={() => {
                    soundEngine.playMicroscopeClick();
                    setStain((s) => !s);
                  }}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
                >
                  {stain ? 'Bio-Stain: ON' : 'Bio-Stain: OFF'}
                </button>
                <button
                  disabled={!focusSharp}
                  onClick={() => onComplete(true)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                    focusSharp
                      ? 'bg-emerald-500 text-slate-950 hover:scale-105'
                      : 'cursor-not-allowed bg-slate-800 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" /> Record Observation
                </button>
              </div>
            </div>
          </div>
        ) : miniGame.type === 'hydroponics' ||
          miniGame.type === 'materials' ||
          miniGame.type === 'sabatier' ||
          miniGame.type === 'power_grid' ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-300">
              Tune both calibration dials into the glowing emerald target zone (72% &amp; 65%):
            </p>
            <div className="space-y-3 rounded-2xl bg-slate-900/70 p-4 text-xs font-bold">
              <div>
                <div className="mb-1 flex justify-between text-cyan-300">
                  <span>Primary Flow / Voltage</span>
                  <span className="tabular-nums">{sliderA}% (Target ~72%)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderA}
                  onChange={(e) => {
                    soundEngine.playMicroscopeClick();
                    setSliderA(Number(e.target.value));
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-amber-300">
                  <span>Secondary Pressure / Balance</span>
                  <span className="tabular-nums">{sliderB}% (Target ~65%)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderB}
                  onChange={(e) => {
                    soundEngine.playMicroscopeClick();
                    setSliderB(Number(e.target.value));
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
            <button
              disabled={!slidersBalanced}
              onClick={() => onComplete(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold transition ${
                slidersBalanced
                  ? 'bg-emerald-500 text-slate-950 hover:scale-[1.02]'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {slidersBalanced ? 'Confirm Calibration' : 'Align Both Dials to Target'}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-300">
              Lock all 4 engineering couplings in sequence to assemble the prototype:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Core Housing', 'Sensor Bus', 'Fluid Seal', 'Power Coupling'].map((label, idx) => {
                const locked = nodes[idx];
                const canClick = idx === step;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      if (!canClick) return;
                      soundEngine.playConstruction();
                      const next = [...nodes];
                      next[idx] = true;
                      setNodes(next);
                      setStep((s) => s + 1);
                    }}
                    className={`rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                      locked
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : canClick
                          ? 'border-cyan-400 bg-cyan-500/20 text-white hover:scale-105'
                          : 'border-white/10 bg-white/5 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase opacity-75">Step {idx + 1}</div>
                    <div className="mt-0.5 text-sm">{locked ? `✓ ${label}` : label}</div>
                  </button>
                );
              })}
            </div>
            <button
              disabled={!allNodesConnected}
              onClick={() => onComplete(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold transition ${
                allNodesConnected
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 hover:scale-[1.02]'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" /> Finalize Prototype
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
