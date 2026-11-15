import React from 'react';
import { Compass, Lock, Maximize2, Navigation, X } from 'lucide-react';
import { MARS_REGIONS } from '../data/catalogue';
import { HudSnapshot } from '../types/game';

interface MarsGlobalMapProps {
  hud: HudSnapshot;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelectTarget: (x: number, z: number, label: string) => void;
  onClearTarget: () => void;
}

export const MarsGlobalMap: React.FC<MarsGlobalMapProps> = ({
  hud,
  expanded,
  onToggleExpand,
  onSelectTarget,
  onClearTarget,
}) => {
  const worldSpan = 165; // -165..165 meters mapped accurately
  const size = expanded ? 410 : 178;
  const toMap = (wx: number, wz: number): [number, number] => {
    const mx = ((wx + worldSpan) / (worldSpan * 2)) * size;
    const my = ((wz + worldSpan) / (worldSpan * 2)) * size;
    return [
      Math.max(8, Math.min(size - 8, mx)),
      Math.max(8, Math.min(size - 8, my)),
    ];
  };

  const [px, pz] = toMap(hud.marsPos[0], hud.marsPos[2]);
  const [rx, rz] = toMap(hud.roverPos[0], hud.roverPos[2]);
  const maxMeters =
    hud.currentLevel >= 15
      ? 165
      : hud.currentLevel >= 12
        ? 132
        : hud.currentLevel >= 9
          ? 118
          : hud.currentLevel >= 6
            ? 112
            : hud.currentLevel >= 3
              ? 88
              : 62;
  const unlockedRadiusPx = (maxMeters / worldSpan) * (size * 0.5);

  const dorm = hud.buildings.find((b) => b.type === 'dormitory');
  const port = hud.buildings.find((b) => b.type === 'landing_port');

  // Stage-accurate mission target overrides generic quest marker
  const activeQuestMarker = hud.levelObjectives.find(
    (o) => o.world === 'mars' && !o.completed && o.targetPos
  );
  const stageTarget =
    (hud.missionStage === 'mars_arrival' || hud.missionStage === 'mars_return_base') && dorm
      ? { x: dorm.position[0], z: dorm.position[2] + 6.5, label: 'Return to Mars Base' }
      : hud.missionStage === 'mars_unlock_capsule' && hud.marsCapsule.arrived && !hud.marsCapsule.unlocked && port
        ? { x: port.position[0], z: port.position[2], label: 'Unlock Supply Capsule' }
        : null;

  const targetCoord = hud.selectedMapTarget
    ? { x: hud.selectedMapTarget.x, z: hud.selectedMapTarget.z, label: hud.selectedMapTarget.label }
    : stageTarget
      ? stageTarget
      : activeQuestMarker?.targetPos
        ? {
            x: activeQuestMarker.targetPos[0],
            z: activeQuestMarker.targetPos[2],
            label: activeQuestMarker.label,
          }
        : null;

  const targetDist = targetCoord
    ? Math.round(Math.hypot(targetCoord.x - hud.marsPos[0], targetCoord.z - hud.marsPos[2]))
    : null;
  const [tx, tz] = targetCoord ? toMap(targetCoord.x, targetCoord.z) : [0, 0];

  return (
    <div
      className={`pointer-events-auto rounded-2xl border border-amber-300/35 bg-[#1b1615]/92 shadow-2xl transition-all duration-150 ${
        expanded ? 'p-4' : 'p-2'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-200">
          <Compass className="h-3.5 w-3.5 text-amber-400" />
          <span>
            {expanded
              ? `MARS PLANETARY GPS · ${hud.discoveredRegionIds.length}/${MARS_REGIONS.length} REGIONS`
              : 'MARS MAP'}
          </span>
        </div>
        <button
          onClick={onToggleExpand}
          className="rounded-lg bg-white/10 p-1 text-slate-200 transition-transform hover:scale-105 hover:bg-white/20 active:scale-95"
          title={expanded ? 'Compact Map' : 'Expand Planetary Map'}
        >
          {expanded ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-amber-400/25"
        style={{
          width: size,
          height: size,
          background:
            'radial-gradient(circle at 38% 35%, #c8835e 0%, #9b5d44 55%, #5c3a31 100%)',
        }}
      >
        <svg width={size} height={size} className="block">
          {/* Polar North Ice Shelf */}
          <ellipse cx={size / 2} cy={size * 0.08} rx={size * 0.36} ry={size * 0.08} fill="#e2e8f0" opacity={0.38} />
          {/* Unlocked Exploration Boundary Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={Math.min(size * 0.49, unlockedRadiusPx)}
            fill="none"
            stroke={hud.fullWorldUnlocked ? '#22c55e' : '#38bdf8'}
            strokeWidth={1.3}
            strokeDasharray="4 4"
            opacity={0.7}
          />

          {/* Regional Landmarks & Discovery Pins */}
          {MARS_REGIONS.map((reg) => {
            const [rxp, rzp] = toMap(reg.center[0], reg.center[1]);
            const unlocked = hud.currentLevel >= reg.unlockLevel;
            const discovered = hud.discoveredRegionIds.includes(reg.id);
            return (
              <g
                key={reg.id}
                className={unlocked ? 'cursor-pointer' : 'opacity-45'}
                onClick={() => unlocked && onSelectTarget(reg.center[0], reg.center[1], reg.name)}
              >
                <circle
                  cx={rxp}
                  cy={rzp}
                  r={expanded ? 11 : 6}
                  fill="none"
                  stroke={discovered ? reg.color : '#cbd5e1'}
                  strokeWidth={1.1}
                  strokeDasharray={discovered ? undefined : '2 2'}
                  opacity={unlocked ? 0.75 : 0.35}
                />
                {expanded && (
                  <text
                    x={rxp}
                    y={rzp - 14}
                    textAnchor="middle"
                    fill={unlocked ? '#fef3c7' : '#94a3b8'}
                    fontSize={9}
                    fontWeight="700"
                  >
                    {reg.name.split('&')[0].trim()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Roads */}
          {hud.roads.map((road) => {
            const pts = road.points
              .map((p) => toMap(p[0], p[2]).join(','))
              .join(' ');
            return (
              <polyline
                key={road.id}
                points={pts}
                fill="none"
                stroke={road.stage === 'paved' ? '#e2e8f0' : '#fbbf24'}
                strokeWidth={road.stage === 'paved' ? 2.5 : 1.5}
              />
            );
          })}

          {/* GPS Navigation Route Line */}
          {targetCoord && (
            <line
              x1={px}
              y1={pz}
              x2={tx}
              y2={tz}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}

          {/* Colony Buildings */}
          {hud.buildings.map((b) => {
            const [bx, bz] = toMap(b.position[0], b.position[2]);
            const col =
              b.type === 'dormitory'
                ? '#22d3ee'
                : b.type === 'greenhouse'
                  ? '#4ade80'
                  : b.type === 'landing_port'
                    ? '#f59e0b'
                    : '#e2e8f0';
            return (
              <g
                key={b.id}
                className="cursor-pointer"
                onClick={() => onSelectTarget(b.position[0], b.position[2], b.name)}
              >
                <rect x={bx - 3} y={bz - 3} width={6} height={6} rx={1.5} fill={col} stroke="#0f172a" strokeWidth={0.8} />
              </g>
            );
          })}

          {/* Dynamic Random Meteorite Impacts */}
          {hud.meteorites
            .filter((m) => !m.collected)
            .map((m) => {
              const [mx, mz] = toMap(m.x, m.z);
              return (
                <g
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => onSelectTarget(m.x, m.z, 'Meteorite Impact')}
                >
                  <circle cx={mx} cy={mz} r={6} fill="#f97316" opacity={0.35} />
                  <circle cx={mx} cy={mz} r={3.5} fill="#fb923c" stroke="#fff" strokeWidth={1} />
                </g>
              );
            })}

          {/* Stranded Pets SOS */}
          {hud.pets
            .filter((p) => p.state === 'stranded_rescue')
            .map((p) => {
              const [sx, sz] = toMap(p.position[0], p.position[2]);
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => onSelectTarget(p.position[0], p.position[2], `Rescue ${p.name}`)}
                >
                  <circle cx={sx} cy={sz} r={6} fill="#ef4444" opacity={0.45} />
                  <circle cx={sx} cy={sz} r={3.5} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                </g>
              );
            })}

          {/* Active Quest / Selected Target Marker */}
          {targetCoord && (
            <g>
              <circle cx={tx} cy={tz} r={7} fill="none" stroke="#facc15" strokeWidth={1.8} />
              <circle cx={tx} cy={tz} r={2.8} fill="#facc15" />
            </g>
          )}

          {/* Rover Marker */}
          {hud.roverUnlocked && (
            <rect
              x={rx - 3.5}
              y={rz - 3.5}
              width={7}
              height={7}
              rx={2}
              fill="#fb923c"
              stroke="#ffffff"
              strokeWidth={1}
            />
          )}

          {/* Mars Astronaut Position */}
          <circle cx={px} cy={pz} r={4.5} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.6} />
        </svg>
      </div>

      {/* GPS Distance Readout */}
      <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-semibold text-slate-200">
        <div className="flex items-center gap-1 truncate">
          <Navigation className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="truncate">
            {targetCoord ? targetCoord.label : 'Free Exploration'}
          </span>
        </div>
        {targetDist !== null && (
          <div className="flex items-center gap-1">
            <span className="tabular-nums text-amber-300">{targetDist}m</span>
            {hud.selectedMapTarget && (
              <button
                onClick={onClearTarget}
                className="rounded bg-white/10 px-1 text-[10px] hover:bg-white/20"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-200">
          {MARS_REGIONS.map((reg) => {
            const unlocked = hud.currentLevel >= reg.unlockLevel;
            const discovered = hud.discoveredRegionIds.includes(reg.id);
            return (
              <button
                key={reg.id}
                disabled={!unlocked}
                onClick={() => onSelectTarget(reg.center[0], reg.center[1], reg.name)}
                className={`flex items-center justify-between gap-1.5 rounded-lg px-2 py-1 text-left ${
                  unlocked
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'cursor-not-allowed bg-white/5 text-slate-500'
                }`}
                title={reg.description}
              >
                <span className="truncate font-bold">{reg.name.split('&')[0].trim()}</span>
                {unlocked ? (
                  <span
                    className={`shrink-0 rounded px-1 text-[9px] font-black ${
                      discovered ? 'bg-emerald-500/25 text-emerald-300' : 'bg-sky-500/25 text-sky-300'
                    }`}
                  >
                    {discovered ? 'FOUND' : 'GO'}
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-0.5 text-[9px] text-slate-400">
                    <Lock className="h-2.5 w-2.5" /> L{reg.unlockLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
