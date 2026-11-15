import * as THREE from 'three';
import { EARTH_ROOMS } from '../data/catalogue';
import {
  FAMOUS_ASTRONAUT_EXHIBITS,
  HISTORICAL_TIMELINE_MILESTONES,
  NASA_BREAKTHROUGH_EXHIBITS,
} from '../data/nasaExhibition';
import { ExhibitInfo } from '../types/game';
import {
  createAstronautPortraitTexture,
  createEarthFloorTexture,
  createExhibitPlaqueTexture,
  createMissionPosterTexture,
  createMuseumFloorTexture,
  createRoomSignTexture,
  createTelemetryScreenTexture,
  createTimelineTotemTexture,
} from './textures';

export interface WallCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height?: number;
  blocksCamera?: boolean;
}

export interface CylinderCollider {
  x: number;
  z: number;
  radius: number;
}

export interface EarthExhibitSpot {
  id: string;
  x: number;
  z: number;
  radius: number;
  info: ExhibitInfo;
}

export interface EarthFacilityHandle {
  group: THREE.Group;
  trolleyGroup: THREE.Group;
  trolleyPartsGroup: THREE.Group;
  benchPartsGroup: THREE.Group;
  prototypeOnBench: THREE.Group;
  prototypeOnTester: THREE.Group;
  testerSpinner: THREE.Mesh;
  testerBeacon: THREE.Mesh;
  capsuleDoor: THREE.Mesh;
  rocketGroup: THREE.Group;
  rocketExhaust: THREE.Mesh;
  redLaunchButton: THREE.Mesh;
  launchGateGroup: THREE.Group;
  targetBeacon: THREE.Group;
  roomLockDoors: Map<string, THREE.Mesh[]>;
  wallColliders: WallCollider[];
  cylColliders: CylinderCollider[];
  partPickups: THREE.Group[];
  telemetryScreens: THREE.Mesh[];
  exhibits: EarthExhibitSpot[];
  clickableExhibitMeshes: THREE.Object3D[];
}

