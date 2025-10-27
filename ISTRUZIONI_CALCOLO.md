# Istruzioni di calcolo MOVARISCH

Questo documento raccoglie le formule di riferimento per il calcolo del rischio MOVARISCH implementato nell'applicazione web.

## 1. Struttura generale

Il rischio complessivo è definito come:

- **Rinal** = P × E<sub>inal</sub>
- **Rcute** = P × E<sub>cut</sub>
- **Rtot** (o **Rcum**) = √(R<sub>inal</sub><sup>2</sup> + R<sub>cut</sub><sup>2</sup>)

Dove **P** è l'indice di pericolosità derivato dalle frasi H e **Einal** / **Ecut** sono gli indici di esposizione per le vie inalatoria e cutanea.

## 2. Esposizione inalatoria

L'esposizione inalatoria è calcolata come:

```
const Iraw = D * Q * U * C;
const I = normalizeToScale(Iraw);   // 1–10
const Einal = I * T * d;
const Rinal = P * Einal;
```

con:

| Variabile | Descrizione | Scala |
|-----------|-------------|-------|
| **D** | Proprietà chimico-fisiche | 1 – 4 |
| **Q** | Quantità in uso | 1 – 5 |
| **U** | Tipologia d'uso | 1 – 4 |
| **C** | Tipologia di controllo | 1 – 5 |
| **T** | Tempo di esposizione | 1 – 5 |

La funzione **normalizeToScale()** applica la tabella di soglie per riportare **Iraw** alla scala 1–10.

| Intervallo Iraw (D×Q×U×C) | I normalizzato |
|---------------------------|----------------|
| ≤ 5                       | 1              |
| 5 &lt; Iraw ≤ 10            | 2              |
| 10 &lt; Iraw ≤ 20           | 3              |
| 20 &lt; Iraw ≤ 30           | 4              |
| 30 &lt; Iraw ≤ 40           | 5              |
| 40 &lt; Iraw ≤ 50           | 6              |
| 50 &lt; Iraw ≤ 60           | 7              |
| 60 &lt; Iraw ≤ 70           | 8              |
| 70 &lt; Iraw ≤ 80           | 9              |
| &gt; 80                     | 10             |

La distanza operatore-sorgente (**d**) è scelta fra i seguenti intervalli:

| Distanza (m) | d |
|--------------|----|
| &lt; 1 | 1.00 |
| 1 – 3 | 0.75 |
| 3 – 5 | 0.50 |
| 5 – 10 | 0.25 |
| ≥ 10 | 0.10 |

## 3. Esposizione cutanea

L'indice **Ecut** è determinato tramite matrice di lookup in funzione della tipologia d'uso e del livello di contatto:

| Tipologia d'uso ↓ / Contatto → | Nessun contatto | Accidentale | Discontinuo | Esteso |
|--------------------------------|-----------------|-------------|-------------|--------|
| Sistema chiuso | 1 | 1 | 3 | 7 |
| Inclusione in matrice | 1 | 3 | 3 | 7 |
| Uso controllato | 1 | 3 | 7 | 10 |
| Uso dispersivo | 1 | 7 | 7 | 10 |

## 4. Output

Tutti gli indici e i rischi restituiti dall'applicazione sono arrotondati a due decimali per coerenza con il modello di calcolo.
