import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CATALOGUE_ITEMS, EARTH_ROOMS, MARS_REGIONS } from '../data/catalogue';
import { LEVELS } from '../data/levels';
import { findMuseumExhibitById } from '../data/nasaExhibition';
import { soundEngine } from '../audio/soundEngine';
import {
  ActiveHazardType,
  ActiveInteractionInfo,
  ActiveMiniGame,
  AstronautVitals,
  AudioVolumes,
  BuildingType,
  CatalogueItem,
  EarthLogisticsState,
  ExhibitInfo,
  GameNotification,
  GameScreen,
  HudSnapshot,
  LevelObjectiveStep,
  MarsCapsuleState,
  MeteoriteSite,
  MissionSequenceStage,
  PlacedBuilding,
  PlacementPreviewState,
  ResourcesState,
  RoadSegment,
  RoboticPet,
  SuitId,
  UniformId,
  WorldId,
} from '../types/game';
import {
  animateAstronautRig,
  applyAstronautAppearance,
  AstronautRig,
  createAstronautModel,
} from './astronautModel';
import { createEarthFacility, EarthFacilityHandle } from './earthFacility';
import {
  BuildingMeshHandle,
  createBuildingMesh,
  createPlacementPreviewMesh,
  createRoadMesh,
  doBuildingFootprintsOverlap,
  doesBuildingOverlapCircle,
  getBuildingFootprint,
  isPointInsideBuildingFootprint,
  localToWorldXZ,
  PlacementPose,
  setPlacementPreviewValidity,
} from './marsBuildings';
import { MarsTerrainManager } from './marsTerrain';
import { animatePetRig, createPetModel, PetRig } from './petModel';
import { animateRoverRig, createRoverModel, RoverRig } from './roverModel';
import { createMarsPlanetTexture, setTextureMaxAnisotropy } from './textures';

const SAVE_KEY = 'outpost_zero_save_v1';

// Pre-allocated math helpers outside render loop (zero GC!)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

interface ActiveTimedInteraction {
  world: WorldId;
  kind: 'sleep' | 'eat' | 'operate' | 'pickup' | 'decon';
  label: string;
  actionState: AstronautVitals['actionState'];
  elapsed: number;
  duration: number;
  enterEnd: number;
  exitStart: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetYaw: number;
  exitPos: THREE.Vector3;
  exitYaw: number;
  cancelable: boolean;
  onComplete?: () => void;
}

export class OutpostGameEngine {
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;
  private marsScene = new THREE.Scene();
  private earthScene = new THREE.Scene();
  private titleScene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  // Lighting
  private marsSun!: THREE.DirectionalLight;
  private marsHemi!: THREE.HemisphereLight;
  private marsFog!: THREE.FogExp2;

  // World Managers
  private marsTerrain!: MarsTerrainManager;
  private marsAstronaut!: AstronautRig;
  private earthAstronaut!: AstronautRig;
  private roverRig!: RoverRig;
  private earthFacility!: EarthFacilityHandle;
  private titlePlanet!: THREE.Mesh;
  private titleAstro!: AstronautRig;

  private buildingHandles = new Map<string, BuildingMeshHandle>();
  private roadGroup = new THREE.Group();
  private discoveryNodesGroup = new THREE.Group();
  private meteoriteGroup = new THREE.Group();
  private petRigs = new Map<string, PetRig>();
  private placementGhostGroup: THREE.Group | null = null;
  private pendingRoadLine: THREE.Line | null = null;

  // Input & Third-Person Camera State
  private keys: Record<string, boolean> = {};
  private camYaw = 0;
  private camPitch = 0.25;
  private camDist = 5.4;
  private smoothedCamDist = 5.4;
  private isCameraDragging = false;
  private reverseTargetYaw: number | null = null;
  private wasPressingReverse = false;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;
  private mouseDownClientPos: { x: number; y: number } | null = null;
  private raycaster = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2();

  // Simulation State
  private screen: GameScreen = 'title';
  private activeWorld: WorldId = 'mars';
  private currentLevel = 1;
  private simTime = 0;
  private simDay = 1;
  private timeOfDay = 0.28; // Morning golden sun
  private sustainabilityTimer = 0;
  private sustainabilityDays = 0;

  private marsPos = new THREE.Vector3(0, 0, 2.5);
  private marsVel = new THREE.Vector3();
  private marsYaw = Math.PI;
  private marsGrounded = true;
  private deconTimer = 0;

  private earthPos = new THREE.Vector3(-2, 0, 2);
  private earthVel = new THREE.Vector3();
  private earthYaw = Math.PI;
  private earthGrounded = true;
  private activeInteraction: ActiveTimedInteraction | null = null;

  private roverPos = new THREE.Vector3(10, 0, -20);
  private roverYaw = -0.5;
  private roverSpeed = 0;
  private roverSteer = 0;
  private roverUnlocked = false;

  private marsVitals: AstronautVitals = {
    energy: 92,
    hunger: 88,
    carryingItem: null,
    insideBuildingId: null,
    inRover: false,
    actionState: 'idle',
  };
  private earthVitals: AstronautVitals = {
    energy: 100,
    hunger: 100,
    carryingItem: null,
    insideBuildingId: null,
    inRover: false,
    actionState: 'idle',
  };

  private resources: ResourcesState = {
    water: 78,
    oxygen: 84,
    food: 82,
    electricity: 80,
    fuel: 65,
    battery: 75,
    materials: 60,
    waste: 12,
    coins: 260,
    xp: 0,
    mealsStored: 4,
    rawCrops: 1,
    samplesCollected: 0,
  };

  private equippedMarsSuit: SuitId = 'mars_artemis';
  private equippedEarthUniform: UniformId = 'earth_navy';
  private ownedItems = new Set<string>(['suit_artemis', 'uniform_navy', 'uniform_white']);

  private buildings: PlacedBuilding[] = [];
  private roads: RoadSegment[] = [];
  private pets: RoboticPet[] = [];
  private meteorites: MeteoriteSite[] = [];
  private discoveries: { id: string; x: number; z: number; collected: boolean; mesh: THREE.Mesh }[] = [];

  private activeHazard: ActiveHazardType = 'none';
  private hazardTimer = 0;
  private nextHazardCooldown = 55;
  private launchCinematicTimer = 0;

  private missionStage: MissionSequenceStage = 'earth_prep';
  private tutorialHint: string | null = 'Collect 3 parts in Inventory & load the Trolley.';
  private activeExhibit: ExhibitInfo | null = null;
  private inspectedExhibitIds = new Set<string>();
  private discoveredRegionIds = new Set<string>(['colony_basin']);
  private marsTargetBeacon!: THREE.Group;

  private earthLogistics: EarthLogisticsState = this.createFreshLogistics(1);
  private marsCapsule: MarsCapsuleState = {
    inTransit: false,
    arrived: false,
    alarmActive: false,
    unlocked: false,
    contentsRetrieved: false,
    unlockCost: 40,
    payloadName: LEVELS[0].requiredPrototype,
    deconPassed: false,
    sterilisationSampleDone: false,
  };
  private levelObjectives: LevelObjectiveStep[] = [];
  private notifications: GameNotification[] = [];
  private activeMiniGame: ActiveMiniGame | null = null;
  private speechBubble: { text: string; world: WorldId; expiresAt: number } | null = null;

  private relocatingBuildingId: string | null = null;
  private placementPreview: PlacementPreviewState | null = null;
  private roadBuildMode: 'none' | 'select_grade' | 'ready_pave' = 'none';
  private pendingRoadPoints: [number, number, number][] = [];
  private selectedMapTarget: { x: number; z: number; label: string } | null = null;

  private nearbyPrompt: { label: string; key: string; actionId: string } | null = null;
  private nearbyExhibit: ExhibitInfo | null = null;
  private lastHudPush = 0;
  private onHudUpdate: (snap: HudSnapshot) => void;

  // Touch virtual joystick
  private touchMoveVec = { x: 0, y: 0 };

  constructor(private container: HTMLElement, onHudUpdate: (snap: HudSnapshot) => void) {
    this.onHudUpdate = onHudUpdate;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    setTextureMaxAnisotropy(this.renderer);

    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      58,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.15,
      450
    );

    // Mandatory studio environment reflection on every scene
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.marsScene.environment = envTex;
    this.earthScene.environment = envTex;
    this.titleScene.environment = envTex;

