import * as THREE from 'three';
import { BuildingType, PlacedBuilding, RoadSegment } from '../types/game';
import { createLandingPadTexture, createRoomSignTexture, createSolarPanelTexture } from './textures';

export interface LocalBoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface LocalCylCollider {
  x: number;
  z: number;
  radius: number;
}

export type FootprintShape =
  | { kind: 'circle'; lx: number; lz: number; radius: number }
  | { kind: 'box'; lx: number; lz: number; halfW: number; halfD: number };

export interface BuildingFootprint {
  shapes: FootprintShape[];
  boundingRadius: number;
  gradingRadius: number;
  entrance?: { lx: number; lz: number; radius: number };
  terrainSamplePoints: [number, number][];
}

export interface PlacementPose {
  type: BuildingType;
  x: number;
  z: number;
  rotationY: number;
}

export function getBuildingFootprint(type: BuildingType): BuildingFootprint {
  if (type === 'dormitory') {
    return {
      shapes: [{ kind: 'circle', lx: 0, lz: 0, radius: 9.6 }],
      boundingRadius: 9.8,
      gradingRadius: 9.8,
      entrance: { lx: 0, lz: 10.2, radius: 1.0 },
      terrainSamplePoints: [
        [0, 0],
        [8.5, 0],
        [-8.5, 0],
        [0, 8.5],
        [0, -8.5],
        [6.0, 6.0],
        [-6.0, -6.0],
      ],
    };
  }
  if (type === 'greenhouse') {
    return {
      shapes: [{ kind: 'circle', lx: 0, lz: 0, radius: 9.2 }],
      boundingRadius: 9.4,
      gradingRadius: 9.4,
      entrance: { lx: 0, lz: 9.8, radius: 1.0 },
      terrainSamplePoints: [
        [0, 0],
        [8.0, 0],
        [-8.0, 0],
        [0, 8.0],
        [0, -8.0],
        [5.8, 5.8],
        [-5.8, -5.8],
      ],
    };
  }
  if (type === 'landing_port') {
    return {
      shapes: [
        { kind: 'circle', lx: 0, lz: 0, radius: 9.5 },
        { kind: 'box', lx: 0, lz: 13.0, halfW: 4.4, halfD: 4.4 },
        { kind: 'circle', lx: 5.8, lz: 12.2, radius: 0.55 },
      ],
      boundingRadius: 18.0,
      gradingRadius: 10.5,
      entrance: { lx: 0, lz: 18.2, radius: 1.1 },
      terrainSamplePoints: [
        [0, 0],
        [8.4, 0],
        [-8.4, 0],
        [0, -8.4],
        [0, 13.0],
        [4.0, 17.0],
        [-4.0, 17.0],
      ],
    };
  }
  if (type === 'solar_array') {
    return {
      shapes: [{ kind: 'box', lx: 0, lz: 0, halfW: 4.4, halfD: 2.3 }],
      boundingRadius: 5.0,
      gradingRadius: 4.2,
      terrainSamplePoints: [
        [0, 0],
        [4.0, 2.0],
        [-4.0, 2.0],
        [4.0, -2.0],
        [-4.0, -2.0],
      ],
    };
  }
  // Enlarged Modular Colony Facilities (10.0m x 10.0m foundation, side tanks to ±5.2m, walkable interior)
  return {
    shapes: [{ kind: 'box', lx: 0, lz: 0, halfW: 5.3, halfD: 5.05 }],
    boundingRadius: 7.35,
    gradingRadius: 5.7,
    entrance: { lx: 0, lz: 5.6, radius: 0.95 },
    terrainSamplePoints: [
      [0, 0],
      [4.7, 4.6],
      [-4.7, 4.6],
      [4.7, -4.6],
      [-4.7, -4.6],
    ],
  };
}

export function localToWorldXZ(
  originX: number,
  originZ: number,
  rotationY: number,
  lx: number,
  lz: number
): [number, number] {
  const c = Math.cos(rotationY);
  const s = Math.sin(rotationY);
  return [originX + lx * c + lz * s, originZ - lx * s + lz * c];
}

export function worldToLocalXZ(
  originX: number,
  originZ: number,
  rotationY: number,
  wx: number,
  wz: number
): [number, number] {
  const dx = wx - originX;
  const dz = wz - originZ;
  const c = Math.cos(rotationY);
  const s = Math.sin(rotationY);
  return [dx * c - dz * s, dx * s + dz * c];
}

interface WorldOBB {
  cx: number;
  cz: number;
  ux: number;
  uz: number;
  vx: number;
  vz: number;
  halfW: number;
  halfD: number;
}

function shapeToWorldOBB(pose: PlacementPose, s: Extract<FootprintShape, { kind: 'box' }>, margin: number): WorldOBB {
  const [cx, cz] = localToWorldXZ(pose.x, pose.z, pose.rotationY, s.lx, s.lz);
  const cos = Math.cos(pose.rotationY);
  const sin = Math.sin(pose.rotationY);
  return {
    cx,
    cz,
    ux: cos,
    uz: -sin,
    vx: sin,
    vz: cos,
    halfW: Math.max(0.05, s.halfW + margin),
    halfD: Math.max(0.05, s.halfD + margin),
  };
}

function obbIntersectsObb(a: WorldOBB, b: WorldOBB): boolean {
  const dx = b.cx - a.cx;
  const dz = b.cz - a.cz;
  const axes: [number, number][] = [
    [a.ux, a.uz],
    [a.vx, a.vz],
    [b.ux, b.uz],
    [b.vx, b.vz],
  ];
  for (const [ax, az] of axes) {
    const distProj = Math.abs(dx * ax + dz * az);
    const ra =
      a.halfW * Math.abs(a.ux * ax + a.uz * az) +
      a.halfD * Math.abs(a.vx * ax + a.vz * az);
    const rb =
      b.halfW * Math.abs(b.ux * ax + b.uz * az) +
      b.halfD * Math.abs(b.vx * ax + b.vz * az);
    if (distProj >= ra + rb) return false;
  }
  return true;
}

