# METODOLOGIA M.I.R.C. - VALUTAZIONE RISCHIO CHIMICO PER LA SICUREZZA

## 🎯 FONTE
**Istituto Nazionale Francese di ricerca sulla sicurezza (INRS)**  
Metodologia M.I.R.C. (Metodo di Identificazione del Rischio Chimico)

---

## 📐 FORMULA DI CALCOLO

```
IRC = (D + E) / 100
```

Dove:
- **IRC** = Indice di Rischio Chimico per la Sicurezza
- **D** = Indice di Danno
- **E** = Indice di Esposizione

### Indice di Danno (D)
```
D = A1 + A2
```

### Indice di Esposizione (E)
```
E = B1 + B2 + B3 + B4
```

---

## 📊 FATTORI DI DANNO

### A1 - PROPRIETÀ CHIMICO-FISICHE PERICOLOSE

Valuta se l'agente chimico è pericoloso per la sicurezza degli addetti.

#### Categorie di pericolo:

**a) Esplosivo**
- Classificato esplosivo (H200, H201, H202, H203, H205, H230, H231, EUH001, EUH006)
- **Score**: variabile in base alla classe

**b) Miscele esplosive con aria**
- Non classificato esplosivo ma può formare miscele esplosive (EUH018, EUH044)
- **Score**: 10.0

**c) Gas liquefatto sotto pressione**
- Classificato H280
- **Score**: 12.0

**d) Comburente**
- Classificato H270, H271, H272
- **Score**: variabile

**e) Proprietà ossidanti**
- Non classificato comburente ma possiede proprietà ossidanti
- **Score**: 1.5

**f) Estremamente infiammabile**
- H220, H224, EUH209
- Punto di infiammabilità < 0°C e punto di ebollizione ≤ 35°C
- **Score**: variabile

**g) Facilmente infiammabile**
- H225
- Punto di infiammabilità 0-23°C e punto di ebollizione > 35°C
- **Score**: variabile

**h) Infiammabile**
- H221, H223, H226, H228
- Punto di infiammabilità 23-55°C e punto di ebollizione > 35°C
- **Score**: variabile

**i) Limiti di infiammabilità**
- Valutazione basata sull'intervallo di infiammabilità:
  - < 10%: **Score** 0.0
  - 10%: **Score** variabile
  - 10-30%: **Score** variabile
  - 30-50%: **Score** variabile
  - 50-70%: **Score** variabile
  - > 70%: **Score** variabile

**l) Vapori più pesanti dell'aria**
- Per agenti con caratteristiche di infiammabilità
- **Score**: se applicabile

**m) Corrosivo**
- H290
- **Score**: varia per classe (1, 2, o non classificato ma corrosivo)

**n) Altri pericoli per la sicurezza**
- Scivolamento, ustioni da calore, congelamento, ecc.
- **Score**: se applicabile

---

### A2 - PROPRIETÀ CHIMICHE PERICOLOSE

Valuta se l'agente chimico può dare luogo a reazioni pericolose.

**a) Reazioni accidentali con altri agenti incompatibili**

Tipi di reazione:
- Esotermica pericolosa (forte sviluppo di calore)
- Forte incremento/decremento di pressione
- Forte incremento di volume
- Violenta/esplosiva (EUH006, EUH014, EUH019)
- Rapida formazione di gas (EUH029, EUH031, EUH032, EUH044)
- Formazione di agenti instabili/esplosivi (EUH018)
- Formazione di agenti ossidanti/comburenti
- Formazione di agenti estremamente/facilmente infiammabili

**Score**: variabile in base al tipo di reazione

---

## 🔬 FATTORI DI ESPOSIZIONE

### B1 - MODALITÀ DI LAVORO

Valuta le condizioni in cui l'agente chimico viene lavorato/prodotto/stoccato.

#### Domande chiave (con esempi di score):

**a-b) Reazioni pericolose contemplate**
- Formazione di prodotti pericolosi: **+5.0** punti (se agenti estremamente/facilmente infiammabili)

**c) Lavoro con esplosivi**
- Urti, frizioni, esposizione a fiamme: **Score** variabile