    this.setupTitleScene();
    this.setupMarsScene();
    this.setupEarthScene();
    this.initNewCampaignState(false);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.marsScene, this.camera);
    }

    this.bindEvents();
    this.pushHud(true);
    this.tick();
  }

  private setupTitleScene() {
    this.titleScene.background = new THREE.Color('#0c1220');
    this.titleScene.fog = new THREE.FogExp2('#0c1220', 0.018);

    const sun = new THREE.DirectionalLight('#ffdfb8', 2.2);
    sun.position.set(10, 12, 10);
    this.titleScene.add(sun);
    this.titleScene.add(new THREE.HemisphereLight('#7dd3fc', '#3b251c', 0.85));

    // Rotating Mars Sphere Backdrop
    const marsTex = createMarsPlanetTexture();
    this.titlePlanet = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 48, 36),
      new THREE.MeshStandardMaterial({ map: marsTex, roughness: 0.78 })
    );
    this.titlePlanet.position.set(3.2, 0.4, -7.5);
    this.titleScene.add(this.titlePlanet);

    // Starfield
    const starCount = 450;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 2] = -15 - Math.random() * 35;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.titleScene.add(
      new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#e2e8f0', size: 0.14 }))
    );

    // Hero Cute Astronaut on Title Diorama Pad
    this.titleAstro = createAstronautModel('mars', 'mars_artemis', 'earth_navy');
    this.titleAstro.root.position.set(-2.3, -1.35, -3.2);
    this.titleAstro.root.rotation.y = 0.48;
    this.titleAstro.root.scale.setScalar(1.35);
    this.titleScene.add(this.titleAstro.root);
  }

  private setupMarsScene() {
    // Balanced natural Martian sky & fog (warm dusty peach-amber, never harsh neon red!)
    this.marsScene.background = new THREE.Color('#d9b498');
    this.marsFog = new THREE.FogExp2('#d9b498', 0.0042);
    this.marsScene.fog = this.marsFog;

    this.marsHemi = new THREE.HemisphereLight('#b5c8dc', '#9b644b', 0.85);
    this.marsScene.add(this.marsHemi);

    this.marsSun = new THREE.DirectionalLight('#ffe4c4', 2.0);
    this.marsSun.position.set(45, 65, 35);
    this.marsSun.castShadow = !this.isSoftwareGl;
    this.marsSun.shadow.mapSize.set(2048, 2048);
    const d = 55;
    this.marsSun.shadow.camera.left = -d;
    this.marsSun.shadow.camera.right = d;
    this.marsSun.shadow.camera.top = d;
    this.marsSun.shadow.camera.bottom = -d;
    this.marsSun.shadow.camera.near = 2;
    this.marsSun.shadow.camera.far = 180;
    this.marsSun.shadow.bias = -0.0005;
    this.marsSun.shadow.normalBias = 0.02;
    this.marsScene.add(this.marsSun);
    this.marsScene.add(this.marsSun.target);

    this.marsTerrain = new MarsTerrainManager(this.marsScene);
    this.marsScene.add(this.roadGroup);
    this.marsScene.add(this.discoveryNodesGroup);
    this.marsScene.add(this.meteoriteGroup);

    this.marsAstronaut = createAstronautModel('mars', this.equippedMarsSuit, this.equippedEarthUniform);
    this.marsScene.add(this.marsAstronaut.root);

    this.roverRig = createRoverModel();
    this.marsScene.add(this.roverRig.root);

    // 3D Glowing Waypoint Beacon for Mars objectives & return-to-base navigation
    this.marsTargetBeacon = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.85, 28),
      new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.9, 12),
      new THREE.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.85 })
    );
    beam.rotation.x = Math.PI;
    beam.position.y = 3.6;
    this.marsTargetBeacon.add(ring, beam);
    this.marsTargetBeacon.visible = false;
    this.marsScene.add(this.marsTargetBeacon);
  }

  private setupEarthScene() {
    this.earthScene.background = new THREE.Color('#c8dff0');
    this.earthScene.fog = new THREE.FogExp2('#c8dff0', 0.0035);

    this.earthScene.add(new THREE.HemisphereLight('#e0f2fe', '#94a3b8', 0.95));
    const sun = new THREE.DirectionalLight('#fffbeb', 1.85);
    sun.position.set(28, 48, 26);
    sun.castShadow = !this.isSoftwareGl;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 48;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    this.earthScene.add(sun);

    this.earthFacility = createEarthFacility();
    this.earthScene.add(this.earthFacility.group);

    this.earthAstronaut = createAstronautModel('earth', this.equippedMarsSuit, this.equippedEarthUniform);
    this.earthScene.add(this.earthAstronaut.root);
  }

  private createFreshLogistics(lvl: number): EarthLogisticsState {
    const def = LEVELS[Math.min(LEVELS.length - 1, lvl - 1)];
    return {
      stage: 'collect_parts',
      requiredParts: [...def.requiredParts],
      collectedParts: [],
      trolleyPos: [-14, 0, 1.5],
      trolleyAttached: false,
      partsOnTrolley: [],
      partsAtBench: [],
      prototypeName: def.requiredPrototype,
      prototypeReady: false,
      testProgress: 0,
      testActive: false,
      testComplete: false,
      carryingPrototype: false,
      capsuleLoaded: false,
      capsuleLocked: false,
      rocketLaunchProgress: 0,
      rocketLaunched: false,
    };
  }

  public initNewCampaignState(loadSaved = true) {
    if (loadSaved) {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          this.currentLevel = data.currentLevel ?? 1;
          this.simDay = data.simDay ?? 1;
          this.resources = { ...this.resources, ...data.resources };
          this.equippedMarsSuit = data.equippedMarsSuit ?? 'mars_artemis';
          this.equippedEarthUniform = data.equippedEarthUniform ?? 'earth_navy';
          this.ownedItems = new Set(data.ownedItems ?? ['suit_artemis', 'uniform_navy', 'uniform_white']);
          const loadedBuildings: PlacedBuilding[] = (data.buildings ?? this.getDefaultBuildings()).map(
            (b: PlacedBuilding) => ({
              ...b,
              hasInterior: b.type !== 'solar_array' && b.type !== 'landing_port',
              footprintRadius: getBuildingFootprint(b.type).boundingRadius,
            })
          );
          // Migrate legacy default positions cleanly so enlarged Dormitory doesn't clip legacy Warehouse
          const legacyWh = loadedBuildings.find((b) => b.id === 'warehouse_main');
          if (legacyWh && legacyWh.position[0] === 16 && legacyWh.position[2] === 0) {
            legacyWh.position = [20, 0, 0];
          }
          const legacyDorm = loadedBuildings.find((b) => b.id === 'dorm_main');
          if (legacyDorm && legacyDorm.position[0] === 0 && legacyDorm.position[2] === -12) {
            legacyDorm.position = [0, 0, -14];
          }
          const legacyPort = loadedBuildings.find((b) => b.id === 'landing_port');
          if (legacyPort && legacyPort.position[0] === 38 && legacyPort.position[2] === -28) {
            legacyPort.position = [44, 0, -30];
          }
          this.buildings = loadedBuildings;
          this.roads = data.roads ?? [];
          this.pets = data.pets ?? [];
          this.meteorites = data.meteorites ?? [];
          this.roverUnlocked = data.roverUnlocked ?? this.currentLevel >= 9;
          this.missionStage = data.missionStage ?? 'earth_prep';
          this.discoveredRegionIds = new Set(data.discoveredRegionIds ?? ['colony_basin']);
          if (data.audioVolumes) {
            soundEngine.setChannelVolume('ambience', data.audioVolumes.ambience ?? 0.45);
            soundEngine.setChannelVolume('effects', data.audioVolumes.effects ?? 0.75);
            soundEngine.setChannelVolume('alerts', data.audioVolumes.alerts ?? 0.6);
          }
          this.activeInteraction = null;
          this.reverseTargetYaw = null;
          this.wasPressingReverse = false;
          this.activeWorld = data.activeWorld === 'earth' ? 'earth' : 'mars';
          if (typeof data.timeOfDay === 'number') this.timeOfDay = data.timeOfDay;
          if (data.marsVitals) {
            this.marsVitals = {
              ...this.marsVitals,
              ...data.marsVitals,
              inRover: false,
              actionState: 'idle',
            };
          } else {
            this.marsVitals.inRover = false;
            this.marsVitals.actionState = 'idle';
          }
          if (data.earthVitals) {
            this.earthVitals = {
              ...this.earthVitals,
              ...data.earthVitals,
              inRover: false,
              actionState: 'idle',
            };
          } else {
            this.earthVitals.actionState = 'idle';
          }
          if (Array.isArray(data.marsPos) && data.marsPos.length === 3) {
            this.marsPos.set(data.marsPos[0], data.marsPos[1], data.marsPos[2]);
          }
          if (Array.isArray(data.earthPos) && data.earthPos.length === 3) {
            this.earthPos.set(data.earthPos[0], data.earthPos[1], data.earthPos[2]);
          }
          this.marsYaw = typeof data.marsYaw === 'number' ? data.marsYaw : Math.PI;
          this.earthYaw = typeof data.earthYaw === 'number' ? data.earthYaw : Math.PI;
          this.marsVel.set(0, 0, 0);
          this.earthVel.set(0, 0, 0);
          this.marsGrounded = true;
          this.earthGrounded = true;
          const activeYaw = this.activeWorld === 'mars' ? this.marsYaw : this.earthYaw;
          this.camYaw = this.normalizeAngle(activeYaw + Math.PI);
          this.camPitch = 0.25;
          this.loadLevelSetup(this.currentLevel, data.levelObjectives, data.earthLogistics, data.marsCapsule);
          this.rebuildMarsWorldMeshes();
          // Critical safeguard: never restore player inside a bed, furniture, or wall collider
          this.ensureSafeMarsStandingPos(this.marsPos);
          this.ensureSafeEarthStandingPos(this.earthPos);
          this.syncMarsInteriorVisibility();
          return;
        }
      } catch {
        // Fallback to fresh campaign
      }
    }

    this.currentLevel = 1;
    this.simDay = 1;
    this.timeOfDay = 0.28;
    this.resources = {
      water: 78,
      oxygen: 84,
      food: 82,
      electricity: 80,
      fuel: 65,
      battery: 75,
      materials: 60,
      waste: 12,
      coins: 260,
      xp: 0,
      mealsStored: 4,
      rawCrops: 1,
      samplesCollected: 0,
    };
    this.marsVitals = {
      energy: 92,
      hunger: 88,
      carryingItem: null,
      insideBuildingId: null,
      inRover: false,
      actionState: 'idle',
    };
    this.earthVitals = {
      energy: 100,
      hunger: 100,
      carryingItem: null,
      insideBuildingId: null,
      inRover: false,
      actionState: 'idle',
    };
    this.equippedMarsSuit = 'mars_artemis';
    this.equippedEarthUniform = 'earth_navy';
    this.ownedItems = new Set(['suit_artemis', 'uniform_navy', 'uniform_white']);
    this.buildings = this.getDefaultBuildings();
    this.roads = [];
    this.pets = [];
    this.meteorites = [];
    this.roverUnlocked = false;
    this.missionStage = 'earth_prep';
    this.discoveredRegionIds = new Set(['colony_basin']);
    this.inspectedExhibitIds.clear();
    this.activeExhibit = null;
    this.activeInteraction = null;
    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;
    this.marsPos.set(0, 0, 2.5);
    this.marsYaw = Math.PI;
    this.marsVel.set(0, 0, 0);
    this.marsGrounded = true;
    this.earthPos.set(-2, 0, 2);
    this.earthYaw = Math.PI;
    this.earthVel.set(0, 0, 0);
    this.earthGrounded = true;
    this.camYaw = 0;
    this.camPitch = 0.25;
    this.camDist = 5.4;
    this.smoothedCamDist = 5.4;
    this.roverPos.set(14, 0, -24);
    this.loadLevelSetup(1);
    this.rebuildMarsWorldMeshes();
  }

  private getDefaultBuildings(): PlacedBuilding[] {
    return [
      {
        id: 'dorm_main',
        type: 'dormitory',
        name: 'Colony Dormitory',
        position: [0, 0, -14],
        rotationY: 0,
        level: 1,
        protectedFromMove: true,
        dustLevel: 0,
        damaged: false,
        hasInterior: true,
        footprintRadius: getBuildingFootprint('dormitory').boundingRadius,
      },
      {
        id: 'warehouse_main',
        type: 'warehouse',
        name: 'Colony Warehouse',
        position: [20, 0, 0],
        rotationY: -Math.PI / 2,
        level: 1,
        dustLevel: 0,
        damaged: false,
        hasInterior: true,
        footprintRadius: getBuildingFootprint('warehouse').boundingRadius,
      },
      {
        id: 'landing_port',
        type: 'landing_port',
        name: 'Mars Landing Station',
        position: [44, 0, -30],
        rotationY: -Math.PI * 0.38,
        level: 1,
        protectedFromMove: true,
        dustLevel: 0,
        damaged: false,
        hasInterior: false,
        footprintRadius: getBuildingFootprint('landing_port').boundingRadius,
      },
    ];
  }

  private loadLevelSetup(
    lvl: number,
    savedObjectives?: LevelObjectiveStep[],
    savedLogistics?: EarthLogisticsState,
    savedCapsule?: MarsCapsuleState
  ) {
    const def = LEVELS[Math.min(LEVELS.length - 1, lvl - 1)];
    this.currentLevel = lvl;
    this.roverUnlocked = this.roverUnlocked || lvl >= 9;

    if (savedObjectives && savedObjectives.length > 0) {
      this.levelObjectives = savedObjectives;
    } else {
      this.levelObjectives = [
        ...def.earthSteps.map((s) => ({ ...s, completed: false })),
        ...def.marsSteps.map((s) => ({ ...s, completed: false })),
      ];
      this.missionStage = 'earth_prep';
      this.tutorialHint = `Level ${lvl}: Prepare ${def.requiredPrototype} on Earth or explore Mars.`;
    }

    this.earthLogistics = savedLogistics || this.createFreshLogistics(lvl);
    this.marsCapsule = savedCapsule || {
      inTransit: false,
      arrived: false,
      alarmActive: false,
      unlocked: false,
      contentsRetrieved: false,
      unlockCost: 35 + lvl * 10,
      payloadName: def.requiredPrototype,
      deconPassed: false,
      sterilisationSampleDone: false,
    };

    // Level-specific world events
    if (lvl === 10 && this.meteorites.every((m) => m.collected)) {
      this.spawnRandomMeteorite();
    }
    if (lvl === 11 && this.activeHazard === 'none') {
      this.triggerHazard('dust_storm');
    }
    if (lvl === 14 && this.activeHazard === 'none') {
      this.triggerHazard('radiation_alert');
    }
    if (lvl === 18 && this.pets.length > 0) {
      this.triggerRarePetRescue();
    }

    // Spawn surface geological discoveries for early exploration
    this.spawnSurfaceDiscoveries();
    this.syncEarthFacilityVisuals();
  }

  private spawnSurfaceDiscoveries() {
    while (this.discoveryNodesGroup.children.length > 0) {
      this.discoveryNodesGroup.remove(this.discoveryNodesGroup.children[0]);
    }
    this.discoveries = [];
    const spots: [number, number][] = [
      [-12, 12],
      [-26, 20],
      [18, 22],
      [-55, 45],
      [10, -90],
      [85, 75],
    ];
    spots.forEach(([x, z], idx) => {
      const y = this.marsTerrain.groundHeightAt(x, z);
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        new THREE.MeshStandardMaterial({
          color: idx === 4 ? '#38bdf8' : '#f59e0b',
          emissive: idx === 4 ? '#0284c7' : '#d97706',
          emissiveIntensity: 0.7,
          roughness: 0.3,
        })
      );
      mesh.position.set(x, y + 0.55, z);
      mesh.castShadow = true;
      this.discoveryNodesGroup.add(mesh);
      this.discoveries.push({ id: `disc_${idx}`, x, z, collected: false, mesh });
    });
  }

  public spawnRandomMeteorite() {
    // Randomize location across valid planetary terrain (never inside buildings or landing port!)
    let mx = 0;
    let mz = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 48 + Math.random() * 68;
      mx = Math.round(Math.cos(angle) * dist);
      mz = Math.round(Math.sin(angle) * dist);
      const tooClose = this.buildings.some(
        (b) => Math.hypot(b.position[0] - mx, b.position[2] - mz) < 18
      );
      if (!tooClose) break;
    }
    const my = this.marsTerrain.groundHeightAt(mx, mz);
    const site: MeteoriteSite = {
      id: `met_${Date.now()}`,
      x: mx,
      z: mz,
      y: my,
      discoveredAtDay: this.simDay,
      collected: false,
      sampleCount: 3,
    };
    this.meteorites.push(site);
    this.rebuildMeteoriteMeshes();
    this.addNotification('meteor', `Meteorite impact detected at (${mx}, ${mz})!`, 'alert');
    soundEngine.playSoftMissionAlert();
  }

  private rebuildMeteoriteMeshes() {
    while (this.meteoriteGroup.children.length > 0) {
      this.meteoriteGroup.remove(this.meteoriteGroup.children[0]);
    }
    for (const m of this.meteorites) {
      if (m.collected) continue;
      const g = new THREE.Group();
      g.position.set(m.x, m.y, m.z);

      const craterRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.45, 8, 24),
        new THREE.MeshStandardMaterial({ color: '#6b4c3e', roughness: 0.92 })
      );
      craterRing.rotation.x = Math.PI / 2;
      craterRing.position.y = 0.1;
      g.add(craterRing);

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.95, 1),
        new THREE.MeshStandardMaterial({
          color: '#334155',
          emissive: '#f97316',
          emissiveIntensity: 0.55,
          roughness: 0.55,
          metalness: 0.5,
        })
      );
      rock.position.y = 0.6;
      rock.castShadow = true;
      g.add(rock);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 16, 8),
        new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.35 })
      );
      beacon.position.y = 8;
      g.add(beacon);

      this.meteoriteGroup.add(g);
    }
  }

  private rebuildMarsWorldMeshes() {
    // Update graded terrain pads & roads first using tight accurate grading radii
    const pads = this.buildings.map((b) => ({
      x: b.position[0],
      z: b.position[2],
      radius: getBuildingFootprint(b.type).gradingRadius,
      targetY: this.marsTerrain.rawHeightAt(b.position[0], b.position[2]),
    }));
    this.marsTerrain.setGradedData(pads, this.roads);

    // Visually hide any decorative surface shrubs/plants overlapped by placed buildings
    this.marsTerrain.updateHiddenVegetation((vx, vz) =>
      this.buildings.some((b) => isPointInsideBuildingFootprint(b, vx, vz, 0.25))
    );

    // Sync building meshes
    for (const h of this.buildingHandles.values()) {
      this.marsScene.remove(h.root);
    }
    this.buildingHandles.clear();
    for (const b of this.buildings) {
      b.position[1] = this.marsTerrain.groundHeightAt(b.position[0], b.position[2]);
      const handle = createBuildingMesh(b);
      this.marsScene.add(handle.root);
      this.buildingHandles.set(b.id, handle);
    }

    // Sync roads
    while (this.roadGroup.children.length > 0) {
      this.roadGroup.remove(this.roadGroup.children[0]);
    }
    for (const r of this.roads) {
      this.roadGroup.add(createRoadMesh(r, (x, z) => this.marsTerrain.groundHeightAt(x, z)));
    }

    // Sync pets
    for (const pr of this.petRigs.values()) {
      this.marsScene.remove(pr.root);
    }
    this.petRigs.clear();
    for (const p of this.pets) {
      const rig = createPetModel(p.species, p.color, p.accentColor);
      rig.root.position.set(p.position[0], p.position[1], p.position[2]);
      this.marsScene.add(rig.root);
      this.petRigs.set(p.id, rig);
    }

    this.rebuildMeteoriteMeshes();
    applyAstronautAppearance(this.marsAstronaut, this.equippedMarsSuit, this.equippedEarthUniform);
    applyAstronautAppearance(this.earthAstronaut, this.equippedMarsSuit, this.equippedEarthUniform);
  }

  private syncEarthFacilityVisuals() {
    const f = this.earthFacility;
    const log = this.earthLogistics;

    // Room lock doors (each room can have multiple doorway barriers)
    for (const room of EARTH_ROOMS) {
      const doors = f.roomLockDoors.get(room.id);
      if (doors) {
        const locked = this.currentLevel < room.unlockLevel;
        for (const d of doors) {
          d.visible = locked;
        }
      }
    }

    // Inventory part pickups visibility
    f.partPickups.forEach((p, idx) => {
      const partName = log.requiredParts[idx];
      const alreadyPicked =
        log.collectedParts.includes(partName) ||
        log.partsOnTrolley.includes(partName) ||
        log.partsAtBench.includes(partName) ||
        log.prototypeReady;
      p.visible = log.stage === 'collect_parts' && !alreadyPicked;
    });

    // Trolley position & parts on trolley
    f.trolleyGroup.position.set(log.trolleyPos[0], log.trolleyPos[1], log.trolleyPos[2]);
    while (f.trolleyPartsGroup.children.length > 0) {
      f.trolleyPartsGroup.remove(f.trolleyPartsGroup.children[0]);
    }
    log.partsOnTrolley.forEach((_, i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.24, 0.28),
        new THREE.MeshStandardMaterial({ color: ['#38bdf8', '#f59e0b', '#22c55e'][i % 3] })
      );
      box.position.set((i - 1) * 0.35, 0, 0);
      f.trolleyPartsGroup.add(box);
    });

    // Bench parts & prototype visibility
    while (f.benchPartsGroup.children.length > 0) {
      f.benchPartsGroup.remove(f.benchPartsGroup.children[0]);
    }
    if (!log.prototypeReady) {
      log.partsAtBench.forEach((_, i) => {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.24, 0.28),
          new THREE.MeshStandardMaterial({ color: ['#38bdf8', '#f59e0b', '#22c55e'][i % 3] })
        );
        box.position.set((i - 1) * 0.45, 0, 0);
        f.benchPartsGroup.add(box);
      });
    }

    f.prototypeOnBench.visible = log.prototypeReady && log.stage === 'assemble_prototype';
    f.prototypeOnTester.visible = log.stage === 'test_prototype' && (log.testActive || log.testComplete);

    // Capsule door & rocket position
    f.capsuleDoor.position.y = log.capsuleLocked ? 1.8 : 0.4;
    f.capsuleDoor.scale.y = log.capsuleLocked ? 1 : 0.2;
    f.rocketExhaust.visible = log.rocketLaunchProgress > 0 && log.rocketLaunchProgress < 1;
    f.rocketGroup.position.y = 0.25 + log.rocketLaunchProgress * 55;
  }

  // PUBLIC GAMEPLAY API FOR REACT UI
  public startGame(continueSave = false) {
    soundEngine.playUiClick();
    if (!continueSave) {
      this.initNewCampaignState(false);
    } else {
      this.initNewCampaignState(true);
    }
    this.clearMovementInputs();
    this.activeInteraction = null;
    this.screen = 'playing';
    const yaw = this.activeWorld === 'mars' ? this.marsYaw : this.earthYaw;
    this.camYaw = this.normalizeAngle(yaw + Math.PI);
    this.camPitch = 0.25;
    soundEngine.updateWorldAmbience(this.activeWorld, true);
    this.addNotification('info', 'Level 1: Explore Mars & prep the Water Filtration Capsule on Earth!', 'info');
    this.pushHud(true);
  }

  public hasSaveGame(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  public setScreen(screen: GameScreen) {
    this.screen = screen;
    this.clearMovementInputs();
    if (screen !== 'playing' && this.activeInteraction) {
      this.cancelActiveInteraction(true);
    }
    soundEngine.updateWorldAmbience(this.activeWorld, screen === 'playing');
    this.pushHud(true);
  }

  public switchWorld(world: WorldId) {
    if (this.activeWorld === world) return;
    soundEngine.playUiClick();
    if (this.activeInteraction) {
      this.cancelActiveInteraction(true);
    }
    this.clearMovementInputs();
    if (world !== 'mars' && this.placementPreview) {
      this.clearPlacementPreviewState();
    }
    this.activeWorld = world;
    this.activeExhibit = null;
    this.marsVitals.inRover = false;
    this.marsVel.set(0, 0, 0);
    this.earthVel.set(0, 0, 0);
    this.ensureSafeMarsStandingPos(this.marsPos);
    this.ensureSafeEarthStandingPos(this.earthPos);
    const yaw = world === 'mars' ? this.marsYaw : this.earthYaw;
    this.camYaw = this.normalizeAngle(yaw + Math.PI);
    this.camPitch = 0.25;
    soundEngine.stopRoverEngine();
    soundEngine.updateWorldAmbience(world, this.screen === 'playing');
    this.pushHud(true);
  }

  public setMuted(muted: boolean) {
    soundEngine.setMuted(muted);
    if (!muted) {
      soundEngine.updateWorldAmbience(this.activeWorld, this.screen === 'playing');
    }
    this.pushHud(true);
  }

  public setVolume(vol: number) {
    soundEngine.setVolume(vol);
    this.pushHud(true);
  }

  public setChannelVolume(channel: keyof AudioVolumes, val: number) {
    soundEngine.setChannelVolume(channel, val);
    this.saveGame();
    this.pushHud(true);
  }

  public openExhibitById(id: string) {
    const info =
      findMuseumExhibitById(id) || this.earthFacility.exhibits.find((e) => e.id === id)?.info;
    if (!info) return;
    this.clearMovementInputs();
    this.activeExhibit = info;
    if (!this.inspectedExhibitIds.has(info.id)) {
      this.inspectedExhibitIds.add(info.id);
      this.resources.xp += 15;
      this.resources.coins += 10;
    }
    soundEngine.playGentleNotif();
    this.saveGame();
    this.pushHud(true);
  }

  public closeExhibit() {
    this.activeExhibit = null;
    this.clearMovementInputs();
    soundEngine.playUiClick();
    this.pushHud(true);
  }

  public selectMapTarget(x: number, z: number, label: string) {
    soundEngine.playUiClick();
    this.selectedMapTarget = { x, z, label };
    this.pushHud(true);
  }

  public clearMapTarget() {
    this.selectedMapTarget = null;
    this.pushHud(true);
  }

  public callPets() {
    soundEngine.playUiClick();
    for (const p of this.pets) {
      if (p.state !== 'charging_sleeping' && p.state !== 'stranded_rescue') {
        p.state = 'following';
        p.stateTimer = 18;
        soundEngine.playPetChirp(p.species);
      }
    }
    this.say('Come here, buddies!', 'mars');
    this.pushHud(true);
  }

  private clearPlacementPreviewState() {
    this.relocatingBuildingId = null;
    this.placementPreview = null;
    if (this.placementGhostGroup) {
      this.marsScene.remove(this.placementGhostGroup);
      this.placementGhostGroup = null;
    }
  }

  private beginPlacementPreview(config: {
    mode: 'construct' | 'relocate';
    catalogueId?: string;
    buildingId?: string;
    buildingType: BuildingType;
    name: string;
    initialX: number;
    initialZ: number;
    rotationY: number;
    cost: number;
    materialsCost: number;
  }) {
    this.clearPlacementPreviewState();
    if (this.activeWorld !== 'mars') {
      this.activeWorld = 'mars';
      this.activeExhibit = null;
      this.marsVitals.inRover = false;
      soundEngine.stopRoverEngine();
      soundEngine.updateWorldAmbience('mars', this.screen === 'playing');
    }
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }

    const x = Math.round(config.initialX * 4) / 4;
    const z = Math.round(config.initialZ * 4) / 4;
    const y = this.marsTerrain.groundHeightAt(x, z);
    const check = this.validateBuildingPlacement(
      config.buildingType,
      x,
      z,
      config.rotationY,
      config.buildingId
    );

    this.relocatingBuildingId = config.mode === 'relocate' ? config.buildingId || null : null;
    this.placementPreview = {
      mode: config.mode,
      catalogueId: config.catalogueId,
      buildingId: config.buildingId,
      buildingType: config.buildingType,
      name: config.name,
      position: [x, y, z],
      rotationY: config.rotationY,
      valid: check.valid,
      reason: check.reason,
      cost: config.cost,
      materialsCost: config.materialsCost,
    };

    this.placementGhostGroup = createPlacementPreviewMesh(config.buildingType);
    this.placementGhostGroup.position.set(x, y, z);
    this.placementGhostGroup.rotation.y = config.rotationY;
    setPlacementPreviewValidity(this.placementGhostGroup, check.valid);
    this.marsScene.add(this.placementGhostGroup);
    this.pushHud(true);
  }

  private refreshPlacementPreviewValidation() {
    if (!this.placementPreview || !this.placementGhostGroup) return;
    const [x, , z] = this.placementPreview.position;
    const y = this.marsTerrain.groundHeightAt(x, z);
    this.placementPreview.position[1] = y;
    const check = this.validateBuildingPlacement(
      this.placementPreview.buildingType,
      x,
      z,
      this.placementPreview.rotationY,
      this.placementPreview.buildingId
    );
    this.placementPreview.valid = check.valid;
    this.placementPreview.reason = check.reason;
    this.placementGhostGroup.position.set(x, y, z);
    this.placementGhostGroup.rotation.y = this.placementPreview.rotationY;
    setPlacementPreviewValidity(this.placementGhostGroup, check.valid);
  }

  public rotatePlacementPreview(deltaRad: number) {
    if (!this.placementPreview) return;
    this.placementPreview.rotationY += deltaRad;
    this.refreshPlacementPreviewValidation();
    soundEngine.playUiClick();
    this.pushHud(true);
  }

  public startRelocateBuilding(buildingId: string) {
    const b = this.buildings.find((x) => x.id === buildingId);
    if (!b || b.protectedFromMove) {
      this.addNotification('info', 'Essential infrastructure cannot be moved.', 'warn');
      return;
    }
    soundEngine.playUiClick();
    this.beginPlacementPreview({
      mode: 'relocate',
      buildingId: b.id,
      buildingType: b.type,
      name: b.name,
      initialX: b.position[0],
      initialZ: b.position[2],
      rotationY: b.rotationY,
      cost: 0,
      materialsCost: 0,
    });
  }

  public confirmPlacementPreview() {
    const prev = this.placementPreview;
    if (!prev) return;
    this.refreshPlacementPreviewValidation();
    if (!prev.valid) {
      soundEngine.playSoftMissionAlert();
      this.addNotification('info', prev.reason || 'Cannot place building at this location.', 'warn');
      this.pushHud(true);
      return;
    }

    const [nx, , nz] = prev.position;
    const ny = this.marsTerrain.groundHeightAt(nx, nz);

    if (prev.mode === 'relocate') {
      const b = this.buildings.find((x) => x.id === prev.buildingId);
      if (!b) {
        this.cancelPlacementPreview();
        return;
      }
      b.position = [nx, ny, nz];
      b.rotationY = prev.rotationY;
      b.footprintRadius = getBuildingFootprint(b.type).boundingRadius;
      this.clearPlacementPreviewState();
      soundEngine.playConstruction();
      this.completeObjectiveById('m17_relocate');
      this.rebuildMarsWorldMeshes();
      this.nudgePlayerOutOfPlacedBuilding(b);
      this.saveGame();
      this.pushHud(true);
      return;
    }

    // Mode === 'construct'
    if (this.resources.coins < prev.cost || this.resources.materials < prev.materialsCost) {
      soundEngine.playSoftMissionAlert();
      this.addNotification('info', 'Not enough Coins or Materials to complete construction!', 'warn');
      this.pushHud(true);
      return;
    }

    this.resources.coins -= prev.cost;
    this.resources.materials -= prev.materialsCost;

    const fp = getBuildingFootprint(prev.buildingType);
    const placed: PlacedBuilding = {
      id: `bld_${prev.buildingType}_${Date.now()}`,
      type: prev.buildingType,
      name: prev.name,
      position: [nx, ny, nz],
      rotationY: prev.rotationY,
      level: 1,
      dustLevel: 0,
      damaged: false,
      hasInterior: prev.buildingType !== 'solar_array' && prev.buildingType !== 'landing_port',
      footprintRadius: fp.boundingRadius,
      cropPlanted: prev.buildingType === 'greenhouse' ? false : undefined,
      cropWatered: false,
      cropGrowth: 0,
    };
    this.buildings.push(placed);
    this.clearPlacementPreviewState();
    soundEngine.playConstruction();
    this.addNotification('info', `Constructed ${placed.name}!`, 'success');
    this.applyBuildingConstructionObjectives(placed.type);
    this.rebuildMarsWorldMeshes();
    this.nudgePlayerOutOfPlacedBuilding(placed);
    this.checkLevelCompletion();
    this.saveGame();
    this.pushHud(true);
  }

  public cancelPlacementPreview() {
    if (!this.placementPreview) return;
    this.clearPlacementPreviewState();
    soundEngine.playUiClick();
    this.pushHud(true);
  }

  public confirmRelocateBuilding() {
    this.confirmPlacementPreview();
  }

  public cancelRelocate() {
    this.cancelPlacementPreview();
  }

  private nudgePlayerOutOfPlacedBuilding(b: PlacedBuilding) {
    if (this.marsVitals.inRover) return;
    if (!this.collidesWithMarsBuildings(this.marsPos.x, this.marsPos.z, 0.52)) return;
    const fp = getBuildingFootprint(b.type);
    const exitDist = (fp.entrance?.lz || fp.boundingRadius) + 1.4;
    const [ex, ez] = localToWorldXZ(b.position[0], b.position[2], b.rotationY, 0, exitDist);
    this.marsPos.set(ex, this.marsTerrain.groundHeightAt(ex, ez), ez);
  }

  public startRoadBuilder() {
    soundEngine.playUiClick();
    this.roadBuildMode = 'select_grade';
    this.pendingRoadPoints = [
      [Math.round(this.marsPos.x), this.marsPos.y, Math.round(this.marsPos.z)],
    ];
    this.updatePendingRoadLine();
    this.addNotification('info', 'Walk or click ground to extend route, then Stage 1: Grade Terrain!', 'info');
    this.pushHud(true);
  }

  public addRoadWaypointAtPlayer() {
    if (this.roadBuildMode !== 'select_grade') return;
    soundEngine.playUiClick();
    this.pendingRoadPoints.push([
      Math.round(this.marsPos.x),
      this.marsPos.y,
      Math.round(this.marsPos.z),
    ]);
    this.updatePendingRoadLine();
    this.pushHud(true);
  }

  public stage1PrepareRoadTerrain() {
    if (this.pendingRoadPoints.length < 2) {
      // Auto-add current position if user only has 1 point
      this.pendingRoadPoints.push([
        Math.round(this.marsPos.x + 8),
        this.marsTerrain.groundHeightAt(this.marsPos.x + 8, this.marsPos.z + 8),
        Math.round(this.marsPos.z + 8),
      ]);
    }
    soundEngine.playConstruction();
    const newRoad: RoadSegment = {
      id: `road_${Date.now()}`,
      points: this.pendingRoadPoints.map((p) => [p[0], this.marsTerrain.rawHeightAt(p[0], p[2]), p[2]]),
      stage: 'graded',
      progress: 50,
    };
    this.roads.push(newRoad);
    this.roadBuildMode = 'ready_pave';
    this.rebuildMarsWorldMeshes();
    this.addNotification('info', 'Stage 1 Complete: Terrain graded! Now construct the Road Surface.', 'success');
    this.pushHud(true);
  }

  public stage2PaveRoad() {
    const graded = this.roads.find((r) => r.stage === 'graded');
    if (!graded) return;
    soundEngine.playConstruction();
    graded.stage = 'paved';
    graded.progress = 100;
    this.roadBuildMode = 'none';
    this.pendingRoadPoints = [];
    if (this.pendingRoadLine) {
      this.marsScene.remove(this.pendingRoadLine);
      this.pendingRoadLine = null;
    }
    this.completeObjectiveById('m15_road');
    this.rebuildMarsWorldMeshes();
    this.saveGame();
    this.pushHud(true);
  }

  public cancelRoadBuilder() {
    this.roadBuildMode = 'none';
    this.pendingRoadPoints = [];
    if (this.pendingRoadLine) {
      this.marsScene.remove(this.pendingRoadLine);
      this.pendingRoadLine = null;
    }
    this.pushHud(true);
  }

  private updatePendingRoadLine() {
    if (this.pendingRoadLine) {
      this.marsScene.remove(this.pendingRoadLine);
    }
    if (this.pendingRoadPoints.length < 2) return;
    const pts = this.pendingRoadPoints.map((p) => new THREE.Vector3(p[0], p[1] + 0.35, p[2]));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.pendingRoadLine = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: '#facc15' })
    );
    this.marsScene.add(this.pendingRoadLine);
  }

  public purchaseOrEquipItem(itemId: string) {
    const item = CATALOGUE_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    if (this.currentLevel < item.unlockLevel) {
      this.addNotification('info', `Unlocks at Level ${item.unlockLevel}`, 'warn');
      return;
    }

    // Supplies can be bought repeatedly
    if (item.category === 'supplies') {
      if (this.resources.coins < item.cost) {
        this.addNotification('info', 'Not enough Coins!', 'warn');
        return;
      }
      this.resources.coins -= item.cost;
      if (item.id === 'sup_meal_pack') this.resources.mealsStored += 3;
      if (item.id === 'sup_alloy_bundle') this.resources.materials += 25;
      soundEngine.playPurchase();
      this.saveGame();
      this.pushHud(true);
      return;
    }

    // Buildings open interactive 3D placement preview on Mars!
    if (item.category === 'buildings' && item.buildingType) {
      if (this.resources.coins < item.cost || this.resources.materials < (item.materialsCost || 0)) {
        this.addNotification('info', 'Need more Coins or Materials!', 'warn');
        return;
      }
      this.startConstructBuilding(item);
      return;
    }

    // Outfits, Pets, Furniture, Decor, Equipment
    if (!this.ownedItems.has(item.id)) {
      if (this.resources.coins < item.cost) {
        this.addNotification('info', 'Not enough Coins!', 'warn');
        return;
      }
      this.resources.coins -= item.cost;
      this.ownedItems.add(item.id);
      soundEngine.playPurchase();

      if (item.category === 'pets' && item.species) {
        const stationIdx = this.pets.length % 4;
        const dorm = this.buildings.find((b) => b.type === 'dormitory');
        const spawnX = (dorm?.position[0] || 0) + 2.5 + this.pets.length * 1.4;
        const spawnZ = (dorm?.position[2] || -12) + 8.5;
        const newPet: RoboticPet = {
          id: `pet_${Date.now()}`,
          catalogueId: item.id,
          name: item.name.split(' ')[0],
          species: item.species,
          color: item.color,
          accentColor: item.accentColor || '#38bdf8',
          battery: item.batteryCapacity || 100,
          maxBattery: item.batteryCapacity || 100,
          state: 'wandering',
          position: [spawnX, this.marsTerrain.groundHeightAt(spawnX, spawnZ), spawnZ],
          rotationY: 0,
          targetPos: [spawnX + 3, 0, spawnZ + 2],
          stationIndex: stationIdx,
          stateTimer: 5,
        };
        this.pets.push(newPet);
        soundEngine.playPetChirp(item.species);
        this.completeObjectiveById('m8_adopt');
        this.rebuildMarsWorldMeshes();
      }
    }

    // Equip outfit
    if (item.suitId) {
      this.equippedMarsSuit = item.suitId;
      applyAstronautAppearance(this.marsAstronaut, this.equippedMarsSuit, this.equippedEarthUniform);
      soundEngine.playUiClick();
    }
    if (item.uniformId) {
      this.equippedEarthUniform = item.uniformId;
      applyAstronautAppearance(this.earthAstronaut, this.equippedMarsSuit, this.equippedEarthUniform);
      soundEngine.playUiClick();
    }

    this.saveGame();
    this.pushHud(true);
  }

  private startConstructBuilding(item: CatalogueItem) {
    if (!item.buildingType) return;
    const fp = getBuildingFootprint(item.buildingType);
    const defaultRot = Math.atan2(-Math.sin(this.marsYaw), -Math.cos(this.marsYaw));
    let bx = Math.round((this.marsPos.x + Math.sin(this.marsYaw) * (fp.boundingRadius + 4.5)) * 4) / 4;
    let bz = Math.round((this.marsPos.z + Math.cos(this.marsYaw) * (fp.boundingRadius + 4.5)) * 4) / 4;

    if (!this.validateBuildingPlacement(item.buildingType, bx, bz, defaultRot).valid) {
      // Spiral search near player for an unobstructed starting preview spot
      outer: for (let r = 6; r <= 48; r += 3) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const cx = Math.round((this.marsPos.x + Math.cos(a) * r) * 4) / 4;
          const cz = Math.round((this.marsPos.z + Math.sin(a) * r) * 4) / 4;
          if (this.validateBuildingPlacement(item.buildingType, cx, cz, defaultRot).valid) {
            bx = cx;
            bz = cz;
            break outer;
          }
        }
      }
    }

    soundEngine.playUiClick();
    this.beginPlacementPreview({
      mode: 'construct',
      catalogueId: item.id,
      buildingType: item.buildingType,
      name: item.name,
      initialX: bx,
      initialZ: bz,
      rotationY: defaultRot,
      cost: item.cost,
      materialsCost: item.materialsCost || 0,
    });
  }

  private applyBuildingConstructionObjectives(type: BuildingType) {
    if (type === 'water_recycler') this.completeObjectiveById('m1_build');
    if (type === 'solar_array') {
      const solarCount = this.buildings.filter((b) => b.type === 'solar_array').length;
      const batCount = this.buildings.filter((b) => b.type === 'battery_bank').length;
      if (solarCount >= 1 && batCount >= 1) this.completeObjectiveById('m2_solar');
      if (solarCount >= 2 && batCount >= 1) this.completeObjectiveById('m17_expand');
    }
    if (type === 'battery_bank') {
      const solarCount = this.buildings.filter((b) => b.type === 'solar_array').length;
      const batCount = this.buildings.filter((b) => b.type === 'battery_bank').length;
      if (solarCount >= 1 && batCount >= 1) this.completeObjectiveById('m2_solar');
      if (solarCount >= 2 && batCount >= 1) this.completeObjectiveById('m17_expand');
    }
    if (type === 'greenhouse') this.completeObjectiveById('m3_greenhouse');
    if (type === 'oxygen_generator') this.completeObjectiveById('m5_build');
    if (type === 'food_processor') this.completeObjectiveById('m7_build');
    if (type === 'waste_processor') this.completeObjectiveById('m13_build');
    if (type === 'radiation_shield') this.completeObjectiveById('m14_build');
    if (type === 'research_outpost') this.completeObjectiveById('m15_outpost');
    if (type === 'fuel_plant') this.completeObjectiveById('m16_build');
  }

  public validateBuildingPlacement(
    type: BuildingType,
    x: number,
    z: number,
    rotationY: number,
    ignoreId?: string
  ): { valid: boolean; reason: string | null } {
    const maxRange = this.getMarsExplorationRange();
    if (Math.hypot(x, z) > maxRange - 4) {
      return { valid: false, reason: 'Location outside unlocked construction zone.' };
    }

    const fp = getBuildingFootprint(type);
    const candidate: PlacementPose = { type, x, z, rotationY };

    // 1. Terrain steepness check across the actual rotated footprint (natural elevation, ignores decorative shrubs)
    const centerH = this.marsTerrain.rawHeightAt(x, z);
    let minH = centerH;
    let maxH = centerH;
    let maxSlope = 0;
    for (const [lx, lz] of fp.terrainSamplePoints) {
      const [wx, wz] = localToWorldXZ(x, z, rotationY, lx, lz);
      const h = this.marsTerrain.rawHeightAt(wx, wz);
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
      const d = Math.hypot(wx - x, wz - z);
      if (d > 0.5) {
        const slope = Math.abs(h - centerH) / d;
        if (slope > maxSlope) maxSlope = slope;
      }
    }
    if (maxSlope > 0.42 || maxH - minH > 2.3) {
      return { valid: false, reason: 'Terrain too steep for safe foundation.' };
    }

    // 2. Accurate rotated footprint overlap check against existing buildings (0.1m clearance!)
    for (const b of this.buildings) {
      if (b.id === ignoreId) continue;
      const existing: PlacementPose = {
        type: b.type,
        x: b.position[0],
        z: b.position[2],
        rotationY: b.rotationY,
      };
      if (doBuildingFootprintsOverlap(candidate, existing, 0.1)) {
        return { valid: false, reason: 'Building overlaps an existing structure.' };
      }

      // 3. Preserve doorway usability without excess spacing
      const existingFp = getBuildingFootprint(b.type);
      if (existingFp.entrance) {
        const [ex, ez] = localToWorldXZ(
          existing.x,
          existing.z,
          existing.rotationY,
          existingFp.entrance.lx,
          existingFp.entrance.lz
        );
        if (doesBuildingOverlapCircle(candidate, ex, ez, existingFp.entrance.radius, 0.04)) {
          return { valid: false, reason: 'Blocks entrance path of an existing building.' };
        }
      }
      if (fp.entrance) {
        const [cx, cz] = localToWorldXZ(x, z, rotationY, fp.entrance.lx, fp.entrance.lz);
        if (doesBuildingOverlapCircle(existing, cx, cz, fp.entrance.radius, 0.04)) {
          return { valid: false, reason: 'Entrance doorway is blocked by an adjacent building.' };
        }
      }
    }

    // 4. Genuine solid rocks & major geological formations ONLY (small shrubs/plants are ignored!)
    for (const rc of this.marsTerrain.rockColliders) {
      if (doesBuildingOverlapCircle(candidate, rc.x, rc.z, rc.radius, 0.08)) {
        return { valid: false, reason: 'Blocked by solid rock or geological formation.' };
      }
    }

    // 5. Important mission equipment & meteorite crater sites
    if (this.roverUnlocked && !this.marsVitals.inRover) {
      if (doesBuildingOverlapCircle(candidate, this.roverPos.x, this.roverPos.z, 1.7, 0.1)) {
        return { valid: false, reason: 'Overlaps parked Mars Rover.' };
      }
    }
    for (const met of this.meteorites) {
      if (!met.collected && doesBuildingOverlapCircle(candidate, met.x, met.z, 3.4, 0.1)) {
        return { valid: false, reason: 'Overlaps active meteorite crater site.' };
      }
    }

    return { valid: true, reason: null };
  }

  public finishMiniGame(success: boolean) {
    const mg = this.activeMiniGame;
    this.activeMiniGame = null;
    this.clearMovementInputs();
    if (!success || !mg) {
      this.pushHud(true);
      return;
    }

    soundEngine.playLevelComplete();
    if (mg.onSuccessAction === 'assemble_prototype') {
      this.earthLogistics.prototypeReady = true;
      this.earthLogistics.stage = 'test_prototype';
      this.completeObjectiveById(`e${this.currentLevel}_assemble`);
      this.syncEarthFacilityVisuals();
      this.addNotification('info', `${this.earthLogistics.prototypeName} assembled! Carry to Testing Station.`, 'success');
    } else if (mg.onSuccessAction === 'science_activity') {
      const steps = this.levelObjectives.filter((o) => o.world === 'earth' && !o.completed);
      if (steps.length > 0) {
        steps[0].completed = true;
      }
      this.addNotification('info', `${mg.title} completed!`, 'success');
    }
    this.checkLevelCompletion();
    this.saveGame();
    this.pushHud(true);
  }

  private triggerHazard(type: ActiveHazardType) {
    this.activeHazard = type;
    this.hazardTimer = type === 'dust_storm' ? 28 : 22;
    if (type === 'dust_storm') {
      soundEngine.playDustStormAlert();
      this.addNotification('dust', 'Martian Dust Storm approaching! Solar efficiency dropping.', 'warn');
      this.buildings.forEach((b) => {
        if (b.type === 'solar_array') b.dustLevel = Math.min(100, b.dustLevel + 55);
      });
    } else if (type === 'radiation_alert') {
      soundEngine.playRadiationAlert();
      this.addNotification('radiation', 'Solar Radiation Alert! Shelter in Dormitory or Shield Dome!', 'alert');
    }
    this.pushHud(true);
  }

  private triggerRarePetRescue() {
    const pet = this.pets[0];
    if (!pet) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 58 + Math.random() * 45;
    const rx = Math.round(Math.cos(angle) * dist);
    const rz = Math.round(Math.sin(angle) * dist);
    pet.state = 'stranded_rescue';
    pet.battery = 4;
    pet.position = [rx, this.marsTerrain.groundHeightAt(rx, rz), rz];
    this.addNotification('pet', `SOS! ${pet.name} battery critical at (${rx}, ${rz}) — rescue by Rover!`, 'alert');
    soundEngine.playSoftMissionAlert();
    this.pushHud(true);
  }

  private completeObjectiveById(id: string) {
    const obj = this.levelObjectives.find((o) => o.id === id);
    if (obj && !obj.completed) {
      obj.completed = true;
      this.resources.xp += 35;
      soundEngine.playGentleNotif();
      this.checkLevelCompletion();
    }
  }

  private checkLevelCompletion() {
    if (this.levelObjectives.length === 0) return;
    if (this.levelObjectives.every((o) => o.completed)) {
      const def = LEVELS[Math.min(LEVELS.length - 1, this.currentLevel - 1)];
      this.resources.coins += def.rewardCoins;
      this.resources.xp += 120;
      this.resources.materials += 25;
      soundEngine.playLevelComplete();
      this.addNotification('level', `Level ${this.currentLevel} Complete! +${def.rewardCoins} Coins`, 'success');

      if (this.currentLevel >= 20) {
        this.screen = 'victory';
      } else {
        this.loadLevelSetup(this.currentLevel + 1);
      }
      this.saveGame();
      this.pushHud(true);
    }
  }

  private addNotification(
    icon: GameNotification['icon'],
    label: string,
    tone: GameNotification['tone']
  ) {
    this.notifications = [
      { id: `${Date.now()}_${Math.random()}`, icon, label, tone, timestamp: Date.now() },
      ...this.notifications.slice(0, 3),
    ];
  }

  private say(text: string, world: WorldId) {
    this.speechBubble = { text, world, expiresAt: performance.now() + 3400 };
  }

  public saveGame() {
    try {
      // Never persist transient action locks (e.g., mid-sleep) or bed-trapped coordinates
      const safeMarsPos = this.marsPos.clone();
      const safeEarthPos = this.earthPos.clone();
      this.ensureSafeMarsStandingPos(safeMarsPos);
      this.ensureSafeEarthStandingPos(safeEarthPos);
      const payload = {
        currentLevel: this.currentLevel,
        simDay: this.simDay,
        timeOfDay: this.timeOfDay,
        activeWorld: this.activeWorld,
        marsPos: [safeMarsPos.x, safeMarsPos.y, safeMarsPos.z],
        marsYaw: this.marsYaw,
        earthPos: [safeEarthPos.x, safeEarthPos.y, safeEarthPos.z],
        earthYaw: this.earthYaw,
        marsVitals: {
          ...this.marsVitals,
          actionState: 'idle',
          inRover: false,
        },
        earthVitals: {
          ...this.earthVitals,
          actionState: 'idle',
          inRover: false,
        },
        resources: this.resources,
        equippedMarsSuit: this.equippedMarsSuit,
        equippedEarthUniform: this.equippedEarthUniform,
        ownedItems: Array.from(this.ownedItems),
        buildings: this.buildings,
        roads: this.roads,
        pets: this.pets,
        meteorites: this.meteorites,
        roverUnlocked: this.roverUnlocked,
        missionStage: this.missionStage,
        discoveredRegionIds: Array.from(this.discoveredRegionIds),
        audioVolumes: soundEngine.getChannelVolumes(),
        levelObjectives: this.levelObjectives,
        earthLogistics: this.earthLogistics,
        marsCapsule: this.marsCapsule,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }

  private clearMovementInputs() {
    this.keys = {};
    this.touchMoveVec = { x: 0, y: 0 };
    this.isCameraDragging = false;
    this.wasPressingReverse = false;
    this.reverseTargetYaw = null;
    this.lastMouseX = null;
    this.lastMouseY = null;
  }

  // Validated safe bedside exit position (clear of bed collider, furniture & walls)
  private findSafeBedExitPosition(dorm: PlacedBuilding): { pos: THREE.Vector3; yaw: number } {
    const floorY = dorm.position[1] + 0.44;
    const candidates: { lx: number; lz: number; yawOffset: number }[] = [
      { lx: -1.85, lz: -3.5, yawOffset: Math.PI * 0.35 },
      { lx: -4.2, lz: -0.95, yawOffset: 0 },
      { lx: -1.9, lz: -1.7, yawOffset: Math.PI * 0.2 },
      { lx: -6.2, lz: -3.5, yawOffset: Math.PI * 0.45 },
      { lx: 0, lz: 0, yawOffset: 0 },
    ];
    for (const c of candidates) {
      if (Math.hypot(c.lx, c.lz) > 7.8) continue;
      const [wx, wz] = this.buildingLocalToWorld(dorm, c.lx, c.lz);
      if (!this.collidesWithMarsBuildings(wx, wz, 0.56)) {
        return {
          pos: new THREE.Vector3(wx, floorY, wz),
          yaw: this.normalizeAngle(dorm.rotationY + c.yawOffset),
        };
      }
    }
    const [fx, fz] = this.buildingLocalToWorld(dorm, 0, 1.5);
    return {
      pos: new THREE.Vector3(fx, floorY, fz),
      yaw: this.normalizeAngle(dorm.rotationY),
    };
  }

  // Guarantee Mars astronaut stands outside any building, bed, furniture, or rock collider
  private ensureSafeMarsStandingPos(pos: THREE.Vector3): boolean {
    const maxRange = this.getMarsExplorationRange();
    if (Math.hypot(pos.x, pos.z) < maxRange && !this.collidesWithMarsBuildings(pos.x, pos.z, 0.52)) {
      pos.y = this.getMarsWalkableFloorY(pos.x, pos.z);
      return false;
    }

    // If trapped near Dormitory Bed, prefer clean bedside exit
    const dorm = this.buildings.find((b) => b.type === 'dormitory');
    if (dorm) {
      const [lx, lz] = this.worldToBuildingLocal(dorm, pos.x, pos.z);
      if (Math.hypot(lx, lz) < 9.2) {
        const bedExit = this.findSafeBedExitPosition(dorm);
        pos.copy(bedExit.pos);
        return true;
      }
    }

    // General radial spiral search around current spot
    const radii = [0.75, 1.3, 2.0, 2.8, 3.8, 5.2, 7.0, 9.5];
    for (const rad of radii) {
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const cx = pos.x + Math.cos(ang) * rad;
        const cz = pos.z + Math.sin(ang) * rad;
        if (Math.hypot(cx, cz) < maxRange && !this.collidesWithMarsBuildings(cx, cz, 0.55)) {
          pos.set(cx, this.getMarsWalkableFloorY(cx, cz), cz);
          return true;
        }
      }
    }

    pos.set(0, this.getMarsWalkableFloorY(0, 2.5), 2.5);
    return true;
  }

  private ensureSafeEarthStandingPos(pos: THREE.Vector3): boolean {
    if (!this.collidesWithEarthWalls(pos.x, pos.z, 0.5)) {
      pos.y = 0;
      return false;
    }
    const radii = [0.75, 1.3, 2.0, 2.8, 4.0, 5.5];
    for (const rad of radii) {
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const cx = pos.x + Math.cos(ang) * rad;
        const cz = pos.z + Math.sin(ang) * rad;
        if (!this.collidesWithEarthWalls(cx, cz, 0.55)) {
          pos.set(cx, 0, cz);
          return true;
        }
      }
    }
    pos.set(-2, 0, 2);
    return true;
  }

  private startTimedInteraction(opts: {
    world: WorldId;
    kind: ActiveTimedInteraction['kind'];
    label: string;
    actionState: AstronautVitals['actionState'];
    duration: number;
    enterEnd?: number;
    exitStart?: number;
    targetPos?: THREE.Vector3;
    targetYaw?: number;
    exitPos?: THREE.Vector3;
    exitYaw?: number;
    cancelable?: boolean;
    onComplete?: () => void;
  }) {
    if (this.activeInteraction) {
      this.cancelActiveInteraction(true);
    }

    const pos = opts.world === 'mars' ? this.marsPos : this.earthPos;
    const vel = opts.world === 'mars' ? this.marsVel : this.earthVel;
    const vitals = opts.world === 'mars' ? this.marsVitals : this.earthVitals;
    const currentYaw = opts.world === 'mars' ? this.marsYaw : this.earthYaw;

    vel.set(0, 0, 0);
    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;

    const startPos = pos.clone();
    const targetPos = opts.targetPos ? opts.targetPos.clone() : pos.clone();
    const exitPos = opts.exitPos ? opts.exitPos.clone() : pos.clone();
    if (opts.world === 'mars') {
      this.ensureSafeMarsStandingPos(exitPos);
    } else {
      this.ensureSafeEarthStandingPos(exitPos);
    }

    this.activeInteraction = {
      world: opts.world,
      kind: opts.kind,
      label: opts.label,
      actionState: opts.actionState,
      elapsed: 0,
      duration: Math.max(0.1, opts.duration),
      enterEnd: opts.enterEnd ?? 0,
      exitStart: opts.exitStart ?? 1,
      startPos,
      targetPos,
      targetYaw: opts.targetYaw ?? currentYaw,
      exitPos,
      exitYaw: opts.exitYaw ?? currentYaw,
      cancelable: opts.cancelable ?? true,
      onComplete: opts.onComplete,
    };
    vitals.actionState = opts.actionState;
    this.pushHud(true);
  }

  private updateActiveInteraction(dt: number, world: WorldId) {
    const inter = this.activeInteraction;
    if (!inter || inter.world !== world) return;

    inter.elapsed = Math.min(inter.duration, inter.elapsed + dt);
    const prog = THREE.MathUtils.clamp(inter.elapsed / inter.duration, 0, 1);

    const pos = world === 'mars' ? this.marsPos : this.earthPos;
    const rig = world === 'mars' ? this.marsAstronaut : this.earthAstronaut;
    const grounded = world === 'mars' ? this.marsGrounded : this.earthGrounded;

    let yaw = world === 'mars' ? this.marsYaw : this.earthYaw;
    if (inter.enterEnd > 0 && prog < inter.enterEnd) {
      const t = THREE.MathUtils.smoothstep(prog / inter.enterEnd, 0, 1);
      pos.lerpVectors(inter.startPos, inter.targetPos, t);
      yaw = this.dampAngle(yaw, inter.targetYaw, 10, dt);
    } else if (inter.exitStart < 1 && prog >= inter.exitStart) {
      const t = THREE.MathUtils.smoothstep((prog - inter.exitStart) / (1 - inter.exitStart), 0, 1);
      pos.lerpVectors(inter.targetPos, inter.exitPos, t);
      yaw = this.dampAngle(yaw, inter.exitYaw, 10, dt);
    } else {
      pos.copy(inter.targetPos);
      yaw = this.dampAngle(yaw, inter.targetYaw, 12, dt);
    }

    if (world === 'mars') {
      this.marsYaw = yaw;
    } else {
      this.earthYaw = yaw;
    }

    animateAstronautRig(rig, inter.actionState, 0, this.simTime, dt, prog, grounded);
    rig.root.position.copy(pos);
    rig.root.rotation.y = yaw;

    if (inter.elapsed >= inter.duration) {
      this.completeActiveInteraction();
    }
  }

  private completeActiveInteraction() {
    const inter = this.activeInteraction;
    if (!inter) return;

    this.activeInteraction = null;
    if (inter.world === 'mars') {
      this.marsPos.copy(inter.exitPos);
      this.ensureSafeMarsStandingPos(this.marsPos);
      this.marsVel.set(0, 0, 0);
      this.marsGrounded = true;
      this.marsYaw = inter.exitYaw;
      this.marsVitals.actionState = 'idle';
      this.marsAstronaut.root.position.copy(this.marsPos);
      this.marsAstronaut.root.rotation.y = this.marsYaw;
      this.syncMarsInteriorVisibility();
    } else {
      this.earthPos.copy(inter.exitPos);
      this.ensureSafeEarthStandingPos(this.earthPos);
      this.earthVel.set(0, 0, 0);
      this.earthGrounded = true;
      this.earthYaw = inter.exitYaw;
      this.earthVitals.actionState = 'idle';
      this.earthAstronaut.root.position.copy(this.earthPos);
      this.earthAstronaut.root.rotation.y = this.earthYaw;
    }

    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;
    inter.onComplete?.();
    this.checkLevelCompletion();
    this.saveGame();
    this.pushHud(true);
  }

  public cancelActiveInteraction(silent = false): boolean {
    const inter = this.activeInteraction;
    if (!inter) return false;

    const wasSleepAndRested = inter.kind === 'sleep' && inter.elapsed >= 0.8;
    this.activeInteraction = null;

    if (inter.world === 'mars') {
      this.marsPos.copy(inter.exitPos);
      this.ensureSafeMarsStandingPos(this.marsPos);
      this.marsVel.set(0, 0, 0);
      this.marsGrounded = true;
      this.marsYaw = inter.exitYaw;
      this.marsVitals.actionState = 'idle';
      this.marsAstronaut.root.position.copy(this.marsPos);
      this.marsAstronaut.root.rotation.y = this.marsYaw;
      animateAstronautRig(this.marsAstronaut, 'idle', 0, this.simTime, 0.25, 0, true);
      this.syncMarsInteriorVisibility();
    } else {
      this.earthPos.copy(inter.exitPos);
      this.ensureSafeEarthStandingPos(this.earthPos);
      this.earthVel.set(0, 0, 0);
      this.earthGrounded = true;
      this.earthYaw = inter.exitYaw;
      this.earthVitals.actionState = 'idle';
      this.earthAstronaut.root.position.copy(this.earthPos);
      this.earthAstronaut.root.rotation.y = this.earthYaw;
      animateAstronautRig(this.earthAstronaut, 'idle', 0, this.simTime, 0.25, 0, true);
    }

    if (wasSleepAndRested) {
      inter.onComplete?.();
    }

    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;
    if (!silent && inter.kind === 'sleep') {
      soundEngine.playUiClick();
      this.say('Awake and ready!', 'mars');
    }
    this.saveGame();
    this.pushHud(true);
    return true;
  }

  public recoverStuckPlayer() {
    if (this.activeInteraction) {
      this.cancelActiveInteraction(true);
    }
    this.clearMovementInputs();
    this.activeExhibit = null;
    if (this.activeWorld === 'mars') {
      if (this.marsVitals.inRover) {
        this.marsVitals.inRover = false;
        this.roverSpeed = 0;
        soundEngine.stopRoverEngine();
      }
      this.marsVel.set(0, 0, 0);
      this.marsGrounded = true;
      this.marsVitals.actionState = 'idle';
      this.ensureSafeMarsStandingPos(this.marsPos);
      this.marsAstronaut.root.visible = true;
      this.marsAstronaut.root.position.copy(this.marsPos);
      animateAstronautRig(this.marsAstronaut, 'idle', 0, this.simTime, 0.25, 0, true);
      this.syncMarsInteriorVisibility();
      this.camYaw = this.normalizeAngle(this.marsYaw + Math.PI);
    } else {
      this.earthVel.set(0, 0, 0);
      this.earthGrounded = true;
      this.earthVitals.actionState = 'idle';
      this.ensureSafeEarthStandingPos(this.earthPos);
      this.earthAstronaut.root.position.copy(this.earthPos);
      animateAstronautRig(this.earthAstronaut, 'idle', 0, this.simTime, 0.25, 0, true);
      this.camYaw = this.normalizeAngle(this.earthYaw + Math.PI);
    }
    this.camPitch = 0.25;
    soundEngine.playGentleNotif();
    this.addNotification('info', 'Astronaut restored to a safe standing position.', 'success');
    this.saveGame();
    this.pushHud(true);
  }

  // INTERACTION HANDLER (Key E or Touch Interact Button)
  public triggerInteract() {
    if (this.screen !== 'playing' || this.activeMiniGame) return;

    if (this.activeInteraction) {
      if (this.activeInteraction.cancelable) {
        this.cancelActiveInteraction(false);
      }
      return;
    }

    if (this.activeWorld === 'mars') {
      this.handleMarsInteract();
    } else {
      this.handleEarthInteract();
    }
    this.checkLevelCompletion();
    this.saveGame();
    this.pushHud(true);
  }

  private worldToBuildingLocal(b: PlacedBuilding, wx: number, wz: number): [number, number] {
    const dx = wx - b.position[0];
    const dz = wz - b.position[2];
    const c = Math.cos(b.rotationY);
    const s = Math.sin(b.rotationY);
    return [dx * c - dz * s, dx * s + dz * c];
  }

  private buildingLocalToWorld(b: PlacedBuilding, lx: number, lz: number): [number, number] {
    const c = Math.cos(b.rotationY);
    const s = Math.sin(b.rotationY);
    return [b.position[0] + lx * c + lz * s, b.position[2] - lx * s + lz * c];
  }

  private getMarsExplorationRange(): number {
    if (this.currentLevel >= 15) return 225;
    if (this.currentLevel >= 12) return 132;
    if (this.currentLevel >= 9) return 118;
    if (this.currentLevel >= 6) return 112;
    if (this.currentLevel >= 3) return 88;
    return 62;
  }

  private handleMarsInteract() {
    const px = this.marsPos.x;
    const pz = this.marsPos.z;

    // 1. Toggle Rover enter/exit (validated safe exit clear of walls/rocks)
    if (this.marsVitals.inRover) {
      this.marsVitals.inRover = false;
      this.roverSpeed = 0;
      this.marsVel.set(0, 0, 0);
      this.marsGrounded = true;
      this.reverseTargetYaw = null;
      soundEngine.stopRoverEngine();
      const cosR = Math.cos(this.roverYaw);
      const sinR = Math.sin(this.roverYaw);
      const roverExitOffsets = [
        [2.6, 0],
        [-2.6, 0],
        [0, -3.4],
        [0, 3.4],
      ];
      let chosenX = this.roverPos.x + cosR * 2.6;
      let chosenZ = this.roverPos.z - sinR * 2.6;
      for (const [ox, oz] of roverExitOffsets) {
        const cx = this.roverPos.x + ox * cosR + oz * sinR;
        const cz = this.roverPos.z - ox * sinR + oz * cosR;
        if (!this.collidesWithMarsBuildings(cx, cz, 0.56)) {
          chosenX = cx;
          chosenZ = cz;
          break;
        }
      }
      this.marsPos.set(chosenX, this.getMarsWalkableFloorY(chosenX, chosenZ), chosenZ);
      this.ensureSafeMarsStandingPos(this.marsPos);
      this.marsYaw = this.roverYaw;
      this.camYaw = this.normalizeAngle(this.marsYaw + Math.PI);
      soundEngine.playDoor();
      return;
    }

    if (this.roverUnlocked && Math.hypot(px - this.roverPos.x, pz - this.roverPos.z) < 4.5) {
      this.marsVitals.inRover = true;
      soundEngine.playDoor();
      this.completeObjectiveById('m9_drive');
      this.say('Rover online! Ready to explore!', 'mars');
      return;
    }

    // 2. Stranded Pet Rescue
    for (const pet of this.pets) {
      if (pet.state === 'stranded_rescue' && Math.hypot(px - pet.position[0], pz - pet.position[2]) < 5.0) {
        this.marsVitals.carryingItem = `Rescued ${pet.name}`;
        pet.state = 'charging_sleeping';
        pet.battery = 15;
        const dorm = this.buildings.find((b) => b.type === 'dormitory');
        const dh = dorm ? this.buildingHandles.get(dorm.id) : undefined;
        const anchor = dh?.petStationAnchors?.[pet.stationIndex] || [0, 0.5, -16];
        pet.position = [anchor[0], anchor[1], anchor[2]];
        this.completeObjectiveById('m18_rescue');
        this.completeObjectiveById('m18_charge');
        soundEngine.playPetChirp(pet.species);
        this.addNotification('pet', `${pet.name} safely returned to Dormitory charging dock!`, 'success');
        this.marsVitals.carryingItem = null;
        return;
      }
      if (Math.hypot(px - pet.position[0], pz - pet.position[2]) < 3.0) {
        this.marsYaw = Math.atan2(pet.position[0] - px, pet.position[2] - pz);
        soundEngine.playPetChirp(pet.species);
        this.completeObjectiveById('m8_pet');
        this.say(`${pet.name} is happy!`, 'mars');
        return;
      }
    }

    // 3. Meteorite Site Investigation & Collection
    for (const met of this.meteorites) {
      if (!met.collected && Math.hypot(px - met.x, pz - met.z) < 5.5) {
        const faceYaw = Math.atan2(met.x - px, met.z - pz);
        met.collected = true;
        this.resources.samplesCollected += 2;
        this.resources.coins += 65;
        this.resources.xp += 30;
        this.marsVitals.carryingItem = 'Meteorite Fragment';
        soundEngine.playPickup();
        this.rebuildMeteoriteMeshes();
        this.completeObjectiveById('m10_meteor');
        this.completeObjectiveById('m20_explore');
        this.addNotification('meteor', 'Collected glowing Meteorite Fragment! Bring to Warehouse.', 'success');
        this.startTimedInteraction({
          world: 'mars',
          kind: 'pickup',
          label: 'Collecting Meteorite',
          actionState: 'pickup',
          duration: 0.85,
          targetYaw: faceYaw,
          exitYaw: faceYaw,
        });
        return;
      }
    }

    // 4. Surface Geological Discoveries
    for (const d of this.discoveries) {
      if (!d.collected && Math.hypot(px - d.x, pz - d.z) < 3.4) {
        const faceYaw = Math.atan2(d.x - px, d.z - pz);
        d.collected = true;
        d.mesh.visible = false;
        this.resources.samplesCollected += 1;
        this.resources.materials += 12;
        this.resources.xp += 20;
        this.marsVitals.carryingItem = 'Martian Mineral Sample';
        soundEngine.playPickup();
        if (this.resources.samplesCollected >= 2) this.completeObjectiveById('m3_soil');
        if (d.id === 'disc_4') {
          this.completeObjectiveById('m12_scan');
          this.completeObjectiveById('m12_extract');
          this.resources.water = Math.min(100, this.resources.water + 20);
        }
        if (d.id === 'disc_3') this.completeObjectiveById('m9_sample');
        this.startTimedInteraction({
          world: 'mars',
          kind: 'pickup',
          label: 'Collecting Mineral Sample',
          actionState: 'pickup',
          duration: 0.85,
          targetYaw: faceYaw,
          exitYaw: faceYaw,
        });
        return;
      }
    }

    // 5. Dormitory Bed (3-phase Sleep -> Wake Up -> Validated Bedside Exit) & Dining Table
    const dorm = this.buildings.find((b) => b.type === 'dormitory');
    if (dorm) {
      const [bedWorldX, bedWorldZ] = this.buildingLocalToWorld(dorm, -4.2, -3.5);
      if (Math.hypot(px - bedWorldX, pz - bedWorldZ) < 3.1) {
        const bedExit = this.findSafeBedExitPosition(dorm);
        soundEngine.playChargingHum();
        this.say('Resting in the Dormitory...', 'mars');
        this.startTimedInteraction({
          world: 'mars',
          kind: 'sleep',
          label: 'Sleeping in Dormitory',
          actionState: 'sleep',
          duration: 3.1,
          enterEnd: 0.18,
          exitStart: 0.72,
          targetPos: new THREE.Vector3(bedWorldX, dorm.position[1] + 0.46, bedWorldZ),
          targetYaw: dorm.rotationY,
          exitPos: bedExit.pos,
          exitYaw: bedExit.yaw,
          cancelable: true,
          onComplete: () => {
            this.marsVitals.energy = 100;
            this.completeObjectiveById('m6_rest');
            this.camYaw = this.normalizeAngle(this.marsYaw + Math.PI);
            this.say('Well rested! Ready for duty.', 'mars');
          },
        });
        return;
      }

      const [dineWorldX, dineWorldZ] = this.buildingLocalToWorld(dorm, 3.8, 2.5);
      if (Math.hypot(px - dineWorldX, pz - dineWorldZ) < 3.0) {
        const faceYaw = Math.atan2(dineWorldX - px, dineWorldZ - pz);
        if (this.resources.mealsStored > 0) {
          this.resources.mealsStored -= 1;
          this.marsVitals.hunger = Math.min(100, this.marsVitals.hunger + 45);
          this.resources.food = Math.min(100, this.resources.food + 15);
          this.completeObjectiveById('m6_eat');
          soundEngine.playPickup();
          this.say('Delicious hydro-meal!', 'mars');
          this.startTimedInteraction({
            world: 'mars',
            kind: 'eat',
            label: 'Eating Hydro-Meal',
            actionState: 'eat',
            duration: 1.8,
            targetYaw: faceYaw,
            exitYaw: faceYaw,
          });
        } else {
          this.addNotification('food', 'No stored meals! Harvest crops or buy rations.', 'warn');
        }
        return;
      }
    }

    // 6. Landing Port Sterilisation Scanner & Stage-E Gated Capsule Retrieval
    const port = this.buildings.find((b) => b.type === 'landing_port');
    if (port) {
      const [lx, lz] = this.worldToBuildingLocal(port, px, pz);
      // Sample-Processing Scanner Console inside Sterilisation Room at local (3.2, 13.0)
      if (Math.hypot(lx - 3.2, lz - 13.0) < 2.8) {
        const [sx, sz] = this.buildingLocalToWorld(port, 3.2, 13.0);
        const faceYaw = Math.atan2(sx - px, sz - pz);
        this.marsCapsule.sterilisationSampleDone = true;
        this.marsCapsule.deconPassed = true;
        this.resources.xp += 20;
        soundEngine.playGentleNotif();
        this.addNotification('info', 'Sterilisation Sample Scan verified! Airlock cleared.', 'success');
        this.startTimedInteraction({
          world: 'mars',
          kind: 'operate',
          label: 'Scanning Sample',
          actionState: 'operate',
          duration: 1.0,
          targetYaw: faceYaw,
          exitYaw: faceYaw,
        });
        return;
      }

      // Capsule Retrieval on Landing Pad
      if (Math.hypot(lx, lz) < 5.6 && this.marsCapsule.arrived && !this.marsCapsule.unlocked) {
        this.marsYaw = Math.atan2(port.position[0] - px, port.position[2] - pz);
        if (this.missionStage !== 'mars_unlock_capsule') {
          soundEngine.playSoftMissionAlert();
          this.addNotification(
            'capsule',
            'Return to your Mars Base first to confirm arrival before unlocking the capsule!',
            'warn'
          );
          return;
        }
        if (!this.marsCapsule.deconPassed) {
          soundEngine.playSoftMissionAlert();
          this.addNotification(
            'capsule',
            'Walk through the Sterilisation Room UV air-shower first!',
            'warn'
          );
          return;
        }
        if (this.resources.coins >= this.marsCapsule.unlockCost) {
          this.resources.coins -= this.marsCapsule.unlockCost;
          this.marsCapsule.unlocked = true;
          this.marsCapsule.alarmActive = false;
          this.marsCapsule.contentsRetrieved = true;
          this.marsVitals.carryingItem = this.marsCapsule.payloadName;
          this.tutorialHint = null;
          this.resources.xp += 60;
          soundEngine.playPurchase();
          this.completeObjectiveById(`m${this.currentLevel}_capsule`);
          this.addNotification('capsule', `Unlocked ${this.marsCapsule.payloadName}!`, 'success');
        } else {
          this.addNotification('capsule', `Need ${this.marsCapsule.unlockCost} Coins to unlock Capsule!`, 'warn');
        }
        return;
      }
    }

    // 7. Enter / Exit Building via E at any enterable doorway
    const doorCandidate = this.getBuildingDoorCandidate(px, pz);
    if (doorCandidate) {
      if (doorCandidate.action === 'enter') {
        this.enterMarsBuilding(doorCandidate.building, doorCandidate.handle);
      } else {
        this.exitMarsBuilding(doorCandidate.building, doorCandidate.handle);
      }
      return;
    }

    // 8. Building-specific interior & exterior interactions
    for (const b of this.buildings) {
      const [lx, lz] = this.worldToBuildingLocal(b, px, pz);
      const isInsideThis = this.marsVitals.insideBuildingId === b.id;

      if (b.type === 'solar_array' && Math.hypot(lx, lz) < 5.6) {
        const faceYaw = Math.atan2(b.position[0] - px, b.position[2] - pz);
        if (b.dustLevel > 5 || this.currentLevel === 2 || this.currentLevel === 11 || this.currentLevel === 19) {
          b.dustLevel = 0;
          b.damaged = false;
          soundEngine.playConstruction();
          this.completeObjectiveById('m2_clean');
          this.completeObjectiveById('m11_clean');
          this.completeObjectiveById('m19_repair');
          this.addNotification('power', 'Solar panels dusted & restored to 100% output!', 'success');
          this.startTimedInteraction({
            world: 'mars',
            kind: 'operate',
            label: 'Servicing Solar Array',
            actionState: 'operate',
            duration: 1.15,
            targetYaw: faceYaw,
            exitYaw: faceYaw,
          });
        } else {
          soundEngine.playGentleNotif();
          this.addNotification('power', 'Exterior Solar Array operating at 100% efficiency.', 'info');
          this.startTimedInteraction({
            world: 'mars',
            kind: 'operate',
            label: 'Inspecting Solar Array',
            actionState: 'operate',
            duration: 0.85,
            targetYaw: faceYaw,
            exitYaw: faceYaw,
          });
        }
        return;
      }

      if (!isInsideThis && Math.hypot(px - b.position[0], pz - b.position[2]) >= b.footprintRadius + 1.5) {
        continue;
      }

      if (b.type === 'warehouse' && (isInsideThis || Math.hypot(lx, lz) < 5.8)) {
        const faceYaw = Math.atan2(b.position[0] - px, b.position[2] - pz);
        if (this.marsVitals.carryingItem) {
          this.marsYaw = faceYaw;
          this.marsVitals.carryingItem = null;
          this.resources.coins += 55;
          this.resources.materials += 15;
          this.resources.xp += 25;
          soundEngine.playPurchase();
          this.completeObjectiveById('m1_discover');
          this.completeObjectiveById('m10_store');
          this.addNotification('info', 'Deposited discovery in Warehouse! +55 Coins', 'success');
        } else if (isInsideThis) {
          soundEngine.playGentleNotif();
          this.addNotification('info', `Warehouse inventory: ${this.resources.materials} Materials · ${this.resources.mealsStored} Meals.`, 'info');
          this.startTimedInteraction({
            world: 'mars',
            kind: 'operate',
            label: 'Checking Warehouse Manifest',
            actionState: 'operate',
            duration: 0.85,
            targetYaw: faceYaw,
            exitYaw: faceYaw,
          });
        }
        return;
      }

      if (b.type === 'greenhouse' && isInsideThis) {
        if (!b.cropPlanted) {
          b.cropPlanted = true;
          b.cropWatered = true;
          b.cropGrowth = 35;
          soundEngine.playPickup();
          this.completeObjectiveById('m4_plant');
          this.say('Seeds planted & watered!', 'mars');
        } else if ((b.cropGrowth || 0) >= 95) {
          b.cropPlanted = false;
          b.cropGrowth = 0;
          this.resources.rawCrops += 3;
          this.resources.food = Math.min(100, this.resources.food + 18);
          soundEngine.playPurchase();
          this.completeObjectiveById('m4_harvest');
          this.addNotification('food', 'Harvested 3 fresh Martian crops!', 'success');
        } else {
          b.cropWatered = true;
          b.cropGrowth = Math.min(100, (b.cropGrowth || 0) + 35);
          soundEngine.playPickup();
        }
        return;
      }

      if (b.type === 'food_processor' && isInsideThis) {
        if (this.resources.rawCrops > 0) {
          this.resources.rawCrops -= 1;
          this.resources.mealsStored += 2;
          this.resources.food = Math.min(100, this.resources.food + 20);
          soundEngine.playConstruction();
          this.completeObjectiveById('m7_process');
          this.addNotification('food', 'Processed crops into +2 Stored Meals!', 'success');
        } else {
          soundEngine.playGentleNotif();
          this.addNotification('food', 'Food Processor ready — bring raw crops from Greenhouse.', 'info');
        }
        return;
      }

      if (b.type === 'waste_processor' && isInsideThis) {
        if (this.resources.waste > 0) {
          this.resources.waste = Math.max(0, this.resources.waste - 10);
          this.resources.materials += 10;
          soundEngine.playConstruction();
          this.completeObjectiveById('m13_recycle');
          this.addNotification('info', 'Recycled organic waste into crop nutrients!', 'success');
        } else {
          soundEngine.playGentleNotif();
          this.addNotification('info', 'Waste Recycling Plant standby — zero waste backlog.', 'info');
        }
        return;
      }

      if (
        isInsideThis &&
        b.type !== 'dormitory' &&
        b.type !== 'landing_port' &&
        Math.hypot(lx, lz + 2.1) < 3.4
      ) {
        const [cx, cz] = this.buildingLocalToWorld(b, 0, -2.35);
        const faceYaw = Math.atan2(cx - px, cz - pz);
        soundEngine.playGentleNotif();
        this.addNotification('info', `${b.name} telemetry nominal — systems active.`, 'info');
        this.startTimedInteraction({
          world: 'mars',
          kind: 'operate',
          label: `Operating ${b.name}`,
          actionState: 'operate',
          duration: 0.9,
          targetYaw: faceYaw,
          exitYaw: faceYaw,
        });
        return;
      }
    }
  }

  private handleEarthInteract() {
    const px = this.earthPos.x;
    const pz = this.earthPos.z;
    const log = this.earthLogistics;

    // 0. Close open Exhibit popup on E if active
    if (this.activeExhibit) {
      this.closeExhibit();
      return;
    }

    // 1. Space Exploration Gallery Exhibits (pick closest exhibit within radius)
    const closestExhibit = this.findClosestEarthExhibit(px, pz);
    if (closestExhibit) {
      this.earthYaw = Math.atan2(closestExhibit.x - px, closestExhibit.z - pz);
      this.openExhibitById(closestExhibit.id);
      return;
    }

    // 2. Pick up physical parts in Inventory & Storage
    if (log.stage === 'collect_parts') {
      this.earthFacility.partPickups.forEach((p, idx) => {
        if (!p.visible) return;
        if (Math.hypot(px - p.position.x, pz - p.position.z) < 2.6) {
          const partName = log.requiredParts[idx];
          if (!this.earthVitals.carryingItem && !log.collectedParts.includes(partName)) {
            const faceYaw = Math.atan2(p.position.x - px, p.position.z - pz);
            log.collectedParts.push(partName);
            this.earthVitals.carryingItem = partName;
            soundEngine.playPickup();
            this.syncEarthFacilityVisuals();
            this.startTimedInteraction({
              world: 'earth',
              kind: 'pickup',
              label: `Picking Up ${partName}`,
              actionState: 'pickup',
              duration: 0.75,
              targetYaw: faceYaw,
              exitYaw: faceYaw,
            });
          }
        }
      });

      // Load carried part onto physical Trolley
      if (
        this.earthVitals.carryingItem &&
        Math.hypot(px - log.trolleyPos[0], pz - log.trolleyPos[2]) < 2.8
      ) {
        log.partsOnTrolley.push(this.earthVitals.carryingItem);
        this.earthVitals.carryingItem = null;
        soundEngine.playPickup();
        if (log.partsOnTrolley.length >= log.requiredParts.length) {
          log.stage = 'transport_to_lab';
          log.trolleyAttached = true;
          this.tutorialHint = 'Push the Trolley into Research Laboratory & unload at the Workstation.';
          this.completeObjectiveById(`e${this.currentLevel}_collect`);
          this.addNotification('info', 'All parts loaded on Trolley! Push Trolley to Workstation.', 'success');
        }
        this.syncEarthFacilityVisuals();
        return;
      }
    }

    // 3. Push/Detach Trolley or Unload at Workstation (-3.5, 0, -1.5)
    if (Math.hypot(px - log.trolleyPos[0], pz - log.trolleyPos[2]) < 2.8 && log.stage === 'transport_to_lab') {
      if (Math.hypot(px - -3.5, pz - -1.5) < 4.5) {
        log.partsAtBench = [...log.partsOnTrolley];
        log.partsOnTrolley = [];
        log.trolleyAttached = false;
        log.stage = 'assemble_prototype';
        this.tutorialHint = 'Press E at the Workstation bench to assemble the prototype.';
        soundEngine.playPickup();
        this.syncEarthFacilityVisuals();
        this.addNotification('info', 'Parts placed on Workstation! Press E to assemble.', 'info');
        return;
      } else {
        log.trolleyAttached = !log.trolleyAttached;
        soundEngine.playUiClick();
        return;
      }
    }

    // 4. Workstation Bench: Assemble Prototype Mini-Game
    if (log.stage === 'assemble_prototype' && Math.hypot(px - -3.5, pz - -1.5) < 3.4) {
      this.earthYaw = Math.atan2(-3.5 - px, -1.5 - pz);
      this.clearMovementInputs();
      this.activeMiniGame = {
        type: LEVELS[this.currentLevel - 1]?.scienceActivity || 'assembly',
        title: `Assemble ${log.prototypeName}`,
        onSuccessAction: 'assemble_prototype',
      };
      soundEngine.playUiClick();
      return;
    }

    // 5. Testing Station (2, 0, -4.5): 30-Second Real Test
    if (log.stage === 'test_prototype' && Math.hypot(px - 2, pz - -4.5) < 3.4) {
      const faceYaw = Math.atan2(2 - px, -4.5 - pz);
      if (!log.testActive && !log.testComplete) {
        log.testActive = true;
        log.testProgress = 0;
        this.tutorialHint = 'Testing in progress (30s). Feel free to tour the Space Exploration Gallery!';
        soundEngine.playConstruction();
        this.syncEarthFacilityVisuals();
        this.addNotification('info', '30-Second Prototype Certification Test started!', 'info');
        this.startTimedInteraction({
          world: 'earth',
          kind: 'operate',
          label: 'Starting Certification Test',
          actionState: 'operate',
          duration: 0.95,
          targetYaw: faceYaw,
          exitYaw: faceYaw,
        });
      } else if (log.testComplete) {
        log.carryingPrototype = true;
        this.earthVitals.carryingItem = log.prototypeName;
        log.stage = 'carry_to_capsule';
        this.tutorialHint = 'Walk east through Cargo Preparation into the Launch Facility to load the rocket!';
        soundEngine.playPickup();
        this.syncEarthFacilityVisuals();
        this.addNotification('info', 'Walk through Cargo Preparation into the Launch Facility!', 'success');
      }
      return;
    }

    // 6. Launch Facility Rocket Pad (42, 0, 0): Load & Lock Prototype
    if (Math.hypot(px - 42, pz - 0) < 5.8) {
      this.earthYaw = Math.atan2(42 - px, 0 - pz);
      if (log.stage === 'carry_to_capsule' && log.carryingPrototype) {
        log.carryingPrototype = false;
        this.earthVitals.carryingItem = null;
        log.capsuleLoaded = true;
        log.stage = 'lock_capsule';
        soundEngine.playConstruction();
        this.syncEarthFacilityVisuals();
        this.addNotification('capsule', 'Prototype loaded! Press E again to Lock Capsule Hatch.', 'info');
        return;
      }
      if (log.stage === 'lock_capsule' && log.capsuleLoaded && !log.capsuleLocked) {
        log.capsuleLocked = true;
        log.stage = 'walk_to_launch_control';
        this.tutorialHint = 'Capsule locked! Walk to the Launch Control Deck and press the Red Launch Button.';
        soundEngine.playDoor();
        this.syncEarthFacilityVisuals();
        this.addNotification('capsule', 'Capsule LOCKED! Go to Launch Control Deck to launch!', 'success');
        return;
      }
    }

    // 7. Launch Control Deck (28, 0, 14): LARGE RED LAUNCH BUTTON -> Stage B!
    if (
      (log.stage === 'walk_to_launch_control' || log.stage === 'press_launch') &&
      Math.hypot(px - 28, pz - 14) < 3.6
    ) {
      this.earthYaw = Math.atan2(28 - px, 14 - pz);
      log.stage = 'monitor_launch';
      log.rocketLaunched = true;
      this.missionStage = 'earth_launch';
      this.launchCinematicTimer = 3.8;
      this.tutorialHint = 'Liftoff! Rocket ascending into Earth-Mars transfer orbit...';
      soundEngine.playRocketLaunch();
      this.completeObjectiveById(`e${this.currentLevel}_launch`);
      this.addNotification('capsule', 'LIFTOFF! Spacecraft departing Earth for Mars!', 'success');

      // Capsule is in transit — NOT arrived or alarming yet until Mars landing sequence completes!
      this.marsCapsule = {
        inTransit: true,
        arrived: false,
        alarmActive: false,
        unlocked: false,
        contentsRetrieved: false,
        unlockCost: 35 + this.currentLevel * 10,
        payloadName: log.prototypeName,
        deconPassed: false,
        sterilisationSampleDone: false,
      };
      return;
    }

    // 8. Specialized Earth Science Rooms
    const roomActivities: {
      x: number;
      z: number;
      minLvl: number;
      type: ActiveMiniGame['type'];
      title: string;
    }[] = [
      { x: -17, z: -15.5, minLvl: 3, type: 'microscopy', title: 'Hydroponics & Agriculture Crop Lab' },
      { x: -2, z: -15.5, minLvl: 1, type: 'microscopy', title: 'Water Analysis & Microscopy Lab' },
      { x: -17, z: 15.5, minLvl: 2, type: 'power_grid', title: 'Energy Testing & Solar Lab' },
      { x: -2, z: 15.5, minLvl: 6, type: 'materials', title: 'Radiation Testing & Shielding Chamber' },
      { x: 13, z: -15, minLvl: 8, type: 'robotics', title: 'Equipment & Robotics Calibration Bench' },
      { x: 13, z: 15, minLvl: 5, type: 'circuit', title: 'Oxygen & Life-Support Research' },
      { x: 28, z: -14, minLvl: 1, type: 'spectrometry', title: 'Mission Control Telemetry Console' },
    ];
    for (const ra of roomActivities) {
      if (this.currentLevel >= ra.minLvl && Math.hypot(px - ra.x, pz - ra.z) < 4.2) {
        this.activeMiniGame = {
          type: ra.type,
          title: ra.title,
          onSuccessAction: 'science_activity',
        };
        soundEngine.playUiClick();
        return;
      }
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('mouseup', this.onMouseUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.onMouseDown);
    dom.addEventListener('mousemove', this.onMouseMove);
    dom.addEventListener('click', this.onCanvasClick);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
    dom.addEventListener('contextmenu', this.onContextMenu);
  }

  private onResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onBlur = () => {
    this.clearMovementInputs();
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.screen !== 'playing' || this.activeMiniGame) return;
    this.mouseDownClientPos = { x: e.clientX, y: e.clientY };
    if (e.button === 0 || e.button === 2) {
      this.isCameraDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseUp = () => {
    this.isCameraDragging = false;
    this.lastMouseX = null;
    this.lastMouseY = null;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (this.screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault();
      this.startGame(false);
      return;
    }
    if (this.screen !== 'playing') return;

    if (this.activeWorld === 'mars' && this.placementPreview) {
      if (e.code === 'KeyQ') {
        e.preventDefault();
        this.rotatePlacementPreview(e.repeat ? -Math.PI / 36 : -Math.PI / 12);
        return;
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        this.rotatePlacementPreview(e.repeat ? Math.PI / 36 : Math.PI / 12);
        return;
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        this.confirmPlacementPreview();
        return;
      }
    }

    if (e.code === 'F8') {
      e.preventDefault();
      this.recoverStuckPlayer();
      return;
    }

    if (this.activeInteraction) {
      if ((e.code === 'KeyE' || e.code === 'Space') && this.activeInteraction.cancelable) {
        e.preventDefault();
        this.cancelActiveInteraction(false);
      }
      return;
    }

    if (e.code === 'KeyE') {
      this.triggerInteract();
    } else if (e.code === 'KeyC' && this.activeWorld === 'mars') {
      this.callPets();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  // Camera ONLY rotates during deliberate click-drag inspection or J/L/I/K keys (never passive touchpad hover!)
  private onMouseMove = (e: MouseEvent) => {
    if (this.screen !== 'playing' || this.activeMiniGame) return;

    // Update building placement preview smoothly under mouse cursor on Mars
    if (this.activeWorld === 'mars' && this.placementPreview) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNdc, this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.marsPos.y);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(plane, hit)) {
        const refinedY = this.marsTerrain.groundHeightAt(hit.x, hit.z);
        const refinedPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -refinedY);
        this.raycaster.ray.intersectPlane(refinedPlane, hit);
        const sx = Math.round(hit.x * 4) / 4;
        const sz = Math.round(hit.z * 4) / 4;
        const sy = this.marsTerrain.groundHeightAt(sx, sz);
        this.placementPreview.position = [sx, sy, sz];
        this.refreshPlacementPreviewValidation();
        this.pushHud(false);
      }
    }

    if (!this.isCameraDragging) {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      return;
    }

    if (this.lastMouseX !== null && this.lastMouseY !== null) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.camYaw = this.normalizeAngle(this.camYaw - dx * 0.0055);
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.004, 0.08, 1.05);
    }
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onCanvasClick = (e: MouseEvent) => {
    if (this.screen !== 'playing' || this.activeMiniGame) return;

    const movedDist = this.mouseDownClientPos
      ? Math.hypot(e.clientX - this.mouseDownClientPos.x, e.clientY - this.mouseDownClientPos.y)
      : 0;
    this.mouseDownClientPos = null;

    // Clickable 3D (i) badges, plaques, and timeline totems in NASA Hall of Fame
    if (this.activeWorld === 'earth' && !this.activeExhibit && movedDist < 7) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNdc, this.camera);
      const hits = this.raycaster.intersectObjects(this.earthFacility.clickableExhibitMeshes, true);
      if (hits.length > 0 && hits[0].distance < 16) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.exhibitId) {
          obj = obj.parent;
        }
        const exId = obj?.userData?.exhibitId;
        if (typeof exId === 'string') {
          this.openExhibitById(exId);
          return;
        }
      }
    }

    // If constructing or relocating a building, clicking confirms placement
    if (this.activeWorld === 'mars' && this.placementPreview) {
      this.confirmPlacementPreview();
      return;
    }

    // If building a road, clicking adds a waypoint on the Martian terrain
    if (this.activeWorld === 'mars' && this.roadBuildMode === 'select_grade') {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNdc, this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.marsPos.y);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(plane, hit)) {
        const gy = this.marsTerrain.groundHeightAt(hit.x, hit.z);
        this.pendingRoadPoints.push([Math.round(hit.x), gy, Math.round(hit.z)]);
        this.updatePendingRoadLine();
        soundEngine.playUiClick();
        this.pushHud(true);
      }
      return;
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.004, 3.2, 10.5);
  };

  public setTouchMove(x: number, y: number) {
    this.touchMoveVec.x = x;
    this.touchMoveVec.y = y;
  }

  public adjustCameraTouch(dx: number, dy: number) {
    this.camYaw -= dx * 0.006;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.004, 0.08, 1.15);
  }

  public triggerJump() {
    if (this.activeWorld === 'mars' && this.marsGrounded && !this.marsVitals.inRover) {
      this.marsVel.y = 7.2;
      this.marsGrounded = false;
      soundEngine.playJump();
    } else if (this.activeWorld === 'earth' && this.earthGrounded) {
      this.earthVel.y = 6.8;
      this.earthGrounded = false;
      soundEngine.playJump();
    }
  }

  // MAIN 60FPS SIMULATION LOOP
  private tick = () => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.simTime += dt;

    if (this.screen === 'title') {
      this.titlePlanet.rotation.y += dt * 0.14;
      animateAstronautRig(this.titleAstro, 'idle', 0, this.simTime, dt, 0, true);
      this.camera.position.set(0, 0.7, 5.2);
      this.camera.lookAt(0.4, 0.2, -4);
      this.renderer.render(this.titleScene, this.camera);
    } else {
      if (this.screen === 'playing') {
        this.updateSharedSimulation(dt);
        if (this.activeWorld === 'mars') {
          this.updateMarsPlayer(dt);
        } else {
          this.updateEarthPlayer(dt);
        }
        this.updateNearbyPrompt();
      }
      this.updateActiveCamera(dt);
      const activeScene = this.activeWorld === 'mars' ? this.marsScene : this.earthScene;
      this.renderer.render(activeScene, this.camera);

      if (performance.now() - this.lastHudPush > 110) {
        this.pushHud(false);
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSharedSimulation(dt: number) {
    // 1. Shared Planetary Day/Night Cycle
    this.timeOfDay += dt * 0.0085;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.simDay += 1;
    }

    // Smooth golden sunrise, clear day, warm sunset, cool blue night
    const sunAngle = this.timeOfDay * Math.PI * 2;
    const sunY = Math.sin(sunAngle) * 75;
    const sunX = Math.cos(sunAngle) * 75;
    this.marsSun.position.set(this.marsPos.x + sunX, Math.max(8, sunY), this.marsPos.z + 35);
    this.marsSun.target.position.set(this.marsPos.x, 0, this.marsPos.z);

    const dayFactor = THREE.MathUtils.clamp(Math.sin(sunAngle) * 1.4 + 0.35, 0.18, 1);
    const isStorm = this.activeHazard === 'dust_storm';

    const skyColor = _vec3A;
    if (isStorm) {
      skyColor.set(0.72, 0.48, 0.34);
    } else {
      const dusk = Math.max(0, 1 - Math.abs(Math.sin(sunAngle)) * 2.2);
      skyColor.set(
        THREE.MathUtils.lerp(0.16, 0.85, dayFactor) + dusk * 0.08,
        THREE.MathUtils.lerp(0.2, 0.71, dayFactor) - dusk * 0.04,
        THREE.MathUtils.lerp(0.32, 0.6, dayFactor) - dusk * 0.1
      );
    }
    (this.marsScene.background as THREE.Color).setRGB(skyColor.x, skyColor.y, skyColor.z);
    this.marsFog.color.setRGB(skyColor.x, skyColor.y, skyColor.z);
    this.marsFog.density = THREE.MathUtils.damp(this.marsFog.density, isStorm ? 0.016 : 0.0042, 2, dt);
    this.marsSun.intensity = THREE.MathUtils.damp(
      this.marsSun.intensity,
      isStorm ? 0.7 : 0.4 + dayFactor * 1.8,
      2,
      dt
    );

    // 2. Earth 30+ Second Real-Time Prototype Testing Station
    const log = this.earthLogistics;
    if (log.testActive && !log.testComplete) {
      log.testProgress += dt;
      this.earthFacility.testerSpinner.rotation.z += dt * 4.5;
      if (Math.floor(log.testProgress) > Math.floor(log.testProgress - dt)) {
        soundEngine.playTestTick();
      }
      if (log.testProgress >= 30) {
        log.testProgress = 30;
        log.testActive = false;
        log.testComplete = true;
        this.completeObjectiveById(`e${this.currentLevel}_test`);
        soundEngine.playLevelComplete();
        this.addNotification('info', '30s Prototype Test PASSED! Carry Prototype through Transfer Tunnel.', 'success');
      }
    }

    // Rocket launch animation on Earth -> Stage B to Stage C (Mars Arrival) transition!
    if (log.rocketLaunched && log.rocketLaunchProgress < 1) {
      log.rocketLaunchProgress = Math.min(1, log.rocketLaunchProgress + dt * 0.25);
      this.syncEarthFacilityVisuals();
    }
    if (this.launchCinematicTimer > 0) {
      this.launchCinematicTimer = Math.max(0, this.launchCinematicTimer - dt);
      if (this.launchCinematicTimer === 0 && this.missionStage === 'earth_launch') {
        this.missionStage = 'mars_arrival';
        this.marsCapsule.inTransit = false;
        this.marsCapsule.arrived = true;
        this.marsCapsule.alarmActive = false; // Do not alarm until Stage E!

        const port = this.buildings.find((b) => b.type === 'landing_port');
        if (port) {
          const [exitX, exitZ] = this.buildingLocalToWorld(port, 0, 20.0);
          this.marsPos.set(exitX, this.marsTerrain.groundHeightAt(exitX, exitZ), exitZ);
          this.ensureSafeMarsStandingPos(this.marsPos);
          this.marsYaw = this.normalizeAngle(port.rotationY);
          this.marsVel.set(0, 0, 0);
        }
        this.switchWorld('mars');
        this.tutorialHint = "Mission update: You've arrived on Mars! Exit the landing area and return to your Mars base.";
        soundEngine.playGentleNotif();
        this.addNotification(
          'capsule',
          "You've arrived on Mars! Exit the landing area and return to your Mars base.",
          'info'
        );
      }
    }

    // Stage C -> Stage D -> Stage E Progression on Mars
    if (this.activeWorld === 'mars') {
      const port = this.buildings.find((b) => b.type === 'landing_port');
      const dorm = this.buildings.find((b) => b.type === 'dormitory');
      if (this.missionStage === 'mars_arrival' && port) {
        if (Math.hypot(this.marsPos.x - port.position[0], this.marsPos.z - port.position[2]) > 21) {
          this.missionStage = 'mars_return_base';
          this.tutorialHint = 'Follow the waypoint back to your Mars Base (Colony Dormitory).';
          soundEngine.playGentleNotif();
        }
      }
      if (
        (this.missionStage === 'mars_arrival' || this.missionStage === 'mars_return_base') &&
        dorm &&
        Math.hypot(this.marsPos.x - dorm.position[0], this.marsPos.z - dorm.position[2]) < 11.5
      ) {
        this.missionStage = 'mars_unlock_capsule';
        this.marsCapsule.alarmActive = true;
        this.tutorialHint =
          'Your Earth cargo has arrived. Return to the landing station and unlock the capsule to retrieve your supplies.';
        soundEngine.playSoftMissionAlert();
        this.addNotification(
          'capsule',
          'Your Earth cargo has arrived. Return to the landing station and unlock the capsule!',
          'info'
        );
      }
    }

    // 3. Mars Colony Resource Production & Consumption
    const solarCount = this.buildings.filter((b) => b.type === 'solar_array' && b.dustLevel < 70).length;
    const waterCount = this.buildings.filter((b) => b.type === 'water_recycler').length;
    const o2Count = this.buildings.filter((b) => b.type === 'oxygen_generator').length;
    const fuelCount = this.buildings.filter((b) => b.type === 'fuel_plant').length;

    const powerGen = solarCount * (isStorm ? 0.35 : 1.35 * dayFactor) + 0.35;
    this.resources.electricity = THREE.MathUtils.clamp(
      this.resources.electricity + (powerGen - 0.6) * dt * 0.55,
      15,
      100
    );
    this.resources.water = THREE.MathUtils.clamp(
      this.resources.water + (waterCount * 0.85 - 0.35) * dt * 0.45,
      15,
      100
    );
    this.resources.oxygen = THREE.MathUtils.clamp(
      this.resources.oxygen + (o2Count * 0.9 - 0.32) * dt * 0.45,
      15,
      100
    );
    if (this.resources.oxygen >= 80) this.completeObjectiveById('m5_check');
    if (fuelCount > 0) {
      this.resources.fuel = THREE.MathUtils.clamp(this.resources.fuel + fuelCount * 0.8 * dt, 0, 100);
      if (this.resources.fuel >= 75) this.completeObjectiveById('m16_fuel');
    }
    if (
      this.resources.water >= 65 &&
      this.resources.oxygen >= 65 &&
      this.resources.electricity >= 65
    ) {
      this.completeObjectiveById('m19_stabilize');
    }

    this.resources.waste = THREE.MathUtils.clamp(this.resources.waste + dt * 0.14, 0, 100);

    // Greenhouse crop growth
    for (const b of this.buildings) {
      if (b.type === 'greenhouse' && b.cropPlanted && b.cropWatered) {
        b.cropGrowth = Math.min(100, (b.cropGrowth || 0) + dt * 4.2);
      }
      const bh = this.buildingHandles.get(b.id);
      if (bh?.cropsGroup) {
        const scaleY = b.cropPlanted ? 0.35 + ((b.cropGrowth || 0) / 100) * 0.95 : 0.15;
        bh.cropsGroup.scale.y = scaleY;
      }
    }

    // Gentle child-friendly astronaut vitals
    if (this.currentLevel >= 6) {
      this.marsVitals.hunger = THREE.MathUtils.clamp(this.marsVitals.hunger - dt * 0.22, 15, 100);
      this.marsVitals.energy = THREE.MathUtils.clamp(this.marsVitals.energy - dt * 0.18, 15, 100);
    }

    // Level 20 Sustainability challenge
    if (this.currentLevel === 20) {
      this.sustainabilityTimer += dt;
      if (this.sustainabilityTimer >= 1.5) {
        this.sustainabilityTimer = 0;
        this.sustainabilityDays = Math.min(30, this.sustainabilityDays + 1);
        if (this.sustainabilityDays >= 30) {
          this.completeObjectiveById('m20_sustain');
        }
      }
    }

    // 4. Random Planetary Events (Meteorite Impacts, Dust Storms, Radiation Alerts)
    if (this.activeHazard !== 'none') {
      this.hazardTimer -= dt;
      if (this.hazardTimer <= 0) {
        if (this.activeHazard === 'dust_storm') this.completeObjectiveById('m11_storm');
        this.activeHazard = 'none';
        this.addNotification('info', 'Environmental conditions returned to normal.', 'success');
      }
    } else {
      this.nextHazardCooldown -= dt;
      if (this.nextHazardCooldown <= 0 && this.currentLevel >= 10) {
        this.nextHazardCooldown = 65 + Math.random() * 45;
        const roll = Math.random();
        if (roll < 0.4) {
          this.spawnRandomMeteorite();
        } else if (roll < 0.72) {
          this.triggerHazard('dust_storm');
        } else if (this.currentLevel >= 14) {
          this.triggerHazard('radiation_alert');
        }
      }
    }

    // 5. Landing Port Sterilisation Room Airlock Doors, Mist & Gentle Status Beacon
    const port = this.buildings.find((b) => b.type === 'landing_port');
    const portHandle = port ? this.buildingHandles.get(port.id) : undefined;
    if (portHandle && port) {
      const [lx, lz] = this.worldToBuildingLocal(port, this.marsPos.x, this.marsPos.z);

      // Outer Airlock Door (local z = 17.4)
      if (portHandle.doorGroup) {
        const openOuter = Math.hypot(lx, lz - 17.4) < 4.8 ? 1 : 0;
        const left = portHandle.doorGroup.children[0];
        const right = portHandle.doorGroup.children[1];
        left.position.x = THREE.MathUtils.damp(left.position.x, -0.88 - openOuter * 1.4, 9, dt);
        right.position.x = THREE.MathUtils.damp(right.position.x, 0.88 + openOuter * 1.4, 9, dt);
      }

      // Inner Airlock Door (local z = 8.6)
      if (portHandle.innerDoorGroup) {
        const openInner = Math.hypot(lx, lz - 8.6) < 4.8 ? 1 : 0;
        const left = portHandle.innerDoorGroup.children[0];
        const right = portHandle.innerDoorGroup.children[1];
        left.position.x = THREE.MathUtils.damp(left.position.x, -0.88 - openInner * 1.4, 9, dt);
        right.position.x = THREE.MathUtils.damp(right.position.x, 0.88 + openInner * 1.4, 9, dt);
      }

      // UV/Mist Decontamination Arch inside Sterilisation Room (local x: -2.8..2.8, z: 10.2..15.8)
      const inDeconZone = Math.abs(lx) < 2.8 && lz > 10.2 && lz < 15.8;
      if (inDeconZone && !this.marsCapsule.deconPassed) {
        if (this.deconTimer === 0) {
          soundEngine.playDeconShower();
          this.addNotification('info', 'Sterilisation air-shower active...', 'info');
        }
        this.deconTimer += dt;
        if (portHandle.deconMist) {
          portHandle.deconMist.visible = true;
          portHandle.deconMist.rotation.y += dt * 3.5;
        }
        if (this.deconTimer >= 1.6) {
          this.marsCapsule.deconPassed = true;
          this.deconTimer = 0;
          if (portHandle.deconMist) portHandle.deconMist.visible = false;
          soundEngine.playGentleNotif();
          this.addNotification('info', 'Sterilisation Complete! Airlock cleared.', 'success');
        }
      } else if (portHandle.deconMist && !inDeconZone) {
        portHandle.deconMist.visible = false;
      }

      // Soft visual status beacon (no harsh looping alarm audio!)
      const beaconActive = this.marsCapsule.alarmActive || this.activeHazard !== 'none';
      if (beaconActive && portHandle.alarmLight && portHandle.alarmPointLight) {
        const pulse = 0.55 + 0.45 * Math.sin(this.simTime * 3.2);
        const mat = portHandle.alarmLight.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.6 + pulse * 1.6;
        portHandle.alarmPointLight.intensity = 2 + pulse * 4;
      } else if (portHandle.alarmLight && portHandle.alarmPointLight) {
        (portHandle.alarmLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        portHandle.alarmPointLight.intensity = 0;
      }
    }

    // 6. Update Robotic Pets AI & Charging Animations
    this.updatePetsAI(dt);
  }

  private updatePetsAI(dt: number) {
    const dorm = this.buildings.find((b) => b.type === 'dormitory');
    const dormHandle = dorm ? this.buildingHandles.get(dorm.id) : undefined;

    for (const pet of this.pets) {
      const rig = this.petRigs.get(pet.id);
      if (!rig) continue;

      if (pet.state === 'stranded_rescue') {
        animatePetRig(rig, pet.state, 0, pet.battery, this.simTime, dt);
        rig.root.position.set(pet.position[0], pet.position[1], pet.position[2]);
        continue;
      }

      const dockAnchor = dormHandle?.petStationAnchors?.[pet.stationIndex] || [
        (dorm?.position[0] || 0) - 3 + pet.stationIndex * 1.15,
        (dorm?.position[1] || 0) + 0.48,
        (dorm?.position[2] || -12) - 4.65,
      ];

      if (pet.state === 'charging_sleeping') {
        pet.battery = Math.min(pet.maxBattery, pet.battery + dt * 11);
        pet.position = [dockAnchor[0], dockAnchor[1], dockAnchor[2]];
        rig.root.position.set(pet.position[0], pet.position[1], pet.position[2]);
        animatePetRig(rig, 'charging_sleeping', 0, pet.battery, this.simTime, dt);
        if (pet.battery >= pet.maxBattery * 0.96) {
          pet.state = 'wandering';
          pet.targetPos = [(dorm?.position[0] || 0) + 2, 0, (dorm?.position[2] || -12) + 8];
        }
        continue;
      }

      // Drain battery gently while active
      pet.battery = Math.max(5, pet.battery - dt * 0.9);
      if (pet.battery < 28) {
        pet.state = 'returning_to_charge';
        pet.targetPos = [dockAnchor[0], dockAnchor[1], dockAnchor[2]];
      }

      pet.stateTimer -= dt;
      if (pet.state === 'following') {
        pet.targetPos = [this.marsPos.x + 1.8, this.marsPos.y, this.marsPos.z + 1.8];
        if (pet.stateTimer <= 0) pet.state = 'wandering';
      } else if (pet.state !== 'returning_to_charge' && pet.stateTimer <= 0) {
        pet.stateTimer = 4 + Math.random() * 5;
        const states: RoboticPet['state'][] = ['wandering', 'exploring', 'playing', 'patrolling'];
        pet.state = states[Math.floor(Math.random() * states.length)];
        const baseX = dorm?.position[0] || 0;
        const baseZ = (dorm?.position[2] || -12) + 9;
        pet.targetPos = [baseX + (Math.random() - 0.5) * 20, 0, baseZ + (Math.random() - 0.5) * 16];
      }

      const dx = pet.targetPos[0] - pet.position[0];
      const dz = pet.targetPos[2] - pet.position[2];
      const dist = Math.hypot(dx, dz);
      let moveSpeed = 0;

      if (dist > 0.45) {
        moveSpeed = pet.state === 'returning_to_charge' ? 3.2 : 2.1;
        const step = Math.min(dist, moveSpeed * dt);
        pet.position[0] += (dx / dist) * step;
        pet.position[2] += (dz / dist) * step;
        pet.rotationY = Math.atan2(dx, dz);
      } else if (pet.state === 'returning_to_charge') {
        pet.state = 'charging_sleeping';
        soundEngine.playChargingHum();
      }

      const insideDorm =
        dorm && Math.hypot(pet.position[0] - dorm.position[0], pet.position[2] - dorm.position[2]) < 8.9;
      pet.position[1] = insideDorm
        ? (dorm?.position[1] || 0) + 0.44
        : this.marsTerrain.groundHeightAt(pet.position[0], pet.position[2]);

      rig.root.position.set(pet.position[0], pet.position[1], pet.position[2]);
      rig.root.rotation.y = pet.rotationY;
      animatePetRig(rig, pet.state, moveSpeed, pet.battery, this.simTime, dt);
    }
  }

  private checkMarsRegionDiscovery() {
    for (const reg of MARS_REGIONS) {
      if (this.currentLevel >= reg.unlockLevel && !this.discoveredRegionIds.has(reg.id)) {
        if (Math.hypot(this.marsPos.x - reg.center[0], this.marsPos.z - reg.center[1]) < reg.radius * 0.85) {
          this.discoveredRegionIds.add(reg.id);
          this.resources.xp += 50;
          soundEngine.playGentleNotif();
          this.addNotification('info', `Discovered ${reg.name}! (+50 XP)`, 'success');
        }
      }
    }
  }

  private normalizeAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  private dampAngle(current: number, target: number, lambda: number, dt: number): number {
    let diff = this.normalizeAngle(target - current);
    if (Math.abs(Math.abs(diff) - Math.PI) < 0.015) {
      diff = Math.PI - 0.015;
    }
    const factor = 1 - Math.exp(-lambda * dt);
    return this.normalizeAngle(current + diff * factor);
  }

  private computeThirdPersonStep(
    dt: number,
    currentYaw: number
  ): { nextYaw: number; moveX: number; moveZ: number; isMoving: boolean } {
    const up = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
    const down = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
    const left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
    const right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);

    const turnInput = (left ? 1 : 0) - (right ? 1 : 0);

    // Reverse key (S / ArrowDown): lock target reverse heading ONCE on press so character smoothly turns and walks away without circular camera spin
    if (down && !up) {
      if (!this.wasPressingReverse || this.reverseTargetYaw === null) {
        this.reverseTargetYaw = this.normalizeAngle(currentYaw + Math.PI);
        this.wasPressingReverse = true;
      }
      if (turnInput !== 0) {
        this.reverseTargetYaw = this.normalizeAngle(this.reverseTargetYaw + turnInput * 1.9 * dt);
      }
      const nextYaw = this.dampAngle(currentYaw, this.reverseTargetYaw, 11, dt);
      return {
        nextYaw,
        moveX: Math.sin(nextYaw),
        moveZ: Math.cos(nextYaw),
        isMoving: true,
      };
    }

    this.wasPressingReverse = false;
    this.reverseTargetYaw = null;

    if (up || left || right) {
      const turnRate = up ? 1.85 : 2.35;
      const nextYaw = this.normalizeAngle(currentYaw + turnInput * turnRate * dt);
      return {
        nextYaw,
        moveX: Math.sin(nextYaw),
        moveZ: Math.cos(nextYaw),
        isMoving: true,
      };
    }

    // Virtual touch joystick fallback for touch devices
    const tx = this.touchMoveVec.x;
    const ty = this.touchMoveVec.y;
    if (Math.hypot(tx, ty) > 0.08) {
      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      const fwd = -ty;
      const vx = -sinY * fwd + cosY * tx;
      const vz = -cosY * fwd - sinY * tx;
      const len = Math.max(0.001, Math.hypot(vx, vz));
      const targetYaw = Math.atan2(vx, vz);
      const nextYaw = this.dampAngle(currentYaw, targetYaw, 11, dt);
      return {
        nextYaw,
        moveX: vx / len,
        moveZ: vz / len,
        isMoving: true,
      };
    }

    return { nextYaw: currentYaw, moveX: 0, moveZ: 0, isMoving: false };
  }

  private realignCameraBehind(targetActorYaw: number, dt: number, rate = 5.4) {
    const manualKeyCam =
      this.keys['KeyJ'] || this.keys['KeyL'] || this.keys['KeyI'] || this.keys['KeyK'];
    if (this.isCameraDragging || manualKeyCam) return;
    const desiredCamYaw = this.normalizeAngle(targetActorYaw + Math.PI);
    this.camYaw = this.dampAngle(this.camYaw, desiredCamYaw, rate, dt);
    this.camPitch = THREE.MathUtils.damp(this.camPitch, 0.25, 2.2, dt);
  }

  private getBuildingDoorCandidate(
    px: number,
    pz: number
  ): { building: PlacedBuilding; handle: BuildingMeshHandle; action: 'enter' | 'exit' } | null {
    for (const b of this.buildings) {
      if (!b.hasInterior) continue;
      const bh = this.buildingHandles.get(b.id);
      if (!bh || bh.doorLocalZ === undefined) continue;
      const [lx, lz] = this.worldToBuildingLocal(b, px, pz);
      const doorZ = bh.doorLocalZ;

      if (this.marsVitals.insideBuildingId === b.id) {
        if (Math.abs(lx) < 2.2 && lz >= doorZ - 2.6 && lz <= doorZ + 0.4) {
          return { building: b, handle: bh, action: 'exit' };
        }
      } else {
        if (Math.abs(lx) < 2.4 && lz >= doorZ - 0.3 && lz <= doorZ + 3.2) {
          return { building: b, handle: bh, action: 'enter' };
        }
      }
    }
    return null;
  }

  private syncMarsInteriorVisibility() {
    this.marsVitals.insideBuildingId = null;
    for (const b of this.buildings) {
      const bh = this.buildingHandles.get(b.id);
      if (!bh) continue;
      const [lx, lz] = this.worldToBuildingLocal(b, this.marsPos.x, this.marsPos.z);

      let inInterior = false;
      if (b.hasInterior) {
        if (b.type === 'dormitory') {
          inInterior = Math.hypot(lx, lz) < 8.4;
        } else if (b.type === 'greenhouse') {
          inInterior = Math.hypot(lx, lz) < 8.2;
        } else if (bh.interiorBounds) {
          inInterior =
            lx >= bh.interiorBounds.minX &&
            lx <= bh.interiorBounds.maxX &&
            lz >= bh.interiorBounds.minZ &&
            lz <= bh.interiorBounds.maxZ;
        }
      }

      const inSterilisation =
        !!bh.sterilisationBounds &&
        lx >= bh.sterilisationBounds.minX - 0.5 &&
        lx <= bh.sterilisationBounds.maxX + 0.5 &&
        lz >= bh.sterilisationBounds.minZ - 0.5 &&
        lz <= bh.sterilisationBounds.maxZ + 0.5;
      const inside = inInterior || inSterilisation;

      if (inside) {
        this.marsVitals.insideBuildingId = b.id;
        if (this.activeHazard === 'radiation_alert') {
          this.completeObjectiveById('m14_shelter');
        }
      }
      bh.roofOrShell.forEach((obj) => {
        obj.visible = !inside;
      });
    }
  }

  private updateMarsDoors(dt: number) {
    for (const b of this.buildings) {
      const bh = this.buildingHandles.get(b.id);
      if (!bh) continue;
      if (b.type !== 'landing_port' && bh.doorGroup && bh.doorLocalZ !== undefined) {
        const [lx, lz] = this.worldToBuildingLocal(b, this.marsPos.x, this.marsPos.z);
        const nearDoor = Math.hypot(lx, lz - bh.doorLocalZ) < 4.2;
        const dL = bh.doorGroup.children[0];
        const dR = bh.doorGroup.children[1];
        dL.position.x = THREE.MathUtils.damp(dL.position.x, nearDoor ? -1.95 : -0.76, 10, dt);
        dR.position.x = THREE.MathUtils.damp(dR.position.x, nearDoor ? 1.95 : 0.76, 10, dt);
      }
    }
  }

  private enterMarsBuilding(b: PlacedBuilding, bh: BuildingMeshHandle) {
    if (this.activeInteraction) this.cancelActiveInteraction(true);
    const doorZ = bh.doorLocalZ ?? 4.5;
    const targetLocalZ = Math.max(0.8, doorZ - 2.2);
    const [wx, wz] = this.buildingLocalToWorld(b, 0, targetLocalZ);
    this.marsPos.set(wx, b.position[1] + 0.44, wz);
    this.ensureSafeMarsStandingPos(this.marsPos);
    this.marsVel.set(0, 0, 0);
    this.marsGrounded = true;
    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;
    this.marsYaw = this.normalizeAngle(b.rotationY + Math.PI);
    this.marsVitals.actionState = 'idle';
    this.syncMarsInteriorVisibility();
    this.camYaw = this.normalizeAngle(this.marsYaw + Math.PI);
    this.camPitch = 0.24;
    soundEngine.playDoor();
  }

  private exitMarsBuilding(b: PlacedBuilding, bh: BuildingMeshHandle) {
    if (this.activeInteraction) this.cancelActiveInteraction(true);
    const doorZ = bh.doorLocalZ ?? 4.5;
    const targetLocalZ = doorZ + 2.2;
    const [wx, wz] = this.buildingLocalToWorld(b, 0, targetLocalZ);
    this.marsPos.set(wx, this.marsTerrain.groundHeightAt(wx, wz), wz);
    this.ensureSafeMarsStandingPos(this.marsPos);
    this.marsVel.set(0, 0, 0);
    this.marsGrounded = true;
    this.reverseTargetYaw = null;
    this.wasPressingReverse = false;
    this.marsYaw = this.normalizeAngle(b.rotationY);
    this.marsVitals.actionState = 'idle';
    this.syncMarsInteriorVisibility();
    this.camYaw = this.normalizeAngle(this.marsYaw + Math.PI);
    this.camPitch = 0.25;
    soundEngine.playDoor();
  }

  private updateMarsPlayer(dt: number) {
    this.checkMarsRegionDiscovery();
    const maxRange = this.getMarsExplorationRange();

    // 1. Driving Mars Rover
    if (this.marsVitals.inRover) {
      const accelInput =
        (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
        (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) -
        this.touchMoveVec.y;
      const steerInput =
        (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) -
        (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
        this.touchMoveVec.x;

      this.roverSteer = THREE.MathUtils.damp(this.roverSteer, steerInput, 10, dt);
      const maxSpeed = 16;
      const targetSpd = accelInput * maxSpeed;
      this.roverSpeed = THREE.MathUtils.damp(this.roverSpeed, targetSpd, 4.5, dt);

      if (Math.abs(this.roverSpeed) > 0.2) {
        this.roverYaw = this.normalizeAngle(
          this.roverYaw + this.roverSteer * (this.roverSpeed >= 0 ? 1 : -1) * 1.45 * dt
        );
      }

      if (Math.abs(accelInput) > 0.05 || Math.abs(this.roverSpeed) > 0.4) {
        this.realignCameraBehind(this.roverYaw, dt, 4.6);
      }

      const nx = this.roverPos.x + Math.sin(this.roverYaw) * this.roverSpeed * dt;
      const nz = this.roverPos.z + Math.cos(this.roverYaw) * this.roverSpeed * dt;
      if (Math.hypot(nx, nz) < maxRange && !this.collidesWithMarsBuildings(nx, nz, 1.8)) {
        this.roverPos.x = nx;
        this.roverPos.z = nz;
      } else {
        this.roverSpeed *= -0.25;
      }

      const ry = this.marsTerrain.groundHeightAt(this.roverPos.x, this.roverPos.z);
      this.roverPos.y = ry;
      this.marsPos.copy(this.roverPos);

      const yf = this.marsTerrain.groundHeightAt(
        this.roverPos.x + Math.sin(this.roverYaw) * 1.4,
        this.roverPos.z + Math.cos(this.roverYaw) * 1.4
      );
      const pitch = Math.atan2(ry - yf, 1.4);

      this.roverRig.root.position.copy(this.roverPos);
      this.roverRig.root.rotation.order = 'YXZ';
      this.roverRig.root.rotation.y = this.roverYaw;
      this.roverRig.root.rotation.x = THREE.MathUtils.damp(this.roverRig.root.rotation.x, pitch, 8, dt);

      const isDarkOrStorm = this.activeHazard === 'dust_storm' || Math.sin(this.timeOfDay * Math.PI * 2) < 0.1;
      animateRoverRig(this.roverRig, this.roverSpeed, this.roverSteer, this.simTime, dt, isDarkOrStorm);
      soundEngine.updateRoverEngine(true, this.roverSpeed);
      this.marsAstronaut.root.visible = false;
      this.marsTerrain.updateChunks(this.roverPos.x, this.roverPos.z);
      this.marsTerrain.updateAtmosphere(this.roverPos.x, this.roverPos.z, dt, this.simTime, this.activeHazard);
      return;
    }

    // 2. Walking / Running Mars Astronaut (Keyboard-first Third-Person Controls)
    soundEngine.stopRoverEngine();
    this.marsAstronaut.root.visible = true;

    if (this.activeInteraction && this.activeInteraction.world === 'mars') {
      this.updateActiveInteraction(dt, 'mars');
      this.syncMarsInteriorVisibility();
      this.updateMarsDoors(dt);
      this.marsTerrain.updateAtmosphere(this.marsPos.x, this.marsPos.z, dt, this.simTime, this.activeHazard);
      return;
    }

    // Automatic passive escape guard if astronaut ever starts a frame overlapping solid geometry
    if (this.collidesWithMarsBuildings(this.marsPos.x, this.marsPos.z, 0.48)) {
      this.ensureSafeMarsStandingPos(this.marsPos);
    }

    const step = this.computeThirdPersonStep(dt, this.marsYaw);
    this.marsYaw = step.nextYaw;

    const isRun = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const maxWalkSpeed = isRun ? 7.8 : 4.6;

    this.marsVel.x = THREE.MathUtils.damp(this.marsVel.x, step.moveX * maxWalkSpeed, 12, dt);
    this.marsVel.z = THREE.MathUtils.damp(this.marsVel.z, step.moveZ * maxWalkSpeed, 12, dt);

    if (step.isMoving) {
      this.realignCameraBehind(this.marsYaw, dt, 5.6);
    }

    if (this.keys['Space'] && this.marsGrounded) {
      this.marsVel.y = 7.2;
      this.marsGrounded = false;
      soundEngine.playJump();
    }
    this.marsVel.y -= 18 * dt;

    const nx = this.marsPos.x + this.marsVel.x * dt;
    const nz = this.marsPos.z + this.marsVel.z * dt;

    if (Math.hypot(nx, nz) < maxRange) {
      if (!this.collidesWithMarsBuildings(nx, this.marsPos.z, 0.52)) {
        this.marsPos.x = nx;
      } else {
        this.marsVel.x = 0;
      }
      if (!this.collidesWithMarsBuildings(this.marsPos.x, nz, 0.52)) {
        this.marsPos.z = nz;
      } else {
        this.marsVel.z = 0;
      }
    }

    const groundY = this.getMarsWalkableFloorY(this.marsPos.x, this.marsPos.z);
    this.marsPos.y += this.marsVel.y * dt;
    if (this.marsPos.y <= groundY) {
      this.marsPos.y = groundY;
      this.marsVel.y = 0;
      this.marsGrounded = true;
    }

    const horizSpeed = Math.hypot(this.marsVel.x, this.marsVel.z);
    if (horizSpeed > 0.35 && this.marsGrounded) {
      soundEngine.playFootstep('mars', horizSpeed > 5.2);
    }

    this.marsVitals.actionState = !this.marsGrounded
      ? 'jump'
      : horizSpeed > 5.2
        ? 'run'
        : horizSpeed > 0.35
          ? 'walk'
          : 'idle';

    this.marsAstronaut.root.position.copy(this.marsPos);
    this.marsAstronaut.root.rotation.y = this.marsYaw;
    animateAstronautRig(
      this.marsAstronaut,
      this.marsVitals.actionState,
      horizSpeed,
      this.simTime,
      dt,
      0,
      this.marsGrounded
    );

    // Camera-aware Interior Roof Visibility, Sliding Doors & Radiation Shelter Check
    this.syncMarsInteriorVisibility();
    this.updateMarsDoors(dt);

    if (this.placementPreview) {
      this.refreshPlacementPreviewValidation();
    }

    this.marsTerrain.updateChunks(this.marsPos.x, this.marsPos.z);
    this.marsTerrain.updateAtmosphere(this.marsPos.x, this.marsPos.z, dt, this.simTime, this.activeHazard);
  }

  private getMarsWalkableFloorY(x: number, z: number): number {
    for (const b of this.buildings) {
      const [lx, lz] = this.worldToBuildingLocal(b, x, z);
      if (b.type === 'dormitory' && Math.hypot(lx, lz) < 9.1) {
        return b.position[1] + 0.44;
      }
      if (b.type === 'greenhouse' && Math.hypot(lx, lz) < 8.7) {
        return b.position[1] + 0.44;
      }
      if (b.hasInterior && b.type !== 'dormitory' && b.type !== 'greenhouse') {
        if (Math.abs(lx) <= 4.7 && Math.abs(lz) <= 4.7) {
          return b.position[1] + 0.44;
        }
      }
      if (b.type === 'landing_port') {
        if (Math.abs(lx) <= 4.5 && lz >= 8.4 && lz <= 17.6) {
          return b.position[1] + 0.23;
        }
        if (Math.hypot(lx, lz) < 9.5) {
          return b.position[1] + 0.3;
        }
      }
    }
    return this.marsTerrain.groundHeightAt(x, z);
  }

  private collidesWithMarsBuildings(x: number, z: number, r: number): boolean {
    for (const b of this.buildings) {
      const [lx, lz] = this.worldToBuildingLocal(b, x, z);
      const dist = Math.hypot(lx, lz);
      const bh = this.buildingHandles.get(b.id);

      // Detailed interior furniture, perimeter walls, side tanks & prop colliders
      if (bh) {
        for (const box of bh.localBoxColliders) {
          if (lx + r > box.minX && lx - r < box.maxX && lz + r > box.minZ && lz - r < box.maxZ) {
            return true;
          }
        }
        for (const cyl of bh.localCylColliders) {
          if (Math.hypot(lx - cyl.x, lz - cyl.z) < cyl.radius + r) {
            return true;
          }
        }
      }

      if (b.type === 'dormitory') {
        const inFrontDoor = lz > 5.8 && Math.abs(lx) < 1.65;
        if (!inFrontDoor && dist > 7.9 && dist < 8.9 + r) return true;
        continue;
      }
      if (b.type === 'greenhouse') {
        const inFrontDoor = lz > 5.6 && Math.abs(lx) < 1.65;
        if (!inFrontDoor && dist > 7.8 && dist < 8.7 + r) return true;
        continue;
      }
      if (b.type === 'landing_port') {
        const inFrontGate = Math.abs(lx) < 4.5 && lz > 6.5;
        if (!inFrontGate && dist > 9.4 && dist < 10.4 + r) return true;
        continue;
      }

      // Modular enterable buildings use their actual wall/interior localBoxColliders above
      if (b.hasInterior) {
        continue;
      }

      // Exterior-only solar arrays use rotated OBB solid footprint collision
      const fp = getBuildingFootprint(b.type);
      for (const shape of fp.shapes) {
        if (shape.kind === 'box') {
          if (Math.abs(lx - shape.lx) < shape.halfW + r && Math.abs(lz - shape.lz) < shape.halfD + r) {
            return true;
          }
        } else if (Math.hypot(lx - shape.lx, lz - shape.lz) < shape.radius + r) {
          return true;
        }
      }
    }

    // Solid Mars Rock & Landmark Colliders (decorative shrubs are non-solid and skipped)
    for (const rc of this.marsTerrain.rockColliders) {
      if (Math.hypot(x - rc.x, z - rc.z) < rc.radius + r) {
        return true;
      }
    }
    return false;
  }

  private updateEarthPlayer(dt: number) {
    // Animate Automatic Launch Facility Blast Gate at (32, 0)
    const gate = this.earthFacility.launchGateGroup;
    if (gate && gate.children.length >= 5) {
      const nearGate = Math.hypot(this.earthPos.x - 32, this.earthPos.z) < 7.5;
      const leafL = gate.children[3];
      const leafR = gate.children[4];
      leafL.position.z = THREE.MathUtils.damp(leafL.position.z, nearGate ? -3.45 : -1.35, 9, dt);
      leafR.position.z = THREE.MathUtils.damp(leafR.position.z, nearGate ? 3.45 : 1.35, 9, dt);
    }

    if (this.activeInteraction && this.activeInteraction.world === 'earth') {
      this.updateActiveInteraction(dt, 'earth');
      return;
    }

    if (this.collidesWithEarthWalls(this.earthPos.x, this.earthPos.z, 0.48)) {
      this.ensureSafeEarthStandingPos(this.earthPos);
    }

    const step = this.computeThirdPersonStep(dt, this.earthYaw);
    this.earthYaw = step.nextYaw;

    const isRun = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const maxWalkSpeed = isRun ? 7.6 : 4.8;

    this.earthVel.x = THREE.MathUtils.damp(this.earthVel.x, step.moveX * maxWalkSpeed, 12, dt);
    this.earthVel.z = THREE.MathUtils.damp(this.earthVel.z, step.moveZ * maxWalkSpeed, 12, dt);

    if (step.isMoving) {
      this.realignCameraBehind(this.earthYaw, dt, 5.6);
    }

    if (this.keys['Space'] && this.earthGrounded) {
      this.earthVel.y = 6.8;
      this.earthGrounded = false;
      soundEngine.playJump();
    }
    this.earthVel.y -= 18 * dt;

    const nx = this.earthPos.x + this.earthVel.x * dt;
    const nz = this.earthPos.z + this.earthVel.z * dt;

    if (!this.collidesWithEarthWalls(nx, this.earthPos.z, 0.5)) {
      this.earthPos.x = nx;
    } else {
      this.earthVel.x = 0;
    }
    if (!this.collidesWithEarthWalls(this.earthPos.x, nz, 0.5)) {
      this.earthPos.z = nz;
    } else {
      this.earthVel.z = 0;
    }

    this.earthPos.y += this.earthVel.y * dt;
    if (this.earthPos.y <= 0) {
      this.earthPos.y = 0;
      this.earthVel.y = 0;
      this.earthGrounded = true;
    }

    const horizSpeed = Math.hypot(this.earthVel.x, this.earthVel.z);
    if (horizSpeed > 0.35 && this.earthGrounded) {
      soundEngine.playFootstep('earth', horizSpeed > 5.2);
    }

    if (this.earthLogistics.trolleyAttached) {
      const tx = this.earthPos.x + Math.sin(this.earthYaw) * 1.45;
      const tz = this.earthPos.z + Math.cos(this.earthYaw) * 1.45;
      this.earthLogistics.trolleyPos = [tx, 0, tz];
      this.earthFacility.trolleyGroup.position.set(tx, 0, tz);
      this.earthFacility.trolleyGroup.rotation.y = this.earthYaw;
    }

    this.earthVitals.actionState = !this.earthGrounded
      ? 'jump'
      : horizSpeed > 5.2
        ? 'run'
        : horizSpeed > 0.35
          ? 'walk'
          : 'idle';

    this.earthAstronaut.root.position.copy(this.earthPos);
    this.earthAstronaut.root.rotation.y = this.earthYaw;
    animateAstronautRig(
      this.earthAstronaut,
      this.earthVitals.actionState,
      horizSpeed,
      this.simTime,
      dt,
      0,
      this.earthGrounded
    );
  }

  private collidesWithEarthWalls(x: number, z: number, r: number): boolean {
    if (x < -23.4 || x > 51.4 || z < -57.4 || z > 21.4) return true;
    for (const w of this.earthFacility.wallColliders) {
      if (x + r > w.minX && x - r < w.maxX && z + r > w.minZ && z - r < w.maxZ) {
        return true;
      }
    }
    for (const c of this.earthFacility.cylColliders) {
      if (Math.hypot(x - c.x, z - c.z) < c.radius + r) {
        return true;
      }
    }
    for (const room of EARTH_ROOMS) {
      if (this.currentLevel < room.unlockLevel) {
        const doors = this.earthFacility.roomLockDoors.get(room.id);
        if (doors) {
          for (const door of doors) {
            const rotated = Math.abs(Math.sin(door.rotation.y)) > 0.5;
            const halfX = rotated ? 0.35 : 2.15;
            const halfZ = rotated ? 2.15 : 0.35;
            if (
              Math.abs(x - door.position.x) < halfX + r &&
              Math.abs(z - door.position.z) < halfZ + r
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private segmentHitsAABB3D(
    ox: number,
    oy: number,
    oz: number,
    ex: number,
    ey: number,
    ez: number,
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): number {
    const dx = ex - ox;
    const dy = ey - oy;
    const dz = ez - oz;
    let tmin = 0;
    let tmax = 1;

    const slab = (p0: number, dp: number, minB: number, maxB: number): boolean => {
      if (Math.abs(dp) < 1e-6) {
        return p0 >= minB && p0 <= maxB;
      }
      let t1 = (minB - p0) / dp;
      let t2 = (maxB - p0) / dp;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      return tmin <= tmax;
    };

    if (!slab(ox, dx, minX, maxX)) return 1;
    if (!slab(oy, dy, minY, maxY)) return 1;
    if (!slab(oz, dz, minZ, maxZ)) return 1;
    return tmin >= 0 && tmin <= 1 ? tmin : 1;
  }

  private segmentHitsCircle2D(
    ox: number,
    oz: number,
    ex: number,
    ez: number,
    cx: number,
    cz: number,
    r: number
  ): number {
    const dx = ex - ox;
    const dz = ez - oz;
    const fx = ox - cx;
    const fz = oz - cz;
    const a = dx * dx + dz * dz;
    if (a < 1e-6) return 1;
    const b = 2 * (fx * dx + fz * dz);
    const c = fx * fx + fz * fz - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return 1;
    const sq = Math.sqrt(disc);
    const t1 = (-b - sq) / (2 * a);
    if (t1 >= 0 && t1 <= 1) return t1;
    return 1;
  }

  private computeClippedCameraFraction(
    ox: number,
    oy: number,
    oz: number,
    ex: number,
    ey: number,
    ez: number
  ): number {
    let bestT = 1.0;

    if (this.activeWorld === 'earth') {
      const pad = 0.2;
      for (const w of this.earthFacility.wallColliders) {
        if (!w.blocksCamera) continue;
        const t = this.segmentHitsAABB3D(
          ox,
          oy,
          oz,
          ex,
          ey,
          ez,
          w.minX - pad,
          0,
          w.minZ - pad,
          w.maxX + pad,
          w.height ?? 3.6,
          w.maxZ + pad
        );
        if (t < bestT) bestT = t;
      }
      for (const room of EARTH_ROOMS) {
        if (this.currentLevel < room.unlockLevel) {
          const doors = this.earthFacility.roomLockDoors.get(room.id);
          if (doors) {
            for (const door of doors) {
              const rotated = Math.abs(Math.sin(door.rotation.y)) > 0.5;
              const hx = (rotated ? 0.25 : 2.1) + pad;
              const hz = (rotated ? 2.1 : 0.25) + pad;
              const t = this.segmentHitsAABB3D(
                ox,
                oy,
                oz,
                ex,
                ey,
                ez,
                door.position.x - hx,
                0,
                door.position.z - hz,
                door.position.x + hx,
                3.0,
                door.position.z + hz
              );
              if (t < bestT) bestT = t;
            }
          }
        }
      }
    } else {
      const pad = 0.22;
      for (const b of this.buildings) {
        if (Math.hypot(ox - b.position[0], oz - b.position[2]) > 30) continue;
        const bh = this.buildingHandles.get(b.id);
        if (!bh) continue;
        const [lox, loz] = this.worldToBuildingLocal(b, ox, oz);
        const [lex, lez] = this.worldToBuildingLocal(b, ex, ez);
        for (const box of bh.cameraWallBoxes) {
          const t = this.segmentHitsAABB3D(
            lox,
            oy,
            loz,
            lex,
            ey,
            lez,
            box.minX - pad,
            b.position[1],
            box.minZ - pad,
            box.maxX + pad,
            b.position[1] + box.height,
            box.maxZ + pad
          );
          if (t < bestT) bestT = t;
        }
      }
      for (const rc of this.marsTerrain.rockColliders) {
        if (Math.hypot(ox - rc.x, oz - rc.z) > 22) continue;
        const t = this.segmentHitsCircle2D(ox, oz, ex, ez, rc.x, rc.z, rc.radius + 0.25);
        if (t < bestT && oy < this.marsTerrain.groundHeightAt(rc.x, rc.z) + 2.8) {
          bestT = t;
        }
      }
    }

    return Math.max(0.24, bestT);
  }

  private updateActiveCamera(dt: number) {
    if (this.activeWorld === 'earth' && this.launchCinematicTimer > 0) {
      const rocketY = this.earthFacility.rocketGroup.position.y;
      _camDesired.set(20, 6.5 + rocketY * 0.3, 18);
      _camTarget.set(42, 4 + rocketY * 0.85, 0);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-5 * dt));
      this.camera.lookAt(_camTarget);
      return;
    }

    // Optional keyboard inspection keys (J/L rotate yaw, I/K tilt pitch)
    if (this.screen === 'playing' && !this.activeMiniGame) {
      if (this.keys['KeyJ']) this.camYaw = this.normalizeAngle(this.camYaw + 1.9 * dt);
      if (this.keys['KeyL']) this.camYaw = this.normalizeAngle(this.camYaw - 1.9 * dt);
      if (this.keys['KeyI']) this.camPitch = THREE.MathUtils.clamp(this.camPitch - 1.2 * dt, 0.08, 1.05);
      if (this.keys['KeyK']) this.camPitch = THREE.MathUtils.clamp(this.camPitch + 1.2 * dt, 0.08, 1.05);
    }

    const actor = this.activeWorld === 'mars' ? this.marsPos : this.earthPos;
    const isEarthTunnel =
      this.activeWorld === 'earth' &&
      actor.x >= 5.5 &&
      actor.x <= 22.5 &&
      Math.abs(actor.z) <= 3.5;
    const isEarthInterior = this.activeWorld === 'earth' && actor.x < 32.5;
    const isMarsInterior = this.activeWorld === 'mars' && !!this.marsVitals.insideBuildingId;
    const isIndoor = isMarsInterior || isEarthInterior;

    let baseDist = this.camDist;
    if (this.marsVitals.inRover) {
      baseDist = THREE.MathUtils.clamp(this.camDist * 1.4, 6.4, 10.5);
    } else if (isEarthTunnel) {
      baseDist = THREE.MathUtils.clamp(this.camDist * 0.5, 2.2, 2.9);
    } else if (isIndoor) {
      baseDist = THREE.MathUtils.clamp(this.camDist * 0.62, 2.6, 3.6);
    } else if (this.activeWorld === 'earth') {
      baseDist = THREE.MathUtils.clamp(this.camDist * 0.9, 4.0, 6.2);
    } else {
      baseDist = THREE.MathUtils.clamp(this.camDist, 3.6, 8.5);
    }

    const targetY = actor.y + (this.marsVitals.inRover ? 1.8 : 1.48);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);
    const shoulderOffset = this.marsVitals.inRover ? 0 : isIndoor ? 0.22 : 0.36;

    const horizDist = Math.cos(this.camPitch) * baseDist;
    const vertDist = Math.sin(this.camPitch) * baseDist;
    const desiredX = actor.x + rightX * shoulderOffset + Math.sin(this.camYaw) * horizDist;
    const desiredZ = actor.z + rightZ * shoulderOffset + Math.cos(this.camYaw) * horizDist;
    const desiredY = targetY + vertDist;

    const clipT = this.computeClippedCameraFraction(
      actor.x,
      targetY,
      actor.z,
      desiredX,
      desiredY,
      desiredZ
    );
    const clippedDist = Math.max(1.15, baseDist * clipT - (clipT < 0.99 ? 0.12 : 0));
    const smoothLambda = clippedDist < this.smoothedCamDist ? 18 : 7.5;
    this.smoothedCamDist = THREE.MathUtils.damp(this.smoothedCamDist, clippedDist, smoothLambda, dt);

    const finalFrac = this.smoothedCamDist / Math.max(0.01, baseDist);
    let cx = THREE.MathUtils.lerp(actor.x, desiredX, finalFrac);
    let cz = THREE.MathUtils.lerp(actor.z, desiredZ, finalFrac);
    let cy = THREE.MathUtils.lerp(targetY, desiredY, finalFrac);

    if (this.activeWorld === 'mars') {
      let minClearY = this.marsTerrain.groundHeightAt(cx, cz) + 0.55;
      for (let s = 1; s <= 4; s++) {
        const f = s / 4;
        const sx = THREE.MathUtils.lerp(actor.x, cx, f);
        const sz = THREE.MathUtils.lerp(actor.z, cz, f);
        minClearY = Math.max(minClearY, this.marsTerrain.groundHeightAt(sx, sz) + 0.45);
      }
      cy = Math.max(cy, minClearY);
    } else {
      cy = Math.max(cy, 1.05);
    }

    _camTarget.set(
      actor.x + rightX * shoulderOffset * finalFrac,
      targetY,
      actor.z + rightZ * shoulderOffset * finalFrac
    );
    _camDesired.set(cx, cy, cz);
    this.camera.position.lerp(_camDesired, 1 - Math.exp(-16 * dt));
    this.camera.lookAt(_camTarget);
  }

  private findClosestEarthExhibit(px: number, pz: number) {
    let bestSpot = null;
    let bestDist = Infinity;
    for (const ex of this.earthFacility.exhibits) {
      const d = Math.hypot(px - ex.x, pz - ex.z);
      if (d < ex.radius && d < bestDist) {
        bestDist = d;
        bestSpot = ex;
      }
    }
    return bestSpot;
  }

  private updateNearbyPrompt() {
    this.nearbyPrompt = null;
    this.nearbyExhibit = null;
    if (this.activeInteraction) {
      if (this.activeInteraction.cancelable) {
        this.nearbyPrompt = {
          label:
            this.activeInteraction.kind === 'sleep'
              ? 'Wake Up & Get Out of Bed'
              : `Cancel ${this.activeInteraction.label}`,
          key: 'E',
          actionId: 'cancel_interaction',
        };
      }
      return;
    }
    if (this.activeWorld === 'mars') {
      if (this.marsVitals.inRover) {
        this.nearbyPrompt = { label: 'Exit Rover', key: 'E', actionId: 'rover_exit' };
        return;
      }
      const px = this.marsPos.x;
      const pz = this.marsPos.z;
      if (this.roverUnlocked && Math.hypot(px - this.roverPos.x, pz - this.roverPos.z) < 4.5) {
        this.nearbyPrompt = { label: 'Drive Mars Rover', key: 'E', actionId: 'rover_enter' };
        return;
      }
      for (const pet of this.pets) {
        if (pet.state === 'stranded_rescue' && Math.hypot(px - pet.position[0], pz - pet.position[2]) < 5.0) {
          this.nearbyPrompt = { label: `Rescue ${pet.name}`, key: 'E', actionId: 'rescue_pet' };
          return;
        }
        if (Math.hypot(px - pet.position[0], pz - pet.position[2]) < 3.0) {
          this.nearbyPrompt = { label: `Pet ${pet.name}`, key: 'E', actionId: 'pet' };
          return;
        }
      }
      for (const met of this.meteorites) {
        if (!met.collected && Math.hypot(px - met.x, pz - met.z) < 5.5) {
          this.nearbyPrompt = { label: 'Collect Meteorite Sample', key: 'E', actionId: 'meteor' };
          return;
        }
      }
      for (const d of this.discoveries) {
        if (!d.collected && Math.hypot(px - d.x, pz - d.z) < 3.4) {
          this.nearbyPrompt = { label: 'Pick Up Mineral Sample', key: 'E', actionId: 'sample' };
          return;
        }
      }
      const dorm = this.buildings.find((b) => b.type === 'dormitory');
      if (dorm) {
        const [bedX, bedZ] = this.buildingLocalToWorld(dorm, -4.2, -3.5);
        if (Math.hypot(px - bedX, pz - bedZ) < 3.0) {
          this.nearbyPrompt = { label: 'Sleep in Bed', key: 'E', actionId: 'sleep' };
          return;
        }
        const [dineX, dineZ] = this.buildingLocalToWorld(dorm, 3.8, 2.5);
        if (Math.hypot(px - dineX, pz - dineZ) < 3.0) {
          this.nearbyPrompt = { label: 'Eat Meal', key: 'E', actionId: 'eat' };
          return;
        }
      }
      const port = this.buildings.find((b) => b.type === 'landing_port');
      if (port) {
        const [lx, lz] = this.worldToBuildingLocal(port, px, pz);
        if (Math.hypot(lx - 3.2, lz - 13.0) < 2.8) {
          this.nearbyPrompt = {
            label: 'Scan Sterilisation Sample',
            key: 'E',
            actionId: 'steril_scan',
          };
          return;
        }
        if (this.marsCapsule.arrived && !this.marsCapsule.unlocked && Math.hypot(lx, lz) < 5.6) {
          this.nearbyPrompt = {
            label:
              this.missionStage === 'mars_unlock_capsule'
                ? `Unlock Capsule (${this.marsCapsule.unlockCost} Coins)`
                : 'Return to Mars Base First',
            key: 'E',
            actionId: 'unlock_capsule',
          };
          return;
        }
      }

      // Enter or Exit any enterable colony building via E
      const doorCandidate = this.getBuildingDoorCandidate(px, pz);
      if (doorCandidate) {
        this.nearbyPrompt = {
          label:
            doorCandidate.action === 'enter'
              ? `Enter ${doorCandidate.building.name}`
              : `Exit ${doorCandidate.building.name}`,
          key: 'E',
          actionId: `${doorCandidate.action}_building`,
        };
        return;
      }

      for (const b of this.buildings) {
        const [lx, lz] = this.worldToBuildingLocal(b, px, pz);
        const isInsideThis = this.marsVitals.insideBuildingId === b.id;

        if (b.type === 'solar_array' && Math.hypot(lx, lz) < 5.6) {
          this.nearbyPrompt = {
            label: 'Clean / Inspect Solar Array (Exterior)',
            key: 'E',
            actionId: 'clean',
          };
          return;
        }
        if (!isInsideThis) continue;

        if (b.type === 'warehouse') {
          this.nearbyPrompt = {
            label: this.marsVitals.carryingItem
              ? `Store ${this.marsVitals.carryingItem}`
              : 'Inspect Warehouse Inventory',
            key: 'E',
            actionId: 'store',
          };
          return;
        }
        if (b.type === 'greenhouse') {
          const label = !b.cropPlanted
            ? 'Plant & Water Crops'
            : (b.cropGrowth || 0) >= 95
              ? 'Harvest Crops'
              : 'Water Growing Crops';
          this.nearbyPrompt = { label, key: 'E', actionId: 'greenhouse' };
          return;
        }
        if (b.type === 'food_processor' && this.resources.rawCrops > 0) {
          this.nearbyPrompt = { label: 'Process Crops into Meals', key: 'E', actionId: 'food' };
          return;
        }
        if (b.type === 'waste_processor' && this.resources.waste > 0) {
          this.nearbyPrompt = { label: 'Recycle Waste', key: 'E', actionId: 'waste' };
          return;
        }
        if (b.type !== 'dormitory' && b.type !== 'landing_port' && Math.hypot(lx, lz + 2.1) < 3.4) {
          this.nearbyPrompt = {
            label: `Operate ${b.name} Console`,
            key: 'E',
            actionId: 'operate_facility',
          };
          return;
        }
      }
    } else {
      const px = this.earthPos.x;
      const pz = this.earthPos.z;
      const log = this.earthLogistics;

      const closestEx = this.findClosestEarthExhibit(px, pz);
      if (closestEx) {
        this.nearbyExhibit = closestEx.info;
        this.nearbyPrompt = { label: `Inspect: ${closestEx.info.title}`, key: 'E', actionId: 'exhibit' };
        return;
      }

      if (log.stage === 'collect_parts') {
        for (let i = 0; i < this.earthFacility.partPickups.length; i++) {
          const p = this.earthFacility.partPickups[i];
          if (p.visible && Math.hypot(px - p.position.x, pz - p.position.z) < 2.6) {
            this.nearbyPrompt = { label: `Pick Up ${log.requiredParts[i]}`, key: 'E', actionId: 'pick_part' };
            return;
          }
        }
        if (this.earthVitals.carryingItem && Math.hypot(px - log.trolleyPos[0], pz - log.trolleyPos[2]) < 2.8) {
          this.nearbyPrompt = { label: 'Load Part onto Trolley', key: 'E', actionId: 'load_trolley' };
          return;
        }
      }
      if (log.stage === 'transport_to_lab' && Math.hypot(px - log.trolleyPos[0], pz - log.trolleyPos[2]) < 2.8) {
        const atBench = Math.hypot(px - -3.5, pz - -1.5) < 4.5;
        this.nearbyPrompt = {
          label: atBench ? 'Unload Parts onto Workstation' : log.trolleyAttached ? 'Release Trolley' : 'Push Trolley',
          key: 'E',
          actionId: 'trolley',
        };
        return;
      }
      if (log.stage === 'assemble_prototype' && Math.hypot(px - -3.5, pz - -1.5) < 3.4) {
        this.nearbyPrompt = { label: `Assemble ${log.prototypeName}`, key: 'E', actionId: 'assemble' };
        return;
      }
      if (log.stage === 'test_prototype' && Math.hypot(px - 2, pz - -4.5) < 3.4) {
        this.nearbyPrompt = {
          label: log.testActive
            ? `Testing... ${Math.ceil(30 - log.testProgress)}s remaining`
            : log.testComplete
              ? `Pick Up Tested ${log.prototypeName}`
              : 'Start 30s Prototype Test',
          key: 'E',
          actionId: 'test',
        };
        return;
      }
      if ((log.stage === 'carry_to_capsule' || log.stage === 'lock_capsule') && Math.hypot(px - 42, pz) < 5.8) {
        this.nearbyPrompt = {
          label: log.stage === 'carry_to_capsule' ? 'Load Prototype into Capsule' : 'Lock Capsule Hatch',
          key: 'E',
          actionId: 'capsule_bay',
        };
        return;
      }
      if (log.stage === 'walk_to_launch_control' && Math.hypot(px - 28, pz - 14) < 3.6) {
        this.nearbyPrompt = { label: 'PRESS RED LAUNCH BUTTON', key: 'E', actionId: 'launch' };
        return;
      }
      const rooms = [
        { x: -17, z: -15.5, minLvl: 3, label: 'Hydroponics & Crop Lab' },
        { x: -2, z: -15.5, minLvl: 1, label: 'Water Analysis & Microscopy' },
        { x: -17, z: 15.5, minLvl: 2, label: 'Energy & Solar Testing' },
        { x: -2, z: 15.5, minLvl: 6, label: 'Radiation Shielding Test' },
        { x: 13, z: -15, minLvl: 8, label: 'Equipment & Robotics Bench' },
        { x: 13, z: 15, minLvl: 5, label: 'Oxygen Research Console' },
        { x: 28, z: -14, minLvl: 1, label: 'Mission Control Telemetry' },
      ];
      for (const r of rooms) {
        if (this.currentLevel >= r.minLvl && Math.hypot(px - r.x, pz - r.z) < 4.2) {
          this.nearbyPrompt = { label: r.label, key: 'E', actionId: 'earth_lab' };
          return;
        }
      }
    }
  }

  private getCurrentEarthRoomName(): string {
    // Check more specific Workstation subzone inside Main Lab first
    const ws = EARTH_ROOMS.find((r) => r.id === 'workstation_hub');
    if (
      ws &&
      this.earthPos.x >= ws.bounds.x1 &&
      this.earthPos.x <= ws.bounds.x2 &&
      this.earthPos.z >= ws.bounds.z1 &&
      this.earthPos.z <= ws.bounds.z2
    ) {
      return ws.name;
    }
    for (const r of EARTH_ROOMS) {
      if (r.id === 'workstation_hub') continue;
      if (
        this.earthPos.x >= r.bounds.x1 &&
        this.earthPos.x <= r.bounds.x2 &&
        this.earthPos.z >= r.bounds.z1 &&
        this.earthPos.z <= r.bounds.z2
      ) {
        return r.name;
      }
    }
    return 'Earth Research Campus';
  }

  private getCurrentMarsLocationLabel(): string {
    const port = this.buildings.find((b) => b.type === 'landing_port');
    if (port) {
      const [lx, lz] = this.worldToBuildingLocal(port, this.marsPos.x, this.marsPos.z);
      if (Math.abs(lx) <= 4.5 && lz >= 8.4 && lz <= 17.6) {
        return 'Mars · Sterilisation Room';
      }
      if (Math.hypot(lx, lz) < 10.2) {
        return 'Mars · Landing Station';
      }
    }
    const insideBld = this.buildings.find((b) => b.id === this.marsVitals.insideBuildingId);
    if (insideBld) return `Mars · ${insideBld.name}`;
    for (let i = MARS_REGIONS.length - 1; i >= 0; i--) {
      const reg = MARS_REGIONS[i];
      if (Math.hypot(this.marsPos.x - reg.center[0], this.marsPos.z - reg.center[1]) < reg.radius * 0.78) {
        return `Mars · ${reg.name}`;
      }
    }
    return 'Mars · Surface Frontier';
  }

  private getNextObjectiveHintAndUpdateBeacons(): string | null {
    // Update Earth & Mars 3D directional beacons based on mission stage
    this.earthFacility.targetBeacon.visible = false;
    this.marsTargetBeacon.visible = false;

    if (this.activeWorld === 'earth') {
      const log = this.earthLogistics;
      let target: [number, number] | null = null;
      let hint = '';
      if (log.stage === 'collect_parts') {
        target = [-17, 0];
        hint = 'Enter INVENTORY & STORAGE (blue wing) to load 3 parts onto Trolley';
      } else if (log.stage === 'transport_to_lab') {
        target = [-3.5, -1.5];
        hint = 'Push Trolley to WORKSTATION in RESEARCH LABORATORY';
      } else if (log.stage === 'assemble_prototype') {
        target = [-3.5, -1.5];
        hint = 'Assemble prototype at WORKSTATION bench';
      } else if (log.stage === 'test_prototype') {
        target = [2, -4.5];
        hint = log.testComplete
          ? 'Pick up certified prototype from Testing Station'
          : log.testActive
            ? `Testing prototype (${Math.ceil(30 - log.testProgress)}s left)`
            : 'Start 30s test at Testing Station';
      } else if (log.stage === 'carry_to_capsule' || log.stage === 'lock_capsule') {
        target = [42, 0];
        hint = 'Walk through CARGO PREPARATION & Gate into LAUNCH FACILITY';
      } else if (log.stage === 'walk_to_launch_control' || log.stage === 'press_launch') {
        target = [28, 14];
        hint = 'Go to LAUNCH CONTROL DECK & press Red Launch Button';
      } else {
        hint = 'Spacecraft departing Earth — stand by for Mars arrival';
      }
      if (target) {
        this.earthFacility.targetBeacon.visible = true;
        this.earthFacility.targetBeacon.position.set(target[0], 0.04, target[1]);
        this.earthFacility.targetBeacon.rotation.y = this.simTime * 1.6;
      }
      return hint;
    }

    // Mars stage-accurate guidance
    const dorm = this.buildings.find((b) => b.type === 'dormitory');
    const port = this.buildings.find((b) => b.type === 'landing_port');
    if (this.missionStage === 'mars_arrival' || this.missionStage === 'mars_return_base') {
      if (dorm) {
        this.marsTargetBeacon.visible = true;
        this.marsTargetBeacon.position.set(dorm.position[0], dorm.position[1] + 0.1, dorm.position[2] + 9.5);
        this.marsTargetBeacon.rotation.y = this.simTime * 1.6;
      }
      return this.missionStage === 'mars_arrival'
        ? 'Exit the Landing Station toward your Mars Base'
        : 'Return to Colony Dormitory (Mars Base)';
    }

    if (this.missionStage === 'mars_unlock_capsule' && this.marsCapsule.arrived && !this.marsCapsule.unlocked) {
      if (port) {
        this.marsTargetBeacon.visible = true;
        this.marsTargetBeacon.position.set(port.position[0], port.position[1] + 0.25, port.position[2]);
        this.marsTargetBeacon.rotation.y = this.simTime * 1.6;
      }
      return 'Return to Mars Landing Station & unlock your Earth cargo capsule';
    }

    const nextMarsObj = this.levelObjectives.find((o) => o.world === 'mars' && !o.completed);
    if (nextMarsObj?.targetPos) {
      const tx = nextMarsObj.targetPos[0];
      const tz = nextMarsObj.targetPos[2];
      this.marsTargetBeacon.visible = true;
      this.marsTargetBeacon.position.set(tx, this.marsTerrain.groundHeightAt(tx, tz) + 0.12, tz);
      this.marsTargetBeacon.rotation.y = this.simTime * 1.6;
    }
    return nextMarsObj?.label || 'Explore unlocked Martian regions or build colony facilities';
  }

  private pushHud(force: boolean) {
    if (!force && this.disposed) return;
    this.lastHudPush = performance.now();
    if (this.speechBubble && performance.now() > this.speechBubble.expiresAt) {
      this.speechBubble = null;
    }

    const activeBld =
      this.activeWorld === 'mars'
        ? this.buildings.find((b) => b.id === this.marsVitals.insideBuildingId)?.name || null
        : this.getCurrentEarthRoomName();

    const currentLocationLabel =
      this.activeWorld === 'earth' ? `Earth · ${activeBld}` : this.getCurrentMarsLocationLabel();
    const nextObjectiveHint = this.getNextObjectiveHintAndUpdateBeacons();
    const unlockedRegions = MARS_REGIONS.filter((r) => this.currentLevel >= r.unlockLevel).length;

    this.onHudUpdate({
      screen: this.screen,
      activeWorld: this.activeWorld,
      currentLevel: this.currentLevel,
      simDay: this.simDay,
      timeOfDay: this.timeOfDay,
      missionStage: this.missionStage,
      tutorialHint: this.tutorialHint,
      currentLocationLabel,
      nextObjectiveHint,
      activeExhibit: this.activeExhibit,
      nearbyExhibit: this.nearbyExhibit,
      resources: { ...this.resources },
      marsVitals: { ...this.marsVitals },
      earthVitals: { ...this.earthVitals },
      marsPos: [this.marsPos.x, this.marsPos.y, this.marsPos.z],
      earthPos: [this.earthPos.x, this.earthPos.y, this.earthPos.z],
      roverPos: [this.roverPos.x, this.roverPos.y, this.roverPos.z],
      roverUnlocked: this.roverUnlocked,
      roverSpeed: this.roverSpeed,
      buildings: this.buildings.map((b) => ({ ...b })),
      roads: this.roads.map((r) => ({ ...r })),
      pets: this.pets.map((p) => ({ ...p })),
      meteorites: this.meteorites.map((m) => ({ ...m })),
      activeHazard: this.activeHazard,
      hazardTimer: this.hazardTimer,
      earthLogistics: { ...this.earthLogistics },
      marsCapsule: { ...this.marsCapsule },
      levelObjectives: this.levelObjectives.map((o) => ({ ...o })),
      equippedMarsSuit: this.equippedMarsSuit,
      equippedEarthUniform: this.equippedEarthUniform,
      ownedItems: Array.from(this.ownedItems),
      unlockedRegions,
      discoveredRegionIds: Array.from(this.discoveredRegionIds),
      fullWorldUnlocked: this.currentLevel >= 15,
      nearbyPrompt: this.nearbyPrompt,
      activeInteraction: this.activeInteraction
        ? {
            kind: this.activeInteraction.kind,
            label: this.activeInteraction.label,
            phase:
              this.activeInteraction.elapsed / this.activeInteraction.duration < this.activeInteraction.enterEnd
                ? 'entering'
                : this.activeInteraction.elapsed / this.activeInteraction.duration >= this.activeInteraction.exitStart
                  ? 'exiting'
                  : 'active',
            cancelable: this.activeInteraction.cancelable,
          }
        : null,
      activeBuildingName: activeBld,
      notifications: [...this.notifications],
      activeMiniGame: this.activeMiniGame,
      sustainabilityDayCount: this.sustainabilityDays,
      muted: soundEngine.isMuted(),
      volume: soundEngine.getVolume(),
      audioVolumes: soundEngine.getChannelVolumes(),
      relocatingBuildingId: this.relocatingBuildingId,
      placementPreview: this.placementPreview ? { ...this.placementPreview, position: [...this.placementPreview.position] as [number, number, number] } : null,
      roadBuildMode: this.roadBuildMode,
      pendingRoadPoints: [...this.pendingRoadPoints],
      selectedMapTarget: this.selectedMapTarget,
      speechBubble: this.speechBubble,
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    soundEngine.stopRoverEngine();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mouseup', this.onMouseUp);
    const dom = this.renderer.domElement;
    dom.removeEventListener('mousedown', this.onMouseDown);
    dom.removeEventListener('mousemove', this.onMouseMove);
    dom.removeEventListener('click', this.onCanvasClick);
    dom.removeEventListener('wheel', this.onWheel);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