function circleIntersectsWorldOBB(cx: number, cz: number, radius: number, obb: WorldOBB): boolean {
  const dx = cx - obb.cx;
  const dz = cz - obb.cz;
  const lx = dx * obb.ux + dz * obb.uz;
  const lz = dx * obb.vx + dz * obb.vz;
  const clampedX = Math.max(-obb.halfW, Math.min(obb.halfW, lx));
  const clampedZ = Math.max(-obb.halfD, Math.min(obb.halfD, lz));
  const ex = lx - clampedX;
  const ez = lz - clampedZ;
  return ex * ex + ez * ez < radius * radius;
}

export function doesBuildingOverlapCircle(
  pose: PlacementPose,
  cx: number,
  cz: number,
  radius: number,
  margin = 0
): boolean {
  const fp = getBuildingFootprint(pose.type);
  for (const shape of fp.shapes) {
    if (shape.kind === 'circle') {
      const [sx, sz] = localToWorldXZ(pose.x, pose.z, pose.rotationY, shape.lx, shape.lz);
      const rSum = Math.max(0.05, shape.radius + margin) + radius;
      const dx = sx - cx;
      const dz = sz - cz;
      if (dx * dx + dz * dz < rSum * rSum) return true;
    } else {
      const obb = shapeToWorldOBB(pose, shape, margin);
      if (circleIntersectsWorldOBB(cx, cz, radius, obb)) return true;
    }
  }
  return false;
}

export function doBuildingFootprintsOverlap(
  a: PlacementPose,
  b: PlacementPose,
  margin = 0.08
): boolean {
  const fpA = getBuildingFootprint(a.type);
  const fpB = getBuildingFootprint(b.type);
  for (const sa of fpA.shapes) {
    for (const sb of fpB.shapes) {
      if (sa.kind === 'circle' && sb.kind === 'circle') {
        const [ax, az] = localToWorldXZ(a.x, a.z, a.rotationY, sa.lx, sa.lz);
        const [bx, bz] = localToWorldXZ(b.x, b.z, b.rotationY, sb.lx, sb.lz);
        const rSum = sa.radius + sb.radius + margin;
        const dx = ax - bx;
        const dz = az - bz;
        if (dx * dx + dz * dz < rSum * rSum) return true;
      } else if (sa.kind === 'box' && sb.kind === 'box') {
        const obbA = shapeToWorldOBB(a, sa, margin * 0.5);
        const obbB = shapeToWorldOBB(b, sb, margin * 0.5);
        if (obbIntersectsObb(obbA, obbB)) return true;
      } else if (sa.kind === 'circle' && sb.kind === 'box') {
        const [ax, az] = localToWorldXZ(a.x, a.z, a.rotationY, sa.lx, sa.lz);
        const obbB = shapeToWorldOBB(b, sb, margin * 0.5);
        if (circleIntersectsWorldOBB(ax, az, sa.radius + margin * 0.5, obbB)) return true;
      } else if (sa.kind === 'box' && sb.kind === 'circle') {
        const [bx, bz] = localToWorldXZ(b.x, b.z, b.rotationY, sb.lx, sb.lz);
        const obbA = shapeToWorldOBB(a, sa, margin * 0.5);
        if (circleIntersectsWorldOBB(bx, bz, sb.radius + margin * 0.5, obbA)) return true;
      }
    }
  }
  return false;
}

export function isPointInsideBuildingFootprint(
  b: PlacedBuilding,
  wx: number,
  wz: number,
  margin = 0.25
): boolean {
  return doesBuildingOverlapCircle(
    { type: b.type, x: b.position[0], z: b.position[2], rotationY: b.rotationY },
    wx,
    wz,
    0.15,
    margin
  );
}

export interface CameraWallBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface BuildingMeshHandle {
  id: string;
  type: BuildingType;
  root: THREE.Group;
  roofOrShell: THREE.Object3D[];
  doorGroup?: THREE.Group;
  innerDoorGroup?: THREE.Group;
  doorLocalZ?: number;
  alarmLight?: THREE.Mesh;
  alarmPointLight?: THREE.PointLight;
  deconMist?: THREE.Points;
  capsuleMesh?: THREE.Group;
  solarPanels?: THREE.Mesh[];
  cropsGroup?: THREE.Group;
  petStationAnchors?: [number, number, number][];
  footprintRing: THREE.Mesh;
  interiorBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  sterilisationBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  localBoxColliders: LocalBoxCollider[];
  localCylColliders: LocalCylCollider[];
  cameraWallBoxes: CameraWallBox[];
}

