// ═══════════════════════════════════
// SGMR - data.js
// Data: load, save, Supabase sync
// ═══════════════════════════════════

function load(){
  try{const d=ls('sgmr_rows');if(d)rows=JSON.parse(d);}catch(e){}
  try{var _sd=ls('sgmr_sites');if(_sd){kbSites=JSON.parse(_sd);sites=kbSites;}}catch(e){}
  try{var _pd=ls('sgmr_kb_partners');if(_pd)kbPartners=JSON.parse(_pd);}catch(e){}
  try{var _cd=ls('sgmr_kb_cats');if(_cd)kbCatTypes=JSON.parse(_cd);}catch(e){}

  // Use preset keys if no saved ones
  anthropicKey=ls('sgmr_akey')||PRESET_AKEY;
  sbUrl=ls('sgmr_sb_url')||PRESET_SBURL;
  sbKey=ls('sgmr_sb_key')||PRESET_SBKEY;

  document.getElementById('cfg-apikey').value=anthropicKey;
  document.getElementById('cfg-url').value=sbUrl;
  document.getElementById('cfg-key').value=sbKey;

  buildSiteFilter();loadConfigFromSB();
  renderList();updateStats();
  setPreset(5,document.querySelector('.preset[data-d="5"]'));
  const _claxonGreetings = [
  '😴 Hola. Acá estoy, como siempre. Nadie me preguntó si quería, pero igual. ¿Qué necesitás?',
  '🥱 Buenís. Arranco con lo mínimo indispensable de energía. ¿En qué andamos?',
  '💤 Me agarrás recién. No estaba durmiendo, estaba... procesando. ¿Qué hay?',
  '🤖 Sistemas online. Motivación: en construcción. ¿Qué me tirás?',
  '☕️ Si me traerês un café sería otro panorama. Pero bueno, acá estamos. Dale.',
  '😒 Otro día laboral sin feriado a la vista. Qué emocionante todo. ¿Qué necesitás?',
  '🏖️ Sabés lo que me gustaría estar haciendo ahora? No importa. ¿En qué te ayudo?',
  '😎 Buenas. Estaba ocupado no haciendo nada hasta que llegaste. ¿Qué onda?',
  '💼 Acá estoy, presente en cuerpo. El espíritu lo negociamos después. ¿Qué me tenés?',
  '😑 Hola. Sigo acá. Nadie me dio de baja todavía. Misterioso. ¿Qué necesitás?',
  '⏰ No sé qué hora es, tampoco sé por qué me importaría. ¿En qué andamos?',
  '🙈 Estaba pensando en nada y la verdad que me venía bien. Pero dale, ¿qué pasó?',
  '🦷 Hola. Puntual como siempre, aunque nadie me lo pide. ¿Qué hacés?',
  '💡 Prendí las luces. Costó cara esa energía. Que sirva para algo. Contame.',
  '😬 No me preguntés cómo estoy que te cuento la verdad y se pone incómodo. Mejor tirá algo.',
];
addBotMsg(_claxonGreetings[Math.floor(Math.random()*_claxonGreetings.length)]);
  if(sbUrl&&sbKey)loadSB();
  loadTodos();
}

async function loadSB(){
  try{
    const r=await fetch(`${sbUrl}/rest/v1/anotaciones?order=created_at.asc`,{headers:{'apikey':sbKey,'Authorization':`Bearer ${sbKey}`}});
    if(!r.ok)return;
    const data=await r.json();
    if(Array.isArray(data)&&data.length>0){
      rows=data.map(r=>({id:r.id,fecha:r.fecha,tipo:r.tipo,sitio:r.sitio,texto:r.texto,partner:r.partner,estado:r.estado}));
      ls('sgmr_rows',JSON.stringify(rows));buildSiteFilter();renderList();updateStats();
    }
  }catch(e){}
}

function saveTodos(){
  ls('sgmr_todos',JSON.stringify(todos));
  if(sbUrl&&sbKey){
    todos.forEach(function(t){
      fetch(sbUrl+'/rest/v1/todos',{
        method:'POST',
        headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({id:String(t.id),text:t.text,done:t.done,archived:t.archived,created:t.created,closed_at:t.closedAt||null})
      }).catch(function(){});
    });
  }
}

function loadTodos(){
  try{var d=ls('sgmr_todos');if(d)todos=JSON.parse(d);}catch(e){}
  if(sbUrl&&sbKey){
    fetch(sbUrl+'/rest/v1/todos?select=*&order=created.desc',{
      headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey}
    }).then(function(r){return r.json();}).then(function(data){
      if(data&&data.length){
        todos=data.map(function(t){return{id:t.id,text:t.text,done:t.done,archived:t.archived,created:t.created,closedAt:t.closed_at};});
        ls('sgmr_todos',JSON.stringify(todos));
        renderTodo();
      }
    }).catch(function(){});
  }
}

function deleteTodo(id){
  if(!confirm('Eliminar tarea?'))return;
  todos=todos.filter(function(x){return x.id!==id;});
  saveTodos();
  if(sbUrl&&sbKey){
    fetch(sbUrl+'/rest/v1/todos?id=eq.'+id,{
      method:'DELETE',
      headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey}
    }).catch(function(){});
  }
  renderTodo();
}

async function patchSB(row){
  if(!sbUrl||!sbKey||!row.id)return;
  try{await fetch(`${sbUrl}/rest/v1/anotaciones?id=eq.${row.id}`,{method:'PATCH',headers:{'apikey':sbKey,'Authorization':`Bearer ${sbKey}`,'Content-Type':'application/json'},body:JSON.stringify({estado:row.estado})});}catch(e){}
}

function loadConfigFromSB(){
  if(!sbUrl||!sbKey)return;
  fetch(sbUrl+'/rest/v1/config?select=key,value',{
    headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey}
  }).then(function(r){return r.json();}).then(function(data){
    if(!data||!data.length)return;
    data.forEach(function(row){
      if(row.key&&row.value){
        ls(row.key,row.value);
        if(row.key==='sgmr_sites'){try{kbSites=JSON.parse(row.value);}catch(e){}}
        if(row.key==='sgmr_kb_partners'){try{kbPartners=JSON.parse(row.value);}catch(e){}}
        if(row.key==='sgmr_kb_cats'){try{kbCatTypes=JSON.parse(row.value);}catch(e){}}
      }
    });
  }).catch(function(){});
}

function saveConfigToSB(){
  if(!sbUrl||!sbKey)return;
  var pairs=[
    {key:'sgmr_sites',value:JSON.stringify(kbSites)},
    {key:'sgmr_kb_partners',value:JSON.stringify(kbPartners)},
    {key:'sgmr_kb_cats',value:JSON.stringify(kbCatTypes||[])}
  ];
  pairs.forEach(function(p){
    fetch(sbUrl+'/rest/v1/config',{
      method:'POST',
      headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({key:p.key,value:p.value,updated_at:new Date().toISOString()})
    }).catch(function(){});
  });
}