/**
 * Formularvalidierung für alle Wizard-Schritte.
 */

const PLZ = /^\d{5}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    errors.heatingBills = `Mindestens ${minBills} Heizkostenabrechnungen (PDF).`;
  }
  return errors;
}

export function validateCustomer(customer) {
  const errors = {};
  if (!customer.name?.trim()) errors.name = 'Name ist erforderlich.';
  if (!EMAIL.test(customer.email || '')) {
    errors.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
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