export function createBuildingMesh(b: PlacedBuilding): BuildingMeshHandle {
  const root = new THREE.Group();
  root.position.set(b.position[0], b.position[1], b.position[2]);
  root.rotation.y = b.rotationY;

  const roofOrShell: THREE.Object3D[] = [];
  const localBoxColliders: LocalBoxCollider[] = [];
  const localCylColliders: LocalCylCollider[] = [];
  const cameraWallBoxes: CameraWallBox[] = [];

  const addLocalBox = (cx: number, cz: number, w: number, d: number, cameraHeight = 0) => {
    const box = {
      minX: cx - w * 0.5,
      maxX: cx + w * 0.5,
      minZ: cz - d * 0.5,
      maxZ: cz + d * 0.5,
    };
    localBoxColliders.push(box);
    if (cameraHeight > 0) {
      cameraWallBoxes.push({ ...box, height: cameraHeight });
    }
  };
  const addLocalCyl = (x: number, z: number, radius: number) => {
    localCylColliders.push({ x, z, radius });
  };
  const addSignBoard = (
    title: string,
    accentHex: string,
    bgHex: string,
    x: number,
    y: number,
    z: number,
    width = 3.8
  ) => {
    const tex = createRoomSignTexture(title, accentHex, bgHex);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.18, 0.88, 0.16),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.5 })
    );
    board.position.set(x, y, z);
    root.add(board);

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.74),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    front.position.set(0, 0, 0.09);
    board.add(front);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.74),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    back.position.set(0, 0, -0.09);
    back.rotation.y = Math.PI;
    board.add(back);
  };

  const handle: BuildingMeshHandle = {
    id: b.id,
    type: b.type,
    root,
    roofOrShell,
    localBoxColliders,
    localCylColliders,
    cameraWallBoxes,
    footprintRing: new THREE.Mesh(
      new THREE.RingGeometry(b.footprintRadius - 0.2, b.footprintRadius, 40),
      new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    ),
  };
  handle.footprintRing.rotation.x = -Math.PI / 2;
  handle.footprintRing.position.y = 0.06;
  handle.footprintRing.visible = false;
  root.add(handle.footprintRing);

  const whiteGloss = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.24,
    metalness: 0.12,
  });
  const warmNeutral = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.55,
    metalness: 0.22,
  });
  const darkSlate = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.45,
    metalness: 0.65,
  });
  const cyanGlow = new THREE.MeshStandardMaterial({
    color: '#22d3ee',
    emissive: '#06b6d4',
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#bae6fd',
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.34,
    clearcoat: 1,
    depthWrite: false,
  });

  if (b.type === 'dormitory') {
    // ENLARGED DORMITORY — Spacious crown-jewel futuristic habitat (~18m diameter)
    handle.interiorBounds = { minX: -8.3, maxX: 8.3, minZ: -8.3, maxZ: 8.3 };
    handle.doorLocalZ = 8.4;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.1, 0.38, 36), darkSlate);
    plinth.position.y = 0.19;
    plinth.receiveShadow = true;
    root.add(plinth);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(8.9, 8.9, 0.06, 36),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.08 })
    );
    floor.position.y = 0.41;
    floor.receiveShadow = true;
    root.add(floor);

    const floorRing = new THREE.Mesh(new THREE.TorusGeometry(8.3, 0.06, 8, 56), cyanGlow);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = 0.45;
    root.add(floorRing);

    // Structural ribs & panoramic glass wall arcs (wide doorway at +Z)
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const wx = Math.sin(ang) * 8.5;
      const wz = Math.cos(ang) * 8.5;
      if (wz > 6.4 && Math.abs(wx) < 3.4) continue;

      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.3, 0.65), whiteGloss);
      rib.position.set(wx, 2.55, wz);
      rib.rotation.y = ang;
      rib.castShadow = true;
      root.add(rib);

      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.72), cyanGlow);
      strip.position.set(wx, 2.55, wz);
      strip.rotation.y = ang;
      root.add(strip);

      // Opaque rib pillar blocks camera smoothly
      cameraWallBoxes.push({
        minX: wx - 0.55,
        maxX: wx + 0.55,
        minZ: wz - 0.55,
        maxZ: wz + 0.55,
        height: 4.5,
      });
    }

    const wallGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 3.8, 36, 1, true, 0.36, Math.PI * 1.78),
      glassMat
    );
    wallGlass.position.y = 2.35;
    wallGlass.renderOrder = 2;
    root.add(wallGlass);

    // Futuristic curved dome roof (auto-hides when inside!)
    const domeRoof = new THREE.Mesh(
      new THREE.SphereGeometry(9.0, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.46),
      whiteGloss
    );
    domeRoof.position.y = 3.85;
    domeRoof.scale.set(1, 0.45, 1);
    domeRoof.castShadow = true;
    root.add(domeRoof);
    roofOrShell.push(domeRoof);

    const roofRim = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.16, 12, 56), cyanGlow);
    roofRim.rotation.x = Math.PI / 2;
    roofRim.position.y = 4.55;
    root.add(roofRim);
    roofOrShell.push(roofRim);

    // Wide 3.2m Airlock Entrance Archway at +Z (z = 8.4)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.4, 8.4);
    root.add(archGroup);

    const archFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 1.4), whiteGloss);
    archFrameL.position.set(-1.85, 1.8, 0);
    archGroup.add(archFrameL);
    const archFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 1.4), whiteGloss);
    archFrameR.position.set(1.85, 1.8, 0);
    archGroup.add(archFrameR);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.5, 1.5), darkSlate);
    archTop.position.set(0, 3.65, 0);
    archGroup.add(archTop);

    // Sliding airlock glass doors
    const doorGroup = new THREE.Group();
    const dL = new THREE.Mesh(new THREE.BoxGeometry(1.55, 3.25, 0.14), glassMat);
    dL.position.set(-0.78, 1.62, 0);
    const dR = new THREE.Mesh(new THREE.BoxGeometry(1.55, 3.25, 0.14), glassMat);
    dR.position.set(0.78, 1.62, 0);
    doorGroup.add(dL, dR);
    archGroup.add(doorGroup);
    handle.doorGroup = doorGroup;

    addSignBoard('COLONY DORMITORY', '#22d3ee', '#e0f2fe', 0, 4.35, 9.1, 4.0);

    // Exterior Mars-adapted planters flanking entrance
    [-3.6, 3.6].forEach((px) => {
      const box = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.48, 12), warmNeutral);
      box.position.set(px, 0.6, 9.0);
      root.add(box);
      const shrub = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 12, 10),
        new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.7 })
      );
      shrub.position.set(px, 1.0, 9.0);
      root.add(shrub);
      addLocalCyl(px, 9.0, 0.7);
    });

    // SPACIOUS INTERIOR FURNITURE
    // 1. Plush Futuristic Bed at (-4.2, 0.44, -3.5)
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-4.2, 0.44, -3.5);
    root.add(bedGroup);
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.36, 3.1), darkSlate);
    bedFrame.position.y = 0.18;
    bedGroup.add(bedFrame);
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 0.26, 2.8),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7 })
    );
    mattress.position.y = 0.46;
    bedGroup.add(mattress);
    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.16, 1.7),
      new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.75 })
    );
    blanket.position.set(0, 0.55, 0.52);
    bedGroup.add(blanket);
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.18, 0.52),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.65 })
    );
    pillow.position.set(0, 0.64, -1.05);
    bedGroup.add(pillow);
    addLocalBox(-4.2, -3.5, 2.3, 3.1);

    // 2. Wall-mounted Individual Pet Charging Stations
    handle.petStationAnchors = [];
    for (let s = 0; s < 4; s++) {
      const sx = -5.4 + s * 1.35;
      const sz = -6.75;
      const dock = new THREE.Group();
      dock.position.set(sx, 0.44, sz);
      root.add(dock);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.08, 16), darkSlate);
      pad.position.y = 0.04;
      dock.add(pad);

      const padGlow = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 24), cyanGlow);
      padGlow.rotation.x = Math.PI / 2;
      padGlow.position.y = 0.09;
      dock.add(padGlow);

      const wallPanel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.9, 0.12), whiteGloss);
      wallPanel.position.set(0, 0.54, -0.38);
      dock.add(wallPanel);

      const dockBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.14), cyanGlow);
      dockBeacon.position.set(0, 0.82, -0.37);
      dock.add(dockBeacon);

      const [wax, waz] = localToWorldXZ(b.position[0], b.position[2], b.rotationY, sx, sz);
      handle.petStationAnchors.push([wax, b.position[1] + 0.48, waz]);
    }
    addLocalBox(-3.35, -7.1, 5.4, 0.45);

    // 3. Integrated Wardrobe Console at (4.4, 0.44, -3.5)
    const wardrobe = new THREE.Group();
    wardrobe.position.set(4.4, 0.44, -3.5);
    root.add(wardrobe);
    const wBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.35, 0.95), whiteGloss);
    wBody.position.y = 1.18;
    wardrobe.add(wBody);
    const wDisplay = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.6, 0.08), glassMat);
    wDisplay.position.set(0, 1.2, 0.49);
    wardrobe.add(wDisplay);
    const wTrim = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.98), cyanGlow);
    wTrim.position.y = 2.2;
    wardrobe.add(wTrim);
    addLocalBox(4.4, -3.5, 2.1, 1.0);

    // 4. Food Dispenser & Dining Table at (3.8, 0.44, 2.5)
    const diningGroup = new THREE.Group();
    diningGroup.position.set(3.8, 0.44, 2.5);
    root.add(diningGroup);
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 20), whiteGloss);
    tableTop.position.y = 0.84;
    diningGroup.add(tableTop);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, 0.84, 14), darkSlate);
    tableLeg.position.y = 0.42;
    diningGroup.add(tableLeg);
    const mealBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.16, 0.14, 14),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35 })
    );
    mealBowl.position.set(0.18, 0.94, 0);
    diningGroup.add(mealBowl);
    addLocalCyl(3.8, 2.5, 1.15);

    const roomLight = new THREE.PointLight('#bae6fd', 1.75, 22);
    roomLight.position.set(0, 3.8, 0);
    root.add(roomLight);
  } else if (b.type === 'greenhouse') {
    // ENLARGED TRANSPARENT GLASS-DOMED GREENHOUSE (~17.5m diameter, spacious walkway)
    handle.interiorBounds = { minX: -7.9, maxX: 7.9, minZ: -7.9, maxZ: 7.9 };
    handle.doorLocalZ = 8.2;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(9.0, 9.4, 0.36, 32), darkSlate);
    base.position.y = 0.18;
    base.receiveShadow = true;
    root.add(base);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.5 })
    );
    floor.position.y = 0.38;
    root.add(floor);

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const px = Math.sin(ang) * 8.3;
      const pz = Math.cos(ang) * 8.3;
      if (pz > 6.0 && Math.abs(px) < 3.0) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.9, 8), whiteGloss);
      post.position.set(px, 2.25, pz);
      root.add(post);
    }

    const shellGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#e0f2fe',
      roughness: 0.06,
      metalness: 0.04,
      transparent: true,
      opacity: 0.26,
      clearcoat: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glassWall = new THREE.Mesh(
      new THREE.CylinderGeometry(8.32, 8.32, 3.6, 36, 1, true, 0.36, Math.PI * 1.78),
      shellGlassMat
    );
    glassWall.position.y = 2.15;
    glassWall.renderOrder = 3;
    root.add(glassWall);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(8.45, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45),
      shellGlassMat
    );
    glassDome.position.y = 3.7;
    glassDome.scale.set(1, 0.45, 1);
    glassDome.renderOrder = 3;
    root.add(glassDome);
    roofOrShell.push(glassDome);

    // Entrance archway & animated sliding doors at z = 8.2
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.38, 8.2);
    root.add(archGroup);
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 1.1), whiteGloss);
    frameL.position.set(-1.8, 1.7, 0);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 1.1), whiteGloss);
    frameR.position.set(1.8, 1.7, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.45, 1.2), darkSlate);
    lintel.position.set(0, 3.45, 0);
    archGroup.add(frameL, frameR, lintel);

    const doorGroup = new THREE.Group();
    const dL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.1, 0.12), glassMat);
    dL.position.set(-0.76, 1.55, 0);
    const dR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.1, 0.12), glassMat);
    dR.position.set(0.76, 1.55, 0);
    doorGroup.add(dL, dR);
    archGroup.add(doorGroup);
    handle.doorGroup = doorGroup;

    addSignBoard('HYDROPONIC GREENHOUSE', '#22c55e', '#dcfce7', 0, 4.15, 8.85, 4.2);

    // Spacious Hydroponic Planting Beds (wide 5.3m central aisle!)
    const cropsGroup = new THREE.Group();
    root.add(cropsGroup);
    handle.cropsGroup = cropsGroup;

    const soilMat = new THREE.MeshStandardMaterial({ color: '#4a3425', roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.55 });
    const growLightMat = new THREE.MeshStandardMaterial({
      color: '#f472b6',
      emissive: '#ec4899',
      emissiveIntensity: 1.1,
    });

    [-3.8, 3.8].forEach((bx) => {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.68, 8.2), whiteGloss);
      trough.position.set(bx, 0.72, -0.6);
      trough.castShadow = true;
      root.add(trough);
      addLocalBox(bx, -0.6, 2.3, 8.2);

      const soil = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 7.8), soilMat);
      soil.position.set(bx, 1.06, -0.6);
      root.add(soil);

      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 7.6), growLightMat);
      lightBar.position.set(bx, 3.0, -0.6);
      root.add(lightBar);

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 7.8, 10),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.5, roughness: 0.3 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(bx + (bx < 0 ? 1.2 : -1.2), 0.78, -0.6);
      root.add(pipe);

      for (let pz = -3.8; pz <= 2.6; pz += 1.05) {
        const plant = new THREE.Group();
        plant.position.set(bx, 1.14, pz);
        for (let l = 0; l < 4; l++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), leafMat);
          leaf.scale.set(1.1, 0.6, 0.8);
          leaf.position.set(Math.cos(l * 1.57) * 0.24, 0.2, Math.sin(l * 1.57) * 0.24);
          plant.add(leaf);
        }
        cropsGroup.add(plant);
      }
    });

    const greenLight = new THREE.PointLight('#bbf7d0', 1.6, 18);
    greenLight.position.set(0, 3.5, 0);
    root.add(greenLight);
  } else if (b.type === 'landing_port') {
    // ENLARGED MARS LANDING PORT + 8.8m x 8.8m WALKABLE STERILISATION ROOM
    handle.sterilisationBounds = { minX: -4.4, maxX: 4.4, minZ: 8.6, maxZ: 17.4 };
    handle.doorLocalZ = 17.4;

    const padTex = createLandingPadTexture();
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(9.2, 9.6, 0.3, 36),
      new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.75, metalness: 0.15 })
    );
    pad.position.y = 0.15;
    pad.receiveShadow = true;
    root.add(pad);

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const fx = Math.sin(ang) * 10.0;
      const fz = Math.cos(ang) * 10.0;
      if (fz > 6.5 && Math.abs(fx) < 4.5) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.0, 8), darkSlate);
      post.position.set(fx, 1.0, fz);
      root.add(post);

      const meshPanel = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.35, 0.06),
        new THREE.MeshStandardMaterial({ color: '#94a3b8', wireframe: true })
      );
      meshPanel.position.set(fx, 1.0, fz);
      meshPanel.rotation.y = ang;
      root.add(meshPanel);
    }

    // WALKABLE STERILISATION ROOM (local x: -4.4..4.4, z: 8.6..17.4)
    const sterilFloor = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.22, 9.0),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.32, metalness: 0.1 })
    );
    sterilFloor.position.set(0, 0.11, 13.0);
    sterilFloor.receiveShadow = true;
    root.add(sterilFloor);

    const laneTrim = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 8.4), cyanGlow);
    laneTrim.position.set(0, 0.24, 13.0);
    root.add(laneTrim);

    const addSterilWall = (cx: number, cz: number, w: number, d: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3.6, d), whiteGloss);
      wall.position.set(cx, 2.0, cz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      root.add(wall);
      addLocalBox(cx, cz, w, d, 3.8);
    };

    // Left & right walls (x = +/-4.25, z = 8.6..17.4)
    addSterilWall(-4.25, 13.0, 0.3, 8.8);
    addSterilWall(4.25, 13.0, 0.3, 8.8);
    // Outer wall segments leaving x = -1.8..1.8 open (3.6m wide doorway!)
    addSterilWall(-3.1, 17.4, 2.6, 0.3);
    addSterilWall(3.1, 17.4, 2.6, 0.3);
    // Inner wall segments leaving x = -1.8..1.8 open onto Landing Pad!
    addSterilWall(-3.1, 8.6, 2.6, 0.3);
    addSterilWall(3.1, 8.6, 2.6, 0.3);

    const sterilRoof = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.24, 9.2), whiteGloss);
    sterilRoof.position.set(0, 3.85, 13.0);
    sterilRoof.castShadow = true;
    root.add(sterilRoof);
    roofOrShell.push(sterilRoof);

    addSignBoard('STERILISATION ROOM', '#22d3ee', '#cffafe', 0, 4.15, 17.6, 4.2);

    // Automatic Sliding Outer Entry Door (z = 17.4)
    const gateFrame = new THREE.Group();
    gateFrame.position.set(0, 0.2, 17.4);
    root.add(gateFrame);
    const doorGroup = new THREE.Group();
    const gLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.2, 0.14), glassMat);
    gLeafL.position.set(-0.88, 1.6, 0);
    const gLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.2, 0.14), glassMat);
    gLeafR.position.set(0.88, 1.6, 0);
    doorGroup.add(gLeafL, gLeafR);
    gateFrame.add(doorGroup);
    handle.doorGroup = doorGroup;

    // Automatic Sliding Inner Airlock Door (z = 8.6)
    const innerFrame = new THREE.Group();
    innerFrame.position.set(0, 0.2, 8.6);
    root.add(innerFrame);
    const innerDoorGroup = new THREE.Group();
    const iLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.2, 0.14), glassMat);
    iLeafL.position.set(-0.88, 1.6, 0);
    const iLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.2, 0.14), glassMat);
    iLeafR.position.set(0.88, 1.6, 0);
    innerDoorGroup.add(iLeafL, iLeafR);
    innerFrame.add(innerDoorGroup);
    handle.innerDoorGroup = innerDoorGroup;

    // Interior Equipment: UV/Mist Decontamination Arch, Scanner Console & Bio-Locker
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.22, 13.0);
    root.add(archGroup);
    const archRing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.24, 2.2), cyanGlow);
    archRing.position.y = 3.15;
    archGroup.add(archRing);

    const scannerBench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 2.4), darkSlate);
    scannerBench.position.set(3.2, 0.72, 13.0);
    root.add(scannerBench);
    const scannerPad = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.9), cyanGlow);
    scannerPad.position.set(3.2, 1.28, 13.0);
    root.add(scannerPad);
    addLocalBox(3.2, 13.0, 1.1, 2.4);

    const locker = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 2.2), whiteGloss);
    locker.position.set(-3.2, 1.3, 13.0);
    root.add(locker);
    addLocalBox(-3.2, 13.0, 1.0, 2.2);

    const mistCount = 130;
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = (Math.random() - 0.5) * 3.0;
      mistPos[i * 3 + 1] = 0.3 + Math.random() * 2.6;
      mistPos[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const deconMist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({ color: '#67e8f9', size: 0.16, transparent: true, opacity: 0.85 })
    );
    deconMist.visible = false;
    archGroup.add(deconMist);
    handle.deconMist = deconMist;

    const sterilLight = new THREE.PointLight('#67e8f9', 1.4, 14);
    sterilLight.position.set(0, 3.2, 13.0);
    root.add(sterilLight);

    // Tall Beacon Post outside Landing Port
    const alarmPost = new THREE.Group();
    alarmPost.position.set(5.8, 0, 12.2);
    root.add(alarmPost);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 6.6, 12), darkSlate);
    pole.position.y = 3.3;
    pole.castShadow = true;
    alarmPost.add(pole);
    addLocalCyl(5.8, 12.2, 0.45);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.55, 16), whiteGloss);
    housing.position.y = 6.6;
    alarmPost.add(housing);

    const alarmLightMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#38bdf8',
      emissiveIntensity: 0.2,
      roughness: 0.15,
    });
    const alarmLight = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), alarmLightMat);
    alarmLight.position.y = 7.1;
    alarmPost.add(alarmLight);
    handle.alarmLight = alarmLight;

    const alarmPt = new THREE.PointLight('#38bdf8', 0, 22);
    alarmPt.position.y = 7.2;
    alarmPost.add(alarmPt);
    handle.alarmPointLight = alarmPt;

    // Arrival Supply Capsule standing on Pad
    const cap = new THREE.Group();
    cap.position.set(0, 0.3, 0);
    root.add(cap);
    const capBody = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.55, 2.5, 20), whiteGloss);
    capBody.position.y = 1.25;
    capBody.castShadow = true;
    cap.add(capBody);
    const capCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 1.15, 20),
      new THREE.MeshStandardMaterial({ color: '#e86f3a', roughness: 0.38 })
    );
    capCone.position.y = 3.05;
    cap.add(capCone);
    const capHatch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.18), darkSlate);
    capHatch.position.set(0, 1.15, 1.3);
    cap.add(capHatch);
    handle.capsuleMesh = cap;
    addLocalCyl(0, 0, 1.6);
  } else if (b.type === 'solar_array') {
    // Enlarged Exterior-Only Dual-Wing Solar Power Station (clearly exterior-only, no fake door)
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.3, 4.2), darkSlate);
    base.position.y = 0.15;
    base.receiveShadow = true;
    root.add(base);
    addLocalBox(0, 0, 5.0, 4.2, 0);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 2.8, 14), whiteGloss);
    mast.position.y = 1.4;
    mast.castShadow = true;
    root.add(mast);

    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 14), cyanGlow);
    beacon.position.y = 2.55;
    root.add(beacon);

    const solarTex = createSolarPanelTexture();
    const panelMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.22,
      metalness: 0.65,
    });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.12, 3.6), panelMat);
    wing.position.y = 2.95;
    wing.rotation.x = 0.42;
    wing.castShadow = true;
    root.add(wing);
    handle.solarPanels = [wing];
  } else {
    // ENLARGED WALKABLE MODULAR COLONY FACILITIES (10.0m x 10.0m foundation, 9.0m x 9.0m walkable interior!)
    const colorMap: Record<string, string> = {
      water_recycler: '#0ea5e9',
      battery_bank: '#10b981',
      oxygen_generator: '#38bdf8',
      food_processor: '#f59e0b',
      waste_processor: '#84cc16',
      fuel_plant: '#f97316',
      radiation_shield: '#a855f7',
      research_outpost: '#06b6d4',
      warehouse: '#eab308',
    };
    const titleMap: Record<string, string> = {
      water_recycler: 'WATER RECYCLING BAY',
      battery_bank: 'BATTERY STORAGE HUB',
      oxygen_generator: 'OXYGEN GENERATOR LAB',
      food_processor: 'FOOD PROCESSING BAY',
      waste_processor: 'WASTE RECYCLING PLANT',
      fuel_plant: 'FUEL SYNTHESIS PLANT',
      radiation_shield: 'RADIATION SHIELD DOME',
      research_outpost: 'RESEARCH OUTPOST',
      warehouse: 'COLONY WAREHOUSE',
    };
    const accentColor = colorMap[b.type] || '#38bdf8';
    const accent = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.35,
      metalness: 0.25,
    });

    handle.interiorBounds = { minX: -4.25, maxX: 4.25, minZ: -4.25, maxZ: 4.25 };
    handle.doorLocalZ = 4.5;

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.38, 10.0), darkSlate);
    foundation.position.y = 0.19;
    foundation.receiveShadow = true;
    root.add(foundation);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(9.0, 0.06, 9.0),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.34, metalness: 0.08 })
    );
    floor.position.y = 0.41;
    floor.receiveShadow = true;
    root.add(floor);

    const floorTrim = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.03, 8.2), accent);
    floorTrim.position.y = 0.43;
    root.add(floorTrim);
    const innerPad = new THREE.Mesh(
      new THREE.BoxGeometry(7.9, 0.035, 7.9),
      new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.35 })
    );
    innerPad.position.y = 0.435;
    root.add(innerPad);

    // Structural Wall Segments with 3.0m wide clear doorway at front (+Z = 4.5)
    const addModWall = (cx: number, cz: number, w: number, d: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3.8, d), whiteGloss);
      wall.position.set(cx, 2.28, cz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      root.add(wall);
      addLocalBox(cx, cz, w, d, 4.0);
    };

    // Back, Left, Right walls
    addModWall(0, -4.5, 9.2, 0.34);
    addModWall(-4.5, 0, 0.34, 9.2);
    addModWall(4.5, 0, 0.34, 9.2);
    // Front walls leaving x in [-1.5, 1.5] open
    addModWall(-3.05, 4.5, 3.1, 0.34);
    addModWall(3.05, 4.5, 3.1, 0.34);

    // Observation glass strips mounted flush on front side wings
    [-3.05, 3.05].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 0.42), glassMat);
      win.position.set(wx, 2.35, 4.5);
      root.add(win);
    });

    // Doorframe lintel & Animated Sliding Airlock Door at z = 4.5
    const doorFrame = new THREE.Group();
    doorFrame.position.set(0, 0.4, 4.5);
    root.add(doorFrame);

    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 0.56), darkSlate);
    postL.position.set(-1.58, 1.7, 0);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 0.56), darkSlate);
    postR.position.set(1.58, 1.7, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.48, 0.6), darkSlate);
    lintel.position.set(0, 3.55, 0);
    doorFrame.add(postL, postR, lintel);

    const doorGroup = new THREE.Group();
    const dL = new THREE.Mesh(new THREE.BoxGeometry(1.48, 3.15, 0.14), glassMat);
    dL.position.set(-0.74, 1.58, 0);
    const dR = new THREE.Mesh(new THREE.BoxGeometry(1.48, 3.15, 0.14), glassMat);
    dR.position.set(0.74, 1.58, 0);
    doorGroup.add(dL, dR);
    doorFrame.add(doorGroup);
    handle.doorGroup = doorGroup;

    // Exterior Nameplate Sign
    addSignBoard(titleMap[b.type] || b.name.toUpperCase(), accentColor, '#e2e8f0', 0, 4.35, 4.78, 3.8);

    // Detachable Roof & Accent Dome (automatically hidden when astronaut enters!)
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.28, 9.6), whiteGloss);
    roofSlab.position.set(0, 4.32, 0);
    roofSlab.castShadow = true;
    root.add(roofSlab);
    roofOrShell.push(roofSlab);

    const roofCollar = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 1.0, 8), accent);
    roofCollar.rotation.y = Math.PI / 8;
    roofCollar.position.y = 4.95;
    roofCollar.castShadow = true;
    root.add(roofCollar);
    roofOrShell.push(roofCollar);

    // Exterior side utility tanks (outside walls at ±4.95)
    [-4.95, 4.95].forEach((tx) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.7, 14), accent);
      tank.position.set(tx, 1.75, -1.2);
      tank.castShadow = true;
      root.add(tank);
      addLocalCyl(tx, -1.2, 0.55);
    });

    // Warm Interior Overhead Light
    const interiorLight = new THREE.PointLight(accentColor, 1.45, 18);
    interiorLight.position.set(0, 3.5, 0);
    root.add(interiorLight);

    // Walkable Interior Equipment & Interactive Station (centered toward z = -2.3 so center aisle stays clear)
    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 1.15), darkSlate);
    consoleBase.position.set(0, 0.94, -2.55);
    consoleBase.castShadow = true;
    root.add(consoleBase);
    const consoleScreen = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 0.12), cyanGlow);
    consoleScreen.position.set(0, 1.65, -2.45);
    consoleScreen.rotation.x = -0.35;
    root.add(consoleScreen);
    addLocalBox(0, -2.55, 2.4, 1.15);

    if (b.type === 'warehouse') {
      [-3.1, 3.1].forEach((rx) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 4.6), warmNeutral);
        rack.position.set(rx, 1.62, -1.0);
        rack.castShadow = true;
        root.add(rack);
        addLocalBox(rx, -1.0, 1.2, 4.6);

        [-2.2, -1.0, 0.2].forEach((cz, idx) => {
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.7, 0.9),
            new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? '#eab308' : '#38bdf8', roughness: 0.4 })
          );
          crate.position.set(rx, 1.45, cz);
          root.add(crate);
        });
      });
    } else if (b.type === 'water_recycler' || b.type === 'fuel_plant' || b.type === 'waste_processor') {
      [-2.6, 2.6].forEach((vx) => {
        const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 2.4, 16), accent);
        vat.position.set(vx, 1.62, -2.2);
        vat.castShadow = true;
        root.add(vat);
        addLocalCyl(vx, -2.2, 0.95);
      });
    } else if (b.type === 'battery_bank') {
      [-2.7, 2.7].forEach((bx) => {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 1.3), accent);
        cell.position.set(bx, 1.52, -2.2);
        cell.castShadow = true;
        root.add(cell);
        addLocalBox(bx, -2.2, 1.3, 1.3);
      });
    } else if (b.type === 'food_processor') {
      [-2.7, 2.7].forEach((fx) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 2.0, 14), whiteGloss);
        pod.position.set(fx, 1.42, -2.2);
        root.add(pod);
        addLocalCyl(fx, -2.2, 0.72);
      });
    } else {
      // oxygen_generator, radiation_shield, research_outpost
      [-2.7, 2.7].forEach((sx, idx) => {
        const core = new THREE.Mesh(
          idx === 0 ? new THREE.SphereGeometry(0.72, 16, 12) : new THREE.OctahedronGeometry(0.72, 0),
          accent
        );
        core.position.set(sx, 1.85, -2.2);
        root.add(core);
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.95, 14), darkSlate);
        ped.position.set(sx, 0.88, -2.2);
        root.add(ped);
        addLocalCyl(sx, -2.2, 0.75);
      });
    }
  }

  return handle;
}

