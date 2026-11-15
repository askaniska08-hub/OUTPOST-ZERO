import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Check, Lock, RotateCw, ShoppingBag, Sparkles, X } from 'lucide-react';
import { CATALOGUE_ITEMS } from '../data/catalogue';
import { createAstronautModel } from '../engine/astronautModel';
import { createBuildingMesh } from '../engine/marsBuildings';
import { createPetModel } from '../engine/petModel';
import { CatalogueItem, HudSnapshot, WardrobeCategory } from '../types/game';

interface WardrobeModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onAction: (itemId: string) => void;
}

const CATEGORIES: { id: WardrobeCategory; label: string }[] = [
  { id: 'outfits', label: 'Outfits' },
  { id: 'pets', label: 'Pets' },
  { id: 'buildings', label: 'Buildings' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'decorations', label: 'Decorations' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'supplies', label: 'Supplies' },
];

// Live 3D Turntable Preview Renderer so every Suit, Pet & Building has an actual inspectable 3D model!
const Item3DPreview: React.FC<{ item: CatalogueItem }> = ({ item }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const yawRef = useRef(0.5);
  const dragRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 280, el.clientHeight || 240);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight('#bae6fd', '#334155', 0.9));
    const key = new THREE.DirectionalLight('#fffbeb', 1.8);
    key.position.set(4, 6, 5);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(42, (el.clientWidth || 280) / (el.clientHeight || 240), 0.1, 100);

    const turntable = new THREE.Group();
    scene.add(turntable);

    // Pedestal ring
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.3, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.5 })
    );
    ped.position.y = -0.07;
    turntable.add(ped);

    if (item.category === 'outfits') {
      const mode = item.world === 'earth' ? 'earth' : 'mars';
      const astro = createAstronautModel(mode, item.suitId || 'mars_artemis', item.uniformId || 'earth_navy');
      turntable.add(astro.root);
      camera.position.set(0, 1.25, 3.4);
      camera.lookAt(0, 0.95, 0);
    } else if (item.category === 'pets') {
      const pet = createPetModel(item.species || 'dog', item.color, item.accentColor || '#38bdf8');
      pet.root.scale.setScalar(1.85);
      turntable.add(pet.root);
      camera.position.set(0, 1.1, 2.7);
      camera.lookAt(0, 0.55, 0);
    } else if (item.category === 'buildings' && item.buildingType) {
      const bHandle = createBuildingMesh({
        id: 'preview',
        type: item.buildingType,
        name: item.name,
        position: [0, 0, 0],
        rotationY: 0,
        level: 1,
        dustLevel: 0,
        damaged: false,
        hasInterior: false,
        footprintRadius: 4,
        cropPlanted: true,
        cropGrowth: 85,
      });
      const bScale =
        item.buildingType === 'landing_port'
          ? 0.075
          : item.buildingType === 'dormitory' || item.buildingType === 'greenhouse'
            ? 0.105
            : 0.145;
      bHandle.root.scale.setScalar(bScale);
      turntable.add(bHandle.root);
      camera.position.set(0, 2.0, 4.2);
      camera.lookAt(0, 0.45, 0);
    } else {
      // Furniture / Decor / Equipment / Supplies 3D showcase prop
      const mat = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.3,
        metalness: 0.35,
      });
      const acc = new THREE.MeshStandardMaterial({
        color: item.accentColor || '#38bdf8',
        emissive: item.accentColor || '#38bdf8',
        emissiveIntensity: 0.35,
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.55, 16), mat);
      base.position.y = 0.35;
      const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), acc);
      top.position.y = 0.95;
      turntable.add(base, top);
      camera.position.set(0, 1.15, 2.7);
      camera.lookAt(0, 0.65, 0);
    }

    let frame = 0;
    const renderLoop = () => {
      if (!dragRef.current) yawRef.current += 0.012;
      turntable.rotation.y = yawRef.current;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [item]);

  return (
    <div
      ref={mountRef}
      onPointerDown={(e) => {
        dragRef.current = true;
        lastXRef.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragRef.current) return;
        yawRef.current += (e.clientX - lastXRef.current) * 0.015;
        lastXRef.current = e.clientX;
      }}
      onPointerUp={() => {
        dragRef.current = false;
      }}
      onPointerLeave={() => {
        dragRef.current = false;
      }}
      className="relative h-60 w-full cursor-grab overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#0c1424] active:cursor-grabbing"
    >
      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
        <RotateCw className="h-3 w-3" />
        <span>Drag to Rotate 3D</span>
      </div>
    </div>
  );
};

