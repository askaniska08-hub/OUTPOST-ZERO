export type WorldId = 'mars' | 'earth';

export type GameScreen = 'title' | 'playing' | 'paused' | 'victory';

export type SuitId =
  | 'mars_artemis'
  | 'mars_terracotta'
  | 'mars_cobalt'
  | 'mars_emerald'
  | 'mars_gold';

export type UniformId =
  | 'earth_navy'
  | 'earth_white'
  | 'earth_teal'
  | 'earth_gold';

export type PetSpecies = 'dog' | 'cat';

export type PetBehaviorState =
  | 'wandering'
  | 'exploring'
  | 'playing'
  | 'following'
  | 'patrolling'
  | 'returning_to_charge'
  | 'charging_sleeping'
  | 'stranded_rescue';

export interface RoboticPet {
  id: string;
  catalogueId: string;
  name: string;
  species: PetSpecies;
  color: string;
  accentColor: string;
  battery: number; // 0-100
  maxBattery: number;
  state: PetBehaviorState;
  position: [number, number, number];
  rotationY: number;
  targetPos: [number, number, number];
  stationIndex: number;
  stateTimer: number;
  alertMessage?: string;
}

export type BuildingType =
  | 'dormitory'
  | 'greenhouse'
  | 'water_recycler'
  | 'solar_array'
  | 'battery_bank'
  | 'oxygen_generator'
  | 'food_processor'
  | 'waste_processor'
  | 'fuel_plant'
  | 'radiation_shield'
  | 'research_outpost'
  | 'warehouse'
  | 'landing_port';

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  name: string;
  position: [number, number, number];
  rotationY: number;
  level: number;
  protectedFromMove?: boolean;
  dustLevel: number; // 0-100 (for solar panels / repairs)
  damaged: boolean;
  hasInterior: boolean;
  footprintRadius: number;
  cropGrowth?: number; // 0-100 for greenhouse
  cropWatered?: boolean;
  cropPlanted?: boolean;
}

export interface RoadSegment {
  id: string;
  points: [number, number, number][];
  stage: 'graded' | 'paved';
  progress: number; // 0-100
}

export interface MeteoriteSite {
  id: string;
  x: number;
  z: number;
  y: number;
  discoveredAtDay: number;
  collected: boolean;
  sampleCount: number;
}

export type ActiveHazardType = 'none' | 'dust_storm' | 'radiation_alert';

export interface EarthRoomDef {
  id: string;
  name: string;
  signTitle: string;
  shortLabel: string;
  unlockLevel: number;
  bounds: { x1: number; z1: number; x2: number; z2: number };
  center: [number, number, number];
  entrancePos: [number, number, number];
  accentColor: string;
  pastelColor: string;
}

export interface MarsRegionDef {
  id: string;
  name: string;
  unlockLevel: number;
  center: [number, number];
  radius: number;
  color: string;
  description: string;
}

export type MissionSequenceStage =
  | 'earth_prep'
  | 'earth_launch'
  | 'mars_arrival'
  | 'mars_return_base'
  | 'mars_unlock_capsule';

export type EarthLogisticsStage =
  | 'idle'
  | 'collect_parts'
  | 'transport_to_lab'
  | 'assemble_prototype'
  | 'test_prototype'
  | 'carry_to_capsule'
  | 'load_capsule'
  | 'lock_capsule'
  | 'walk_to_launch_control'
  | 'press_launch'
  | 'monitor_launch'
  | 'launched';

export interface EarthLogisticsState {
  stage: EarthLogisticsStage;
  requiredParts: string[];
  collectedParts: string[];
  trolleyPos: [number, number, number];
  trolleyAttached: boolean;
  partsOnTrolley: string[];
  partsAtBench: string[];
  prototypeName: string;
  prototypeReady: boolean;
  testProgress: number; // 0 to 30+ seconds
  testActive: boolean;
  testComplete: boolean;
  carryingPrototype: boolean;
  capsuleLoaded: boolean;
  capsuleLocked: boolean;
  rocketLaunchProgress: number; // 0 to 1
  rocketLaunched: boolean;
}

export interface MarsCapsuleState {
  inTransit: boolean;
  arrived: boolean;
  alarmActive: boolean;
  unlocked: boolean;
  contentsRetrieved: boolean;
  unlockCost: number;
  payloadName: string;
  deconPassed: boolean;
  sterilisationSampleDone: boolean;
}

export interface LevelObjectiveStep {
  id: string;
  world: WorldId;
  label: string;
  icon: string;
  completed: boolean;
  targetPos?: [number, number, number];
  targetRoomId?: string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  theme: string;
  unlockText: string;
  rewardCoins: number;
  requiredPrototype: string;
  requiredParts: string[];
  scienceActivity:
    | 'assembly'
    | 'microscopy'
    | 'hydroponics'
    | 'circuit'
    | 'materials'
    | 'robotics'
    | 'spectrometry'
    | 'sabatier'
    | 'power_grid'
    | 'waste_sort';
  earthSteps: Omit<LevelObjectiveStep, 'completed'>[];
  marsSteps: Omit<LevelObjectiveStep, 'completed'>[];
}

