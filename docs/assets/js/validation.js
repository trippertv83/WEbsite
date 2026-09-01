/**
 * Formularvalidierung für alle Wizard-Schritte.
 */

const PLZ = /^\d{5}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function phoneDigitCount(value) {
  return String(value || '').replace(/\D/g, '').length;
}

export function validateBuilding(building) {
  const errors = {};
  if (!PLZ.test(String(building.plz || ''))) {
    errors.plz = 'Bitte eine gültige 5-stellige PLZ angeben.';
  }
  if (!building.ort?.trim()) errors.ort = 'Ort ist erforderlich.';
  if (!building.strasse?.trim()) errors.strasse = 'Straße ist erforderlich.';
  if (!building.hausnummer?.trim()) errors.hausnummer = 'Hausnummer ist erforderlich.';
  const area = Number(building.wohnflaeche);
  if (!Number.isFinite(area) || area < 20) {
    errors.wohnflaeche = 'Wohnfläche mindestens 20 m².';
  }
  if (!building.gebaeudetyp) errors.gebaeudetyp = 'Bitte Gebäudetyp wählen.';
  if (!building.anlass) errors.anlass = 'Bitte den Anlass wählen.';
  const units = Number(building.anzahlWohnungen);
  if (!Number.isFinite(units) || units < 1) {
    errors.anzahlWohnungen = 'Anzahl Wohnungen mindestens 1.';
  }
  if (!building.gekuehlt) errors.gekuehlt = 'Bitte Kühlung angeben.';
  if (building.erneuerbareEnergien && !building.erneuerbareEnergienA) {
    errors.erneuerbareEnergienA = 'Bitte die Art der erneuerbaren Energie wählen.';
  }
  const none = building.keineEmpfehlungen === '1';
  const recCount = (building.recommendations || []).length;
  if (!none && recCount !== 2) {
    errors.recommendations = 'Bitte genau zwei Sanierungsmaßnahmen ankreuzen oder „keine möglich“.';
  }
  if (building.gekuehlt === 'ja') {
    const inspect =
      building.klimaanlage12kWohne === '1' ||
      building.klimaanlage12kWmit === '1' ||
      building.klimaanlage70kW === '1';
    if (inspect && !building.klimaanlageFaelligkeit) {
      errors.klimaanlageFaelligkeit = 'Bitte das nächste Inspektionsdatum angeben.';
    }
  }
  const year = Number(building.baujahr);
  if (year < 1800 || year > 2026) errors.baujahr = 'Baujahr prüfen.';
  const heatYear = Number(building.baujahrHeizung);
  if (heatYear < 1800 || heatYear > 2026) {
    errors.baujahrHeizung = 'Baujahr der Heizung prüfen.';
  }
  if (!building.beheizterKeller) {
    errors.beheizterKeller = 'Bitte angeben, ob ein Keller beheizt wird.';
  }
  if (!building.warmwasser) errors.warmwasser = 'Bitte Warmwasser wählen.';
  return errors;
}

export function validateConsumption(consumption) {
  const errors = {};
  if (!consumption.energietraeger) {
    errors.energietraeger = 'Bitte einen Energieträger wählen.';
  }
  const storable = ['heizoel', 'holz', 'pellets'].includes(consumption.energietraeger);
  if (storable && consumption.useLager) {
    const lager = consumption.lager || {};
    const from = Date.parse(lager.anfangDatum || '');
    const to = Date.parse(lager.endeDatum || '');
    if (!Number.isFinite(from)) errors.anfangDatum = 'Bitte das Datum des Anfangsbestands angeben.';
    if (!Number.isFinite(to)) errors.endeDatum = 'Bitte das Datum des Endbestands angeben.';
    if (Number.isFinite(from) && Number.isFinite(to) && to - from < 3 * 365.25 * 24 * 60 * 60 * 1000) {
      errors.endeDatum = 'Zwischen Anfangs- und Endbestand müssen mindestens drei Jahre liegen.';
    }
    const total = Number(lager.consumption);
    if (!Number.isFinite(total) || total <= 0) {
      errors.anfangBestand = 'Verbrauch muss größer 0 sein (Anfangsbestand + Zukäufe − Endbestand).';
    }
    return errors;
  }
  const year = Number(consumption.startYear);
  if (year < 2015 || year > 2026) {
    errors.startYear = 'Jahr zwischen 2015 und 2026 wählen.';
  }
  if (!consumption.periodStartMonth) {
    errors.periodStartMonth = 'Abrechnungsperiode wählen.';
  }
  (consumption.periods || []).forEach((period, index) => {
    const value = Number(period.consumption);
    if (!Number.isFinite(value) || value <= 0) {
      errors[`period-${index}-consumption`] = 'Verbrauch größer 0 angeben.';
    }
    const vacancy = Number(period.vacancy);
    if (!Number.isFinite(vacancy) || vacancy < 0 || vacancy >= 100) {
      errors[`period-${index}-vacancy`] = 'Leerstand zwischen 0 und 99,9 %.';
    }
  });
  return errors;
}