export function createEarthFacility(): EarthFacilityHandle {
  const group = new THREE.Group();

  // Campus Floor (expanded northwards to cover NASA Hall of Fame up to z = -58)
  const floorTex = createEarthFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.38,
    metalness: 0.08,
  });

  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(88, 94), floorMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(14, 0, -16);
  mainFloor.receiveShadow = true;
  group.add(mainFloor);

  // Exterior launch pad deck in Launch Facility (x: 32..52, z: -12..12)
  const launchDeck = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.72, metalness: 0.12 })
  );
  launchDeck.position.set(42, 0.03, 0);
  launchDeck.receiveShadow = true;
  group.add(launchDeck);

  // Launch pad hazard apron circle
  const apron = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.9, 0.16, 36),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.78 })
  );
  apron.position.set(42, 0.08, 0);
  apron.receiveShadow = true;
  group.add(apron);

  const hazardRing = new THREE.Mesh(
    new THREE.RingGeometry(7.5, 8.3, 36),
    new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide })
  );
  hazardRing.rotation.x = -Math.PI / 2;
  hazardRing.position.set(42, 0.17, 0);
  group.add(hazardRing);

  // Walkway stripe leading from Cargo Prep gate (x=32) straight to Launch Pad
  const launchWalkway = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3.6),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.55 })
  );
  launchWalkway.rotation.x = -Math.PI / 2;
  launchWalkway.position.set(35.5, 0.07, 0);
  group.add(launchWalkway);

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.42,
    metalness: 0.1,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.4,
    metalness: 0.55,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#bae6fd',
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    clearcoat: 1,
    depthWrite: false,
  });

  const wallColliders: WallCollider[] = [];
  const cylColliders: CylinderCollider[] = [];
  const roomLockDoors = new Map<string, THREE.Mesh[]>();

  const addBoxCollider = (
    cx: number,
    cz: number,
    w: number,
    d: number,
    height = 1.0,
    blocksCamera = false
  ) => {
    wallColliders.push({
      minX: cx - w * 0.5,
      maxX: cx + w * 0.5,
      minZ: cz - d * 0.5,
      maxZ: cz + d * 0.5,
      height,
      blocksCamera,
    });
  };

  const addCylCollider = (x: number, z: number, radius: number) => {
    cylColliders.push({ x, z, radius });
  };

  const addWall = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    height = 3.4,
    isGlass = false,
    thick = 0.35,
    customMat?: THREE.Material
  ) => {
    const cx = (x1 + x2) * 0.5;
    const cz = (z1 + z2) * 0.5;
    const w = Math.max(thick, Math.abs(x2 - x1));
    const d = Math.max(thick, Math.abs(z2 - z1));
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, height, d),
      customMat || (isGlass ? glassMat : wallMat)
    );
    mesh.position.set(cx, height * 0.5, cz);
    if (!isGlass) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    group.add(mesh);
    addBoxCollider(cx, cz, w, d, height, !isGlass && height >= 1.9);
  };

  // Subtle pastel color identity per room: floor inlay, perimeter border & room lighting
  for (const r of EARTH_ROOMS) {
    if (r.id === 'launch_facility' || r.id === 'space_gallery') continue;
    const rw = r.bounds.x2 - r.bounds.x1;
    const rd = r.bounds.z2 - r.bounds.z1;

    const pastelFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(rw - 0.8, rd - 0.8),
      new THREE.MeshStandardMaterial({
        color: r.pastelColor,
        roughness: 0.45,
        metalness: 0.04,
        transparent: true,
        opacity: 0.52,
      })
    );
    pastelFloor.rotation.x = -Math.PI / 2;
    pastelFloor.position.set(
      (r.bounds.x1 + r.bounds.x2) * 0.5,
      0.015,
      (r.bounds.z1 + r.bounds.z2) * 0.5
    );
    pastelFloor.receiveShadow = true;
    group.add(pastelFloor);

    // Architectural accent frame along top of room zone
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(rw - 0.7, 0.09, rd - 0.7),
      new THREE.MeshBasicMaterial({
        color: r.accentColor,
        wireframe: true,
        transparent: true,
        opacity: 0.28,
      })
    );
    rim.position.set(
      (r.bounds.x1 + r.bounds.x2) * 0.5,
      3.85,
      (r.bounds.z1 + r.bounds.z2) * 0.5
    );
    group.add(rim);
  }

  // Dedicated polished museum terrazzo floor for NASA Space Exploration Hall (x: -24..22, z: -58..-22)
  const museumFloorTex = createMuseumFloorTexture();
  const museumFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(45.4, 35.4),
    new THREE.MeshStandardMaterial({
      map: museumFloorTex,
      roughness: 0.28,
      metalness: 0.16,
    })
  );
  museumFloor.rotation.x = -Math.PI / 2;
  museumFloor.position.set(-1, 0.018, -40);
  museumFloor.receiveShadow = true;
  group.add(museumFloor);

  // =========================================================================
  // ARCHITECTURAL WALLS (WITH CLEAR 4.4m-6m DOORWAYS)
  // =========================================================================

  // Outer West & South walls
  addWall(-24, -22, -24, 22);
  addWall(-24, 22, 20, 22);

  // North wall between Research Wing (z=-22) and NASA Space Exploration Hall (z=-58..-22)
  // Doorway 1: from Hydroponics (-19..-15)
  // Doorway 2: from Water Analysis / Main Lab corridor (-4.4..0.4) — ALWAYS UNLOCKED AT LEVEL 1!
  addWall(-24, -22, -19.2, -22);
  addWall(-14.8, -22, -4.4, -22);
  addWall(0.4, -22, 22, -22);

  // NASA Space Exploration Hall Outer Perimeter (x: -24..22, z: -58..-22, tall architectural walls)
  addWall(-24, -58, -24, -22, 4.2);
  addWall(-24, -58, 22, -58, 4.2);
  addWall(22, -58, 22, -22, 4.2);

  // Internal Research Room Dividers
  // Inventory (-24..-10) <-> Main Lab (-10..6) doorway at z = -2.2..2.2
  addWall(-10, -8, -10, -2.2);
  addWall(-10, 2.2, -10, 8);
  // Main Lab <-> Water Analysis (-22..-8) doorway at x = -4.2..0.2
  addWall(-10, -8, -4.2, -8);
  addWall(0.2, -8, 6, -8);
  // Inventory <-> Hydroponics (-22..-8) doorway at x = -19.2..-14.8
  addWall(-24, -8, -19.2, -8);
  addWall(-14.8, -8, -10, -8);
  // Hydroponics <-> Water Analysis doorway at z = -17.2..-12.8
  addWall(-10, -22, -10, -17.2);
  addWall(-10, -12.8, -10, -8);
  // Inventory <-> Energy Testing (8..22) doorway at x = -19.2..-14.8
  addWall(-24, 8, -19.2, 8);
  addWall(-14.8, 8, -10, 8);
  // Main Lab <-> Radiation Testing (8..22) doorway at x = -4.2..0.2
  addWall(-10, 8, -4.2, 8);
  addWall(0.2, 8, 6, 8);
  // Energy Testing <-> Radiation Testing doorway at z = 12.8..17.2
  addWall(-10, 8, -10, 12.8);
  addWall(-10, 17.2, -10, 22);

  // East Wing: Equipment Testing (-22..-8), Transfer Tunnel (-3..3), Oxygen Research (8..22)
  addWall(6, -22, 6, -17.2);
  addWall(6, -12.8, 6, -2.6);
  addWall(6, 2.6, 6, 12.8);
  addWall(6, 17.2, 6, 22);
  addWall(6, -8, 20, -8);
  addWall(6, 8, 20, 8);
  addWall(20, -22, 20, -8);
  addWall(20, 8, 20, 22);

  // ENCLOSED BOARDING TRANSFER TUNNEL (x: 6..22, z: -3..3)
  addWall(6, -3, 22, -3, 3.2, true);
  addWall(6, 3, 22, 3, 3.2, true);
  for (let tx = 8; tx <= 20; tx += 3) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.14, 8, 20, Math.PI),
      trimMat
    );
    rib.rotation.y = Math.PI / 2;
    rib.position.set(tx, 0.2, 0);
    group.add(rib);
  }

  // Cargo Prep (22..32, -8..8), Mission Control (22..34, -20..-8), Launch Control Deck (22..34, 8..20)
  addWall(22, -20, 22, -3);
  addWall(22, 3, 22, 20);
  addWall(22, -8, 25.3, -8);
  addWall(29.7, -8, 34, -8);
  addWall(22, 8, 25.3, 8);
  addWall(29.7, 8, 34, 8);
  addWall(22, -20, 34, -20);
  addWall(22, 20, 34, 20);

  // Panoramic Glass Walls overlooking Launch Pad
  addWall(34, -20, 34, -8, 3.6, true); // Mission Control observation window
  addWall(34, 8, 34, 20, 3.6, true); // Launch Control Deck observation window

  // LAUNCH FACILITY GATE & WALKABLE PERIMETER (x: 32..52, z: -12..12)
  // Gate opening at x = 32 between z = -2.8 and z = 2.8 (5.6m wide!)
  addWall(32, -8, 32, -2.8, 3.6, false);
  addWall(32, 2.8, 32, 8, 3.6, false);
  // Launch Facility outer safety walls (open sky above, plenty of walking room around pad!)
  addWall(34, -12, 52, -12, 2.2, false);
  addWall(34, 12, 52, 12, 2.2, false);
  addWall(52, -12, 52, 12, 2.2, false);

  // Animated Automatic Sliding Blast Gate at Launch Facility Entrance (x=32, z=0)
  const launchGateGroup = new THREE.Group();
  launchGateGroup.position.set(32, 0, 0);
  group.add(launchGateGroup);

  const gatePostL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 0.45), trimMat);
  gatePostL.position.set(0, 1.9, -2.9);
  const gatePostR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 0.45), trimMat);
  gatePostR.position.set(0, 1.9, 2.9);
  const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 6.2), trimMat);
  gateLintel.position.set(0, 3.7, 0);
  launchGateGroup.add(gatePostL, gatePostR, gateLintel);

  const gateLeafMat = new THREE.MeshStandardMaterial({
    color: '#f97316',
    roughness: 0.35,
    metalness: 0.4,
    transparent: true,
    opacity: 0.86,
  });
  const gateLeafL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 2.65), gateLeafMat);
  gateLeafL.position.set(0, 1.6, -1.35);
  const gateLeafR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 2.65), gateLeafMat);
  gateLeafR.position.set(0, 1.6, 1.35);
  launchGateGroup.add(gateLeafL, gateLeafR);

  // =========================================================================
  // FUTURISTIC NASA-INSPIRED ROOM ENTRANCE SIGNAGE
  // =========================================================================
  const addEntranceSign = (
    title: string,
    accentColor: string,
    pastelColor: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    width = 3.6
  ) => {
    const tex = createRoomSignTexture(title, accentColor, pastelColor);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, 0.96, 0.14), trimMat);
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    group.add(frame);

    const frontFace = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.82),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    frontFace.position.set(0, 0, 0.08);
    frame.add(frontFace);

    const backFace = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.82),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    backFace.position.set(0, 0, -0.08);
    backFace.rotation.y = Math.PI;
    frame.add(backFace);
  };

  // Mount entrance signage cleanly above every major room entrance (facing approach corridor)
  const signPlacement: Record<string, { x: number; y: number; z: number; rotY: number; w?: number }> = {
    inventory_room: { x: -10, y: 3.15, z: 0, rotY: Math.PI / 2 },
    main_lab: { x: -10, y: 3.15, z: 0, rotY: Math.PI / 2 }, // double-sided lintel above central hall
    workstation_hub: { x: -3.5, y: 2.85, z: -1.5, rotY: 0, w: 3.0 },
    water_analysis: { x: -2, y: 3.15, z: -8, rotY: 0 },
    hydroponics_room: { x: -17, y: 3.15, z: -8, rotY: 0, w: 4.1 },
    energy_testing: { x: -17, y: 3.15, z: 8, rotY: 0 },
    radiation_testing: { x: -2, y: 3.15, z: 8, rotY: 0, w: 4.0 },
    equipment_testing: { x: 6, y: 3.15, z: -15, rotY: Math.PI / 2 },
    oxygen_research: { x: 6, y: 3.15, z: 15, rotY: Math.PI / 2 },
    space_gallery: { x: -2, y: 3.15, z: -22, rotY: 0, w: 4.3 },
    cargo_prep: { x: 22, y: 3.15, z: 0, rotY: Math.PI / 2 },
    launch_facility: { x: 32, y: 4.15, z: 0, rotY: Math.PI / 2, w: 4.0 },
    launch_observation: { x: 27.5, y: 3.15, z: 8, rotY: 0, w: 3.8 },
    mission_control: { x: 27.5, y: 3.15, z: -8, rotY: 0 },
  };

  for (const r of EARTH_ROOMS) {
    if (r.id === 'main_lab') {
      // Also mount RESEARCH LABORATORY sign above East Main Lab hall facing Transfer Tunnel
      addEntranceSign(r.signTitle, r.accentColor, r.pastelColor, 6, 3.15, 0, Math.PI / 2, 3.8);
      continue;
    }
    const sp = signPlacement[r.id];
    if (sp) {
      addEntranceSign(r.signTitle, r.accentColor, r.pastelColor, sp.x, sp.y, sp.z, sp.rotY, sp.w || 3.6);
    }
  }

  // Progressive Room Lock Barriers matched accurately to EARTH_ROOMS IDs
  const addLockBarrier = (roomId: string, x: number, z: number, rotY = 0) => {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.8, 0.22),
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#f59e0b',
        emissiveIntensity: 0.28,
        transparent: true,
        opacity: 0.68,
      })
    );
    door.position.set(x, 1.4, z);
    door.rotation.y = rotY;
    group.add(door);
    const list = roomLockDoors.get(roomId) || [];
    list.push(door);
    roomLockDoors.set(roomId, list);
  };

  addLockBarrier('energy_testing', -17, 8, 0);
  addLockBarrier('energy_testing', -10, 15, Math.PI / 2);
  addLockBarrier('hydroponics_room', -17, -8, 0);
  addLockBarrier('hydroponics_room', -10, -15, Math.PI / 2);
  addLockBarrier('hydroponics_room', -17, -22, 0);
  addLockBarrier('oxygen_research', 6, 15, Math.PI / 2);
  addLockBarrier('radiation_testing', -2, 8, 0);
  addLockBarrier('equipment_testing', 6, -15, Math.PI / 2);

  // =========================================================================
  // 1. INVENTORY & STORAGE ROOM (-24..-10, -8..8)
  // =========================================================================
  const shelfMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.5, roughness: 0.4 });
  [-21, -17, -13].forEach((sx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.9), shelfMat);
    shelf.position.set(sx, 1.1, -6.0);
    shelf.castShadow = true;
    group.add(shelf);
    addBoxCollider(sx, -6.0, 2.6, 0.9);
  });

  // 3 Pickable Part Pedestals
  const partPickups: THREE.Group[] = [];
  const partColors = ['#38bdf8', '#f59e0b', '#22c55e'];
  [-20, -17, -14].forEach((px, idx) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(px, 0.9, -3.6);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.9, 14), trimMat);
    ped.position.y = -0.45;
    pGroup.add(ped);
    addCylCollider(px, -3.6, 0.55);

    const partObj = new THREE.Mesh(
      idx === 0
        ? new THREE.CylinderGeometry(0.22, 0.22, 0.42, 12)
        : idx === 1
          ? new THREE.OctahedronGeometry(0.26, 0)
          : new THREE.TorusGeometry(0.2, 0.08, 10, 18),
      new THREE.MeshStandardMaterial({
        color: partColors[idx],
        emissive: partColors[idx],
        emissiveIntensity: 0.45,
        roughness: 0.25,
      })
    );
    partObj.position.y = 0.25;
    pGroup.add(partObj);
    group.add(pGroup);
    partPickups.push(pGroup);
  });

  // Physical Pushable Trolley
  const trolleyGroup = new THREE.Group();
  trolleyGroup.position.set(-14, 0, 1.5);
  group.add(trolleyGroup);

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.12, 1.0),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.4 })
  );
  tray.position.y = 0.65;
  tray.castShadow = true;
  trolleyGroup.add(tray);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), trimMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.05, 0.55);
  trolleyGroup.add(handleBar);

  [-0.55, 0.55].forEach((wx) => {
    [-0.4, 0.4].forEach((wz) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), trimMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.14, wz);
      trolleyGroup.add(wheel);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.52, 8), trimMat);
      leg.position.set(wx, 0.4, wz);
      trolleyGroup.add(leg);
    });
  });

  const trolleyPartsGroup = new THREE.Group();
  trolleyPartsGroup.position.y = 0.85;
  trolleyGroup.add(trolleyPartsGroup);

  // =========================================================================
  // 2. WORKSTATION & RESEARCH LABORATORY (-10..6, -8..8)
  // =========================================================================
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 1.5), trimMat);
  bench.position.set(-3.5, 0.48, -1.5);
  bench.castShadow = true;
  group.add(bench);
  addBoxCollider(-3.5, -1.5, 3.4, 1.5);

  const benchPartsGroup = new THREE.Group();
  benchPartsGroup.position.set(-3.5, 1.08, -1.5);
  group.add(benchPartsGroup);

  const prototypeOnBench = new THREE.Group();
  prototypeOnBench.position.set(-3.5, 1.15, -1.5);
  prototypeOnBench.visible = false;
  const protoCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.38, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.5, roughness: 0.25 })
  );
  const protoRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.06, 10, 20),
    new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#f59e0b', emissiveIntensity: 0.7 })
  );
  protoRing.rotation.x = Math.PI / 2;
  prototypeOnBench.add(protoCore, protoRing);
  group.add(prototypeOnBench);

  // 30-Second Testing Station at (2, 0, -4.5)
  const testerGroup = new THREE.Group();
  testerGroup.position.set(2, 0, -4.5);
  group.add(testerGroup);
  const testerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.9, 20), trimMat);
  testerBase.position.y = 0.45;
  testerGroup.add(testerBase);
  addCylCollider(2, -4.5, 1.45);

  const testerSpinner = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 10, 28),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.9 })
  );
  testerSpinner.rotation.x = Math.PI / 2;
  testerSpinner.position.y = 1.25;
  testerGroup.add(testerSpinner);
  const testerBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.3 })
  );
  testerBeacon.position.set(1.1, 1.5, 0);
  testerGroup.add(testerBeacon);

  const prototypeOnTester = prototypeOnBench.clone();
  prototypeOnTester.position.set(0, 1.25, 0);
  prototypeOnTester.visible = false;
  testerGroup.add(prototypeOnTester);

  // =========================================================================
  // 3. WATER ANALYSIS ROOM (-10..6, -22..-8)
  // =========================================================================
  const microDesk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.3), wallMat);
  microDesk.position.set(-2, 0.45, -15.5);
  microDesk.castShadow = true;
  group.add(microDesk);
  addBoxCollider(-2, -15.5, 2.8, 1.3);

  const microBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.55), trimMat);
  microBase.position.set(-2, 0.97, -15.5);
  const microArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 12), wallMat);
  microArm.position.set(-2, 1.32, -15.65);
  const microTube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.45, 12), trimMat);
  microTube.position.set(-2, 1.48, -15.45);
  microTube.rotation.x = 0.45;
  group.add(microBase, microArm, microTube);

  // =========================================================================
  // 4. HYDROPONICS & AGRICULTURE (-24..-10, -22..-8)
  // =========================================================================
  const earthSoil = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.65, 2.3),
    new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 })
  );
  earthSoil.position.set(-17, 0.33, -15.5);
  earthSoil.castShadow = true;
  group.add(earthSoil);
  addBoxCollider(-17, -15.5, 6.2, 2.3);

  for (let cx = -19.5; cx <= -14.5; cx += 1.2) {
    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.65 })
    );
    plant.position.set(cx, 0.85, -15.5);
    group.add(plant);
  }

  // =========================================================================
  // 5. ENERGY TESTING, RADIATION TESTING, EQUIPMENT TESTING, OXYGEN RESEARCH
  // =========================================================================
  const hydroTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.0, 2.4, 16),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#d97706', emissiveIntensity: 0.35 })
  );
  hydroTower.position.set(-17, 1.2, 15.5);
  hydroTower.castShadow = true;
  group.add(hydroTower);
  addCylCollider(-17, 15.5, 1.05);

  const matChamber = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.1, 2.2),
    new THREE.MeshStandardMaterial({ color: '#fb923c', transparent: true, opacity: 0.6 })
  );
  matChamber.position.set(-2, 1.05, 15.5);
  matChamber.castShadow = true;
  group.add(matChamber);
  addBoxCollider(-2, 15.5, 2.4, 2.2);

  const roboRig = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.2, 1.8),
    new THREE.MeshStandardMaterial({ color: '#f87171', roughness: 0.35 })
  );
  roboRig.position.set(13, 0.6, -15);
  roboRig.castShadow = true;
  group.add(roboRig);
  addBoxCollider(13, -15, 2.6, 1.8);

  const simHolo = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 18, 14),
    new THREE.MeshStandardMaterial({ color: '#a78bfa', emissive: '#7c3aed', emissiveIntensity: 0.75, wireframe: true })
  );
  simHolo.position.set(13, 1.5, 15);
  group.add(simHolo);
  const simBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.6, 16), trimMat);
  simBase.position.set(13, 0.3, 15);
  group.add(simBase);
  addCylCollider(13, 15, 1.25);

  // =========================================================================
  // 6. NASA SPACE EXPLORATION HALL OF FAME (x: -24..22, z: -58..-22)
  // =========================================================================
  const exhibits: EarthExhibitSpot[] = [];
  const clickableExhibitMeshes: THREE.Object3D[] = [];

  const museumSlateMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.32, metalness: 0.45 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.78, roughness: 0.22 });
  const silverMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.68, roughness: 0.22 });
  const goldFoilMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.85, roughness: 0.24 });

  // Prestigious museum lighting (overhead soft fill + wing accents)
  const hallCenterLight = new THREE.PointLight('#bae6fd', 1.6, 48);
  hallCenterLight.position.set(-2, 5.2, -38);
  const hallNorthLight = new THREE.PointLight('#fde68a', 1.3, 36);
  hallNorthLight.position.set(-10, 4.6, -50);
  const hallEastLight = new THREE.PointLight('#93c5fd', 1.3, 36);
  hallEastLight.position.set(16, 4.6, -38);
  group.add(hallCenterLight, hallNorthLight, hallEastLight);

  // Overhead Illuminated Hall Banner Arch just inside main entrance (-2, -23.6)
  addEntranceSign('NASA SPACE EXPLORATION HALL OF FAME', '#fbbf24', '#fef3c7', -2, 3.65, -23.2, 0, 6.2);
  addEntranceSign('CHRONOLOGICAL TIMELINE · 1958–2021', '#38bdf8', '#e0f2fe', -20.5, 3.65, -24.2, Math.PI / 2, 4.4);
  addEntranceSign('ASTRONAUT HALL OF LEGENDS', '#f59e0b', '#fef3c7', 16.8, 3.65, -23.5, 0, 4.8);

  const registerClickable = (mesh: THREE.Object3D, exhibitId: string) => {
    mesh.userData.exhibitId = exhibitId;
    clickableExhibitMeshes.push(mesh);
  };

  const addInfoOrb = (parent: THREE.Object3D, x: number, y: number, z: number, info: ExhibitInfo) => {
    const accent = info.accentColor || '#38bdf8';
    const badgeGroup = new THREE.Group();
    badgeGroup.position.set(x, y, z);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.035, 8, 22),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      })
    );
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshStandardMaterial({
        color: '#0ea5e9',
        emissive: '#38bdf8',
        emissiveIntensity: 1.0,
        roughness: 0.15,
      })
    );
    // Crisp white 'i' stem + dot visual on both front & back
    const iMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.34), iMat);
    stem.position.y = -0.02;
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.34), iMat);
    dot.position.y = 0.08;

    badgeGroup.add(ring, orb, stem, dot);
    parent.add(badgeGroup);
    registerClickable(orb, info.id);
    registerClickable(ring, info.id);
  };

  const mountExhibitPlaque = (
    parent: THREE.Object3D,
    info: ExhibitInfo,
    px: number,
    py: number,
    pz: number,
    rotY: number,
    tiltX = -0.45,
    width = 1.65,
    height = 1.03
  ) => {
    const tex = createExhibitPlaqueTexture(info.title, info.year, info.fact, info.accentColor || '#38bdf8');
    const holder = new THREE.Group();
    holder.position.set(px, py, pz);
    holder.rotation.y = rotY;

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, py - 0.1, 10), trimMat);
    stand.position.y = -(py - 0.1) * 0.5;
    holder.add(stand);

    const backing = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.06), museumSlateMat);
    backing.rotation.x = tiltX;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    face.position.z = 0.036;
    backing.add(face);
    holder.add(backing);

    registerClickable(face, info.id);
    registerClickable(backing, info.id);
    parent.add(holder);
  };

  // Helper to create a glass display case exhibit with custom 3D model inside
  const buildShowcaseExhibit = (
    info: ExhibitInfo,
    x: number,
    z: number,
    facingYaw: number,
    modelBuilder: (modelRoot: THREE.Group) => void,
    caseW = 2.6,
    caseD = 2.1,
    plinthH = 0.85,
    glassH = 1.45
  ) => {
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    root.rotation.y = facingYaw;
    group.add(root);

    const base = new THREE.Mesh(new THREE.BoxGeometry(caseW, plinthH, caseD), museumSlateMat);
    base.position.y = plinthH * 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    const accentTrim = new THREE.Mesh(
      new THREE.BoxGeometry(caseW + 0.06, 0.07, caseD + 0.06),
      new THREE.MeshStandardMaterial({
        color: info.accentColor || '#38bdf8',
        emissive: info.accentColor || '#38bdf8',
        emissiveIntensity: 0.45,
      })
    );
    accentTrim.position.y = plinthH;
    root.add(accentTrim);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(caseW - 0.18, glassH, caseD - 0.18), glassMat);
    glass.position.y = plinthH + glassH * 0.5;
    root.add(glass);

    const modelRoot = new THREE.Group();
    modelRoot.position.y = plinthH + 0.06;
    modelBuilder(modelRoot);
    root.add(modelRoot);

    // Front readable plaque & floating [ ⓘ ] badge
    mountExhibitPlaque(root, info, 0, 1.05, caseD * 0.5 + 0.42, 0, -0.58, 1.65, 1.02);
    addInfoOrb(root, caseW * 0.42, plinthH + glassH + 0.35, caseD * 0.38, info);

    // Accurate world-axis collider covering the vitrine + plaque stand
    const rotCos = Math.abs(Math.cos(facingYaw));
    const rotSin = Math.abs(Math.sin(facingYaw));
    const wX = caseW * rotCos + (caseD + 0.5) * rotSin;
    const wZ = (caseD + 0.5) * rotCos + caseW * rotSin;
    addBoxCollider(x, z, wX, wZ, plinthH + glassH, false);

    exhibits.push({
      id: info.id,
      x,
      z,
      radius: 2.9,
      info,
    });
  };

  // -------------------------------------------------------------------------
  // A. CENTRAL SPACE EXPLORATION MONUMENT (-2, -31.5)
  // -------------------------------------------------------------------------
  const centralInfo = NASA_BREAKTHROUGH_EXHIBITS.ex_monument_central;
  {
    const cx = -2;
    const cz = -31.5;
    const monGroup = new THREE.Group();
    monGroup.position.set(cx, 0, cz);
    group.add(monGroup);

    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.55, 0.32, 32), museumSlateMat);
    tier1.position.y = 0.16;
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 0.42, 32), trimMat);
    tier2.position.y = 0.53;
    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.05, 10, 40), brassMat);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.y = 0.34;
    monGroup.add(tier1, tier2, brassRing);

    // Tall Multi-Stage Heavy-Lift Monument Rocket (Saturn V / SLS tribute)
    const stage1 = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 2.5, 22), wallMat);
    stage1.position.y = 1.98;
    const bandBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.42, 22), museumSlateMat);
    bandBlack.position.y = 1.25;
    const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 1.35, 22), silverMat);
    stage2.position.y = 3.9;
    const capsuleStage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.65, 20),
      new THREE.MeshStandardMaterial({ color: '#e86f3a', roughness: 0.35 })
    );
    capsuleStage.position.y = 4.9;
    const escapeTower = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 18), wallMat);
    escapeTower.position.y = 5.65;
    monGroup.add(stage1, bandBlack, stage2, capsuleStage, escapeTower);

    // Dual Gold-Visor EVA Astronaut Statues flanking the rocket
    [-1.25, 1.25].forEach((sx, idx) => {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.45, 16), museumSlateMat);
      ped.position.set(sx, 0.95, 0.35);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.48, 8, 12), silverMat);
      body.position.set(sx, 1.58, 0.35);
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), silverMat);
      helm.position.set(sx, 2.08, 0.35);
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI, 0.25, Math.PI * 0.55),
        goldFoilMat
      );
      visor.position.set(sx, 2.08, 0.42);
      visor.rotation.y = idx === 0 ? -Math.PI / 2.2 : -Math.PI / 1.8;
      monGroup.add(ped, body, helm, visor);
    });

    // Orbital Rings Halo
    const orbit1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.035, 8, 48),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.7 })
    );
    orbit1.position.y = 3.2;
    orbit1.rotation.set(1.15, 0.35, 0.2);
    monGroup.add(orbit1);

    mountExhibitPlaque(monGroup, centralInfo, 0, 1.05, 2.55, 0, -0.5, 1.85, 1.12);
    addInfoOrb(monGroup, 0, 2.55, 2.15, centralInfo);
    addCylCollider(cx, cz, 2.55);

    exhibits.push({
      id: centralInfo.id,
      x: cx,
      z: cz,
      radius: 3.8,
      info: centralInfo,
    });
  }

  // -------------------------------------------------------------------------
  // B. APOLLO & MARS EXPLORATION PAVILIONS (West Interior Column, x = -15.8)
  // -------------------------------------------------------------------------
  // 1. Apollo 11 Moon Landing (Eagle Lunar Module diorama)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_apollo11,
    -15.8,
    -28.0,
    Math.PI / 2,
    (root) => {
      const regolith = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.0, 0.14, 24),
        new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.92 })
      );
      regolith.position.y = 0.07;
      root.add(regolith);
      const descent = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.36, 8), goldFoilMat);
      descent.position.y = 0.52;
      const ascent = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.52), silverMat);
      ascent.position.y = 0.92;
      root.add(descent, ascent);
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.52, 6), goldFoilMat);
        leg.position.set(Math.cos(a) * 0.52, 0.32, Math.sin(a) * 0.52);
        leg.rotation.z = Math.cos(a) * 0.48;
        leg.rotation.x = -Math.sin(a) * 0.48;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 10), goldFoilMat);
        pad.position.set(Math.cos(a) * 0.68, 0.15, Math.sin(a) * 0.68);
        root.add(leg, pad);
      });
    }
  );

  // 2. Apollo Guidance Computer (AGC & DSKY vitrine)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_agc,
    -15.8,
    -35.5,
    Math.PI / 2,
    (root) => {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), museumSlateMat);
      chassis.position.set(-0.25, 0.35, 0);
      const dsky = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.45), silverMat);
      dsky.position.set(0.5, 0.4, 0.1);
      dsky.rotation.x = -0.25;
      const dskyScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.28),
        new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.9 })
      );
      dskyScreen.position.set(0.5, 0.52, 0.34);
      dskyScreen.rotation.x = -0.25;
      root.add(chassis, dsky, dskyScreen);
    }
  );

  // 3. Mars Exploration Rovers (Spirit & Opportunity)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_mer_rovers,
    -15.8,
    -43.0,
    Math.PI / 2,
    (root) => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.12, 1.3),
        new THREE.MeshStandardMaterial({ color: '#b46949', roughness: 0.9 })
      );
      slab.position.y = 0.06;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.55), goldFoilMat);
      body.position.y = 0.38;
      const solarWing = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.05, 0.85),
        new THREE.MeshStandardMaterial({ color: '#1e3a8a', metalness: 0.6, roughness: 0.25 })
      );
      solarWing.position.y = 0.53;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.55, 8), silverMat);
      mast.position.set(0, 0.82, 0.25);
      const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.1), silverMat);
      camHead.position.set(0, 1.1, 0.25);
      root.add(slab, body, solarWing, mast, camHead);
      [-0.36, 0, 0.36].forEach((wz) => {
        [-0.4, 0.4].forEach((wx) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), trimMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.2, wz);
          root.add(w);
        });
      });
    }
  );

  // 4. Curiosity Rover (Gale Crater)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_curiosity,
    -15.8,
    -50.5,
    Math.PI / 2,
    (root) => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.12, 1.35),
        new THREE.MeshStandardMaterial({ color: '#9c5a40', roughness: 0.9 })
      );
      slab.position.y = 0.06;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.95), wallMat);
      body.position.y = 0.44;
      const mmrtg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 10), brassMat);
      mmrtg.rotation.x = Math.PI / 2.6;
      mmrtg.position.set(0, 0.52, -0.52);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.62, 10), wallMat);
      mast.position.set(0.18, 0.88, 0.32);
      const chemCam = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.18), silverMat);
      chemCam.position.set(0.18, 1.2, 0.32);
      root.add(slab, body, mmrtg, mast, chemCam);
      [-0.42, 0, 0.42].forEach((wz) => {
        [-0.5, 0.5].forEach((wx) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), museumSlateMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.22, wz);
          root.add(w);
        });
      });
    }
  );

  // -------------------------------------------------------------------------
  // C. SPACEFLIGHT, OBSERVATORIES & PLANETARY SCIENCE (Inner Columns x=-8.8 & x=5.8)
  // -------------------------------------------------------------------------
  // 5. Space Shuttle Programme (-8.8, -28.0)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_shuttle,
    -8.8,
    -28.0,
    Math.PI / 2,
    (root) => {
      const orbiter = new THREE.Group();
      orbiter.position.y = 0.58;
      orbiter.rotation.x = -0.32;
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.35, 16), wallMat);
      fuse.rotation.x = Math.PI / 2;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 16), museumSlateMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.z = 0.88;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 0.65), wallMat);
      wing.position.set(0, -0.08, -0.2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.34), wallMat);
      tail.position.set(0, 0.3, -0.5);
      orbiter.add(fuse, nose, wing, tail);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.55, 10), brassMat);
      stand.position.y = 0.28;
      root.add(orbiter, stand);
    }
  );

  // 6. Hubble Space Telescope (-8.8, -36.5)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_hubble,
    -8.8,
    -36.5,
    Math.PI / 2,
    (root) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.6, 10), trimMat);
      stand.position.y = 0.3;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.15, 20), silverMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.rotation.y = 0.35;
      barrel.position.y = 0.72;
      const solarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.03, 1.25),
        new THREE.MeshStandardMaterial({ color: '#1d4ed8', metalness: 0.6, roughness: 0.25 })
      );
      solarL.position.set(0, 0.72, 0);
      solarL.rotation.y = 0.35;
      root.add(stand, barrel, solarL);
    }
  );

  // 7. International Space Station (-8.8, -44.5)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_iss,
    -8.8,
    -44.5,
    Math.PI / 2,
    (root) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.55, 10), trimMat);
      stand.position.y = 0.28;
      const truss = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.08), silverMat);
      truss.position.y = 0.72;
      const habSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 14), wallMat);
      habSpine.rotation.x = Math.PI / 2;
      habSpine.position.y = 0.72;
      root.add(stand, truss, habSpine);
      [-0.74, -0.5, 0.5, 0.74].forEach((ax) => {
        [-0.42, 0.42].forEach((az) => {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.02, 0.68),
            new THREE.MeshStandardMaterial({ color: '#1d4ed8', emissive: '#1e3a8a', emissiveIntensity: 0.3 })
          );
          panel.position.set(ax, 0.72, az);
          root.add(panel);
        });
      });
    }
  );

  // 8. Perseverance Rover & Ingenuity Mars Helicopter (-8.8, -51.8)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_perseverance,
    -8.8,
    -51.8,
    Math.PI / 2,
    (root) => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.12, 1.3),
        new THREE.MeshStandardMaterial({ color: '#b46949', roughness: 0.9 })
      );
      slab.position.y = 0.06;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.9), wallMat);
      body.position.set(-0.2, 0.42, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.52, 8), wallMat);
      mast.position.set(-0.05, 0.82, 0.28);
      const superCam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), silverMat);
      superCam.position.set(-0.05, 1.08, 0.28);
      root.add(slab, body, mast, superCam);

      // Ingenuity Helicopter hovering on slender acrylic rod
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 6), glassMat);
      rod.position.set(0.55, 0.58, 0.15);
      const heliBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), goldFoilMat);
      heliBody.position.set(0.55, 1.05, 0.15);
      const rotor1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.06), museumSlateMat);
      rotor1.position.set(0.55, 1.18, 0.15);
      const rotor2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.62), museumSlateMat);
      rotor2.position.set(0.55, 1.21, 0.15);
      root.add(rod, heliBody, rotor1, rotor2);
    }
  );

  // 9. Landsat Earth Observation (5.8, -28.0)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_landsat,
    5.8,
    -28.0,
    -Math.PI / 2,
    (root) => {
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 22, 18),
        new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.45 })
      );
      globe.position.y = 0.55;
      const land = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 12, 10, 0.4, 1.8, 0.6, 1.3),
        new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.7 })
      );
      land.position.y = 0.55;
      const sat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.2), silverMat);
      sat.position.set(0.55, 1.05, 0);
      const scanCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.55, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: '#34d399', transparent: true, opacity: 0.25, side: THREE.DoubleSide })
      );
      scanCone.position.set(0.32, 0.82, 0);
      scanCone.rotation.z = 0.65;
      root.add(globe, land, sat, scanCone);
    }
  );

  // 10. GPS & Satellite Navigation (5.8, -35.5)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_gps,
    5.8,
    -35.5,
    -Math.PI / 2,
    (root) => {
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 18, 16),
        new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
      );
      earth.position.y = 0.68;
      root.add(earth);
      [0.45, -0.55, 1.1].forEach((rot, idx) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.018, 8, 36),
          new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 0.65 })
        );
        ring.position.y = 0.68;
        ring.rotation.set(rot, idx * 0.9, 0.3);
        const sat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), brassMat);
        sat.position.set(0.7, 0, 0);
        ring.add(sat);
        root.add(ring);
      });
    }
  );

  // 11. Voyager 1 Interstellar Probe (5.8, -43.0)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_voyager1,
    5.8,
    -43.0,
    -Math.PI / 2,
    (root) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.62, 10), trimMat);
      stand.position.y = 0.31;
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.24, 24, 1, true), wallMat);
      dish.position.y = 0.72;
      dish.rotation.x = Math.PI + 0.35;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 10), museumSlateMat);
      body.position.set(0, 0.62, -0.1);
      const goldenRecord = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 20), brassMat);
      goldenRecord.rotation.z = Math.PI / 2;
      goldenRecord.position.set(0.22, 0.62, -0.1);
      const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 6), silverMat);
      magBoom.rotation.z = Math.PI / 2.2;
      magBoom.position.set(-0.52, 0.72, -0.1);
      root.add(stand, dish, body, goldenRecord, magBoom);
    }
  );

  // 12. James Webb Space Telescope (5.8, -50.5)
  buildShowcaseExhibit(
    NASA_BREAKTHROUGH_EXHIBITS.ex_jwst,
    5.8,
    -50.5,
    -Math.PI / 2,
    (root) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.45, 10), trimMat);
      stand.position.y = 0.22;
      const sunshield = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.82, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.75, roughness: 0.2 })
      );
      sunshield.scale.set(1.0, 1, 1.35);
      sunshield.position.y = 0.52;
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 6), goldFoilMat);
      mirror.rotation.x = Math.PI / 2;
      mirror.position.set(0, 0.96, -0.08);
      const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.52, 3, 1, true), museumSlateMat);
      tripod.rotation.x = -Math.PI / 2;
      tripod.position.set(0, 0.96, 0.22);
      root.add(stand, sunshield, mirror, tripod);
    }
  );

  // -------------------------------------------------------------------------
  // D. FUTURE SPACE EXPLORATION SECTION (-2, -52.5) + NORTH WALL MISSION MURALS
  // -------------------------------------------------------------------------
  const futureInfo = NASA_BREAKTHROUGH_EXHIBITS.ex_future_artemis;
  {
    const fx = -2;
    const fz = -52.5;
    const futureGroup = new THREE.Group();
    futureGroup.position.set(fx, 0, fz);
    group.add(futureGroup);

    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.65, 0.75, 24), museumSlateMat);
    fBase.position.y = 0.38;
    const holoRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.04, 10, 36),
      new THREE.MeshStandardMaterial({ color: '#a78bfa', emissive: '#8b5cf6', emissiveIntensity: 0.85 })
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.y = 0.82;
    const moonOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 16),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.85 })
    );
    moonOrb.position.set(-0.45, 1.35, 0);
    const marsOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 18, 16),
      new THREE.MeshStandardMaterial({ color: '#e86f3a', roughness: 0.75 })
    );
    marsOrb.position.set(0.48, 1.45, 0);
    const gatewayStation = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.14), silverMat);
    gatewayStation.position.set(0, 1.68, 0.2);

    futureGroup.add(fBase, holoRing, moonOrb, marsOrb, gatewayStation);
    mountExhibitPlaque(futureGroup, futureInfo, 0, 1.05, 1.9, 0, -0.55, 1.75, 1.08);
    addInfoOrb(futureGroup, 0, 2.15, 0, futureInfo);
    addCylCollider(fx, fz, 1.65);

    exhibits.push({
      id: futureInfo.id,
      x: fx,
      z: fz,
      radius: 3.1,
      info: futureInfo,
    });
  }

  // North Wall Archival Mission Murals (z = -57.6)
  const posterSpecs = [
    { x: -16, title: 'APOLLO XI', sub: 'Sea of Tranquility', year: '1969', col: '#fbbf24', exId: 'ex_apollo11' },
    { x: -6.5, title: 'VOYAGER I', sub: 'Interstellar Mission', year: '1977', col: '#f59e0b', exId: 'ex_voyager1' },
    { x: 3.0, title: 'PERSEVERANCE', sub: 'Jezero Crater Science', year: '2021', col: '#38bdf8', exId: 'ex_perseverance' },
    { x: 12.5, title: 'ARTEMIS TO MARS', sub: 'Future Deep Space', year: 'FUTURE', col: '#a78bfa', exId: 'ex_future_artemis' },
  ];
  for (const ps of posterSpecs) {
    const pTex = createMissionPosterTexture(ps.title, ps.sub, ps.year, ps.col);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.1, 0.14), trimMat);
    frame.position.set(ps.x, 2.25, -57.65);
    group.add(frame);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(2.25, 2.85),
      new THREE.MeshBasicMaterial({ map: pTex })
    );
    face.position.set(0, 0, 0.08);
    frame.add(face);
    registerClickable(face, ps.exId);
  }

  // -------------------------------------------------------------------------
  // E. INTERACTIVE CHRONOLOGICAL NASA TIMELINE (West Wall: x = -23.3, z = -24.5..-54.5)
  // -------------------------------------------------------------------------
  HISTORICAL_TIMELINE_MILESTONES.forEach((ms, idx) => {
    const tz = -24.5 - idx * 2.0;
    const totemGroup = new THREE.Group();
    totemGroup.position.set(-23.25, 0, tz);
    totemGroup.rotation.y = Math.PI / 2;
    group.add(totemGroup);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 0.55), museumSlateMat);
    plinth.position.y = 0.225;
    const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.95, 0.14), trimMat);
    panelFrame.position.y = 1.42;

    const tex = createTimelineTotemTexture(ms.year, ms.title, ms.fact, ms.accentColor || '#38bdf8');
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.26, 1.78),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    face.position.set(0, 0, 0.08);
    panelFrame.add(face);
    totemGroup.add(plinth, panelFrame);

    addInfoOrb(totemGroup, 0.52, 2.55, 0.1, ms);
    registerClickable(face, ms.id);
    registerClickable(panelFrame, ms.id);
    addBoxCollider(-23.25, tz, 0.65, 1.45, 2.4, false);

    // Connecting glowing chronological rail along West Wall
    if (idx < HISTORICAL_TIMELINE_MILESTONES.length - 1) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 2.0),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.7 })
      );
      rail.position.set(-23.45, 0.48, tz - 1.0);
      group.add(rail);
    }

    exhibits.push({
      id: ms.id,
      x: -21.8,
      z: tz,
      radius: 1.55,
      info: ms,
    });
  });

  // -------------------------------------------------------------------------
  // F. FAMOUS ASTRONAUTS GALLERY OF LEGENDS (East Promenade: x = 12.6 & x = 21.1)
  // -------------------------------------------------------------------------
  FAMOUS_ASTRONAUT_EXHIBITS.forEach((astro, idx) => {
    const isLeftRow = idx < 6;
    const rowIdx = idx % 6;
    const az = -26.0 - rowIdx * 5.0;
    const ax = isLeftRow ? 12.6 : 21.1;
    const facingYaw = isLeftRow ? Math.PI / 2 : -Math.PI / 2;

    const kiosk = new THREE.Group();
    kiosk.position.set(ax, 0, az);
    kiosk.rotation.y = facingYaw;
    group.add(kiosk);

    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 0.9), museumSlateMat);
    ped.position.y = 0.375;
    ped.castShadow = true;
    kiosk.add(ped);

    // Sculpted Helmet / EVA Bust trophy beside portrait
    const bustStand = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 12), brassMat);
    bustStand.position.set(-0.56, 0.86, 0.14);
    const bustBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.26, 14), silverMat);
    bustBody.position.set(-0.56, 1.08, 0.14);
    const bustHelm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), silverMat);
    bustHelm.position.set(-0.56, 1.32, 0.14);
    const bustVisor = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI, 0.2, Math.PI * 0.6),
      goldFoilMat
    );
    bustVisor.position.set(-0.56, 1.32, 0.19);
    bustVisor.rotation.y = -Math.PI / 2;
    kiosk.add(bustStand, bustBody, bustHelm, bustVisor);

    // Tall Illuminated Astronaut Portrait Card
    const pTex = createAstronautPortraitTexture(
      astro.title,
      astro.subtitle,
      astro.year,
      astro.fact,
      astro.accentColor || '#38bdf8'
    );
    const cardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.56, 0.12), trimMat);
    cardFrame.position.set(0.28, 1.6, 0);
    const cardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 1.44),
      new THREE.MeshBasicMaterial({ map: pTex })
    );
    cardFace.position.z = 0.068;
    cardFrame.add(cardFace);
    kiosk.add(cardFrame);

    // Also add back face for the center row so approaching from either side looks crisp
    if (isLeftRow) {
      const cardBack = new THREE.Mesh(
        new THREE.PlaneGeometry(1.08, 1.44),
        new THREE.MeshBasicMaterial({ map: pTex })
      );
      cardBack.position.z = -0.068;
      cardBack.rotation.y = Math.PI;
      cardFrame.add(cardBack);
      registerClickable(cardBack, astro.id);
    }

    addInfoOrb(kiosk, 0.72, 2.55, 0.12, astro);
    registerClickable(cardFace, astro.id);
    registerClickable(cardFrame, astro.id);

    addBoxCollider(ax, az, 1.0, 1.9, 2.4, false);

    exhibits.push({
      id: astro.id,
      x: isLeftRow ? ax + 1.4 : ax - 1.4,
      z: az,
      radius: 2.35,
      info: astro,
    });
  });

  // Researcher Briefing Lounge Table placed cleanly in central plaza (-2, 0, -42.5)
  const loungeTable = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.78, 20), museumSlateMat);
  loungeTable.position.set(-2, 0.39, -42.5);
  loungeTable.castShadow = true;
  const loungeRing = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.035, 8, 28), brassMat);
  loungeRing.rotation.x = Math.PI / 2;
  loungeRing.position.set(-2, 0.78, -42.5);
  group.add(loungeTable, loungeRing);
  addCylCollider(-2, -42.5, 1.25);

  // =========================================================================
  // 7. LAUNCH FACILITY: ROCKET, GANTRY TOWER & PAD (x: 32..52, z: -12..12)
  // =========================================================================
  const rocketGroup = new THREE.Group();
  rocketGroup.position.set(42, 0.2, 0);
  group.add(rocketGroup);

  const booster = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.7, 4.8, 24), wallMat);
  booster.position.y = 2.4;
  booster.castShadow = true;
  rocketGroup.add(booster);

  const capsuleHull = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.45, 2.4, 24),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
  );
  capsuleHull.position.y = 6.0;
  rocketGroup.add(capsuleHull);

  const noseCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 1.6, 24),
    new THREE.MeshStandardMaterial({ color: '#e86f3a', roughness: 0.35 })
  );
  noseCone.position.y = 8.0;
  rocketGroup.add(noseCone);

  const capsuleDoor = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 1.45, 0.22),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.5, roughness: 0.25 })
  );
  capsuleDoor.position.set(-1.32, 1.8, 0);
  capsuleDoor.rotation.y = Math.PI / 2;
  rocketGroup.add(capsuleDoor);

  const rocketExhaust = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 4.2, 16),
    new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.85 })
  );
  rocketExhaust.rotation.x = Math.PI;
  rocketExhaust.position.y = -2.1;
  rocketExhaust.visible = false;
  rocketGroup.add(rocketExhaust);

  // Solid cylinder collider around rocket pad center so player walks smoothly around rocket without clipping
  addCylCollider(42, 0, 1.9);

  // Launch Umbilical Gantry Tower beside Rocket at (45.2, 0, -3.8)
  const gantry = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.2, 1.4), trimMat);
  gantry.position.set(45.2, 4.1, -3.8);
  gantry.castShadow = true;
  group.add(gantry);
  const gantryArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 0.45), trimMat);
  gantryArm.position.set(43.8, 5.8, -1.9);
  gantryArm.rotation.y = 0.65;
  group.add(gantryArm);
  addBoxCollider(45.2, -3.8, 1.5, 1.5);

  // =========================================================================
  // 8. LAUNCH CONTROL DECK & MISSION CONTROL
  // =========================================================================
  const btnPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 1.15, 16), trimMat);
  btnPedestal.position.set(28, 0.58, 14);
  group.add(btnPedestal);
  addCylCollider(28, 14, 0.78);

  const redLaunchButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.45, 0.24, 20),
    new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#dc2626',
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );
  redLaunchButton.position.set(28, 1.24, 14);
  group.add(redLaunchButton);

  // Mission Control Telemetry Consoles
  const telemetryScreens: THREE.Mesh[] = [];
  const screenConfigs = [
    { title: 'CAPSULE TELEMETRY', status: 'PRE-FLIGHT CHECK', accent: '#38bdf8', x: 26 },
    { title: 'BOOSTER THRUST', status: 'STAGE 1 NOMINAL', accent: '#f59e0b', x: 30 },
  ];
  for (const sc of screenConfigs) {
    const tex = createTelemetryScreenTexture(sc.title, sc.status, sc.accent);
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.0),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    scr.position.set(sc.x, 2.1, -19.55);
    group.add(scr);
    telemetryScreens.push(scr);
  }
  const mcConsole = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.9, 1.2), trimMat);
  mcConsole.position.set(28, 0.45, -17.5);
  group.add(mcConsole);
  addBoxCollider(28, -17.5, 6.5, 1.2);

  // =========================================================================
  // 9. TARGET ENTRANCE / OBJECTIVE BEACON (Animated Floor Ring + Pillar)
  // =========================================================================
  const targetBeacon = new THREE.Group();
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.45, 28),
    new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
    })
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.05;
  const beaconCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.7, 12),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.85 })
  );
  beaconCone.rotation.x = Math.PI;
  beaconCone.position.y = 2.6;
  targetBeacon.add(beaconRing, beaconCone);
  targetBeacon.visible = false;
  group.add(targetBeacon);

  return {
    group,
    trolleyGroup,
    trolleyPartsGroup,
    benchPartsGroup,
    prototypeOnBench,
    prototypeOnTester,
    testerSpinner,
    testerBeacon,
    capsuleDoor,
    rocketGroup,
    rocketExhaust,
    redLaunchButton,
    launchGateGroup,
    targetBeacon,
    roomLockDoors,
    wallColliders,
    cylColliders,
    partPickups,
    telemetryScreens,
    exhibits,
    clickableExhibitMeshes,
  };
}