export function createPlacementPreviewMesh(type: BuildingType): THREE.Group {
  const fp = getBuildingFootprint(type);
  const ghostHandle = createBuildingMesh({
    id: '__placement_preview__',
    type,
    name: 'Preview',
    position: [0, 0, 0],
    rotationY: 0,
    level: 1,
    dustLevel: 0,
    damaged: false,
    hasInterior: false,
    footprintRadius: fp.boundingRadius,
    cropPlanted: type === 'greenhouse',
    cropGrowth: 60,
  });

  const group = ghostHandle.root;
  group.userData.ghostSolidMaterials = [];
  group.userData.ghostOutlineMaterials = [];

  const solidGhostMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    emissive: '#16a34a',
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.42,
    roughness: 0.4,
    depthWrite: false,
  });
  const outlineMat = new THREE.MeshBasicMaterial({
    color: '#4ade80',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  (group.userData.ghostSolidMaterials as THREE.MeshStandardMaterial[]).push(solidGhostMat);
  (group.userData.ghostOutlineMaterials as THREE.MeshBasicMaterial[]).push(outlineMat);

  group.traverse((obj) => {
    if (obj === ghostHandle.footprintRing) {
      obj.visible = false;
      return;
    }
    if (obj instanceof THREE.Light || obj instanceof THREE.Points) {
      obj.visible = false;
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.material = solidGhostMat;
      obj.renderOrder = 4;
    }
  });

  // Exact ground footprint outline matching actual OBB / Circle geometry
  const outlineGroup = new THREE.Group();
  outlineGroup.position.y = 0.09;
  group.add(outlineGroup);

  for (const shape of fp.shapes) {
    if (shape.kind === 'circle') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(Math.max(0.2, shape.radius - 0.18), shape.radius + 0.04, 48),
        outlineMat
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(shape.lx, 0, shape.lz);
      outlineGroup.add(ring);

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(shape.radius, 48),
        new THREE.MeshBasicMaterial({
          color: '#22c55e',
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(shape.lx, -0.02, shape.lz);
      outlineGroup.add(disc);
      (group.userData.ghostOutlineMaterials as THREE.MeshBasicMaterial[]).push(
        disc.material as THREE.MeshBasicMaterial
      );
    } else {
      const w = shape.halfW * 2;
      const d = shape.halfD * 2;
      const t = 0.16;
      const bars: [number, number, number, number][] = [
        [shape.lx, shape.lz + shape.halfD, w + t, t],
        [shape.lx, shape.lz - shape.halfD, w + t, t],
        [shape.lx + shape.halfW, shape.lz, t, d + t],
        [shape.lx - shape.halfW, shape.lz, t, d + t],
      ];
      for (const [bx, bz, bw, bd] of bars) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(bw, bd), outlineMat);
        bar.rotation.x = -Math.PI / 2;
        bar.position.set(bx, 0, bz);
        outlineGroup.add(bar);
      }
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({
          color: '#22c55e',
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(shape.lx, -0.02, shape.lz);
      outlineGroup.add(fill);
      (group.userData.ghostOutlineMaterials as THREE.MeshBasicMaterial[]).push(
        fill.material as THREE.MeshBasicMaterial
      );
    }
  }

  // Front doorway / orientation chevron indicator
  if (fp.entrance) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.85, 3), outlineMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(fp.entrance.lx, 0.08, fp.entrance.lz);
    outlineGroup.add(arrow);
  }

  return group;
}