export function validateDocuments(documents, minBills) {
  const errors = {};
  if ((documents.heatingBills || []).length < minBills) {
    errors.heatingBills =
      minBills === 1
        ? 'Mindestens eine Heizkostenabrechnung als PDF hochladen.'
        : `Mindestens ${minBills} Heizkostenabrechnungen (PDF).`;
  }
  return errors;
}

export function validateLogin(customer) {
  const errors = {};
  if (!EMAIL.test(customer.email || '')) {
    errors.email = 'Bitte die E-Mail-Adresse angeben, die in SevDesk hinterlegt ist.';
  }
  return errors;
}

export function validateRegistration(customer) {
  const errors = {};
  if (!['firma', 'herr', 'frau'].includes(customer.customerType)) {
    errors.customerType = 'Bitte Firma, Herr oder Frau wählen.';
  }
  if (customer.customerType === 'firma') {
    if (!customer.companyName?.trim()) {
      errors.companyName = 'Firmenname ist erforderlich.';
    }
    if (!customer.contactFirstName?.trim()) {
      errors.contactFirstName = 'Vorname des Ansprechpartners ist erforderlich.';
    }
    if (!customer.contactLastName?.trim()) {
      errors.contactLastName = 'Nachname des Ansprechpartners ist erforderlich.';
    }
  } else {
    if (!customer.firstName?.trim()) errors.firstName = 'Vorname ist erforderlich.';
    if (!customer.lastName?.trim()) errors.lastName = 'Nachname ist erforderlich.';
  }
  if (!EMAIL.test(customer.email || '')) {
    errors.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
  }
  if (phoneDigitCount(customer.phone) < 6) {
    errors.phone = 'Bitte eine Telefonnummer angeben (für die sichere Zahlung).';
  }
  if (!customer.strasse?.trim()) errors.strasse = 'Straße ist erforderlich.';
  if (!customer.hausnummer?.trim()) errors.hausnummer = 'Hausnummer ist erforderlich.';
  if (!PLZ.test(String(customer.plz || ''))) {
    errors.plz = 'Bitte eine gültige 5-stellige PLZ angeben.';
  }
  if (!customer.ort?.trim()) errors.ort = 'Ort ist erforderlich.';
  if (!customer.acceptRegisterPrivacy) {
    errors.acceptRegisterPrivacy =
      'Bitte der Speicherung in SevDesk zur Auftragserfassung zustimmen.';
  }
  return errors;
}

export function validateCustomer(customer) {
  const errors = {};
  if (!customer.name?.trim()) errors.name = 'Name ist erforderlich.';
  if (!EMAIL.test(customer.email || '')) {
    errors.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
  }
  if (phoneDigitCount(customer.phone) < 6) {
    errors.phone = 'Bitte eine Telefonnummer angeben.';
  }
  if (!customer.acceptAgb) errors.acceptAgb = 'Bitte die AGB akzeptieren.';
  if (!customer.acceptPrivacy) {
    errors.acceptPrivacy = 'Bitte die Datenschutzerklärung akzeptieren.';
  }
  return errors;
}

export function isEmpty(errors) {
  return Object.keys(errors).length === 0;
}