**d) Polveri esplosive**
- Condizioni che portano a sospensione e concentrazione esplosiva: **Score** variabile

**e) Gas liquefatti**
- Presenza di fonti di calore, condizioni pericolose: **Score** variabile

**f) Comburenti**
- Contatto con combustibili/infiammabili: **Score** variabile

**g) Concentrazione atmosferica nei limiti di infiammabilità**
- SI: **+8.0** punti
- NO: **0.0** punti

**h) Operazioni con agenti infiammabili**
- Temperatura > punto di infiammabilità: **Score** variabile
- Prossimità a sorgenti di calore: **Score** variabile
- Impianti non ATEX: **Score** variabile
- Locali non idonei: **Score** variabile

**i) Messa a terra componenti metalliche**
- Non collegate a terra: **+6.0** punti
- Indumenti antistatici: **0.0** punti

**l) Accumulo vapori pesanti dell'aria**
- Assenza di cautele: **Score** variabile

**m) Assenza di procedure**
- Per operazioni routinarie/straordinarie/primo intervento: **Score** variabile

**n) Classificazione rischio incendio (D.M. 10/03/1998)**
- Basso: **0.0** punti
- Medio: **Score** variabile
- Alto: **Score** variabile

**o) Accumulo rifiuti pericolosi**
- In zona attigua non continuativa: **+0.7** punti

**p) Procedura perdite/spandimenti**
- Non esiste: **+1.5** punti
- Esiste: **0.0** punti

**q-r) Resistenza alla corrosione**
- Contenitori/condotte non resistenti: **Score** variabile
- Assenza bacino contenimento: **Score** variabile

**s) Separazione agenti incompatibili**
- NO: **Score** variabile
- SI: **0.0** punti

**t) Contenitori agenti con alta tensione di vapore**
- Materiale non idoneo o esposti a calore: **Score** variabile

**u-v) Precauzioni nella manipolazione**
- Senza precauzioni: **Score** variabile
- Travaso in contenitori non idonei: **Score** variabile

**z-x-y-k) Etichettatura e segnalazione**
- Assenza etichettatura: **Score** variabile
- Condutture non segnalate: **Score** variabile
- Assenza SDS: **Score** variabile
- SDS non conforme: **+2.0** punti

---

### B2 - FREQUENZA E TEMPI DI UTILIZZO

**a) Frequenza operazione:**
- Discontinuo, non periodico: **0.0** punti
- Occasionale (1-2 volte/mese): **0.0** punti
- Continuativo periodico: **0.0** punti
- 1 giorno/settimana: **0.0** punti
- 3 giorni/settimana: **0.0** punti
- Tutti i giorni: **+5.0** punti

**b) Durata esposizione giornaliera:**
- < 1 ora/giorno: **+0.5** punti
- ≥ 1 ora/giorno: **0.0** punti
- 2-4 ore/giorno: **0.0** punti
- 4-6 ore/giorno: **0.0** punti
- 6-8 ore/giorno: **0.0** punti
- > 8 ore/giorno: **0.0** punti

---

### B3 - QUANTITATIVI UTILIZZATI

**a) Quantità utilizzata:**
- Trascurabile: **0.0** punti
- Lieve: **+2.0** punti
- Moderata: **0.0** punti
- Considerevole: **0.0** punti
- Elevata: **0.0** punti

---

### B4 - FATTORI DI RIDUZIONE DELL'ESPOSIZIONE

**Misure di prevenzione e protezione (valori NEGATIVI):**

**a) Procedure scritte per operazioni routinarie/straordinarie**
- SI: **-10.0** punti
- NO: **0.0** punti

**b) Procedure scritte per gestione emergenze**
- SI: **-10.0** punti
- NO: **0.0** punti

**c) Recipienti chiusi, etichettati, materiale idoneo**
- SI: **-5.0** punti
- NO: **0.0** punti

**d) Utilizzo esplosivi e gas compressi in sicurezza**
- Condizioni sicure: **-7.0** punti
- Quantitativi minimi: **0.0** punti

**e) Evitare sospensione polveri esplosive**
- SI: **0.0** punti
- NO: **0.0** punti

