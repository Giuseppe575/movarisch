(function(){
  const KB_ENTRIES = [
    { id:'import', tags:['import', 'upload', 'pdf', 'sds'] },
    { id:'indici', tags:['indice', 'index', 'risk', 'movarisch'] },
    { id:'export', tags:['export', 'excel', 'word', 'report'] }
  ];

  const stepsList = document.getElementById('tutorialSteps');
  const kbResults = document.getElementById('kbResults');
  const kbCount = document.getElementById('kbCount');
  const kbSearch = document.getElementById('kbSearch');

  function ensureI18n(){
    return window.i18n || {
      t(key){ return key; },
      get(){ return undefined; },
      getLanguage(){ return 'it'; }
    };
  }

  function renderSteps(){
    if(!stepsList){ return; }
    const i18n = ensureI18n();
    const steps = i18n.t('tutorial.steps');
    stepsList.innerHTML = '';
    if(Array.isArray(steps)){
      steps.forEach((step)=>{
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
      });
    }
  }

  function matchesQuery(entry, query){
    if(!query){ return true; }
    const i18n = ensureI18n();
    const title = String(i18n.t(`kb.entries.${entry.id}.title`) || '').toLowerCase();
    const summary = String(i18n.t(`kb.entries.${entry.id}.summary`) || '').toLowerCase();
    const tags = (entry.tags || []).join(' ').toLowerCase();
    return title.includes(query) || summary.includes(query) || tags.includes(query);
  }

  function renderKnowledge(){
    if(!kbResults || !kbCount){ return; }
    const i18n = ensureI18n();
    const query = (kbSearch?.value || '').trim().toLowerCase();
    const filtered = KB_ENTRIES.filter(entry => matchesQuery(entry, query));
    const countText = i18n.t('support.knowledge.results', { count: filtered.length });
    kbCount.textContent = typeof countText === 'string' ? countText : String(filtered.length);
    kbResults.innerHTML = '';
    if(!filtered.length){
      const empty = document.createElement('div');
      empty.className = 'kb-empty';
      empty.textContent = i18n.t('support.knowledge.noResults');
      kbResults.appendChild(empty);
      return;
    }
    filtered.forEach((entry)=>{
      const title = i18n.t(`kb.entries.${entry.id}.title`);
      const summary = i18n.t(`kb.entries.${entry.id}.summary`);
      const card = document.createElement('article');
      card.className = 'kb-item';
      const h3 = document.createElement('h3');
      h3.textContent = title;
      const p = document.createElement('p');
      p.textContent = summary;
      card.appendChild(h3);
      card.appendChild(p);
      kbResults.appendChild(card);
    });
  }

  function init(){
    renderSteps();
    renderKnowledge();
    if(kbSearch){
      kbSearch.addEventListener('input', ()=>{
        renderKnowledge();
      });
    }
    if(window.i18n && typeof window.i18n.onChange === 'function'){
      window.i18n.onChange(()=>{
        renderSteps();
        renderKnowledge();
      });
    }else{
      window.addEventListener('i18n:change', ()=>{
        renderSteps();
        renderKnowledge();
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
