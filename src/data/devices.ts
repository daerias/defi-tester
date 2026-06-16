export interface DeviceTolerance {
  type: 'percentage' | 'fixed';
  value: number; // e.g. 15 for 15%, or 2 for +/- 2J
  greater_of?: { type: 'fixed'; value: number }; // e.g. "whichever is greater"
}

export interface TestValue {
  label: string;
  targetEnergy: number; // in Joules
}

export interface Defibrillator {
  id: string;
  manufacturer: string;
  model: string;
  category: 'aed' | 'defibrillator';
  standardShocks: TestValue[];  // 3 for AEDs, up to 6 for manual defibrillators
  tolerance: DeviceTolerance;
  iecReference?: string;  // e.g. "IEC 60601-2-4: ±15% or ±2J"
  imageUrl?: string;
  electrodeUrl?: string;
  userManualUrl?: string;
  serviceManualUrl?: string;
}

export const devices: Defibrillator[] = [
  // ===== MANUAL DEFIBRILLATORS (6 shocks) =====
  {
    id: 'zoll-x',
    manufacturer: 'Zoll',
    model: 'X Series',
    category: 'defibrillator',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 50 },
      { label: 'Schock 2', targetEnergy: 100 },
      { label: 'Schock 3', targetEnergy: 120 },
      { label: 'Schock 4', targetEnergy: 150 },
      { label: 'Schock 5', targetEnergy: 200 },
      { label: 'Schock 6', targetEnergy: 200 }
    ],
    tolerance: { type: 'percentage', value: 15, greater_of: { type: 'fixed', value: 2 } },
    iecReference: 'IEC 60601-2-4: ±15% or ±2J (whichever is greater)',
    imageUrl: '/zoll_real_device.jpg',
    electrodeUrl: '/zoll_real_connector.jpg',
    userManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Zoll%20X%20Defibrilltor%20-%20User%20manual.pdf'
  },
  {
    id: 'physio-lifepak-15',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 15',
    category: 'defibrillator',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 50 },
      { label: 'Schock 2', targetEnergy: 100 },
      { label: 'Schock 3', targetEnergy: 200 },
      { label: 'Schock 4', targetEnergy: 300 },
      { label: 'Schock 5', targetEnergy: 360 },
      { label: 'Schock 6', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15, greater_of: { type: 'fixed', value: 2 } },
    iecReference: 'IEC 60601-2-4: ±15% or ±2J (whichever is greater)',
    imageUrl: '/lifepak_real_device.jpg',
    electrodeUrl: '/lifepak_real_connector.jpg',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/PhysioControl%20Lifepak%2015%20Defibrillator%20-%20Service%20manual.pdf'
  },
  {
    id: 'schiller-fred-pa1',
    manufacturer: 'Schiller',
    model: 'FRED PA-1',
    category: 'defibrillator',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 50 },
      { label: 'Schock 2', targetEnergy: 100 },
      { label: 'Schock 3', targetEnergy: 150 },
      { label: 'Schock 4', targetEnergy: 150 },
      { label: 'Schock 5', targetEnergy: 200 },
      { label: 'Schock 6', targetEnergy: 200 }
    ],
    tolerance: { type: 'percentage', value: 15, greater_of: { type: 'fixed', value: 3 } },
    iecReference: 'IEC 60601-2-4: ±15% or ±3J (whichever is greater)',
    imageUrl: '/schiller_pa1_real_device.webp'
  },
  {
    id: 'physio-lifepak-20',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 20',
    category: 'defibrillator',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 50 },
      { label: 'Schock 2', targetEnergy: 100 },
      { label: 'Schock 3', targetEnergy: 200 },
      { label: 'Schock 4', targetEnergy: 300 },
      { label: 'Schock 5', targetEnergy: 360 },
      { label: 'Schock 6', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/lifepak20_real_device.jpg',
    electrodeUrl: '/lifepak_real_connector.jpg'
  },
  {
    id: 'physio-lifepak-20e',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 20e',
    category: 'defibrillator',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 50 },
      { label: 'Schock 2', targetEnergy: 100 },
      { label: 'Schock 3', targetEnergy: 200 },
      { label: 'Schock 4', targetEnergy: 300 },
      { label: 'Schock 5', targetEnergy: 360 },
      { label: 'Schock 6', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/lifepak20_real_device.jpg',
    electrodeUrl: '/lifepak_real_connector.jpg'
  },

  // ===== AEDs (3 shocks) =====
  {
    id: 'philips-heartstart-fr3',
    manufacturer: 'Philips',
    model: 'HeartStart FR3',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 150 },
      { label: 'Schock 2', targetEnergy: 150 },
      { label: 'Schock 3', targetEnergy: 150 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/philips_fr3_real_device.webp',
    electrodeUrl: '/philips_real_connector.jpg'
  },
  {
    id: 'philips-hs1',
    manufacturer: 'Philips',
    model: 'HeartStart HS1',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 150 },
      { label: 'Schock 2', targetEnergy: 150 },
      { label: 'Schock 3', targetEnergy: 150 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/philips_hs1_real_device.png',
    electrodeUrl: '/philips_real_connector.jpg'
  },
  {
    id: 'schiller-fred',
    manufacturer: 'Schiller',
    model: 'FRED easy',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 130 },
      { label: 'Schock 2', targetEnergy: 130 },
      { label: 'Schock 3', targetEnergy: 130 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/schiller_real_device.jpg',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/Schiller_Fred_easy_-_Service_manual.pdf'
  },
  {
    id: 'primedic-heartsave',
    manufacturer: 'Primedic',
    model: 'HeartSave AED-M',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 200 },
      { label: 'Schock 2', targetEnergy: 200 },
      { label: 'Schock 3', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/primedic_heartsave_real_device.webp',
    userManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Metrax_Primedic_HeartSave_AED_-_User_manual.pdf',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/Primedic%20HeartSave%20AED%20-%20Electrical%20safety%20test%20procedure%20(de).pdf'
  },
  {
    id: 'zoll-aed-plus',
    manufacturer: 'Zoll',
    model: 'AED Plus',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 120 },
      { label: 'Schock 2', targetEnergy: 150 },
      { label: 'Schock 3', targetEnergy: 200 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/zoll_device.png',
    electrodeUrl: '/zoll_rectangular_connector.jpg',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/Zoll_AED+_-_Service_manual.pdf'
  },
  {
    id: 'zoll-aed-pro',
    manufacturer: 'Zoll',
    model: 'AED Pro',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 120 },
      { label: 'Schock 2', targetEnergy: 150 },
      { label: 'Schock 3', targetEnergy: 200 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/zoll_aed_pro_real_device.webp',
    electrodeUrl: '/zoll_rectangular_connector.jpg',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/Zoll_AED_Pro_-_Service_manual.pdf'
  },
  {
    id: 'physio-lifepak-1000',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 1000',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 200 },
      { label: 'Schock 2', targetEnergy: 300 },
      { label: 'Schock 3', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/lifepak1000_real_device.png',
    electrodeUrl: '/lifepak_real_connector.jpg',
    userManualUrl: 'http://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Physio-Control_Lifepak_1000_-_User_manual.pdf',
    serviceManualUrl: 'http://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Physio-Control_Lifepak_1000_-_User_manual.pdf'
  },
  {
    id: 'physio-lifepak-1000e',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 1000e',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 200 },
      { label: 'Schock 2', targetEnergy: 300 },
      { label: 'Schock 3', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/lifepak1000_real_device.png',
    electrodeUrl: '/lifepak_real_connector.jpg',
    userManualUrl: 'http://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Physio-Control_Lifepak_1000_-_User_manual.pdf',
    serviceManualUrl: 'http://www.frankshospitalworkshop.com/equipment/documents/defibrillators/user_manuals/Physio-Control_Lifepak_1000_-_User_manual.pdf'
  },
  {
    id: 'physio-lifepak-500',
    manufacturer: 'Physio-Control',
    model: 'Lifepak 500',
    category: 'aed',
    standardShocks: [
      { label: 'Schock 1', targetEnergy: 200 },
      { label: 'Schock 2', targetEnergy: 300 },
      { label: 'Schock 3', targetEnergy: 360 }
    ],
    tolerance: { type: 'percentage', value: 15 },
    iecReference: 'IEC 60601-2-4: ±15%',
    imageUrl: '/lifepak500_real_device.png',
    electrodeUrl: '/lifepak_real_connector.jpg',
    serviceManualUrl: 'https://www.frankshospitalworkshop.com/equipment/documents/defibrillators/service_manuals/Medtronic%20Lifepak%20500%20Defibrillator%20-%20Service%20manual.pdf'
  }
];


export const evaluateTolerance = (measured: number, target: number, tolerance: DeviceTolerance): boolean => {
  if (isNaN(measured)) return false;
  
  let allowedDeviation = 0;
  if (tolerance.type === 'percentage') {
    allowedDeviation = target * (tolerance.value / 100);
  } else if (tolerance.type === 'fixed') {
    allowedDeviation = tolerance.value;
  }
  
  if (tolerance.greater_of) {
    allowedDeviation = Math.max(allowedDeviation, tolerance.greater_of.value);
  }
  
  return Math.abs(measured - target) <= allowedDeviation;
};