export const WardrobeModal: React.FC<WardrobeModalProps> = ({ hud, onClose, onAction }) => {
  const [cat, setCat] = useState<WardrobeCategory>('outfits');
  const items = CATALOGUE_ITEMS.filter((i) => i.category === cat);
  const [selected, setSelected] = useState<CatalogueItem>(items[0]);

  const handleSelectCategory = (c: WardrobeCategory) => {
    setCat(c);
    const first = CATALOGUE_ITEMS.find((i) => i.category === c);
    if (first) setSelected(first);
  };

  const isOwned = hud.ownedItems.includes(selected.id);
  const isEquipped =
    selected.suitId === hud.equippedMarsSuit || selected.uniformId === hud.equippedEarthUniform;
  const isLocked = hud.currentLevel < selected.unlockLevel;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-cyan-300/30 bg-[#11192a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-wide text-white">
                COLONY WARDROBE &amp; SUPPLY CATALOGUE
              </h2>
              <p className="text-xs text-slate-400">
                Inspect 3D suits, robotic companions &amp; modular colony buildings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/20 px-3 py-1.5 text-sm font-bold tabular-nums text-amber-300">
              🪙 {hud.resources.coins} Coins
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Category Row at Top */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-900/60 px-6 py-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCategory(c.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all hover:scale-105 active:scale-95 ${
                cat === c.id
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Main Split: Catalogue Grid + Interactive 3D Preview */}
        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-6 md:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:col-span-7">
            {items.map((item) => {
              const owned = hud.ownedItems.includes(item.id);
              const eq =
                item.suitId === hud.equippedMarsSuit || item.uniformId === hud.equippedEarthUniform;
              const locked = hud.currentLevel < item.unlockLevel;
              const active = selected.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all hover:scale-[1.02] active:scale-95 ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="h-7 w-7 rounded-lg border border-white/25 shadow-inner"
                      style={{ backgroundColor: item.color }}
                    />
                    {eq ? (
                      <span className="rounded-lg bg-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        EQUIPPED
                      </span>
                    ) : owned && item.category !== 'buildings' && item.category !== 'supplies' ? (
                      <span className="rounded-lg bg-sky-500/25 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                        OWNED
                      </span>
                    ) : locked ? (
                      <span className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                        <Lock className="h-2.5 w-2.5" /> Lvl {item.unlockLevel}
                      </span>
                    ) : (
                      <span className="tabular-nums text-xs font-bold text-amber-300">
                        🪙 {item.cost}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                      {item.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3D Inspector Panel */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4 md:col-span-5">
            <div>
              <Item3DPreview item={selected} />
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">{selected.name}</h3>
                  <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase text-cyan-300">
                    {selected.world || 'Mars'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{selected.shortDesc}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {selected.batteryCapacity && (
                    <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-300">
                      ⚡ {selected.batteryCapacity}% Battery Cell
                    </span>
                  )}
                  {selected.materialsCost && (
                    <span className="rounded-lg bg-slate-700/70 px-2.5 py-1 font-bold text-slate-200">
                      🧱 {selected.materialsCost} Materials
                    </span>
                  )}
                  <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-bold tabular-nums text-amber-300">
                    🪙 {selected.cost} Coins
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={isLocked || isEquipped}
              onClick={() => {
                onAction(selected.id);
                if (
                  selected.category === 'buildings' &&
                  hud.resources.coins >= selected.cost &&
                  hud.resources.materials >= (selected.materialsCost || 0)
                ) {
                  onClose();
                }
              }}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold tracking-wide transition-all ${
                isLocked
                  ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                  : isEquipped
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4" /> Unlocks at Level {selected.unlockLevel}
                </>
              ) : isEquipped ? (
                <>
                  <Check className="h-4 w-4" /> Equipped
                </>
              ) : isOwned && selected.category !== 'buildings' && selected.category !== 'supplies' ? (
                <>
                  <Sparkles className="h-4 w-4" /> Equip Now
                </>
              ) : selected.category === 'buildings' ? (
                <>Place on Mars ({selected.cost} Coins)</>
              ) : (
                <>Purchase ({selected.cost} Coins)</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
