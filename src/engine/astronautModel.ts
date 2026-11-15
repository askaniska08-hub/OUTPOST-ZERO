import * as THREE from 'three';
import { AstronautVitals, SuitId, UniformId } from '../types/game';
import { createContactShadowTexture, createNasaPatchTexture } from './textures';

export interface AstronautRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  visorMesh?: THREE.Mesh;
  backpack?: THREE.Group;
  carriedAnchor: THREE.Group;
  primaryMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  visorMat?: THREE.MeshPhysicalMaterial;
  mode: 'mars' | 'earth';
}

const SUIT_PALETTES: Record<SuitId, { primary: string; accent: string; visor: string }> = {
  mars_artemis: { primary: '#f4f6f9', accent: '#e86f3a', visor: '#fbbf24' },
  mars_terracotta: { primary: '#e57c4e', accent: '#fef3c7', visor: '#38bdf8' },
  mars_cobalt: { primary: '#2563eb', accent: '#38bdf8', visor: '#facc15' },
  mars_emerald: { primary: '#10b981', accent: '#ecfdf5', visor: '#38bdf8' },
  mars_gold: { primary: '#eab308', accent: '#1e293b', visor: '#f97316' },
};

const UNIFORM_PALETTES: Record<UniformId, { primary: string; accent: string }> = {
  earth_navy: { primary: '#1e3a5f', accent: '#38bdf8' },
  earth_white: { primary: '#f1f5f9', accent: '#2563eb' },
  earth_teal: { primary: '#0d9488', accent: '#f8fafc' },
  earth_gold: { primary: '#ca8a04', accent: '#fef9c3' },
};

let sharedNasaTex: THREE.CanvasTexture | null = null;
let sharedShadowTex: THREE.CanvasTexture | null = null;

function getNasaTex() {
  if (!sharedNasaTex) sharedNasaTex = createNasaPatchTexture();
  return sharedNasaTex;
}

function getShadowTex() {
  if (!sharedShadowTex) sharedShadowTex = createContactShadowTexture();
  return sharedShadowTex;
}

