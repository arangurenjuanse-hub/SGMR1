// ═══════════════════════════════════
// SGMR - data.js
// Data: load, save, Supabase sync
// ═══════════════════════════════════

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

async function saveSB(row){
  if(!sbUrl||!sbKey)return false;
  try{
    var payload={fecha:row.fecha,tipo:row.tipo,sitio:row.sitio,texto:row.texto,partner:row.partner||'',estado:row.estado,nombre:row.nombre||'',tg_sent:row.tgSent||false};
    var res=await fetch(sbUrl+'/rest/v1/anotaciones',{method:'POST',headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(payload)});
    if(!res.ok)return false;
    var data=await res.json();
    if(data&&data[0])row.id=data[0].id;
    if(row.screenshot&&row.id){
      uploadScreenshot(row.screenshot,row.id,function(url){
        if(url){
          row.screenshot_url=url;
          fetch(sbUrl+'/rest/v1/anotaciones?id=eq.'+row.id,{method:'PATCH',headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey,'Content-Type':'application/json'},body:JSON.stringify({screenshot_url:url})});
          ls('sgmr_rows',JSON.stringify(rows));
        }
      });
    }
    return true;
  }catch(e){return false;}
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