export interface ResourcesState {
  water: number; // 0-100
  oxygen: number; // 0-100
  food: number; // 0-100
  electricity: number; // 0-100
  fuel: number; // 0-100
  battery: number; // 0-100
  materials: number;
  waste: number; // 0-100
  coins: number;
  xp: number;
  mealsStored: number;
  rawCrops: number;
  samplesCollected: number;
}

export interface AstronautVitals {
  energy: number; // 0-100
  hunger: number; // 0-100
  carryingItem: string | null;
  insideBuildingId: string | null;
  inRover: boolean;
  actionState:
    | 'idle'
    | 'walk'
    | 'run'
    | 'jump'
    | 'pickup'
    | 'eat'
    | 'sleep'
    | 'operate'
    | 'decon';
}

export type WardrobeCategory =
  | 'outfits'
  | 'pets'
  | 'buildings'
  | 'furniture'
  | 'decorations'
  | 'equipment'
  | 'supplies';

export interface CatalogueItem {
  id: string;
  category: WardrobeCategory;
  name: string;
  shortDesc: string;
  cost: number;
  unlockLevel: number;
  color: string;
  accentColor?: string;
  world?: WorldId | 'both';
  buildingType?: BuildingType;
  species?: PetSpecies;
  batteryCapacity?: number;
  suitId?: SuitId;
  uniformId?: UniformId;
  materialsCost?: number;
}

export interface GameNotification {
  id: string;
  icon: 'water' | 'oxygen' | 'food' | 'power' | 'capsule' | 'dust' | 'radiation' | 'pet' | 'meteor' | 'level' | 'info';
  label: string;
  tone: 'info' | 'warn' | 'alert' | 'success';
  timestamp: number;
}

export type ExhibitCategory = 'breakthrough' | 'astronaut' | 'timeline' | 'monument';

export interface ExhibitInfo {
  id: string;
  category?: ExhibitCategory;
  title: string;
  subtitle: string;
  fact: string;
  year: string;
  background?: string;
  whatHappened?: string;
  peopleInvolved?: string;
  significance?: string;
  whyItChanged?: string;
  interestingFacts?: string[];
  imageUrl?: string;
  imageCaption?: string;
  attribution?: string;
  visualKind?: string;
  accentColor?: string;
}

export interface ActiveMiniGame {
  type:
    | 'microscopy'
    | 'assembly'
    | 'hydroponics'
    | 'circuit'
    | 'materials'
    | 'robotics'
    | 'spectrometry'
    | 'sabatier'
    | 'power_grid'
    | 'waste_sort';
  title: string;
  onSuccessAction: string;
}

export interface AudioVolumes {
  ambience: number; // 0..1
  effects: number; // 0..1
  alerts: number; // 0..1
}

export interface PlacementPreviewState {
  mode: 'construct' | 'relocate';
  catalogueId?: string;
  buildingId?: string;
  buildingType: BuildingType;
  name: string;
  position: [number, number, number];
  rotationY: number;
  valid: boolean;
  reason: string | null;
  cost: number;
  materialsCost: number;
}

export interface ActiveInteractionInfo {
  kind: 'sleep' | 'eat' | 'operate' | 'pickup' | 'decon';
  label: string;
  phase: 'entering' | 'active' | 'exiting';
  cancelable: boolean;
}

export interface HudSnapshot {
  screen: GameScreen;
  activeWorld: WorldId;
  currentLevel: number;
  simDay: number;
  timeOfDay: number; // 0..1
  missionStage: MissionSequenceStage;
  tutorialHint: string | null;
  currentLocationLabel: string;
  nextObjectiveHint: string | null;
  activeExhibit: ExhibitInfo | null;
  nearbyExhibit: ExhibitInfo | null;
  resources: ResourcesState;
  marsVitals: AstronautVitals;
  earthVitals: AstronautVitals;
  marsPos: [number, number, number];
  earthPos: [number, number, number];
  roverPos: [number, number, number];
  roverUnlocked: boolean;
  roverSpeed: number;
  buildings: PlacedBuilding[];
  roads: RoadSegment[];
  pets: RoboticPet[];
  meteorites: MeteoriteSite[];
  activeHazard: ActiveHazardType;
  hazardTimer: number;
  earthLogistics: EarthLogisticsState;
  marsCapsule: MarsCapsuleState;
  levelObjectives: LevelObjectiveStep[];
  equippedMarsSuit: SuitId;
  equippedEarthUniform: UniformId;
  ownedItems: string[];
  unlockedRegions: number; // 1..6
  discoveredRegionIds: string[];
  fullWorldUnlocked: boolean;
  nearbyPrompt: { label: string; key: string; actionId: string } | null;
  activeInteraction: ActiveInteractionInfo | null;
  activeBuildingName: string | null;
  notifications: GameNotification[];
  activeMiniGame: ActiveMiniGame | null;
  sustainabilityDayCount: number;
  muted: boolean;
  volume: number;
  audioVolumes: AudioVolumes;
  relocatingBuildingId: string | null;
  placementPreview: PlacementPreviewState | null;
  roadBuildMode: 'none' | 'select_grade' | 'ready_pave';
  pendingRoadPoints: [number, number, number][];
  selectedMapTarget: { x: number; z: number; label: string } | null;
  speechBubble: { text: string; world: WorldId; expiresAt: number } | null;
}
