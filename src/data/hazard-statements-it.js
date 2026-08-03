(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MovarischHazardStatementsIt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Formulazioni italiane delle indicazioni di pericolo CLP. I testi tra parentesi
  // restano generici quando la SDS deve specificare organi, via o effetto.
  const STATEMENTS = Object.freeze({
    H200: 'Esplosivo instabile.', H201: 'Esplosivo; pericolo di esplosione di massa.',
    H202: 'Esplosivo; grave pericolo di proiezione.', H203: 'Esplosivo; pericolo di incendio, di spostamento d’aria o di proiezione.',
    H204: 'Pericolo di incendio o di proiezione.', H205: 'Pericolo di esplosione di massa in caso d’incendio.',
    H220: 'Gas altamente infiammabile.', H221: 'Gas infiammabile.', H222: 'Aerosol altamente infiammabile.',
    H223: 'Aerosol infiammabile.', H224: 'Liquido e vapori altamente infiammabili.',
    H225: 'Liquido e vapori facilmente infiammabili.', H226: 'Liquido e vapori infiammabili.',
    H227: 'Liquido combustibile.', H228: 'Solido infiammabile.', H229: 'Contenitore pressurizzato: può esplodere se riscaldato.',
    H230: 'Può esplodere anche in assenza di aria.', H231: 'Può esplodere anche in assenza di aria a pressione e/o temperatura elevata.',
    H240: 'Rischio di esplosione per riscaldamento.', H241: 'Rischio d’incendio o di esplosione per riscaldamento.',
    H242: 'Rischio d’incendio per riscaldamento.', H250: 'Spontaneamente infiammabile all’aria.',
    H251: 'Autoriscaldante; può infiammarsi.', H252: 'Autoriscaldante in grandi quantità; può infiammarsi.',
    H260: 'A contatto con l’acqua libera gas infiammabili che possono infiammarsi spontaneamente.',
    H261: 'A contatto con l’acqua libera gas infiammabili.', H270: 'Può provocare o aggravare un incendio; comburente.',
    H271: 'Può provocare un incendio o un’esplosione; molto comburente.', H272: 'Può aggravare un incendio; comburente.',
    H280: 'Contiene gas sotto pressione; può esplodere se riscaldato.', H281: 'Contiene gas refrigerato; può provocare ustioni o lesioni criogeniche.',
    H290: 'Può essere corrosivo per i metalli.',
    H300: 'Letale se ingerito.', H301: 'Tossico se ingerito.', H302: 'Nocivo se ingerito.',
    H304: 'Può essere letale in caso di ingestione e di penetrazione nelle vie respiratorie.',
    H310: 'Letale per contatto con la pelle.', H311: 'Tossico per contatto con la pelle.', H312: 'Nocivo per contatto con la pelle.',
    H314: 'Provoca gravi ustioni cutanee e gravi lesioni oculari.', H315: 'Provoca irritazione cutanea.',
    H317: 'Può provocare una reazione allergica della pelle.', H318: 'Provoca gravi lesioni oculari.', H319: 'Provoca grave irritazione oculare.',
    H330: 'Letale se inalato.', H331: 'Tossico se inalato.', H332: 'Nocivo se inalato.',
    H334: 'Può provocare sintomi allergici o asmatici o difficoltà respiratorie se inalato.',
    H335: 'Può irritare le vie respiratorie.', H336: 'Può provocare sonnolenza o vertigini.',
    H340: 'Può provocare alterazioni genetiche.', H341: 'Sospettato di provocare alterazioni genetiche.',
    H350: 'Può provocare il cancro.', H350I: 'Può provocare il cancro se inalato.', H351: 'Sospettato di provocare il cancro.',
    H360: 'Può nuocere alla fertilità o al feto.', H360F: 'Può nuocere alla fertilità.', H360D: 'Può nuocere al feto.',
    H360FD: 'Può nuocere alla fertilità. Può nuocere al feto.', H360FD_MINOR: 'Può nuocere alla fertilità. Sospettato di nuocere al feto.',
    H360DF_MINOR: 'Può nuocere al feto. Sospettato di nuocere alla fertilità.',
    H361: 'Sospettato di nuocere alla fertilità o al feto.', H361F: 'Sospettato di nuocere alla fertilità.',
    H361D: 'Sospettato di nuocere al feto.', H361FD: 'Sospettato di nuocere alla fertilità. Sospettato di nuocere al feto.',
    H362: 'Può essere nocivo per i lattanti allattati al seno.',
    H370: 'Provoca danni agli organi.', H371: 'Può provocare danni agli organi.',
    H372: 'Provoca danni agli organi in caso di esposizione prolungata o ripetuta.',
    H373: 'Può provocare danni agli organi in caso di esposizione prolungata o ripetuta.',
    H400: 'Molto tossico per gli organismi acquatici.', H410: 'Molto tossico per gli organismi acquatici con effetti di lunga durata.',
    H411: 'Tossico per gli organismi acquatici con effetti di lunga durata.', H412: 'Nocivo per gli organismi acquatici con effetti di lunga durata.',
    H413: 'Può essere nocivo per gli organismi acquatici con effetti di lunga durata.', H420: 'Nuoce alla salute pubblica e all’ambiente distruggendo l’ozono dello strato superiore dell’atmosfera.',
    EUH001: 'Esplosivo allo stato secco.', EUH006: 'Esplosivo a contatto o senza contatto con l’aria.',
    EUH014: 'Reagisce violentemente con l’acqua.', EUH018: 'Durante l’uso può formarsi una miscela vapore-aria esplosiva/infiammabile.',
    EUH019: 'Può formare perossidi esplosivi.', EUH029: 'A contatto con l’acqua libera un gas tossico.',
    EUH031: 'A contatto con acidi libera gas tossici.', EUH032: 'A contatto con acidi libera gas molto tossici.',
    EUH044: 'Rischio di esplosione per riscaldamento in ambiente confinato.', EUH066: 'L’esposizione ripetuta può provocare secchezza o screpolature della pelle.',
    EUH070: 'Tossico per contatto oculare.', EUH071: 'Corrosivo per le vie respiratorie.',
    EUH201: 'Contiene piombo. Non utilizzare su oggetti che possono essere masticati o succhiati dai bambini.',
    EUH201A: 'Attenzione! Contiene piombo.', EUH202: 'Cianoacrilato. Pericolo. Incolla la pelle e gli occhi in pochi secondi. Tenere fuori dalla portata dei bambini.',
    EUH203: 'Contiene cromo (VI). Può provocare una reazione allergica.', EUH204: 'Contiene isocianati. Può provocare una reazione allergica.',
    EUH205: 'Contiene componenti epossidici. Può provocare una reazione allergica.', EUH206: 'Attenzione! Non utilizzare in combinazione con altri prodotti. Possono liberarsi gas pericolosi (cloro).',
    EUH207: 'Attenzione! Contiene cadmio. Durante l’uso si sviluppano fumi pericolosi. Leggere le informazioni del fabbricante e rispettare le disposizioni di sicurezza.',
    EUH208: 'Contiene una sostanza sensibilizzante. Può provocare una reazione allergica.',
    EUH209: 'Può diventare facilmente infiammabile durante l’uso.', EUH209A: 'Può diventare infiammabile durante l’uso.',
    EUH380: 'Può interferire con il sistema endocrino negli esseri umani.', EUH381: 'Sospettato di interferire con il sistema endocrino negli esseri umani.'
  });

  function normalizeCode(value) {
    const match = String(value == null ? '' : value).match(/\b(EUH\s*\d{3}[A-Z]?|H\s*\d{3}[A-Z]{0,2})\b/i);
    return match ? match[1].replace(/\s+/g, '').toUpperCase() : '';
  }

  function descriptionFor(value) {
    const raw = String(value == null ? '' : value).replace(/\s+/g, '');
    if (/^H360Fd$/.test(raw)) return STATEMENTS.H360FD_MINOR;
    if (/^H360Df$/.test(raw)) return STATEMENTS.H360DF_MINOR;
    return STATEMENTS[normalizeCode(value)] || '';
  }

  return Object.freeze({ STATEMENTS, normalizeCode, descriptionFor });
});
