/**
 * Zentraler Anwendungszustand. Keine API-Schlüssel.
 */

const listeners = new Set();

const state = {
  step: 1,
  maxReached: 1,
  building: {
    plz: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    wohnflaeche: '',
    gebaeudetyp: '',
    baujahr: '',
    baujahrHeizung: '',
    beheizterKeller: '',
    warmwasser: '',
  },
  consumption: {
    energietraeger: '',
    unit: '',
    startYear: 2023,
    periodStartMonth: 1,
    periods: [],
  },
  documents: {
    heatingBills: [],
    floorPlan: [],
    heatingPhoto: [],
    other: [],
  },
  calculation: null,
  registered: false,
  customer: {
    customerType: '',
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    acceptRegisterPrivacy: false,
    acceptAgb: false,
    acceptPrivacy: false,
    sevdeskCustomerId: null,
    customerNumber: null,
  },
  order: {
    number: null,
    status: 'draft',
  },
};

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

export function patch(partial) {
  Object.assign(state, partial);
  notify();
}

export function patchBuilding(partial) {
  Object.assign(state.building, partial);
  notify();
}

export function patchConsumption(partial) {
  Object.assign(state.consumption, partial);
  notify();
}

export function setDocuments(partial) {
  Object.assign(state.documents, partial);
  notify();
}

export function setCalculation(result) {
  state.calculation = result;
  notify();
}

export function patchCustomer(partial) {
  Object.assign(state.customer, partial);
  notify();
}

export function setStep(step) {
  state.step = step;
  if (step > state.maxReached) state.maxReached = step;
  notify();
}

export function serializeForBackend() {
  return {
    building: { ...state.building },
    consumption: {
      energietraeger: state.consumption.energietraeger,
      unit: state.consumption.unit,
      startYear: state.consumption.startYear,
      periodStartMonth: state.consumption.periodStartMonth,
      periods: state.consumption.periods.map((p) => ({
        label: p.label,
        from: p.from,
        to: p.to,
        consumption: p.consumption,
        vacancy: p.vacancy,
        warmWater: p.warmWater,
      })),
    },
    calculation: state.calculation,
    customer: {
      customerType: state.customer.customerType,
      companyName: state.customer.companyName,
      contactFirstName: state.customer.contactFirstName,
      contactLastName: state.customer.contactLastName,
      firstName: state.customer.firstName,
      lastName: state.customer.lastName,
      email: state.customer.email,
      name: state.customer.name,
      strasse: state.customer.strasse,
      hausnummer: state.customer.hausnummer,
      plz: state.customer.plz,
      ort: state.customer.ort,
      sevdeskCustomerId: state.customer.sevdeskCustomerId,
      customerNumber: state.customer.customerNumber,
    },
    orderNumber: state.order.number,
  };
}
