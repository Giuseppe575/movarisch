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

  const calcEinal = (I, T, d) => {
    const intensity = Number.isFinite(I) ? I : 0;
    const time = Number.isFinite(T) ? T : 0;
    const distance = Number.isFinite(d) ? d : 0;
    return intensity * time * distance;
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

  const movarischLib = {
    calcI,
    calcEinal,
    calcRinal,
    calcRcute,
    calcRcum,
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
