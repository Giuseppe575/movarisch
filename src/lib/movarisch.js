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

  // =================== M.I.R.C. (INRS) SAFETY CALCULATIONS ===================

  // Calculate D (Fattore Danno) = A1 + A2
  const calcMircD = (A1, A2) => {
    const a1 = Number.isFinite(A1) ? A1 : 0;
    const a2 = Number.isFinite(A2) ? A2 : 0;
    return a1 + a2;
  };

  // Calculate E (Fattore Esposizione) = B1 + B2 + B3 + B4
  const calcMircE = (B1, B2, B3, B4) => {
    const b1 = Number.isFinite(B1) ? B1 : 0;
    const b2 = Number.isFinite(B2) ? B2 : 0;
    const b3 = Number.isFinite(B3) ? B3 : 0;
    const b4 = Number.isFinite(B4) ? B4 : 0;
    return b1 + b2 + b3 + b4;
  };

  // Calculate IRC (Indice Rischio Chimico)
  // Formula esponenziale semplificata: IRC = 10^((D+E)/100)
  // Questa formula gestisce correttamente anche valori negativi di E (DPI molto efficaci)
  const calcMircIRC = (D, E) => {
    const d = Number.isFinite(D) ? D : 0;
    const e = Number.isFinite(E) ? E : 0;

    // IRC = 10^((D+E)/100)
    const exponent = (d + e) / 100;
    return Math.pow(10, exponent);
  };

  // Classify M.I.R.C. IRC Level (3 levels INRS standard)
  const classifyMircRisk = (irc) => {
    const risk = Number.isFinite(irc) ? irc : 0;

    // Classificazione INRS standard a 3 livelli
    if (risk < 1.0) {
      return {
        level: 'basso',
        class: 'irr',
        text: 'RISCHIO BASSO (Accettabile)'
      };
    }
    if (risk < 10.0) {
      return {
        level: 'medio',
        class: 'unc',
        text: 'RISCHIO MEDIO (Verificare misure)'
      };
    }
    return {
      level: 'alto',
      class: 'grave',
      text: 'RISCHIO ALTO (Non tollerabile)'
    };
  };

  const movarischLib = {
    calcI,
    calcEinal,
    calcRinal,
    calcRcute,
    calcRcum,
    // M.I.R.C. (INRS) Safety functions
    calcMircD,
    calcMircE,
    calcMircIRC,
    classifyMircRisk
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
