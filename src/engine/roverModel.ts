import * as THREE from 'three';
import { createSolarPanelTexture } from './textures';

export interface RoverRig {
  root: THREE.Group;
  chassis: THREE.Group;
  wheels: THREE.Mesh[];
  wheelPivots: THREE.Group[];
  headlights: THREE.SpotLight[];
  beaconLight: THREE.Mesh;
  mast: THREE.Group;
  cargoSlot: THREE.Group;
}

export function createRoverModel(): RoverRig {
  const root = new THREE.Group();
  root.name = 'MarsRover';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.32,
    metalness: 0.35,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: '#e86f3a',
    roughness: 0.35,
    metalness: 0.25,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.45,
    metalness: 0.72,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.85,
    metalness: 0.12,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#38bdf8',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
    clearcoat: 1,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    map: createSolarPanelTexture(),
    roughness: 0.25,
    metalness: 0.55,
  });

  const chassis = new THREE.Group();
  chassis.position.y = 0.72;
  root.add(chassis);

  // Main angled cabin hull
  const mainHull = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 3.1), bodyMat);
  mainHull.position.y = 0.24;
  mainHull.castShadow = true;
  mainHull.receiveShadow = true;
  chassis.add(mainHull);

  // Orange expedition trim bumper
  const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.24, 0.28), accentMat);
  bumperFront.position.set(0, -0.02, 1.56);
  chassis.add(bumperFront);

  const bumperRear = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.24, 0.28), accentMat);
  bumperRear.position.set(0, -0.02, -1.56);
  chassis.add(bumperRear);

  // Panoramic front windshield cabin
  const cabinTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.58, 1.45), bodyMat);
  cabinTop.position.set(0, 0.82, 0.35);
  cabinTop.castShadow = true;
  chassis.add(cabinTop);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.44, 0.18), glassMat);
  windshield.position.set(0, 0.82, 1.06);
  windshield.rotation.x = -0.28;
  chassis.add(windshield);

  // Rear solar deck & cargo bed
  const solarDeck = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.08, 1.1), solarMat);
  solarDeck.position.set(0, 0.64, -0.92);
  chassis.add(solarDeck);

  const cargoSlot = new THREE.Group();
  cargoSlot.position.set(0, 0.72, -0.92);
  chassis.add(cargoSlot);

  // Mast scanner
  const mast = new THREE.Group();
  mast.position.set(0.55, 1.12, 0.85);
  chassis.add(mast);

  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.62, 10), frameMat);
  mastPole.position.y = 0.3;
  mast.add(mastPole);

  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.18), bodyMat);
  camHead.position.y = 0.62;
  mast.add(camHead);

  const camLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: '#0ea5e9', emissive: '#38bdf8', emissiveIntensity: 1.2 })
  );
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0, 0.62, 0.1);
  mast.add(camLens);

  const beaconLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#facc15', emissiveIntensity: 1.4 })
  );
  beaconLight.position.set(-0.55, 1.16, 0.4);
  chassis.add(beaconLight);

  // Dual Working Headlights
  const headlights: THREE.SpotLight[] = [];
  [-0.62, 0.62].forEach((hx) => {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14),
      new THREE.MeshStandardMaterial({ color: '#fef9c3', emissive: '#fef08a', emissiveIntensity: 2 })
    );
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(hx, 0.25, 1.56);
    chassis.add(lamp);

    const spot = new THREE.SpotLight('#fef9c3', 3.5, 32, Math.PI / 5, 0.45, 1.2);
    spot.position.set(hx, 0.3, 1.58);
    spot.target.position.set(hx, -0.4, 9);
    chassis.add(spot);
    chassis.add(spot.target);
    headlights.push(spot);
  });

  // 6 Large Suspension Wheels (Rocker-Bogie style)
  const wheels: THREE.Mesh[] = [];
  const wheelPivots: THREE.Group[] = [];
  const wheelZ = [1.22, 0, -1.22];
  const wheelX = [-1.18, 1.18];

  for (const wz of wheelZ) {
    for (const wx of wheelX) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, 0.46, wz);
      root.add(pivot);

      // Visible suspension strut connecting wheel to chassis
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.11), frameMat);
      strut.position.set(wx < 0 ? 0.18 : -0.18, 0.18, 0);
      strut.rotation.z = wx < 0 ? 0.42 : -0.42;
      pivot.add(strut);

      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.32, 20), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      pivot.add(wheel);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 12), accentMat);
      hub.rotation.z = Math.PI / 2;
      pivot.add(hub);

      wheelPivots.push(pivot);
      wheels.push(wheel);
    }
  }

  return {
    root,
    chassis,
    wheels,
    wheelPivots,
    headlights,
    beaconLight,
    mast,
    cargoSlot,
  };
}

export function animateRoverRig(
  rig: RoverRig,
  speed: number,
  steer: number,
  time: number,
  dt: number,
  isNightOrStorm: boolean
) {
  // Spin wheels proportional to forward velocity
  const angularVel = speed / 0.46;
  rig.wheels.forEach((w) => {
    w.rotation.x += angularVel * dt;
  });

  // Front wheels steer in turn direction, rear wheels counter-steer slightly
  rig.wheelPivots.forEach((p, idx) => {
    const isFront = idx < 2;
    const isRear = idx >= 4;
    const targetSteer = isFront ? steer * 0.42 : isRear ? -steer * 0.22 : 0;
    p.rotation.y = THREE.MathUtils.damp(p.rotation.y, targetSteer, 12, dt);
  });

  // Subtle suspension bounce when driving
  const bounce = Math.abs(speed) > 0.4 ? Math.sin(time * 18) * 0.02 : 0;
  rig.chassis.position.y = THREE.MathUtils.damp(rig.chassis.position.y, 0.72 + bounce, 14, dt);
  rig.mast.rotation.y = Math.sin(time * 0.9) * 0.45;

  rig.headlights.forEach((spot) => {
    spot.intensity = isNightOrStorm ? 5.0 : 1.8;
  });
}
