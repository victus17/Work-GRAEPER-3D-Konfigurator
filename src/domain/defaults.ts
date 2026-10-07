import type { Config, MvField, MvFieldType, WalkInCfg } from './types';

let seq = 0;
export const uid = (p = 'id') => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;
export const mvFields = (...types: MvFieldType[]): MvField[] => types.map((type) => ({ id: uid('f'), type }));

export const defaultWalkIn = (): WalkInCfg => ({
  system: 'professional', serieId: 'ts-r2-528',
  lengthCm: 510, widthCm: 303, roomHeightCm: 245, cellarCm: 78,
  wall: 'standard',
  rooms: ['ms', 'trafo'], roomSplit: [0.62, 0.38],
  floor: 'beton', floorFinish: 'ohne',
  roofForm: 'flach', roofPitch: 25, roofInsulated: false,
  doors: [], grilles: [], doorsAuto: true,
  roofHood: false, gutter: true, modules: 1,
});

export const defaultConfig = (): Config => ({
  schema: 1,
  projectName: 'Neue Station',
  projectNo: '',
  useCase: 'ortsnetz',
  demand: {
    mode: 'direkt', households: 120, heatPumps: 30, wallboxes: 40,
    chargersDc: 6, chargerDcKw: 300, chargersAc: 10, chargerAcKw: 22,
    pvKwp: 2500, connectedKw: 900, simultaneity: 0.7, cosPhi: 0.95, storageKw: 2000, reservePercent: 20,
  },
  transformer: {
    count: 1, powerKva: 630, type: 'oel', primaryKv: 20, secondaryV: 400, ukPercent: 4, vectorGroup: 'Dyn5',
    ront: false, protection: 'thermometer', vibrationDampers: true, customerSupplied: false,
  },
  mv: {
    insulation: 'sf6frei', vendorId: 'neutral', fields: mvFields('K', 'K', 'T'), protection: 'hh', ikKa: 20,
    motorDrives: false, faultIndicators: 'ksa', customerSupplied: false, meteringSupplied: true,
  },
  lv: {
    design: 'offen', incomer: 'lasttrenner', nh00: 2, nh1: 0, nh2: 8, nh3: 0, acbFeeders: 0, reserve: 2,
    instrument: 'multimeter', billingMeters: 0, ctSupplied: false, feederMonitoring: false,
    streetLighting: false, tempPower: true, generatorInlet: false, surgeProtection: false, compensationKvar: 0, customerSupplied: false,
  },
  building: {
    kind: 'kompakt', compactId: 'gkp-s3', autoSelect: true, walkIn: defaultWalkIn(), trafostandId: 'vk-g002',
    concrete: 'leicht', doorMaterial: 'alu', security: 'standard', panicLocks: false, lockSystem: 'pz', doorMonitoring: false,
    fire: 'ohne', soundProtection: false, gasTight: false, slopeInstall: false, trafoRails: true, fwRoom: false, ventRing: false,
  },
  envelope: {
    surface: 'reibeputz', clinkerTone: 'rot', bodyRal: '9010', roofRal: '5017', plinthRal: '5017',
    doorFinish: 'eloxiert', doorRal: '7035', tubBlack: true, tubOilProof: true, interiorWhite: true, graffitiProtection: false,
  },
  penetrations: {
    mvCount: 3, mvSystem: 'HSI150', mvCover: 'D3/58', lvCount: 8, lvSystem: 'HSI150', lvCover: 'D7/33',
    tempPower: 2, tempPowerSystem: 'graeper', earthing: 2, antenna: false, fiber: 1,
  },
  equipment: {
    telecontrol: 'vorbereitet', comm: 'lte450', protocol: 'iec104', ups: false, telecontrolSupplied: false,
    enimon: 'ohne', steuerbox14a: false,
    accessories: {}, heating: false, lighting: true, climate: false,
  },
  site: {
    zip: '', city: '', deliveryWeek: '', distanceKm: 200, plantId: 'ahlhorn', unloading: 'bordkran', foundation: 'sandplanum',
    services: {}, access: {}, boundaryBuild: false, residential: false, floodRisk: false, notes: '',
  },
  contact: {
    company: '', name: '', role: '', email: '', phone: '', street: '', zip: '', city: '', message: '', consent: false,
    customerType: 'netzbetreiber',
  },
});
