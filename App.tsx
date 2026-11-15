import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  Bot,
  Check,
  Compass,
  Droplets,
  Flame,
  Hammer,
  Heart,
  Info,
  Layers,
  MapPin,
  Move,
  Package,
  Pause,
  Play,
  Radiation,
  RefreshCw,
  Rocket,
  RotateCcw,
  RotateCw,
  Route,
  ShoppingBag,
  Sparkles,
  Utensils,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import { ExhibitModal } from './components/ExhibitModal';
import { MarsGlobalMap } from './components/MarsGlobalMap';
import { MiniGameModal } from './components/MiniGameModal';
import { MissionModal } from './components/MissionModal';
import { WardrobeModal } from './components/WardrobeModal';
import { LEVELS } from './data/levels';
import { OutpostGameEngine } from './engine/OutpostGameEngine';
import { HudSnapshot } from './types/game';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<OutpostGameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const engine = new OutpostGameEngine(el, (snap) => {
      setHud(snap);
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Global keyboard shortcuts: Tab for Missions, Esc for Pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng || !hud) return;
      if (e.code === 'Tab' && hud.screen === 'playing') {
        e.preventDefault();
        setShowMissions((v) => !v);
      } else if (e.code === 'Escape') {
        if (hud.activeExhibit) eng.closeExhibit();
        else if (hud.placementPreview) eng.cancelPlacementPreview();
        else if (showWardrobe) setShowWardrobe(false);
        else if (showMissions) setShowMissions(false);
        else if (showMoveMenu) setShowMoveMenu(false);
        else if (hud.activeInteraction?.cancelable) eng.cancelActiveInteraction(false);
        else if (hud.screen === 'playing') eng.setScreen('paused');
        else if (hud.screen === 'paused') eng.setScreen('playing');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hud, showWardrobe, showMissions, showMoveMenu]);

  const eng = engineRef.current;
  const currentDef = hud ? LEVELS[Math.min(LEVELS.length - 1, hud.currentLevel - 1)] : LEVELS[0];
  const activeWorldSteps = hud
    ? hud.levelObjectives.filter((o) => o.world === hud.activeWorld && !o.completed)
    : [];
  const nextStep = activeWorldSteps[0] || hud?.levelObjectives.find((o) => !o.completed);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c1220]">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {/* TITLE SCREEN */}
      {hud?.screen === 'title' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-8 md:p-14">
          <div className="max-w-xl">
            {/* Bespoke SVG Title Lockup over calm negative space */}
            <svg viewBox="0 0 520 150" className="w-full max-w-md drop-shadow-2xl">
              <defs>
                <linearGradient id="ozTitleGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="55%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <rect x="0" y="10" width="165" height="24" rx="12" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="82.5" y="26" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="800" letterSpacing="2">
                20-LEVEL EXPEDITION
              </text>
              <text
                x="0"
                y="96"
                fill="url(#ozTitleGrad)"
                fontSize="64"
                fontWeight="900"
                letterSpacing="-1.5"
              >
                OUTPOST ZERO
              </text>
              <text x="2" y="130" fill="#cbd5e1" fontSize="18" fontWeight="700" letterSpacing="3">
                TWO WORLDS · TWO ASTRONAUTS · ONE MISSION
              </text>
            </svg>

            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => eng?.startGame(false)}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400 px-7 py-3.5 text-base font-black text-slate-950 shadow-xl shadow-orange-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-slate-950" />
                START ADVENTURE
              </button>

              {eng?.hasSaveGame() && (
                <button
                  onClick={() => eng.startGame(true)}
                  className="flex items-center gap-2 rounded-2xl border border-cyan-300/40 bg-slate-900/90 px-6 py-3.5 text-sm font-extrabold text-cyan-200 transition-transform hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" />
                  CONTINUE MISSION
                </button>
              )}
            </div>
          </div>

          {/* Single flat control-hint line */}
          <div className="text-xs font-bold tracking-wider text-slate-300/85">
            WASD / Arrows Move &amp; Steer · Space Jump · E Enter &amp; Interact · Drag Mouse or J/L/I/K Look · Tab Missions · Esc Pause
          </div>
        </div>
      )}

      {/* IN-GAME HUD (Low Occlusion, pointer-events-none wrapper, ZERO backdrop-filter!) */}
      {hud && hud.screen === 'playing' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3.5">
          {/* TOP ROW */}
          <div className="flex items-start justify-between gap-3">
            {/* TOP-LEFT: Permanent Mars Global Map on Mars, or Earth Location Card on Earth */}
            <div className="flex flex-col items-start gap-2">
              {hud.activeWorld === 'mars' ? (
                <>
                  <div className="pointer-events-auto rounded-xl border border-amber-300/35 bg-[#1b1615]/92 px-3 py-1.5 text-xs font-extrabold text-amber-200 shadow-lg">
                    📍 {hud.currentLocationLabel}
                  </div>
                  <MarsGlobalMap
                    hud={hud}
                    expanded={mapExpanded}
                    onToggleExpand={() => setMapExpanded((e) => !e)}
                    onSelectTarget={(x, z, label) => eng?.selectMapTarget(x, z, label)}
                    onClearTarget={() => eng?.clearMapTarget()}
                  />
                </>
              ) : (
                <div className="pointer-events-auto rounded-2xl border border-sky-300/35 bg-[#0f172a]/92 px-4 py-2.5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-sky-300">
                    <Compass className="h-4 w-4" />
                    <span>{hud.currentLocationLabel}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-300">
                    {hud.earthLogistics.testActive
                      ? `🧪 Testing: ${Math.floor(hud.earthLogistics.testProgress)}/30s`
                      : hud.earthLogistics.prototypeReady
                        ? `📦 ${hud.earthLogistics.prototypeName}`
                        : `Parts on Trolley: ${hud.earthLogistics.partsOnTrolley.length}/${hud.earthLogistics.requiredParts.length}`}
                  </div>
                </div>
              )}

              {/* Stage-Accurate Capsule & Environmental Indicators */}
              {hud.missionStage === 'mars_unlock_capsule' && hud.marsCapsule.arrived && !hud.marsCapsule.unlocked && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-950/92 px-3 py-1.5 text-xs font-extrabold text-amber-200 shadow-lg">
                  <Rocket className="h-4 w-4 text-amber-300" />
                  <span>CARGO READY · UNLOCK AT LANDING PORT</span>
                </div>
              )}
              {hud.activeHazard === 'dust_storm' && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-950/92 px-3 py-1.5 text-xs font-extrabold text-amber-200 shadow-lg">
                  <Wind className="h-4 w-4 text-amber-400" />
                  <span>DUST STORM · {Math.ceil(hud.hazardTimer)}s</span>
                </div>
              )}
              {hud.activeHazard === 'radiation_alert' && (
                <div className="flex items-center gap-2 rounded-xl border border-purple-400/60 bg-purple-950/92 px-3 py-1.5 text-xs font-extrabold text-purple-200 shadow-lg">
                  <Radiation className="h-4 w-4 text-purple-300" />
                  <span>RADIATION ALERT · SEEK SHELTER</span>
                </div>
              )}
            </div>

            {/* TOP-CENTER: Compact Level, Active Stage Objective & Contextual Guidance */}
            <div className="hidden flex-col items-center gap-1.5 md:flex">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0f172a]/90 px-4 py-2 shadow-xl">
                <span className="rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-black tabular-nums text-amber-300">
                  LVL {hud.currentLevel}/20
                </span>
                <span className="text-xs font-extrabold text-white">{currentDef.title}</span>
                <span className="text-[11px] font-bold tabular-nums text-slate-400">
                  Sol {hud.simDay}
                  {hud.currentLevel === 20 ? ` (${hud.sustainabilityDayCount}/30)` : ''}
                </span>
              </div>
              {(hud.nextObjectiveHint || nextStep) && (
                <button
                  onClick={() => setShowMissions(true)}
                  className="pointer-events-auto flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-[#0f172a]/90 px-3.5 py-1.5 text-xs font-bold text-cyan-200 shadow-lg transition hover:scale-105"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>{hud.nextObjectiveHint || nextStep?.label}</span>
                </button>
              )}
              {hud.tutorialHint && (
                <div className="max-w-md rounded-xl border border-amber-300/35 bg-[#0f172a]/92 px-3.5 py-1.5 text-center text-[11px] font-bold text-amber-100 shadow-lg">
                  {hud.tutorialHint}
                </div>
              )}
            </div>

            {/* TOP-RIGHT: Icon-first Resource Cluster & World Switcher */}
            <div className="flex flex-col items-end gap-2">
              <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 rounded-2xl border border-white/15 bg-[#0f172a]/92 px-3 py-2 shadow-xl">
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-sky-300" title="Water">
                  <Droplets className="h-3.5 w-3.5" /> {Math.round(hud.resources.water)}%
                </div>
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-cyan-300" title="Oxygen">
                  <Wind className="h-3.5 w-3.5" /> {Math.round(hud.resources.oxygen)}%
                </div>
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-amber-300" title="Power">
                  <Zap className="h-3.5 w-3.5" /> {Math.round(hud.resources.electricity)}%
                </div>
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-emerald-300" title="Food">
                  <Utensils className="h-3.5 w-3.5" /> {hud.resources.mealsStored}
                </div>
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-orange-300" title="Fuel">
                  <Flame className="h-3.5 w-3.5" /> {Math.round(hud.resources.fuel)}%
                </div>
                <div className="flex items-center gap-1 px-1.5 text-xs font-extrabold tabular-nums text-slate-200" title="Materials">
                  <Package className="h-3.5 w-3.5" /> {hud.resources.materials}
                </div>
                <div className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-black tabular-nums text-amber-300">
                  🪙 {hud.resources.coins}
                </div>
              </div>

              {/* Dedicated Switch Character / World + Audio + Pause */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={() => eng?.switchWorld(hud.activeWorld === 'mars' ? 'earth' : 'mars')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                    hud.activeWorld === 'mars'
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-orange-400 text-slate-950'
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {hud.activeWorld === 'mars' ? 'SWITCH TO EARTH' : 'SWITCH TO MARS'}
                </button>

                <button
                  onClick={() => eng?.setMuted(!hud.muted)}
                  className="rounded-xl border border-white/15 bg-[#0f172a]/90 p-2 text-slate-200 transition hover:scale-105"
                  title={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {hud.muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-cyan-300" />}
                </button>

                <button
                  onClick={() => eng?.setScreen('paused')}
                  className="rounded-xl border border-white/15 bg-[#0f172a]/90 p-2 text-slate-200 transition hover:scale-105"
                  title="Pause (Esc)"
                >
                  <Pause className="h-4 w-4" />
                </button>
              </div>

              {/* Crew Vitals (Hunger / Energy / Carrying) */}
              {hud.activeWorld === 'mars' && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0f172a]/88 px-3 py-1.5 text-[11px] font-bold">
                  <span className="flex items-center gap-1 tabular-nums text-rose-300">
                    <Heart className="h-3 w-3" /> {Math.round(hud.marsVitals.hunger)}%
                  </span>
                  <span className="flex items-center gap-1 tabular-nums text-emerald-300">
                    <BatteryCharging className="h-3 w-3" /> {Math.round(hud.marsVitals.energy)}%
                  </span>
                  {hud.marsVitals.carryingItem && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">
                      ✋ {hud.marsVitals.carryingItem}
                    </span>
                  )}
                </div>
              )}

              {/* Compact Notifications */}
              {hud.notifications.slice(0, 2).map((n) => (
                <div
                  key={n.id}
                  className={`flex max-w-xs items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-lg ${
                    n.tone === 'alert'
                      ? 'border-red-400/50 bg-red-950/92 text-red-100'
                      : n.tone === 'warn'
                        ? 'border-amber-400/50 bg-amber-950/92 text-amber-100'
                        : n.tone === 'success'
                          ? 'border-emerald-400/50 bg-emerald-950/92 text-emerald-100'
                          : 'border-cyan-400/40 bg-slate-900/92 text-cyan-100'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER-BOTTOM: Interaction Prompt, Speech Bubble & Road/Relocate Banner */}
          <div className="flex flex-col items-center gap-2.5">
            {hud.speechBubble && hud.speechBubble.world === hud.activeWorld && (
              <div className="rounded-2xl border border-cyan-300/40 bg-white px-4 py-1.5 text-xs font-extrabold text-slate-900 shadow-xl">
                💬 {hud.speechBubble.text}
              </div>
            )}

            {hud.placementPreview && (
              <div
                className={`pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold text-white shadow-2xl ${
                  hud.placementPreview.valid
                    ? 'border-emerald-400/60 bg-[#0f172a]/95'
                    : 'border-rose-400/65 bg-[#1b1016]/95'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-cyan-300">
                      {hud.placementPreview.mode === 'construct' ? 'Build' : 'Move'}
                    </span>
                    <span className="font-extrabold text-white">{hud.placementPreview.name}</span>
                    <span className="tabular-nums text-[11px] text-slate-400">
                      {Math.round((((hud.placementPreview.rotationY * 180) / Math.PI) % 360 + 360) % 360)}°
                    </span>
                  </div>
                  <span
                    className={`mt-0.5 text-[11px] font-bold ${
                      hud.placementPreview.valid ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {hud.placementPreview.valid
                      ? 'Valid foundation — Move mouse to aim, Click or Enter to place'
                      : hud.placementPreview.reason || 'Invalid location'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => eng?.rotatePlacementPreview(-Math.PI / 12)}
                    className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold hover:bg-white/20"
                    title="Rotate Left (Q)"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Q
                  </button>
                  <button
                    onClick={() => eng?.rotatePlacementPreview(Math.PI / 12)}
                    className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold hover:bg-white/20"
                    title="Rotate Right (R)"
                  >
                    <RotateCw className="h-3.5 w-3.5" /> R
                  </button>
                  <button
                    disabled={!hud.placementPreview.valid}
                    onClick={() => eng?.confirmPlacementPreview()}
                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                      hud.placementPreview.valid
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'cursor-not-allowed bg-rose-950/80 text-rose-300/60'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Place
                  </button>
                  <button
                    onClick={() => eng?.cancelPlacementPreview()}
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hud.roadBuildMode !== 'none' && (
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-amber-400/50 bg-[#0f172a]/95 px-4 py-2 text-xs font-bold text-white shadow-xl">
                {hud.roadBuildMode === 'select_grade' ? (
                  <>
                    <span>Stage 1: Click terrain points ({hud.pendingRoadPoints.length})</span>
                    <button
                      onClick={() => eng?.addRoadWaypointAtPlayer()}
                      className="rounded-xl bg-white/15 px-3 py-1 hover:bg-white/25"
                    >
                      + Point Here
                    </button>
                    <button
                      onClick={() => eng?.stage1PrepareRoadTerrain()}
                      className="rounded-xl bg-amber-400 px-3 py-1 font-extrabold text-slate-950"
                    >
                      Grade Terrain
                    </button>
                  </>
                ) : (
                  <>
                    <span>Terrain Prepared! Ready for Stage 2:</span>
                    <button
                      onClick={() => eng?.stage2PaveRoad()}
                      className="rounded-xl bg-emerald-400 px-3 py-1 font-extrabold text-slate-950"
                    >
                      Construct Road Surface
                    </button>
                  </>
                )}
                <button
                  onClick={() => eng?.cancelRoadBuilder()}
                  className="rounded-xl bg-white/10 px-2.5 py-1"
                >
                  Cancel
                </button>
              </div>
            )}

            {hud.nearbyExhibit && !hud.activeExhibit && (
              <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl border border-sky-400/55 bg-[#0c1424]/95 px-4 py-2.5 shadow-2xl">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-black text-sky-300">
                      {hud.nearbyExhibit.year}
                    </span>
                    <span className="truncate text-sm font-black text-white">
                      {hud.nearbyExhibit.title}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-300">
                    {hud.nearbyExhibit.fact}
                  </p>
                </div>
                <button
                  onClick={() => eng?.openExhibitById(hud.nearbyExhibit!.id)}
                  title="Open Detailed Information Panel (E)"
                  aria-label={`Open information for ${hud.nearbyExhibit.title}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-400 px-3 py-2 text-xs font-black text-slate-950 shadow-lg transition hover:scale-105 hover:bg-sky-300 active:scale-95"
                >
                  <Info className="h-4 w-4" />
                  <span>Details (E)</span>
                </button>
              </div>
            )}

            {hud.nearbyPrompt && hud.nearbyPrompt.actionId !== 'exhibit' && (
              <button
                onClick={() => eng?.triggerInteract()}
                className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-amber-300/60 bg-[#0f172a]/95 px-4 py-2 text-sm font-extrabold text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-xs font-black text-slate-950">
                  {hud.nearbyPrompt.key}
                </span>
                <span>{hud.nearbyPrompt.label}</span>
              </button>
            )}

            {/* BOTTOM DOCK */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#0f172a]/92 px-3 py-2 shadow-2xl">
              <button
                onClick={() => setShowMissions(true)}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-extrabold text-white transition hover:scale-105 hover:bg-white/20"
              >
                <Layers className="h-4 w-4 text-amber-300" />
                Missions (Tab)
              </button>

              <button
                onClick={() => setShowWardrobe(true)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:scale-105 active:scale-95"
              >
                <ShoppingBag className="h-4 w-4" />
                Wardrobe &amp; Store
              </button>

              {hud.activeWorld === 'mars' && (
                <>
                  <button
                    onClick={() => setShowMoveMenu((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:scale-105 hover:bg-white/20"
                  >
                    <Move className="h-4 w-4 text-emerald-300" />
                    Move Building
                  </button>

                  <button
                    onClick={() => eng?.startRoadBuilder()}
                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:scale-105 hover:bg-white/20"
                  >
                    <Route className="h-4 w-4 text-amber-300" />
                    Build Road
                  </button>

                  {hud.pets.length > 0 && (
                    <button
                      onClick={() => eng?.callPets()}
                      className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:scale-105 hover:bg-white/20"
                    >
                      <Bot className="h-4 w-4 text-sky-300" />
                      Call Pets (C)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Building Relocation Picker Popover */}
          {showMoveMenu && hud.activeWorld === 'mars' && (
            <div className="pointer-events-auto fixed bottom-20 left-1/2 z-30 w-72 -translate-x-1/2 rounded-2xl border border-emerald-400/35 bg-[#11192a] p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Hammer className="h-3.5 w-3.5" /> Select Building to Relocate
                </span>
                <button onClick={() => setShowMoveMenu(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {hud.buildings
                  .filter((b) => !b.protectedFromMove)
                  .map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        eng?.startRelocateBuilding(b.id);
                        setShowMoveMenu(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left text-xs font-bold text-white hover:bg-emerald-500/20"
                    >
                      <span>{b.name}</span>
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Mobile Touch Controls (auto-shown on touch devices) */}
          {isTouchDevice && (
            <div className="pointer-events-auto fixed bottom-20 left-4 right-4 flex items-end justify-between">
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-900/80 p-2">
                <div />
                <button
                  onTouchStart={() => eng?.setTouchMove(0, -1)}
                  onTouchEnd={() => eng?.setTouchMove(0, 0)}
                  className="h-11 w-11 rounded-xl bg-white/15 font-bold"
                >
                  ▲
                </button>
                <div />
                <button
                  onTouchStart={() => eng?.setTouchMove(-1, 0)}
                  onTouchEnd={() => eng?.setTouchMove(0, 0)}
                  className="h-11 w-11 rounded-xl bg-white/15 font-bold"
                >
                  ◀
                </button>
                <button
                  onTouchStart={() => eng?.setTouchMove(0, 1)}
                  onTouchEnd={() => eng?.setTouchMove(0, 0)}
                  className="h-11 w-11 rounded-xl bg-white/15 font-bold"
                >
                  ▼
                </button>
                <button
                  onTouchStart={() => eng?.setTouchMove(1, 0)}
                  onTouchEnd={() => eng?.setTouchMove(0, 0)}
                  className="h-11 w-11 rounded-xl bg-white/15 font-bold"
                >
                  ▶
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => eng?.triggerJump()}
                  className="h-14 w-14 rounded-2xl bg-sky-500/90 text-xs font-black text-slate-950 shadow-lg"
                >
                  JUMP
                </button>
                <button
                  onClick={() => eng?.triggerInteract()}
                  className="h-14 w-14 rounded-2xl bg-amber-400/95 text-xs font-black text-slate-950 shadow-lg"
                >
                  USE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {hud && showWardrobe && (
        <WardrobeModal
          hud={hud}
          onClose={() => setShowWardrobe(false)}
          onAction={(id) => eng?.purchaseOrEquipItem(id)}
        />
      )}

      {hud && showMissions && (
        <MissionModal
          hud={hud}
          onClose={() => setShowMissions(false)}
          onSwitchWorld={(w) => eng?.switchWorld(w)}
        />
      )}

      {hud?.activeMiniGame && (
        <MiniGameModal
          miniGame={hud.activeMiniGame}
          onComplete={(ok) => eng?.finishMiniGame(ok)}
        />
      )}

      {hud?.activeExhibit && (
        <ExhibitModal
          exhibit={hud.activeExhibit}
          onClose={() => eng?.closeExhibit()}
          onSelectExhibit={(id) => eng?.openExhibitById(id)}
        />
      )}

      {/* PAUSE MODAL */}
      {hud?.screen === 'paused' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-300/30 bg-[#11192a] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black tracking-wide text-white">MISSION PAUSED</h2>
            <p className="mt-1 text-xs text-slate-400">
              Level {hud.currentLevel}: {currentDef.title}
            </p>

            <div className="mt-5 space-y-2.5 text-left text-xs font-bold text-slate-300">
              <label className="flex items-center justify-between">
                <span>Master Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(hud.volume * 100)}
                  onChange={(e) => eng?.setVolume(Number(e.target.value) / 100)}
                  className="w-36 accent-cyan-400"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Ambience</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(hud.audioVolumes.ambience * 100)}
                  onChange={(e) => eng?.setChannelVolume('ambience', Number(e.target.value) / 100)}
                  className="w-36 accent-sky-400"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Effects</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(hud.audioVolumes.effects * 100)}
                  onChange={(e) => eng?.setChannelVolume('effects', Number(e.target.value) / 100)}
                  className="w-36 accent-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Alerts</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(hud.audioVolumes.alerts * 100)}
                  onChange={(e) => eng?.setChannelVolume('alerts', Number(e.target.value) / 100)}
                  className="w-36 accent-amber-400"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => eng?.setScreen('playing')}
                className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
              >
                RESUME EXPEDITION
              </button>
              <button
                onClick={() => {
                  eng?.recoverStuckPlayer();
                  eng?.setScreen('playing');
                }}
                className="w-full rounded-2xl border border-emerald-400/35 bg-emerald-500/15 py-2.5 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/25"
              >
                RECOVER ASTRONAUT POSITION (F8)
              </button>
              <button
                onClick={() => {
                  eng?.saveGame();
                  eng?.setScreen('title');
                }}
                className="w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-slate-200 hover:bg-white/20"
              >
                SAVE &amp; RETURN TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL (Level 20 Complete) */}
      {hud?.screen === 'victory' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-300/50 bg-[#11192a] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
              <Sparkles className="h-9 w-9" />
            </div>
            <h2 className="text-3xl font-black text-amber-300">OUTPOST ZERO ESTABLISHED!</h2>
            <p className="mt-2 text-sm text-slate-300">
              You united Earth science and Martian engineering to build a thriving, sustainable colony across 20 levels!
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => eng?.setScreen('playing')}
                className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950"
              >
                CONTINUE FREE EXPLORATION
              </button>
              <button
                onClick={() => eng?.startGame(false)}
                className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold text-white"
              >
                NEW CAMPAIGN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
