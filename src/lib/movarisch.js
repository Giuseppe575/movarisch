(() => {
  const INTENSITY_THRESHOLDS = [
    { max: 10, value: 1 },
    { max: 30, value: 2 },
    { max: 60, value: 3 },
    { max: 100, value: 5 },
    { max: 200, value: 7 },
  ];

  const MAX_INTENSITY = 10;

  const normalizeIntensity = (raw) => {
    if (!Number.isFinite(raw) || raw <= 0) {
      return 0;
    }
    for (const { max, value } of INTENSITY_THRESHOLDS) {
      if (raw <= max) {
        return value;
      }
    }
    return MAX_INTENSITY;
  };

  const calcI = (D, Q, U, C) => {
    const factors = [D, Q, U, C];
    if (factors.some((value) => !Number.isFinite(value) || value <= 0)) {
      return 0;
    }
    const raw = factors.reduce((product, value) => product * value, 1);
    return normalizeIntensity(raw);
  };

  const calcEinal = (I, d) => {
    const intensity = Number.isFinite(I) ? I : 0;
    const distance = Number.isFinite(d) ? d : 0;
    return intensity * distance;
  };

  const calcRinal = (P, Einal) => {
    const hazard = Number.isFinite(P) ? P : 0;
    const exposure = Number.isFinite(Einal) ? Einal : 0;
    return hazard * exposure;
  };

  const calcRcute = (P, Ecute) => {
    const hazard = Number.isFinite(P) ? P : 0;
    const exposure = Number.isFinite(Ecute) ? Ecute : 0;
    return hazard * exposure;
  };

  const calcRcum = (Rinal, Rcute) => {
    const inal = Number.isFinite(Rinal) ? Rinal : 0;
    const cute = Number.isFinite(Rcute) ? Rcute : 0;
    return Math.hypot(inal, cute);
  };

  // =================== SAFETY CALCULATIONS ===================

  // Calculate Pericolo Intrinseco (PI)
  const calcPI = (hcodesPhysical, H_PHYSICAL_SCORE) => {
    if (!Array.isArray(hcodesPhysical) || hcodesPhysical.length === 0) {
      return 10; // default if no H-codes
    }
    const scores = hcodesPhysical
      .map(h => H_PHYSICAL_SCORE[h])
      .filter(score => Number.isFinite(score) && score > 0);

    return scores.length > 0 ? Math.max(...scores) : 10;
  };

  // Calculate Indice Quantità (IQ)
  const calcIQ = (quantity) => {
    const qty = Number.isFinite(quantity) ? quantity : 0;
    if (qty < 1) return 1;
    if (qty <= 10) return 2;
    if (qty <= 100) return 3;
    if (qty <= 1000) return 4;
    return 5;
  };

  // Calculate Fattore Condizioni Operative (FCO)
  const calcFCO = (systemType, ventilation, openFlames, ignitionSources,
                   operatingTemp, flashPoint) => {
    let fco = 1.0;

    if (systemType === 'aperto') fco *= 1.5;
    if (ventilation === 'assente') fco *= 1.3;
    if (openFlames === true) fco *= 2.0;
    if (ignitionSources === true) fco *= 1.5;

    // Check if operating temp > flash point
    const temp = Number.isFinite(operatingTemp) ? operatingTemp : 25;
    const flash = Number.isFinite(flashPoint) ? flashPoint : Infinity;
    if (temp > flash) fco *= 2.0;

    return fco;
  };

  // Calculate Rischio Sicurezza
  const calcRiskSafety = (PI, IQ, FCO) => {
    const pi = Number.isFinite(PI) ? PI : 10;
    const iq = Number.isFinite(IQ) ? IQ : 1;
    const fco = Number.isFinite(FCO) ? FCO : 1.0;
    return pi * iq * fco;
  };

  // Classify Safety Risk Level
  const classifySafetyRisk = (riskValue) => {
    const risk = Number.isFinite(riskValue) ? riskValue : 0;
    if (risk <= 10) return { level: 'basso', class: 'irr' };
    if (risk <= 25) return { level: 'medio', class: 'unc' };
    if (risk <= 50) return { level: 'alto', class: 'sup' };
    return { level: 'molto_alto', class: 'grave' };
  };

  const movarischLib = {
    calcI,
    calcEinal,
    calcRinal,
    calcRcute,
    calcRcum,
    // Safety functions
    calcPI,
    calcIQ,
    calcFCO,
    calcRiskSafety,
    classifySafetyRisk
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = movarischLib;
  }

  const globalScope =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
      ? window
      : undefined;

  if (globalScope) {
    const existing = globalScope.movarischLib || {};
    globalScope.movarischLib = { ...existing, ...movarischLib };
  }
})();
