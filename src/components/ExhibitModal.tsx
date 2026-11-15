import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Compass,
  Info,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { HISTORICAL_TIMELINE_MILESTONES } from '../data/nasaExhibition';
import { ExhibitInfo } from '../types/game';

interface ExhibitModalProps {
  exhibit: ExhibitInfo;
  onClose: () => void;
  onSelectExhibit: (id: string) => void;
}

function ExhibitFallbackIllustration({ exhibit }: { exhibit: ExhibitInfo }) {
  const accent = exhibit.accentColor || '#38bdf8';
  const kind = exhibit.visualKind || 'monument_rocket';

  return (
    <svg
      viewBox="0 0 420 260"
      className="h-full w-full rounded-xl bg-[#091120]"
      role="img"
      aria-label={exhibit.title}
    >
      <defs>
        <radialGradient id="exGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#091120" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="420" height="260" fill="#091120" />
      <rect width="420" height="260" fill="url(#exGlow)" />

      {/* Subtle starfield & blueprint grid */}
      {[
        [36, 38],
        [92, 24],
        [168, 42],
        [244, 28],
        [312, 46],
        [374, 34],
        [54, 198],
        [358, 192],
        [390, 128],
      ].map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r={idx % 2 === 0 ? 1.8 : 1.2} fill="#cbd5e1" opacity="0.6" />
      ))}

      {kind.startsWith('astronaut_') && (
        <g transform="translate(210, 132)">
          <circle cx="0" cy="-14" r="66" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 5" opacity="0.55" />
          <path d="M-54,78 C-54,36 -30,22 0,22 C30,22 54,36 54,78 Z" fill="#e2e8f0" />
          <rect x="-20" y="34" width="40" height="24" rx="4" fill="#1e293b" stroke={accent} strokeWidth="1.5" />
          <circle cx="0" cy="-18" r="36" fill="#f8fafc" />
          <rect x="-25" y="-34" width="50" height="30" rx="14" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
          <path d="M-16,-24 Q-4,-30 12,-24" stroke="#fef3c7" strokeWidth="2.5" fill="none" opacity="0.7" />
        </g>
      )}

      {kind === 'agc_dsky' && (
        <g transform="translate(120, 48)">
          <rect x="0" y="0" width="180" height="164" rx="12" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
          <rect x="18" y="16" width="144" height="62" rx="6" fill="#052e16" stroke="#22c55e" strokeWidth="2" />
          <text x="90" y="42" textAnchor="middle" fill="#4ade80" fontSize="14" fontFamily="monospace" fontWeight="bold">
            PROG 64  VERB 06
          </text>
          <text x="90" y="64" textAnchor="middle" fill="#4ade80" fontSize="14" fontFamily="monospace" fontWeight="bold">
            +00124  -00042
          </text>
          {[0, 1, 2, 3, 4].map((c) =>
            [0, 1, 2].map((r) => (
              <rect
                key={`${c}_${r}`}
                x={22 + c * 28}
                y={92 + r * 20}
                width="22"
                height="15"
                rx="3"
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth="1"
              />
            ))
          )}
        </g>
      )}

      {kind === 'gps_constellation' && (
        <g transform="translate(210, 130)">
          <circle cx="0" cy="0" r="38" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="125" ry="42" transform="rotate(-24)" fill="none" stroke="#22d3ee" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="125" ry="42" transform="rotate(36)" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="125" ry="42" transform="rotate(88)" fill="none" stroke="#a5f3fc" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x="92" y="-34" width="16" height="10" rx="2" fill="#fbbf24" />
          <rect x="-108" y="24" width="16" height="10" rx="2" fill="#fbbf24" />
          <rect x="-8" y="-122" width="16" height="10" rx="2" fill="#fbbf24" />
        </g>
      )}

      {kind === 'apollo_eagle' && (
        <g transform="translate(210, 140)">
          <line x1="-150" y1="74" x2="150" y2="74" stroke="#94a3b8" strokeWidth="3" />
          <path d="M-36,-10 L36,-10 L44,24 L-44,24 Z" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />
          <rect x="-26" y="-48" width="52" height="38" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <line x1="-38" y1="22" x2="-64" y2="72" stroke="#f59e0b" strokeWidth="4" />
          <line x1="38" y1="22" x2="64" y2="72" stroke="#f59e0b" strokeWidth="4" />
          <line x1="0" y1="22" x2="0" y2="72" stroke="#f59e0b" strokeWidth="4" />
          <ellipse cx="-64" cy="73" rx="12" ry="4" fill="#fbbf24" />
          <ellipse cx="64" cy="73" rx="12" ry="4" fill="#fbbf24" />
        </g>
      )}

      {(kind === 'mer_rover' || kind === 'curiosity_rover' || kind === 'perseverance_ingenuity') && (
        <g transform="translate(210, 146)">
          <line x1="-155" y1="62" x2="155" y2="62" stroke="#c87d55" strokeWidth="4" />
          <rect x="-56" y="-12" width="112" height="34" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <rect x="-32" y="-56" width="10" height="44" fill="#cbd5e1" />
          <rect x="-42" y="-68" width="32" height="16" rx="4" fill="#e2e8f0" stroke={accent} strokeWidth="2" />
          <circle cx="-26" cy="-60" r="4" fill="#38bdf8" />
          {[-44, 0, 44].map((wx) => (
            <circle key={wx} cx={wx} cy="46" r="16" fill="#1e293b" stroke="#cbd5e1" strokeWidth="3" />
          ))}
          {kind === 'perseverance_ingenuity' && (
            <g transform="translate(94, -52)">
              <rect x="-10" y="-8" width="20" height="16" rx="3" fill="#f59e0b" />
              <line x1="-32" y1="-16" x2="32" y2="-16" stroke="#38bdf8" strokeWidth="3" />
              <line x1="-10" y1="8" x2="-16" y2="20" stroke="#94a3b8" strokeWidth="2" />
              <line x1="10" y1="8" x2="16" y2="20" stroke="#94a3b8" strokeWidth="2" />
            </g>
          )}
        </g>
      )}

      {(kind === 'hubble_scope' ||
        kind === 'iss_station' ||
        kind === 'jwst_mirror' ||
        kind === 'voyager_probe' ||
        kind === 'landsat_earth' ||
        kind === 'space_shuttle' ||
        kind === 'monument_rocket' ||
        kind === 'future_artemis') && (
        <g transform="translate(210, 130)">
          <circle cx="0" cy="0" r="68" fill="none" stroke={accent} strokeWidth="2" opacity="0.45" />
          <ellipse cx="0" cy="0" rx="112" ry="34" transform="rotate(-18)" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          {kind === 'jwst_mirror' ? (
            <>
              <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#eab308" stroke="#fef08a" strokeWidth="2.5" />
              <polygon points="-58,34 0,14 58,34 0,58" fill="#cbd5e1" opacity="0.85" />
            </>
          ) : kind === 'monument_rocket' || kind === 'future_artemis' || kind === 'space_shuttle' ? (
            <>
              <path d="M0,-74 L18,-36 L18,46 L-18,46 L-18,-36 Z" fill="#f8fafc" />
              <path d="M-18,18 L-40,52 L-18,46 Z" fill={accent} />
              <path d="M18,18 L40,52 L18,46 Z" fill={accent} />
              <rect x="-18" y="-12" width="36" height="14" fill="#1e293b" />
            </>
          ) : (
            <>
              <rect x="-32" y="-18" width="64" height="36" rx="8" fill="#e2e8f0" stroke={accent} strokeWidth="2" />
              <rect x="-92" y="-12" width="52" height="24" rx="3" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
              <rect x="40" y="-12" width="52" height="24" rx="3" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

export const ExhibitModal: React.FC<ExhibitModalProps> = ({
  exhibit,
  onClose,
  onSelectExhibit,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [exhibit.id]);

  const categoryLabel =
    exhibit.category === 'astronaut'
      ? 'ASTRONAUT BIOGRAPHY'
      : exhibit.category === 'timeline'
        ? 'HISTORICAL TIMELINE'
        : exhibit.category === 'monument'
          ? 'SPACE EXPLORATION MONUMENT'
          : 'NASA & SPACE BREAKTHROUGH';

  const accent = exhibit.accentColor || '#38bdf8';

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-sky-400/35 bg-[#0c1424] shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-[#101b30] px-5 py-4 sm:px-7">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest text-slate-950"
                style={{ backgroundColor: accent }}
              >
                <Info className="h-3 w-3" />
                {categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                <Calendar className="h-3 w-3 text-sky-300" />
                {exhibit.year}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              {exhibit.title}
            </h2>
            <p className="text-xs font-bold text-amber-300 sm:text-sm">{exhibit.subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-extrabold text-slate-100 transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
            <span>Close (E / Esc)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Left Media Column */}
            <div className="flex flex-col gap-3 md:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#070d18]">
                {exhibit.imageUrl && !imgError ? (
                  <img
                    src={exhibit.imageUrl}
                    alt={exhibit.title}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ExhibitFallbackIllustration exhibit={exhibit} />
                )}
              </div>

              {(exhibit.imageCaption || exhibit.attribution) && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[11px] leading-snug text-slate-300">
                  {exhibit.imageCaption && <p className="font-medium text-slate-200">{exhibit.imageCaption}</p>}
                  {exhibit.attribution && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                      Source: {exhibit.attribution}
                    </p>
                  )}
                </div>
              )}

              {/* At-a-Glance Summary Card */}
              <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 p-3.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                  Exhibit Summary
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-100">
                  {exhibit.fact}
                </p>
              </div>
            </div>

            {/* Right Detailed Archive Column */}
            <div className="space-y-4 md:col-span-7">
              {exhibit.background && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                    <BookOpen className="h-3.5 w-3.5" />
                    Historical Background
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{exhibit.background}</p>
                </section>
              )}

              {exhibit.whatHappened && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-300">
                    <Compass className="h-3.5 w-3.5" />
                    What Happened
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{exhibit.whatHappened}</p>
                </section>
              )}

              {exhibit.peopleInvolved && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
                    <Users className="h-3.5 w-3.5" />
                    People &amp; Agencies Involved
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{exhibit.peopleInvolved}</p>
                </section>
              )}

              {(exhibit.significance || exhibit.whyItChanged) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {exhibit.significance && (
                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
                        <Award className="h-3.5 w-3.5" />
                        Significance
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                        {exhibit.significance}
                      </p>
                    </section>
                  )}
                  {exhibit.whyItChanged && (
                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Why It Changed Exploration
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                        {exhibit.whyItChanged}
                      </p>
                    </section>
                  )}
                </div>
              )}

              {exhibit.interestingFacts && exhibit.interestingFacts.length > 0 && (
                <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Notable Historical Facts
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                    {exhibit.interestingFacts.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Historical Timeline Bar Footer */}
        <div className="border-t border-white/10 bg-[#09101d] px-4 py-3 sm:px-6">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>NASA Chronological Timeline (1958 – 2021) · Click any milestone</span>
            <span className="text-sky-300">16 Milestones</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {HISTORICAL_TIMELINE_MILESTONES.map((ms) => {
              const active = ms.id === exhibit.id;
              return (
                <button
                  key={ms.id}
                  onClick={() => onSelectExhibit(ms.id)}
                  className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-left transition ${
                    active
                      ? 'border-sky-300 bg-sky-400 text-slate-950'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-sky-400/50 hover:bg-white/10'
                  }`}
                >
                  <div className={`text-[10px] font-black ${active ? 'text-slate-950' : 'text-sky-300'}`}>
                    {ms.year}
                  </div>
                  <div className="max-w-[110px] truncate text-[10px] font-bold">{ms.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