export function setPlacementPreviewValidity(previewGroup: THREE.Group, valid: boolean) {
  const solidHex = valid ? '#22c55e' : '#ef4444';
  const emissiveHex = valid ? '#16a34a' : '#dc2626';
  const outlineHex = valid ? '#4ade80' : '#f87171';

  const solids = (previewGroup.userData.ghostSolidMaterials || []) as THREE.MeshStandardMaterial[];
  for (const m of solids) {
    m.color.set(solidHex);
    m.emissive.set(emissiveHex);
  }
  const outlines = (previewGroup.userData.ghostOutlineMaterials || []) as THREE.MeshBasicMaterial[];
  for (const m of outlines) {
    m.color.set(outlineHex);
  }
}

export function createRoadMesh(
  road: RoadSegment,
  groundHeightAt: (x: number, z: number) => number
): THREE.Group {
  const group = new THREE.Group();
  const isPaved = road.stage === 'paved';
  const mat = new THREE.MeshStandardMaterial({
    color: isPaved ? '#334155' : '#9c7864',
    roughness: isPaved ? 0.6 : 0.92,
    metalness: isPaved ? 0.18 : 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const stripeMat = new THREE.MeshBasicMaterial({ color: isPaved ? '#38bdf8' : '#fcd34d' });

  for (let i = 0; i < road.points.length - 1; i++) {
    const a = road.points[i];
    const b = road.points[i + 1];
    const subSteps = 6;
    for (let s = 0; s < subSteps; s++) {
      const t0 = s / subSteps;
      const t1 = (s + 1) / subSteps;
      const x0 = THREE.MathUtils.lerp(a[0], b[0], t0);
      const z0 = THREE.MathUtils.lerp(a[2], b[2], t0);
      const x1 = THREE.MathUtils.lerp(a[0], b[0], t1);
      const z1 = THREE.MathUtils.lerp(a[2], b[2], t1);

      const mx = (x0 + x1) * 0.5;
      const mz = (z0 + z1) * 0.5;
      const y0 = groundHeightAt(x0, z0);
      const y1 = groundHeightAt(x1, z1);
      const my = (y0 + y1) * 0.5 + 0.05;

      const dx = x1 - x0;
      const dz = z1 - z0;
      const segLen = Math.hypot(dx, dz) + 0.15;
      const yaw = Math.atan2(dx, dz);
      const pitch = Math.atan2(y1 - y0, Math.max(0.01, segLen));

      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, segLen), mat);
      plank.position.set(mx, my, mz);
      plank.rotation.order = 'YXZ';
      plank.rotation.y = yaw;
      plank.rotation.x = -pitch;
      plank.receiveShadow = true;
      group.add(plank);

      if (s % 2 === 0) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, segLen * 0.55), stripeMat);
        dash.position.set(mx, my + 0.06, mz);
        dash.rotation.order = 'YXZ';
        dash.rotation.y = yaw;
        dash.rotation.x = -pitch;
        group.add(dash);
      }
    }
  }

  return group;
}