**f) Sistemi assorbimento aumenti pressione**
- Esistono e manutenuti: **0.0** punti

**g) Modalità lavoro comburenti**
- Nessun contatto con combustibili: **0.0** punti

**h) Utilizzo agenti infiammabili in sicurezza**
- Temperatura < punto infiammabilità: **-10.0** punti
- Impianti a norma AD-ADPE: **-4.0** punti
- Travasi con messa a terra: **0.0** punti
- Locali idonei: **0.0** punti

**i) Miscela aria-infiammabile fuori intervallo**
- SI: **-5.0** punti
- NO: **0.0** punti

**l) Cautele per vapori pesanti dell'aria**
- SI: **0.0** punti

**m) Zona di lavoro all'aperto**
- SI: **-3.0** punti
- NO: **0.0** punti

**n) Agente utilizzato diluito**
- SI: **0.0** punti
- NO: **0.0** punti

**o) Intervento pronto su perdite/spandimenti**
- SI: **-3.0** punti
- NO: **0.0** punti

**p) Presidi antincendio adeguati**
- SI: **-6.0** punti
- NO: **0.0** punti

**q) Manutenzione presidi antincendio**
- Almeno semestrale: **0.0** punti
- < 6 mesi: **0.0** punti

**r-s) Resistenza materiali e bacini contenimento**
- Materiali resistenti e manutenuti: **0.0** punti
- Bacino contenimento presente: **0.0** punti

**t) Contenitori con valvole di sfiato**
- Idonei e non esposti a calore: **0.0** punti

**u) Separazione agenti incompatibili**
- PREVEDONO: **0.0** punti
- NON PREVEDONO: **0.0** punti

**v) Monitoraggio e regolazione parametri critici**
- SI: **-10.0** punti
- NO: **0.0** punti

**z-x-y) Controlli su reazioni pericolose**
- Raffreddamento, sensori temperatura: **0.0** punti
- Sfiati, sensori pressione: **0.0** punti
- Dimensionamento, sensori volume, scarico automatico: **0.0** punti

**k) Precauzioni tecniche**
- SI: **0.0** punti

**j) Informazione e consapevolezza addetti**
- SI/NO: **0.0** punti

**w) Segnaletica di pericolo**
- SI/NO: **0.0** punti

---

## 🎯 CLASSIFICAZIONE DEL RISCHIO

| Intervallo IRC | Livello Rischio | Classificazione |
|----------------|----------------|-----------------|
| 0 ≤ IRC ≤ 6 | Rischio irrilevante | **BASSO** |
| 6.5 ≤ IRC ≤ 12 | Rischio basso | **BASSO** |
| 12.5 ≤ IRC ≤ 18 | Rischio considerevole | **NON BASSO** |
| 18.5 ≤ IRC ≤ 24 | Rischio importante | **NON BASSO** |
| 24.5 ≤ IRC ≤ 33.5 | Rischio elevato | **NON BASSO** |

---

## 📋 ESEMPIO DI CALCOLO (dal documento)

**Agente chimico:** Gasoli paraffinici; gasolio - non specificato

### Fattori di Danno:
- **A1** (Proprietà chimico-fisiche): 23.5 punti
- **A2** (Proprietà chimiche): 0.0 punti
- **D** (Indice di danno): **23.5**

### Fattori di Esposizione:
- **B1** (Modalità di lavoro): 23.2 punti
- **B2** (Frequenza e tempi): 5.5 punti
- **B3** (Quantitativi): 2.0 punti
- **B4** (Fattori riduzione): -73.0 punti
- **E** (Indice di esposizione): **-42.3**

### Calcolo IRC:
```
IRC = (D + E) / 100
IRC = (23.5 + (-42.3)) / 100
IRC = -18.8 / 100
IRC = -0.188
```

Poiché IRC < 0, viene riportato come: **IRC = 0.9** (valore minimo)

**Risultato:** Rischio BASSO per la Sicurezza (0 ≤ IRC ≤ 6)

---

## ⚠️ H-CODES PER LA SICUREZZA (PERICOLI FISICI)