export function createAstronautModel(
  mode: 'mars' | 'earth',
  suitId: SuitId = 'mars_artemis',
  uniformId: UniformId = 'earth_navy'
): AstronautRig {
  const root = new THREE.Group();
  root.name = mode === 'mars' ? 'MarsAstronaut' : 'EarthAstronaut';

  // Soft radial contact shadow so feet always stay grounded
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: getShadowTex(),
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.02;
  root.add(contactShadow);

  const pal =
    mode === 'mars'
      ? SUIT_PALETTES[suitId] || SUIT_PALETTES.mars_artemis
      : UNIFORM_PALETTES[uniformId] || UNIFORM_PALETTES.earth_navy;

  const primaryMat = new THREE.MeshStandardMaterial({
    color: pal.primary,
    roughness: mode === 'mars' ? 0.48 : 0.62,
    metalness: 0.08,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: pal.accent,
    roughness: 0.35,
    metalness: 0.25,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.38,
    metalness: 0.65,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: mode === 'mars' ? '#cbd5e1' : '#1e293b',
    roughness: 0.55,
    metalness: 0.2,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.85,
    metalness: 0.1,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#fbd3b6',
    roughness: 0.65,
    metalness: 0.02,
  });

  // Hip root sits at y = 0.78 so chubby legs reach y = 0 cleanly
  const hips = new THREE.Group();
  hips.position.y = 0.74;
  root.add(hips);

  // Pelvis (rounded chubby lower torso)
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), primaryMat);
  pelvis.scale.set(1.06, 0.72, 0.92);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Waist belt / seam
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.042, 10, 24), accentMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.08;
  belt.scale.set(1.04, 0.9, 1);
  hips.add(belt);

  // Torso (cute, rounded, slightly chubby proportions)
  const torso = new THREE.Group();
  torso.position.y = 0.12;
  hips.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.37, 24, 20), primaryMat);
  chest.scale.set(1.05, 1.05, 0.92);
  chest.position.y = 0.28;
  chest.castShadow = true;
  chest.receiveShadow = true;
  torso.add(chest);

  // NASA Insignia on RIGHT chest (character's right = -X in local facing +Z)
  const patchMat = new THREE.MeshBasicMaterial({
    map: getNasaTex(),
    transparent: true,
  });
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), patchMat);
  patch.position.set(-0.14, 0.36, 0.325);
  patch.rotation.y = -0.32;
  torso.add(patch);

  // Chest control module (Mars) or Front Zipper & Pockets (Earth)
  if (mode === 'mars') {
    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.09), trimMat);
    chestBox.position.set(0.05, 0.26, 0.33);
    chestBox.castShadow = true;
    torso.add(chestBox);

    const statusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.4 })
    );
    statusLed.position.set(0.11, 0.29, 0.375);
    torso.add(statusLed);

    // Joint collar ring
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 12, 24), trimMat);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.y = 0.56;
    torso.add(collarRing);
  } else {
    // Earth one-piece flight/research uniform: front zipper, structured collar, utility pockets
    const zipper = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.52, 0.03),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.2 })
    );
    zipper.position.set(0, 0.25, 0.34);
    torso.add(zipper);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.11, 20, 1, true), accentMat);
    collar.position.y = 0.58;
    torso.add(collar);

    // Side thigh/chest pockets
    const pocket1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.04), accentMat);
    pocket1.position.set(0.16, 0.22, 0.31);
    pocket1.rotation.y = 0.32;
    torso.add(pocket1);
  }

  // Mars Life-Support Backpack (PLSS)
  let backpack: THREE.Group | undefined;
  if (mode === 'mars') {
    backpack = new THREE.Group();
    backpack.position.set(0, 0.3, -0.34);
    torso.add(backpack);

    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.54, 0.24), primaryMat);
    packBody.castShadow = true;
    backpack.add(packBody);

    const packBevel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.27), accentMat);
    backpack.add(packBevel);

    // Dual oxygen tanks
    const tankGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.44, 14);
    const tankL = new THREE.Mesh(tankGeo, trimMat);
    tankL.position.set(-0.14, -0.02, -0.1);
    backpack.add(tankL);
    const tankR = new THREE.Mesh(tankGeo, trimMat);
    tankR.position.set(0.14, -0.02, -0.1);
    backpack.add(tankR);

    // Comms antenna
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.36, 8), trimMat);
    ant.position.set(0.18, 0.42, -0.04);
    backpack.add(ant);
    const antTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.5 })
    );
    antTip.position.set(0.18, 0.61, -0.04);
    backpack.add(antTip);
  }

  // Head group
  const head = new THREE.Group();
  head.position.set(0, 0.62, 0);
  torso.add(head);

  let visorMesh: THREE.Mesh | undefined;
  let visorMat: THREE.MeshPhysicalMaterial | undefined;

  if (mode === 'mars') {
    // Big adorable rounded helmet
    const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 24), primaryMat);
    helmetShell.position.y = 0.26;
    helmetShell.scale.set(1.02, 0.98, 1.02);
    helmetShell.castShadow = true;
    head.add(helmetShell);

    // Cute inner face visible behind clear/tinted visor!
    const innerHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), skinMat);
    innerHead.position.set(0, 0.25, 0.03);
    head.add(innerHead);

    // Expressive cute eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2 });
    const eyeShineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    [-0.075, 0.075].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), eyeMat);
      eye.position.set(ex, 0.27, 0.225);
      head.add(eye);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), eyeShineMat);
      shine.position.set(ex + 0.01, 0.282, 0.252);
      head.add(shine);
    });

    // Rosy cheeks
    const cheekMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.8 });
    [-0.125, 0.125].forEach((cx) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), cheekMat);
      cheek.scale.set(1.2, 0.7, 0.5);
      cheek.position.set(cx, 0.22, 0.21);
      head.add(cheek);
    });

    // Curved reflective visor
    visorMat = new THREE.MeshPhysicalMaterial({
      color: (SUIT_PALETTES[suitId] || SUIT_PALETTES.mars_artemis).visor,
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.45,
      clearcoat: 1.0,
    });
    visorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.315, 24, 20, -Math.PI * 0.38, Math.PI * 0.76, Math.PI * 0.22, Math.PI * 0.56),
      visorMat
    );
    visorMesh.position.set(0, 0.26, 0.055);
    visorMesh.rotation.y = Math.PI / 2;
    head.add(visorMesh);

    // Side helmet ear-pods
    [-0.33, 0.33].forEach((px) => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 16), accentMat);
      pod.rotation.z = Math.PI / 2;
      pod.position.set(px, 0.25, 0);
      head.add(pod);
    });
  } else {
    // Earth astronaut cute exposed head with hair and comm headset
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.265, 24, 20), skinMat);
    skull.position.y = 0.24;
    skull.castShadow = true;
    head.add(skull);

    // Stylized rounded hair cap
    const hairMat = new THREE.MeshStandardMaterial({ color: '#3b2618', roughness: 0.7 });
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.278, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hair.position.set(0, 0.26, -0.02);
    hair.rotation.x = -0.25;
    hair.castShadow = true;
    head.add(hair);

    // Cute expressive eyes & smile
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2 });
    const eyeShineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    [-0.085, 0.085].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), eyeMat);
      eye.position.set(ex, 0.25, 0.238);
      head.add(eye);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), eyeShineMat);
      shine.position.set(ex + 0.012, 0.265, 0.268);
      head.add(shine);
    });

    const cheekMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.85 });
    [-0.14, 0.14].forEach((cx) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), cheekMat);
      cheek.scale.set(1.2, 0.7, 0.5);
      cheek.position.set(cx, 0.19, 0.22);
      head.add(cheek);
    });

    // Comm headset
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.018, 8, 24, Math.PI), trimMat);
    headband.position.y = 0.26;
    head.add(headband);
    const micPod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), accentMat);
    micPod.rotation.z = Math.PI / 2;
    micPod.position.set(-0.27, 0.24, 0);
    head.add(micPod);
  }

  // Helper to build articulated rounded arms & legs
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.41, 0.44, 0);
    torso.add(shoulder);

    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), accentMat);
    shoulder.add(shoulderJoint);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.16, 8, 12), primaryMat);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);

    const elbowRing = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), trimMat);
    elbow.add(elbowRing);

    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.14, 8, 12), primaryMat);
    foreArm.position.y = -0.12;
    foreArm.castShadow = true;
    elbow.add(foreArm);

    // Properly proportioned chubby glove/hand
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 14, 12),
      mode === 'mars' ? accentMat : skinMat
    );
    hand.scale.set(0.95, 1.1, 0.85);
    hand.position.y = -0.25;
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  const carriedAnchor = new THREE.Group();
  carriedAnchor.position.set(0, 0.26, 0.56);
  torso.add(carriedAnchor);

  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.17, -0.05, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.18, 8, 14), primaryMat);
    thigh.position.y = -0.16;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.32;
    hip.add(knee);

    const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), trimMat);
    kneePad.position.z = 0.03;
    knee.add(kneePad);

    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.16, 8, 14), primaryMat);
    calf.position.y = -0.16;
    calf.castShadow = true;
    knee.add(calf);

    // Chunky astronaut boot (bottom sits cleanly at -0.37 relative to knee => total 0.74 from hips!)
    const bootUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.08, 8, 14), bootMat);
    bootUpper.rotation.x = Math.PI / 2;
    bootUpper.position.set(0, -0.3, 0.06);
    bootUpper.castShadow = true;
    knee.add(bootUpper);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.34), soleMat);
    sole.position.set(0, -0.34, 0.06);
    sole.castShadow = true;
    knee.add(sole);

    return { hip, knee };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  return {
    root,
    hips,
    torso,
    head,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    visorMesh,
    backpack,
    carriedAnchor,
    primaryMat,
    accentMat,
    trimMat,
    visorMat,
    mode,
  };
}

