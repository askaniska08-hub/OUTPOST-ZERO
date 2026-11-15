import * as THREE from 'three';
import { ActiveHazardType, RoadSegment } from '../types/game';
import { createMarsPlanetTexture, createMarsRegolithTexture } from './textures';

export interface GradedPad {
  x: number;
  z: number;
  radius: number;
  targetY: number;
}

export interface VegetationSpot {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export class MarsTerrainManager {
  public group = new THREE.Group();
  public rockColliders: { x: number; z: number; radius: number }[] = [];
  public vegetationSpots: VegetationSpot[] = [];
  private chunks = new Map<string, { mesh: THREE.Mesh; cx: number; cz: number; lod: number }>();
  private chunkSize = 48;
  private material: THREE.MeshStandardMaterial;
  private gradedPads: GradedPad[] = [];
  private gradedRoads: RoadSegment[] = [];
  private dustPoints: THREE.Points;
  private dustPositions: Float32Array;
  private dustCount = 900;
  private rockInstanced: THREE.InstancedMesh;
  private vegetationInstanced!: THREE.InstancedMesh;
  private horizonRing: THREE.Mesh;
  private globeMesh: THREE.Mesh;

  constructor(private scene: THREE.Scene) {
    const regolithTex = createMarsRegolithTexture();
    this.material = new THREE.MeshStandardMaterial({
      map: regolithTex,
      roughness: 0.9,
      metalness: 0.03,
      vertexColors: true,
    });

    // Distant planetary mountain silhouette ring so outdoor Mars never ends in a flat box
    const ringGeo = new THREE.CylinderGeometry(230, 260, 42, 64, 1, true);
    const pos = ringGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      if (vy > 0) {
        const ang = Math.atan2(vz, vx);
        const ridge = 12 + Math.sin(ang * 7) * 9 + Math.cos(ang * 13) * 6 + Math.sin(ang * 23) * 3;
        pos.setY(i, ridge);
      } else {
        pos.setY(i, -12);
      }
    }
    ringGeo.computeVertexNormals();
    this.horizonRing = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({
        color: '#a86b52',
        roughness: 0.95,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.horizonRing);

    // Instanced Martian Rocks (varying neutral grey, sandstone, terracotta) + solid colliders
    const rockGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const rPos = rockGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const n = 0.8 + 0.35 * Math.sin(i * 1.7 + rPos.getX(i) * 2.1);
      rPos.setXYZ(i, rPos.getX(i) * n, rPos.getY(i) * 0.72 * n, rPos.getZ(i) * n);
    }
    rockGeo.computeVertexNormals();
    const rockMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.05 });
    const rockCount = 180;
    this.rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    this.rockInstanced.castShadow = true;
    this.rockInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const rockColors = ['#7c726d', '#8e6c5a', '#6b6766', '#9e725c', '#a88c7a'];

    let placed = 0;
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    while (placed < rockCount) {
      const angle = rand() * Math.PI * 2;
      const dist = 26 + rand() * 145;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      // Keep Landing Port corridor & central colony plaza unobstructed
      if (Math.abs(rx) < 26 && Math.abs(rz) < 25) continue;
      if (Math.hypot(rx - 38, rz + 28) < 20) continue;

      const ry = this.rawHeightAt(rx, rz);
      const s = 0.5 + rand() * 1.9;
      dummy.position.set(rx, ry + s * 0.16, rz);
      dummy.rotation.set(rand() * 0.5, rand() * Math.PI * 2, rand() * 0.5);
      dummy.scale.set(s * (0.85 + rand() * 0.3), s * (0.7 + rand() * 0.4), s * (0.85 + rand() * 0.3));
      dummy.updateMatrix();
      this.rockInstanced.setMatrixAt(placed, dummy.matrix);
      tint.set(rockColors[placed % rockColors.length]);
      this.rockInstanced.setColorAt(placed, tint);
      // Only genuine solid rocks & boulders block construction / walking; tiny surface rubble (< 0.78) stays non-blocking
      if (s >= 0.78) {
        this.rockColliders.push({ x: rx, z: rz, radius: s * 0.56 });
      }
      placed++;
    }
    this.rockInstanced.instanceMatrix.needsUpdate = true;
    if (this.rockInstanced.instanceColor) this.rockInstanced.instanceColor.needsUpdate = true;
    this.rockInstanced.computeBoundingSphere();
    this.group.add(this.rockInstanced);

    // Decorative Small Mars Shrubs / Ground Flora (non-solid, NEVER blocks building placement or walking)
    this.buildDecorativeVegetation(rand);

    // Regional Landmarks for the 6 Progressive Mars Regions
    this.buildRegionalLandmarks();

    // Airborne & ground-hugging Martian dust particles
    this.dustPositions = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 90;
      this.dustPositions[i * 3 + 1] = 0.2 + Math.random() * 11;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: '#ebd0b8',
      size: 0.18,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.dustPoints.frustumCulled = false;
    this.group.add(this.dustPoints);

    // Distant Phobos / Planetary Globe for Title Screen vista
    const planetTex = createMarsPlanetTexture();
    this.globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(12, 36, 28),
      new THREE.MeshStandardMaterial({ map: planetTex, roughness: 0.82 })
    );
    this.globeMesh.position.set(0, 26, -150);
    this.globeMesh.visible = false;
    this.group.add(this.globeMesh);

    this.scene.add(this.group);
    this.updateChunks(0, 0);
  }

  private buildDecorativeVegetation(rand: () => number) {
    // Low organic desert-scrub tuft geometry (completely non-solid decorative surface flora)
    const bushGeo = new THREE.DodecahedronGeometry(0.42, 1);
    const bPos = bushGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const vx = bPos.getX(i);
      const vy = bPos.getY(i);
      const vz = bPos.getZ(i);
      const wobble = 0.78 + 0.36 * Math.sin(vx * 5.2 + vz * 4.4 + i * 0.7);
      bPos.setXYZ(i, vx * wobble, Math.max(-0.08, vy * 0.65 * wobble), vz * wobble);
    }
    bushGeo.computeVertexNormals();

    const bushMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02 });
    const bushCount = 240;
    this.vegetationInstanced = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
    this.vegetationInstanced.castShadow = false;
    this.vegetationInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const bushColors = ['#6b8e5a', '#7c9a5e', '#8b7e52', '#5f7d58', '#9c6e4b'];

    let placed = 0;
    let guard = 0;
    while (placed < bushCount && guard < 2000) {
      guard++;
      const angle = rand() * Math.PI * 2;
      const dist = 7 + rand() * 125;
      const vx = Math.cos(angle) * dist;
      const vz = Math.sin(angle) * dist;
      // Avoid solid boulders & Landing Port pad center
      if (Math.hypot(vx - 38, vz + 28) < 12) continue;
      if (this.rockColliders.some((rc) => Math.hypot(vx - rc.x, vz - rc.z) < rc.radius + 0.8)) continue;

      const vy = this.rawHeightAt(vx, vz);
      const s = 0.45 + rand() * 0.75;
      const spot: VegetationSpot = {
        x: vx,
        y: vy + 0.06,
        z: vz,
        rotY: rand() * Math.PI * 2,
        scaleX: s * (0.9 + rand() * 0.4),
        scaleY: s * (0.55 + rand() * 0.45),
        scaleZ: s * (0.9 + rand() * 0.4),
      };
      this.vegetationSpots.push(spot);

      dummy.position.set(spot.x, spot.y, spot.z);
      dummy.rotation.set(0, spot.rotY, 0);
      dummy.scale.set(spot.scaleX, spot.scaleY, spot.scaleZ);
      dummy.updateMatrix();
      this.vegetationInstanced.setMatrixAt(placed, dummy.matrix);
      tint.set(bushColors[placed % bushColors.length]);
      this.vegetationInstanced.setColorAt(placed, tint);
      placed++;
    }
    this.vegetationInstanced.count = placed;
    this.vegetationInstanced.instanceMatrix.needsUpdate = true;
    if (this.vegetationInstanced.instanceColor) this.vegetationInstanced.instanceColor.needsUpdate = true;
    this.vegetationInstanced.computeBoundingSphere();
    this.group.add(this.vegetationInstanced);
  }

  public updateHiddenVegetation(isCovered: (x: number, z: number) => boolean) {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.vegetationSpots.length; i++) {
      const sp = this.vegetationSpots[i];
      dummy.position.set(sp.x, sp.y, sp.z);
      dummy.rotation.set(0, sp.rotY, 0);
      if (isCovered(sp.x, sp.z)) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.scale.set(sp.scaleX, sp.scaleY, sp.scaleZ);
      }
      dummy.updateMatrix();
      this.vegetationInstanced.setMatrixAt(i, dummy.matrix);
    }
    this.vegetationInstanced.instanceMatrix.needsUpdate = true;
  }

  private buildRegionalLandmarks() {
    // 1. Ares Lava Tube Caves (76, 54): Basaltic Arch Cave with glowing subsurface crystals
    const caveX = 76;
    const caveZ = 54;
    const caveY = this.rawHeightAt(caveX, caveZ);
    const basaltMat = new THREE.MeshStandardMaterial({ color: '#4c3f3d', roughness: 0.92 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#a855f7',
      emissive: '#7e22ce',
      emissiveIntensity: 0.9,
      roughness: 0.25,
    });

    const arch = new THREE.Mesh(new THREE.TorusGeometry(6.5, 1.8, 10, 18, Math.PI), basaltMat);
    arch.position.set(caveX, caveY, caveZ);
    arch.rotation.y = -0.6;
    arch.castShadow = true;
    this.group.add(arch);
    // Colliders for cave arch pillars (leaving interior walkway open)
    this.rockColliders.push({ x: caveX - 5.2, z: caveZ + 3.4, radius: 2.1 });
    this.rockColliders.push({ x: caveX + 5.2, z: caveZ - 3.4, radius: 2.1 });

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const cx = caveX + Math.cos(ang) * 3.8;
      const cz = caveZ + Math.sin(ang) * 3.8;
      const cy = this.rawHeightAt(cx, cz);
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4 + (i % 3) * 0.4, 6), crystalMat);
      shard.position.set(cx, cy + 0.65, cz);
      shard.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.25;
      this.group.add(shard);
    }

    // 2. North Polar Water-Ice Shelf (10, -105): Glacial Frost Formations
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: '#cffafe',
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      clearcoat: 0.8,
    });
    const iceSpots: [number, number, number][] = [
      [10, -105, 2.2],
      [4, -110, 1.6],
      [16, -102, 1.8],
      [12, -98, 1.3],
    ];
    for (const [ix, iz, sc] of iceSpots) {
      const iy = this.rawHeightAt(ix, iz);
      const berg = new THREE.Mesh(new THREE.DodecahedronGeometry(sc, 0), iceMat);
      berg.position.set(ix, iy + sc * 0.45, iz);
      berg.scale.set(1.3, 0.75, 1.1);
      berg.castShadow = true;
      this.group.add(berg);
      this.rockColliders.push({ x: ix, z: iz, radius: sc * 0.95 });
    }

    // 3. Red Ridge & Mineral Valley (-58, 48): Terracotta Canyon Strata Outcrops
    const strataMat = new THREE.MeshStandardMaterial({ color: '#b4654a', roughness: 0.86 });
    [
      [-64, 52, 2.4],
      [-52, 54, 2.0],
    ].forEach(([rx, rz, sc]) => {
      const ry = this.rawHeightAt(rx, rz);
      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(sc * 0.7, sc * 1.25, sc * 1.6, 8), strataMat);
      mesa.position.set(rx, ry + sc * 0.7, rz);
      mesa.castShadow = true;
      this.group.add(mesa);
      this.rockColliders.push({ x: rx, z: rz, radius: sc * 1.15 });
    });

    // 4. Olympus Foothills Relay Beacon (110, -10)
    const relayY = this.rawHeightAt(110, -10);
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 6.0, 10),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.6, roughness: 0.35 })
    );
    mast.position.set(110, relayY + 3.0, -10);
    const beaconBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      new THREE.MeshBasicMaterial({ color: '#22c55e' })
    );
    beaconBulb.position.set(110, relayY + 6.1, -10);
    this.group.add(mast, beaconBulb);
    this.rockColliders.push({ x: 110, z: -10, radius: 0.7 });
  }

  public setGradedData(pads: GradedPad[], roads: RoadSegment[]) {
    this.gradedPads = pads;
    this.gradedRoads = roads;
    this.rebuildAllActiveChunks();
  }

  public rawHeightAt(x: number, z: number): number {
    // Gentle flat basin around core colony (r < 34) & landing port (38, -28)
    const distCenter = Math.hypot(x, z);
    const colonyBlend = THREE.MathUtils.smoothstep(distCenter, 26, 56);
    const portDist = Math.hypot(x - 38, z + 28);
    const portBlend = THREE.MathUtils.smoothstep(portDist, 14, 28);

    // Rolling Martian valleys, ridges & crater rims
    const broadWaves = Math.sin(x * 0.032) * Math.cos(z * 0.028) * 3.4;
    const fineRipples = Math.sin(x * 0.11 + z * 0.08) * 0.55;

    // Prominent crater at (-58, 48)
    const c1 = Math.hypot(x + 58, z - 48);
    const crater1 = Math.exp(-Math.pow((c1 - 18) / 6, 2)) * 4.2 - Math.exp(-Math.pow(c1 / 12, 2)) * 3.1;

    // Olympus foothills ridge at (85, 75)
    const r2 = Math.hypot(x - 85, z - 75);
    const ridge2 = Math.exp(-Math.pow(r2 / 32, 2)) * 6.5;

    // Polar ice basin at (10, -90)
    const p3 = Math.hypot(x - 10, z + 90);
    const polarBasin = -Math.exp(-Math.pow(p3 / 24, 2)) * 2.4;

    const raw = broadWaves + fineRipples + crater1 + ridge2 + polarBasin;
    return raw * colonyBlend * portBlend;
  }

  public groundHeightAt(x: number, z: number): number {
    let h = this.rawHeightAt(x, z);

    // Blend smoothly toward graded building pads (tight margin for compact colony layouts)
    for (const pad of this.gradedPads) {
      const d = Math.hypot(x - pad.x, z - pad.z);
      if (d < pad.radius + 2.5) {
        const t = 1 - THREE.MathUtils.smoothstep(d, pad.radius, pad.radius + 2.5);
        h = THREE.MathUtils.lerp(h, pad.targetY, t);
      }
    }

    // Blend smoothly toward prepared / paved roadbeds so roads follow terrain without floating!
    for (const road of this.gradedRoads) {
      for (let i = 0; i < road.points.length - 1; i++) {
        const a = road.points[i];
        const b = road.points[i + 1];
        const abx = b[0] - a[0];
        const abz = b[2] - a[2];
        const lenSq = abx * abx + abz * abz;
        if (lenSq < 0.001) continue;
        const proj = THREE.MathUtils.clamp(((x - a[0]) * abx + (z - a[2]) * abz) / lenSq, 0, 1);
        const cx = a[0] + abx * proj;
        const cz = a[2] + abz * proj;
        const dist = Math.hypot(x - cx, z - cz);
        if (dist < 4.8) {
          const roadY = THREE.MathUtils.lerp(a[1], b[1], proj);
          const blend = 1 - THREE.MathUtils.smoothstep(dist, 2.2, 4.8);
          h = THREE.MathUtils.lerp(h, roadY, blend);
        }
      }
    }

    return h;
  }

  private createChunkMesh(cx: number, cz: number, lod: number): THREE.Mesh {
    const segs = lod === 0 ? 28 : 12;
    const geo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const worldOffsetX = cx * this.chunkSize;
    const worldOffsetZ = cz * this.chunkSize;

    const cWarmSand = new THREE.Color('#d29a76');
    const cTerracotta = new THREE.Color('#c27a57');
    const cDustyRose = new THREE.Color('#b67868');
    const cFrost = new THREE.Color('#d9d4d6');
    const cRoadBed = new THREE.Color('#8a6d62');
    const temp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = lx + worldOffsetX;
      const wz = lz + worldOffsetZ;
      const wy = this.groundHeightAt(wx, wz);
      pos.setY(i, wy);

      // Subtle regional geological tinting (natural Martian palette)
      const northIce = THREE.MathUtils.clamp((-wz - 65) / 45, 0, 1);
      const heightTint = THREE.MathUtils.clamp((wy + 2) / 8, 0, 1);
      temp.copy(cTerracotta).lerp(cWarmSand, heightTint);
      if (Math.sin(wx * 0.04 + wz * 0.04) > 0.3) {
        temp.lerp(cDustyRose, 0.35);
      }
      if (northIce > 0) {
        temp.lerp(cFrost, northIce * 0.55);
      }

      // Prepared roadbed tinting
      for (const road of this.gradedRoads) {
        for (let k = 0; k < road.points.length - 1; k++) {
          const a = road.points[k];
          const b = road.points[k + 1];
          const abx = b[0] - a[0];
          const abz = b[2] - a[2];
          const lenSq = abx * abx + abz * abz;
          if (lenSq < 0.001) continue;
          const proj = THREE.MathUtils.clamp(((wx - a[0]) * abx + (wz - a[2]) * abz) / lenSq, 0, 1);
          const d = Math.hypot(wx - (a[0] + abx * proj), wz - (a[2] + abz * proj));
          if (d < 3.4) {
            temp.lerp(cRoadBed, 0.75 * (1 - THREE.MathUtils.smoothstep(d, 1.8, 3.4)));
          }
        }
      }

      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.set(worldOffsetX, 0, worldOffsetZ);
    mesh.receiveShadow = true;
    return mesh;
  }

  public rebuildAllActiveChunks() {
    for (const [key, entry] of this.chunks.entries()) {
      this.group.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      const mesh = this.createChunkMesh(entry.cx, entry.cz, entry.lod);
      this.group.add(mesh);
      this.chunks.set(key, { mesh, cx: entry.cx, cz: entry.cz, lod: entry.lod });
    }
  }

  public updateChunks(playerX: number, playerZ: number) {
    const pcx = Math.round(playerX / this.chunkSize);
    const pcz = Math.round(playerZ / this.chunkSize);
    const radius = 3; // 7x7 chunks = 336m x 336m active around player
    const needed = new Set<string>();

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = `${cx},${cz}`;
        needed.add(key);
        const lod = Math.max(Math.abs(dx), Math.abs(dz)) <= 1 ? 0 : 1;
        const existing = this.chunks.get(key);
        if (!existing || existing.lod !== lod) {
          if (existing) {
            this.group.remove(existing.mesh);
            existing.mesh.geometry.dispose();
          }
          const mesh = this.createChunkMesh(cx, cz, lod);
          this.group.add(mesh);
          this.chunks.set(key, { mesh, cx, cz, lod });
        }
      }
    }

    for (const [key, entry] of this.chunks.entries()) {
      if (!needed.has(key)) {
        this.group.remove(entry.mesh);
        entry.mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }
  }

  public updateAtmosphere(
    playerX: number,
    playerZ: number,
    dt: number,
    time: number,
    hazard: ActiveHazardType
  ) {
    const isStorm = hazard === 'dust_storm';
    const windSpeed = isStorm ? 22 : 3.2 + Math.sin(time * 0.35) * 1.4;
    const mat = this.dustPoints.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.damp(mat.opacity, isStorm ? 0.85 : 0.42, 3, dt);
    mat.size = THREE.MathUtils.damp(mat.size, isStorm ? 0.34 : 0.17, 3, dt);
    mat.color.set(isStorm ? '#d99a6c' : '#ebd0b8');

    const posAttr = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.dustCount; i++) {
      let px = this.dustPositions[i * 3];
      let py = this.dustPositions[i * 3 + 1];
      let pz = this.dustPositions[i * 3 + 2];

      // Ground-hugging gusts move faster near surface, fine dust drifts smoothly
      const heightFactor = py < 1.8 ? 1.35 : 0.85;
      px += windSpeed * heightFactor * dt;
      pz += Math.sin(time * 0.8 + i * 0.1) * (isStorm ? 4.5 : 0.9) * dt;
      py += Math.sin(time * 1.7 + i) * 0.25 * dt;

      // Wrap relative to player position so dust always surrounds camera
      if (px - playerX > 45) px -= 90;
      if (px - playerX < -45) px += 90;
      if (pz - playerZ > 45) pz -= 90;
      if (pz - playerZ < -45) pz += 90;
      if (py < 0.2) py = 0.25;
      if (py > 11) py = 10.5;

      this.dustPositions[i * 3] = px;
      this.dustPositions[i * 3 + 1] = py;
      this.dustPositions[i * 3 + 2] = pz;
    }
    posAttr.needsUpdate = true;

    this.horizonRing.position.set(playerX, 0, playerZ);
  }
}
