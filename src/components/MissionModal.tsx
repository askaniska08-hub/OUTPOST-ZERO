import React from 'react';
import { BookOpen, CheckCircle2, Circle, Globe2, Rocket, X } from 'lucide-react';
import { LEVELS } from '../data/levels';
import { HudSnapshot } from '../types/game';

interface MissionModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSwitchWorld: (w: 'mars' | 'earth') => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({ hud, onClose, onSwitchWorld }) => {
  const def = LEVELS[Math.min(LEVELS.length - 1, hud.currentLevel - 1)];
  const earthSteps = hud.levelObjectives.filter((o) => o.world === 'earth');
  const marsSteps = hud.levelObjectives.filter((o) => o.world === 'mars');

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-amber-300/30 bg-[#11192a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                Level {def.level} of 20 · {def.theme}
              </div>
              <h2 className="text-lg font-extrabold text-white">{def.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          {/* Earth Mission Card */}
          <div className="rounded-2xl border border-sky-400/25 bg-slate-900/75 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-sky-300">
                <Globe2 className="h-4 w-4" /> EARTH RESEARCH CAMPUS
              </div>
              <button
                onClick={() => {
                  onSwitchWorld('earth');
                  onClose();
                }}
                className="rounded-lg bg-sky-500 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 transition hover:scale-105"
              >
                Go to Earth
              </button>
            </div>
            <div className="space-y-2">
              {earthSteps.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs ${
                    s.completed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-200'
                  }`}
                >
                  {s.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  <span className="font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
            {/* Live Earth Logistics Progress */}
            <div className="mt-3 rounded-xl bg-slate-950/70 p-3 text-[11px] text-slate-300">
              <div className="font-bold text-sky-300">Capsule Prep: {hud.earthLogistics.prototypeName}</div>
              <div className="mt-1">
                Parts on Trolley: {hud.earthLogistics.partsOnTrolley.length}/{hud.earthLogistics.requiredParts.length}
                {hud.earthLogistics.testActive && (
                  <span className="ml-2 font-bold text-amber-300 tabular-nums">
                    · Testing {Math.floor(hud.earthLogistics.testProgress)}/30s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mars Mission Card */}
          <div className="rounded-2xl border border-amber-400/25 bg-slate-900/75 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-amber-300">
                <Rocket className="h-4 w-4" /> MARS COLONY
              </div>
              <button
                onClick={() => {
                  onSwitchWorld('mars');
                  onClose();
                }}
                className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 transition hover:scale-105"
              >
                Go to Mars
              </button>
            </div>
            <div className="space-y-2">
              {marsSteps.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs ${
                    s.completed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-200'
                  }`}
                >
                  {s.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  <span className="font-semibold">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl bg-slate-950/70 p-3 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <BookOpen className="h-3.5 w-3.5" /> Reward &amp; Unlock
              </div>
              <div className="mt-1">
                {def.unlockText} · <span className="text-amber-300">+{def.rewardCoins} Coins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
