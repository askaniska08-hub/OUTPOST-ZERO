import * as THREE from 'three';
import { PetBehaviorState, PetSpecies } from '../types/game';
import { createContactShadowTexture } from './textures';

export interface PetRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  legs: THREE.Group[];
  statusRing: THREE.Mesh;
  species: PetSpecies;
}

let petShadowTex: THREE.CanvasTexture | null = null;

export function createPetModel(
  species: PetSpecies,
  color = '#f8fafc',
  accentColor = '#38bdf8'
): PetRig {
  const root = new THREE.Group();

  if (!petShadowTex) petShadowTex = createContactShadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({
      map: petShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.4,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const shellMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.4,
    emissive: accentColor,
    emissiveIntensity: 0.35,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.4,
    metalness: 0.65,
  });

  const body = new THREE.Group();
  body.position.y = 0.32;
  root.add(body);

  // Rounded chassis torso
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(species === 'dog' ? 0.14 : 0.125, 0.24, 10, 16),
    shellMat
  );
  torso.rotation.x = Math.PI / 2;
  torso.castShadow = true;
  body.add(torso);

  // Glowing collar / battery status ring
  const statusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.135, 0.022, 10, 20),
    accentMat.clone()
  );
  statusRing.position.set(0, 0.04, 0.16);
  body.add(statusRing);

  // Cute Head
  const head = new THREE.Group();
  head.position.set(0, 0.15, 0.23);
  body.add(head);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), shellMat);
  cranium.scale.set(1.05, 0.95, 1.05);
  cranium.castShadow = true;
  head.add(cranium);

  // LED Visor screen
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.095, 0.06), darkMat);
  visor.position.set(0, 0.01, 0.115);
  head.add(visor);

  // Cute glowing eyes
  [-0.048, 0.048].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), accentMat);
    eye.position.set(ex, 0.015, 0.145);
    head.add(eye);
  });

  // Species ears & muzzle
  if (species === 'dog') {
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), shellMat);
    muzzle.scale.set(1.1, 0.8, 1.1);
    muzzle.position.set(0, -0.045, 0.13);
    head.add(muzzle);

    // Floppy robotic ears
    [-0.135, 0.135].forEach((ex, i) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.08, 6, 10), accentMat);
      ear.position.set(ex, 0.03, 0);
      ear.rotation.z = i === 0 ? 0.35 : -0.35;
      head.add(ear);
    });
  } else {
    // Pointed robotic cat ears
    [-0.085, 0.085].forEach((ex, i) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.11, 10), accentMat);
      ear.position.set(ex, 0.14, 0);
      ear.rotation.z = i === 0 ? 0.25 : -0.25;
      head.add(ear);
    });
  }

  // Tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.08, -0.2);
  body.add(tail);
  const tailGeo =
    species === 'dog'
      ? new THREE.CapsuleGeometry(0.024, 0.14, 6, 10)
      : new THREE.CapsuleGeometry(0.02, 0.22, 6, 10);
  const tailMesh = new THREE.Mesh(tailGeo, accentMat);
  tailMesh.position.set(0, 0.08, -0.04);
  tailMesh.rotation.x = -0.6;
  tail.add(tailMesh);

  // 4 Articulated Legs
  const legs: THREE.Group[] = [];
  const legOffsets: [number, number][] = [
    [-0.095, 0.14],
    [0.095, 0.14],
    [-0.095, -0.14],
    [0.095, -0.14],
  ];
  for (const [lx, lz] of legOffsets) {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, -0.05, lz);
    body.add(legPivot);

    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.15, 6, 10), darkMat);
    limb.position.y = -0.11;
    limb.castShadow = true;
    legPivot.add(limb);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), shellMat);
    paw.scale.set(1, 0.65, 1.2);
    paw.position.set(0, -0.22, 0.015);
    legPivot.add(paw);

    legs.push(legPivot);
  }

  return { root, body, head, tail, legs, statusRing, species };
}

export function animatePetRig(
  rig: PetRig,
  state: PetBehaviorState,
  speed: number,
  battery: number,
  time: number,
  dt: number
) {
  const damp = (a: number, b: number, k = 10) => THREE.MathUtils.damp(a, b, k, dt);
  const mat = rig.statusRing.material as THREE.MeshStandardMaterial;

  if (state === 'charging_sleeping') {
    // Curled up / lying comfortably on its side with gentle breathing!
    rig.body.position.y = damp(rig.body.position.y, 0.14, 8);
    rig.body.rotation.z = damp(rig.body.rotation.z, rig.species === 'dog' ? 1.15 : 0.35, 6);
    rig.body.rotation.y = damp(rig.body.rotation.y, 0.4, 6);
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.35, 6);
    rig.head.rotation.y = damp(rig.head.rotation.y, 0.45, 6);
    rig.tail.rotation.y = damp(rig.tail.rotation.y, 0.5, 6);

    // Fold legs naturally
    rig.legs.forEach((leg, i) => {
      leg.rotation.x = damp(leg.rotation.x, i < 2 ? -1.1 : 1.1, 8);
    });

    // Gentle breathing scale & soft cyan charging glow
    const breath = 1 + Math.sin(time * 2.2) * 0.035;
    rig.body.scale.set(breath, breath, 1);
    mat.color.set('#38bdf8');
    mat.emissive.set('#38bdf8');
    mat.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.35;
    return;
  }

  if (state === 'stranded_rescue') {
    // Safe inactive sleep mode on distant terrain
    rig.body.position.y = damp(rig.body.position.y, 0.14, 8);
    rig.body.rotation.z = damp(rig.body.rotation.z, 1.35, 6);
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.45, 6);
    mat.color.set('#ef4444');
    mat.emissive.set('#ef4444');
    mat.emissiveIntensity = 0.5 + Math.sin(time * 6) * 0.4;
    return;
  }

  // Active posture
  rig.body.scale.set(1, 1, 1);
  rig.body.rotation.z = damp(rig.body.rotation.z, 0, 10);
  rig.body.rotation.y = damp(rig.body.rotation.y, 0, 10);

  if (battery < 30) {
    mat.color.set('#f59e0b');
    mat.emissive.set('#f59e0b');
  } else {
    mat.color.set('#34d399');
    mat.emissive.set('#34d399');
  }
  mat.emissiveIntensity = 0.55;

  if (speed > 0.2) {
    const phase = time * 10;
    rig.body.position.y = damp(rig.body.position.y, 0.32 + Math.abs(Math.sin(phase)) * 0.04, 14);
    rig.legs[0].rotation.x = Math.sin(phase) * 0.65;
    rig.legs[1].rotation.x = -Math.sin(phase) * 0.65;
    rig.legs[2].rotation.x = -Math.sin(phase) * 0.65;
    rig.legs[3].rotation.x = Math.sin(phase) * 0.65;
    rig.head.rotation.x = damp(rig.head.rotation.x, 0, 10);
    rig.head.rotation.y = damp(rig.head.rotation.y, 0, 10);
    rig.tail.rotation.z = Math.sin(time * 12) * 0.4;
  } else {
    rig.body.position.y = damp(rig.body.position.y, 0.32 + Math.sin(time * 2.5) * 0.012, 10);
    rig.legs.forEach((leg) => {
      leg.rotation.x = damp(leg.rotation.x, 0, 12);
    });
    rig.head.rotation.y = damp(rig.head.rotation.y, Math.sin(time * 1.1) * 0.3, 6);
    rig.head.rotation.x = damp(rig.head.rotation.x, Math.sin(time * 1.7) * 0.1, 6);
    rig.tail.rotation.z = Math.sin(time * 5.5) * 0.25;
  }
}