export function applyAstronautAppearance(
  rig: AstronautRig,
  suitId: SuitId,
  uniformId: UniformId
) {
  if (rig.mode === 'mars') {
    const pal = SUIT_PALETTES[suitId] || SUIT_PALETTES.mars_artemis;
    rig.primaryMat.color.set(pal.primary);
    rig.accentMat.color.set(pal.accent);
    if (rig.visorMat) rig.visorMat.color.set(pal.visor);
  } else {
    const pal = UNIFORM_PALETTES[uniformId] || UNIFORM_PALETTES.earth_navy;
    rig.primaryMat.color.set(pal.primary);
    rig.accentMat.color.set(pal.accent);
  }
}

export function animateAstronautRig(
  rig: AstronautRig,
  action: AstronautVitals['actionState'],
  speed: number,
  time: number,
  dt: number,
  actionProgress = 0, // 0..1 for pickup/eat/sleep
  grounded = true
) {
  const damp = (cur: number, target: number, lambda = 12) =>
    THREE.MathUtils.damp(cur, target, lambda, dt);

  // Target joint angles
  let hipY = 0.74;
  let torsoRotX = 0;
  let torsoRotY = 0;
  let hipsRotX = 0;
  let headRotY = 0;
  let headRotX = 0;

  let lHipX = 0;
  let lKneeX = 0;
  let rHipX = 0;
  let rKneeX = 0;

  let lShX = 0;
  let lShZ = 0.14;
  let lElX = -0.25;
  let rShX = 0;
  let rShZ = -0.14;
  let rElX = -0.25;

  if (action === 'sleep') {
    // 3-phase sleep sequence: enter bed (0..0.20), horizontal rest (0.20..0.72), wake & sit up (0.72..1.0)
    const p = THREE.MathUtils.clamp(actionProgress, 0, 1);
    let sleepBlend = 1;
    let wakeStretch = 0;
    if (p < 0.2) {
      sleepBlend = THREE.MathUtils.smoothstep(p / 0.2, 0, 1);
    } else if (p > 0.72) {
      const w = (p - 0.72) / 0.28;
      sleepBlend = 1 - THREE.MathUtils.smoothstep(w, 0, 1);
      wakeStretch = Math.sin(w * Math.PI);
    }
    hipY = THREE.MathUtils.lerp(0.74, 0.56, sleepBlend);
    hipsRotX = THREE.MathUtils.lerp(0, -Math.PI / 2, sleepBlend);
    torsoRotX = 0.05 * sleepBlend;
    headRotX = (0.12 + Math.sin(time * 1.4) * 0.03) * sleepBlend;
    lShX = -0.35 * wakeStretch;
    rShX = -0.35 * wakeStretch;
    lShZ = 0.14 + 0.14 * sleepBlend + 0.25 * wakeStretch;
    rShZ = -0.14 - 0.14 * sleepBlend - 0.25 * wakeStretch;
    lElX = -0.25 - 0.08 * sleepBlend;
    rElX = -0.25 - 0.08 * sleepBlend;
    lKneeX = 0.14 * sleepBlend + 0.22 * wakeStretch;
    rKneeX = 0.14 * sleepBlend + 0.22 * wakeStretch;
  } else if (action === 'pickup') {
    // Natural IK-like kneel & bend knees to pick up object (never awkward waist-only bend!)
    const kneel = Math.sin(Math.min(1, actionProgress) * Math.PI);
    hipY = 0.74 - kneel * 0.28;
    lHipX = -kneel * 0.95;
    lKneeX = kneel * 1.55;
    rHipX = -kneel * 0.65;
    rKneeX = kneel * 1.15;
    torsoRotX = kneel * 0.35;
    rShX = -kneel * 1.15;
    rElX = -0.2;
    lShX = -kneel * 0.35;
    headRotX = kneel * 0.3;
  } else if (action === 'eat') {
    // Eating animation: bring hand up to mouth gently
    const chew = Math.sin(time * 6) * 0.14;
    rShX = -1.25 + chew;
    rShZ = -0.35;
    rElX = -1.1 + chew;
    headRotX = 0.12 + Math.sin(time * 5) * 0.06;
    hipY = 0.74 + Math.sin(time * 2) * 0.015;
  } else if (action === 'operate' || action === 'decon') {
    const work = Math.sin(time * 5) * 0.18;
    lShX = -0.85 + work;
    rShX = -0.85 - work;
    lElX = -0.6;
    rElX = -0.6;
    headRotX = 0.15;
  } else if (!grounded) {
    // Jump / airborne pose
    hipY = 0.78;
    lHipX = -0.45;
    lKneeX = 0.75;
    rHipX = 0.25;
    rKneeX = 0.35;
    lShX = -0.8;
    rShX = -0.8;
    lShZ = 0.45;
    rShZ = -0.45;
  } else if (speed > 0.35) {
    // Smooth walking / running cycle with heel-toe lift & hip bob
    const isRun = speed > 5.2;
    const freq = isRun ? 11.5 : 7.8;
    const amp = isRun ? 0.85 : 0.56;
    const phase = time * freq;

    hipY = 0.74 + Math.abs(Math.sin(phase)) * (isRun ? 0.09 : 0.045);
    torsoRotX = isRun ? 0.18 : 0.07;
    torsoRotY = Math.sin(phase) * 0.08;

    lHipX = Math.sin(phase) * amp;
    rHipX = -Math.sin(phase) * amp;
    lKneeX = Math.max(0, -Math.cos(phase) * (isRun ? 1.15 : 0.75));
    rKneeX = Math.max(0, Math.cos(phase) * (isRun ? 1.15 : 0.75));

    lShX = -Math.sin(phase) * amp * 0.8;
    rShX = Math.sin(phase) * amp * 0.8;
    lElX = isRun ? -0.95 : -0.45;
    rElX = isRun ? -0.95 : -0.45;
    headRotY = Math.sin(phase * 0.5) * 0.05;
  } else {
    // Natural alive idle: gentle breathing, subtle weight shift, looking around
    hipY = 0.74 + Math.sin(time * 2.1) * 0.014;
    torsoRotY = Math.sin(time * 0.7) * 0.05;
    headRotY = Math.sin(time * 0.55) * 0.24;
    headRotX = Math.sin(time * 0.9) * 0.06;
    lShZ = 0.14 + Math.sin(time * 2.1) * 0.025;
    rShZ = -0.14 - Math.sin(time * 2.1) * 0.025;
  }

  rig.hips.position.y = damp(rig.hips.position.y, hipY, 14);
  rig.hips.rotation.x = damp(rig.hips.rotation.x, hipsRotX, 10);
  rig.torso.rotation.x = damp(rig.torso.rotation.x, torsoRotX, 12);
  rig.torso.rotation.y = damp(rig.torso.rotation.y, torsoRotY, 10);
  rig.head.rotation.y = damp(rig.head.rotation.y, headRotY, 8);
  rig.head.rotation.x = damp(rig.head.rotation.x, headRotX, 8);

  rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, lHipX, 14);
  rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, lKneeX, 14);
  rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, rHipX, 14);
  rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, rKneeX, 14);

  rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, lShX, 14);
  rig.leftShoulder.rotation.z = damp(rig.leftShoulder.rotation.z, lShZ, 12);
  rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, lElX, 14);

  rig.rightShoulder.rotation.x = damp(rig.rightShoulder.rotation.x, rShX, 14);
  rig.rightShoulder.rotation.z = damp(rig.rightShoulder.rotation.z, rShZ, 12);
  rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, rElX, 14);
}