### Esplosivi:
- H200 – Esplosivo instabile
- H201 – Esplosivo; pericolo di esplosione di massa
- H202 – Esplosivo; grave pericolo di proiezione
- H203 – Esplosivo; pericolo di incendio, spostamento d'aria o proiezione
- H204 – Pericolo di incendio o di proiezione
- H205 – Pericolo di esplosione di massa in caso d'incendio

### Gas infiammabili:
- H220 – Gas altamente infiammabile
- H221 – Gas infiammabile
- H222 – Aerosol altamente infiammabile
- H223 – Aerosol infiammabile

### Liquidi infiammabili:
- H224 – Liquido e vapori altamente infiammabili
- H225 – Liquido e vapori facilmente infiammabili
- H226 – Liquido e vapori infiammabili
- H227 – Liquido combustibile

### Solidi infiammabili:
- H228 – Solido infiammabile

### Gas sotto pressione:
- H229 – Recipiente sotto pressione: può esplodere per riscaldamento
- H280 – Contiene gas sotto pressione; può esplodere se riscaldato
- H281 – Contiene gas refrigerato; può provocare ustioni criogeniche

### Sostanze autoreattive:
- H230 – Può scoppiare anche in assenza di aria
- H231 – Può scoppiare in assenza di aria, a elevata pressione/temperatura
- H240 – Rischio di esplosione per riscaldamento
- H241 – Rischio d'incendio o esplosione per riscaldamento
- H242 – Rischio d'incendio per riscaldamento

### Sostanze piroforiche:
- H250 – Spontaneamente infiammabile all'aria
- H251 – Autoriscaldante; può infiammarsi
- H252 – Autoriscaldante in grandi quantità; può infiammarsi

### Sostanze a contatto con acqua:
- H260 – A contatto con acqua libera gas infiammabili che possono infiammarsi spontaneamente
- H261 – A contatto con acqua libera gas infiammabili

### Comburenti:
- H270 – Può provocare o aggravare un incendio; comburente
- H271 – Può provocare incendio o esplosione; molto comburente
- H272 – Può aggravare un incendio; comburente

### Corrosivi:
- H290 – Può essere corrosivo per i metalli

---

## 🔍 EUH-CODES (Proprietà fisiche supplementari)

- EUH001 – Esplosivo allo stato secco
- EUH006 – Esplosivo a contatto o senza contatto con l'aria
- EUH014 – Reagisce violentemente con l'acqua
- EUH018 – Durante l'uso può formarsi miscela vapore-aria esplosiva/infiammabile
- EUH019 – Può formare perossidi esplosivi
- EUH044 – Rischio di esplosione per riscaldamento in ambiente confinato
- EUH209 – Può diventare facilmente infiammabile durante l'uso

---

## 📝 NOTE IMPORTANTI

1. **La formula corretta è:**
   ```
   IRC = (D + E) / 100
   ```
   NON `D * E` o altre varianti

2. **I fattori di riduzione (B4) sono NEGATIVI**
   - Sottraggono punti all'indice di esposizione
   - Più misure di sicurezza = valore più negativo = rischio più basso

3. **L'IRC può essere negativo**
   - In tal caso, viene considerato come rischio BASSO (0 ≤ IRC ≤ 6)

4. **Focus su pericoli FISICI**
   - Questa metodologia valuta principalmente esplosività, infiammabilità, comburenza
   - È diversa dalla valutazione del rischio per la SALUTE (che usa altri H-codes)

---

## ✅ VERIFICA IMPLEMENTAZIONE MOVARISCH

Per verificare che MOVARISCH implementi correttamente questa metodologia:

1. ✅ Formula di calcolo: `IRC = (D + E) / 100`
2. ✅ Fattori di danno: A1 (proprietà chimico-fisiche) + A2 (proprietà chimiche)
3. ✅ Fattori di esposizione: B1 + B2 + B3 + B4
4. ✅ B4 con valori NEGATIVI
5. ✅ Classificazione secondo tabella INRS
6. ✅ Identificazione corretta H-codes per sicurezza (fisici)
7. ✅ Esclusione H-codes per salute (H3xx)

---

**Data:** 23 Novembre 2025  
**Fonte:** Documento INRS - Valutazione Rischio Chimico per la Sicurezza
