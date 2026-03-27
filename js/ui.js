// ═══════════════════════════════════
// SGMR - ui.js
// UI: rendering, panels, config, modals
// ═══════════════════════════════════

function addCatType(){
  const name=document.getElementById('cat-name-inp')?.value.trim();
  const color=document.getElementById('cat-color-val')?.value||'#ff5c5c';
  if(!name)return;
  if(kbCatTypes.find(c=>c.name===name))return showToast('Ya existe','err');
  kbCatTypes.push({name,color});
  saveCatTypes();
  document.getElementById('cat-name-inp').value='';
  renderCatsList();showToast('Tipo agregado','ok');
}

function addKB(type){
  const alias=document.getElementById(type==='partners'?'p-alias':type==='sites'?'s-alias':'c-alias').value.trim().toLowerCase();
  const full=document.getElementById(type==='partners'?'p-full':type==='sites'?'s-full':'c-full').value.trim();
  if(!alias||!full)return;
  const store=type==='partners'?kbPartners:type==='sites'?kbSites:kbCats;
  if(store.find(x=>x.alias===alias))return showToast('Alias ya existe','err');
  store.push({alias,full});
  ls(`sgmr_kb_${type}`,JSON.stringify(store));
  document.getElementById(type==='partners'?'p-alias':type==='sites'?'s-alias':'c-alias').value='';
  document.getElementById(type==='partners'?'p-full':type==='sites'?'s-full':'c-full').value='';
  if(type==='sites'){sites.push(full);ls('sgmr_sites',JSON.stringify(sites));buildSiteFilter();}
  renderKB();showToast(`Agregado: ${alias} → ${full}`,'ok');
}

function addPartner(){
  const inp=document.getElementById('p-new');
  const name=inp.value.trim();
  if(!name)return;
  if(kbPartners.find(p=>(p.full||p.alias)===name))return showToast('Ya existe','err');
  kbPartners.push({alias:name.toLowerCase().replace(/\s+/g,'-'),full:name});
  ls('sgmr_kb_partners',JSON.stringify(kbPartners));
  inp.value='';renderPartnersList();showToast('Partner agregado','ok');
}

function addSite(){
  var inp=document.getElementById('s-new');
  var name=inp.value.trim();
  if(!name)return;
  if(kbSites.includes(name))return showToast('Ya existe','err');
  kbSites.push(name);sites=kbSites;ls('sgmr_sites',JSON.stringify(kbSites));inp.value='';
  buildSiteFilter();renderSitesList();showToast('Sitio agregado','ok');
  saveConfigToSB();
}

function addTodo(){
  const inp=document.getElementById('todo-inp');
  const text=inp.value.trim();
  if(!text)return;
  todos.unshift({id:Date.now(),text,done:false,archived:false,created:new Date().toISOString()});
  saveTodos();inp.value='';renderTodo();
}

function bindDrag(container){
  var items=container.querySelectorAll('[draggable]');
  items.forEach(function(el){
    el.addEventListener('dragstart',function(e){
      _dragFrom=parseInt(el.dataset.idx);
      e.dataTransfer.effectAllowed='move';
      setTimeout(function(){el.style.opacity='0.4';},0);
    });
    el.addEventListener('dragend',function(){
      el.style.opacity='';
      container.querySelectorAll('.drag-over').forEach(function(x){x.classList.remove('drag-over');});
    });
    el.addEventListener('dragover',function(e){
      e.preventDefault();
      el.classList.add('drag-over');
    });
    el.addEventListener('dragleave',function(){
      el.classList.remove('drag-over');
    });
    el.addEventListener('drop',function(e){
      e.preventDefault();
      el.classList.remove('drag-over');
      var toIdx=parseInt(el.dataset.idx);
      var list=el.dataset.list;
      if(_dragFrom===null||_dragFrom===toIdx){_dragFrom=null;return;}
      if(list==='partners'){
        var item=kbPartners.splice(_dragFrom,1)[0];
        kbPartners.splice(toIdx,0,item);
        ls('sgmr_kb_partners',JSON.stringify(kbPartners));
        saveConfigToSB();renderPartnersList();
      } else if(list==='sites'){
        var item2=kbSites.splice(_dragFrom,1)[0];
        kbSites.splice(toIdx,0,item2);sites=kbSites;
        ls('sgmr_sites',JSON.stringify(kbSites));
        saveConfigToSB();renderSitesList();buildSiteFilter();
      }
      _dragFrom=null;
    });
  });
}

function buildSiteFilter(){
  var sel=document.getElementById('f-sitio');
  if(!sel)return;
  sel.innerHTML='<option value="todos">Todos los sitios</option>';
  var list=kbSites.length?kbSites:sites;
  list.forEach(function(s){var o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o);});
}

function cancelAnnoEdit(){
  const ov=document.getElementById('anno-detail-overlay');
  ov.classList.remove('anno-editing');
  ov.classList.add('anno-not-editing');
  document.getElementById('ad-edit-btn').style.display='';
  document.getElementById('ad-save-btn').style.display='none';
  document.getElementById('ad-cancel-btn').style.display='none';
}

function clearAll(){
  if(!confirm('¿Limpiar todos los datos locales?'))return;
  rows=[];sites=[...DEFAULT_SITES];
  ls('sgmr_rows','[]');ls('sgmr_sites',JSON.stringify(sites));
  buildSiteFilter();renderList();updateStats();showToast('Datos eliminados');
}

function clearPreset(){document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));datePreset=0;}

function closeAnnoDetail(e){
  if(e&&e.target!==document.getElementById('anno-detail-overlay'))return;
  document.getElementById('anno-detail-overlay').classList.remove('open');
  _currentDetailIdx=-1;
}

function closeCfg(){document.getElementById('overlay-cfg').classList.remove('open');}

function closeCfgOut(e){if(e.target.id==='overlay-cfg')closeCfg();}

function closeLightbox(e){
  if(e&&e.target!==document.getElementById('lightbox'))return;
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightbox-img').src='';
}

function closeMobList(){
  document.getElementById('mob-list').classList.remove('mob-open');
  document.getElementById('mob-fab').style.display='';
}

function compressImg(dataUrl,type,cb){
  const img=new Image();
  img.onload=()=>{
    const canvas=document.createElement('canvas');
    const max=1024;
    let w=img.width,h=img.height;
    if(w>max||h>max){if(w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;}}
    canvas.width=w;canvas.height=h;
    canvas.getContext('2d').drawImage(img,0,0,w,h);
    const compressed=canvas.toDataURL('image/jpeg',0.7);
    cb(compressed.split(',')[1],compressed,'image/jpeg');
  };img.src=dataUrl;
}

function confirmCancel(){pendingConfirm=null;addBotMsg('Ok, no guardé nada. ¿Algo más?');}

function confirmEdit(){addBotMsg('Decime qué querés cambiar (tipo, sitio, descripción o partner).');}

async function confirmSave(){
  if(!pendingConfirm)return;
  const r=pendingConfirm;pendingConfirm=null;
  var autoTipo=r.tipo;if(!autoTipo||autoTipo==='Cambio/Comentario'){var txt=(r.texto||r.sitio||'').toLowerCase();if(txt.indexOf('problem')>-1||txt.indexOf('error')>-1||txt.indexOf('fall')>-1||txt.indexOf('issue')>-1||txt.indexOf('bug')>-1)autoTipo='Problema';else if(txt.indexOf('recordar')>-1||txt.indexOf('reminder')>-1||txt.indexOf('pending')>-1||txt.indexOf('pendiente')>-1)autoTipo='Recordatorio';else autoTipo=autoTipo||'Cambio/Comentario';}var autoNombre=r.texto?r.texto.slice(0,40):r.sitio;const row={fecha:nowFecha(),tipo:autoTipo,sitio:r.sitio,texto:r.texto,partner:r.partner||'',estado:r.estado||'Pendiente',nombre:autoNombre,tgSent:false};
  if(window._lastPastedImage){row.screenshot=window._lastPastedImage;window._lastPastedImage=null;}
  const saved=await saveSB(row); rows.push(row);ls('sgmr_rows',JSON.stringify(rows));
  buildSiteFilter();renderList();updateStats();
  addBotMsg(`✅ Guardado en <strong>${esc(row.sitio)}</strong>${saved?' y sincronizado en Supabase':' (guardado local)'}.`);
  showToast('Anotación guardada','ok');
}

async function cycleEstado(idx){
  const s=['Pendiente','En proceso','Listo'];
  rows[idx].estado=s[(s.indexOf(rows[idx].estado)+1)%3];
  ls('sgmr_rows',JSON.stringify(rows));patchSB(rows[idx]);renderList();
}

async function deleteRow(idx){
  if(!confirm('Eliminar esta anotacion?'))return;
  const row=rows[idx];
  if(row.id&&sbUrl&&sbKey){try{await fetch(sbUrl+'/rest/v1/anotaciones?id=eq.'+row.id,{method:'DELETE',headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey}});}catch(e){}}
  rows.splice(idx,1);ls('sgmr_rows',JSON.stringify(rows));renderList();updateStats();showToast('Eliminado','ok');
}

function editCatType(i){
  const txt=document.getElementById('cattxt_'+i);
  const cur=kbCatTypes[i].name;
  const inp=document.createElement('input');
  inp.type='text';inp.value=cur;inp.className='fc';inp.style.flex='1';inp.style.fontSize='16px';inp.style.padding='3px 7px';
  txt.replaceWith(inp);inp.focus();
  inp.onblur=()=>{
    const v=inp.value.trim();
    if(v&&v!==cur){kbCatTypes[i].name=v;saveCatTypes();}
    renderCatsList();
  };
  inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value=cur;inp.blur();}};
}

function editPartner(i){
  const txt=document.getElementById('partnertxt_'+i);
  const cur=kbPartners[i].full||kbPartners[i].alias;
  const inp=document.createElement('input');
  inp.type='text';inp.value=cur;inp.className='fc';inp.style.flex='1';inp.style.fontSize='16px';inp.style.padding='3px 7px';
  txt.replaceWith(inp);inp.focus();
  inp.onblur=()=>{
    const v=inp.value.trim();
    if(v&&v!==cur){kbPartners[i].full=v;kbPartners[i].alias=v.toLowerCase().replace(/\s+/g,'-');ls('sgmr_kb_partners',JSON.stringify(kbPartners));}
    renderPartnersList();
  };
  inp.onkeydown=(e)=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value=cur;inp.blur();}};
}

function editSite(i){
  const txt=document.getElementById('sitetxt_'+i);
  const cur=kbSites[i];
  const inp=document.createElement('input');
  inp.type='text';inp.value=cur;inp.className='fc';inp.style.flex='1';inp.style.fontSize='16px';inp.style.padding='3px 7px';
  txt.replaceWith(inp);inp.focus();
  inp.onblur=()=>{
    const v=inp.value.trim();
    if(v&&v!==cur){kbSites[i]=v;ls('sgmr_sites',JSON.stringify(kbSites));}
    renderSitesList();
  };
  inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value=cur;inp.blur();}};
}

function getTipoColor(tipo){
  if(!tipo)return null;
  try{
    var cats=kbCatTypes||[];
    if(!cats.length){var _c2=ls('sgmr_kb_cats');if(_c2)cats=JSON.parse(_c2);}
    var found=cats.find(function(x){return x.name===tipo;});
    if(found&&found.color)return found.color;
  }catch(e){}
  if(/problema/i.test(tipo))return'var(--prob)';
  if(/recordatorio/i.test(tipo))return'var(--rec)';
  if(/cambio/i.test(tipo))return'var(--cam)';
  return null;
}

function handleScreenshot(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const dataUrl=e.target.result;
    // Save to row
    if(_currentDetailIdx>=0){
      rows[_currentDetailIdx].screenshot=dataUrl;
      ls('sgmr_rows',JSON.stringify(rows));
      showScreenshotThumb(dataUrl);
      showToast('Screenshot guardado ✓','ok');
    }
  };
  reader.readAsDataURL(file);
}

function initColorPicker(){
  const picker=document.getElementById('cat-color-picker');
  if(!picker||picker.children.length>0)return;
  CAT_COLORS.forEach((col,idx)=>{
    const dot=document.createElement('div');
    dot.title=col.name;
    dot.style.cssText='width:22px;height:22px;border-radius:50%;background:'+col.hex+';cursor:pointer;border:2px solid '+(idx===0?'#fff':'transparent')+';transition:all .15s;flex-shrink:0;box-shadow:0 0 6px '+col.hex+'88;';
    dot.onclick=()=>{
      document.getElementById('cat-color-val').value=col.hex;
      picker.querySelectorAll('div').forEach(d=>d.style.borderColor='transparent');
      dot.style.borderColor='#fff';
    };
    picker.appendChild(dot);
  });
}

function openAnnoDetail(idx){
  _currentDetailIdx = idx;
  const r = rows[idx];
  const cls = r.tipo==='Problema'?'prob':r.tipo==='Recordatorio'?'rec':'cam';
  document.getElementById('ad-rtype').className='rtype '+cls;
  document.getElementById('ad-rtype').textContent=r.tipo;
  document.getElementById('ad-sitio').textContent=r.sitio||'';
  document.getElementById('ad-texto').textContent=r.texto||'';
  document.getElementById('ad-texto-edit').value=r.texto||'';
  document.getElementById('ad-partner').textContent=r.partner||'—';
  document.getElementById('ad-partner-edit').value=r.partner||'';
  document.getElementById('ad-estado').textContent=r.estado||'';
  document.getElementById('ad-estado-edit').value=r.estado||'Pendiente';
  // Populate partner select from kbPartners
  var partSel=document.getElementById('ad-partner-edit');
  var partOpts='<option value="">Sin partner</option>';
  kbPartners.forEach(function(p){var n=p.full||p.alias;partOpts+='<option value="'+n+'">'+n+'</option>';});
  if(r.partner&&!kbPartners.find(function(p){return (p.full||p.alias)===r.partner;}))partOpts+='<option value="'+r.partner+'">'+r.partner+'</option>';
  partSel.innerHTML=partOpts;
  partSel.value=r.partner||'';
  // Populate tipo select from kbCatTypes
  var tipoSel=document.getElementById('ad-tipo-edit');
  var tipoList=kbCatTypes&&kbCatTypes.length?kbCatTypes:[{name:'Problema'},{name:'Recordatorio'},{name:'Cambio/Comentario'}];
  tipoSel.innerHTML=tipoList.map(function(ct){return '<option value="'+ct.name+'">'+ct.name+'</option>';}).join('');
  if(r.tipo&&!tipoList.find(function(ct){return ct.name===r.tipo;}))tipoSel.innerHTML+='<option value="'+r.tipo+'">'+r.tipo+'</option>';
  tipoSel.value=r.tipo||tipoList[0].name;
  try{var _ls=ls('sgmr_sites');if(_ls){kbSites=JSON.parse(_ls);sites=kbSites;}}catch(e){}
  try{var _lp=ls('sgmr_kb_partners');if(_lp)kbPartners=JSON.parse(_lp);}catch(e){}
  try{var _lc=ls('sgmr_kb_cats');if(_lc)kbCatTypes=JSON.parse(_lc);}catch(e){}
  var sitioSel=document.getElementById('ad-sitio-edit');
  var sitioOpts='<option value="">-- Sitio --</option>';
  kbSites.forEach(function(s){sitioOpts+='<option value="'+s+'">'+s+'</option>';});
  if(r.sitio&&kbSites.indexOf(r.sitio)===-1)sitioOpts+='<option value="'+r.sitio+'">'+r.sitio+'</option>';
  sitioSel.innerHTML=sitioOpts;
  sitioSel.value=r.sitio||'';
  // Update sitio display val
  const sitioVal=document.getElementById('ad-sitio-val');
  if(sitioVal)sitioVal.textContent=r.sitio||'';
  document.getElementById('ad-tipo').textContent=r.tipo||'';
  document.getElementById('ad-tipo-edit').value=r.tipo||'Problema';
  document.getElementById('ad-fecha').textContent=r.fecha||'';
  document.getElementById('ad-notas').textContent=r.notas||'Sin notas';
  document.getElementById('ad-notas-edit').value=r.notas||'';
  showScreenshotThumb(r.screenshot||'');
  const ov=document.getElementById('anno-detail-overlay');
  ov.className='anno-detail-overlay anno-not-editing';
  ov.classList.add('open');
  document.getElementById('ad-edit-btn').style.display='';
  document.getElementById('ad-save-btn').style.display='none';
  document.getElementById('ad-cancel-btn').style.display='none';
}

function openCfg(){renderKB();renderSitesList();renderPartnersList();renderCatsList();document.getElementById('overlay-cfg').classList.add('open');}

function openLightbox(src){
  document.getElementById('lightbox-img').src=src;
  document.getElementById('lightbox').classList.add('open');
}

function openMobList(){
  document.getElementById('mob-list').classList.add('mob-open');
  document.getElementById('mob-fab').style.display='none';
}

function removeCatType(i){
  kbCatTypes.splice(i,1);
  ls('sgmr_kb_cats',JSON.stringify(kbCatTypes));
  saveConfigToSB();
  renderCatsList();
  showToast('Tipo eliminado','ok');
}

function removeKB(type,i){
  const store=type==='partners'?kbPartners:type==='sites'?kbSites:kbCats;
  store.splice(i,1);ls(`sgmr_kb_${type}`,JSON.stringify(store));renderKB();
}

function removePartner(i){
  kbPartners.splice(i,1);
  ls('sgmr_kb_partners',JSON.stringify(kbPartners));
  saveConfigToSB();
  renderPartnersList();
  showToast('Partner eliminado','ok');
}

function removeSite(i){
  kbSites.splice(i,1);sites=kbSites;
  ls('sgmr_sites',JSON.stringify(kbSites));
  saveConfigToSB();
  buildSiteFilter();renderSitesList();
  showToast('Sitio eliminado','ok');
}

function renderCatsList(){
  const el=document.getElementById('kb-cats-list');if(!el)return;
  el.innerHTML=kbCatTypes.length?kbCatTypes.map((cat,i)=>
    `<div class="kb-item" style="display:flex;align-items:center;gap:10px;padding:10px 14px" id="catrow_${i}">
      <div style="width:14px;height:14px;border-radius:50%;background:${cat.color};flex-shrink:0;box-shadow:0 0 6px ${cat.color}88"></div>
      <span class="kb-full" id="cattxt_${i}" style="flex:1;font-size:16px">${cat.name}</span>
      <div style="display:flex;gap:4px">
        <button class="kb-rm" style="color:var(--text3);font-size:14px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface2)" onclick="editCatType(${i})">✎</button>
        <button class="kb-rm" onclick="removeCatType(${i})">✕</button>
      </div>
    </div>`).join('')
  :'<div style="font-size:16px;color:var(--text3);padding:6px 0">Sin tipos configurados.</div>';
  initColorPicker();
}

function renderKB(){
  ['partners','sites','cats'].forEach(type=>{
    const store=type==='partners'?kbPartners:type==='sites'?kbSites:kbCats;
    const el=document.getElementById('kb-'+type);if(!el)return;
    el.innerHTML=store.length?store.map((x,i)=>`<div class="kb-item"><span class="kb-alias">${esc(x.alias)}</span><span class="kb-arrow">→</span><span class="kb-full">${esc(x.full)}</span><button class="kb-rm" onclick="removeKB('${type}',${i})">✕</button></div>`).join(''):'';
  });
}

function renderList(){
  const tipoF=filterTipo,sitioF=document.getElementById('f-sitio').value,estadoF=document.getElementById('f-estado').value;
  const fromV=document.getElementById('d-from').value,toV=document.getElementById('d-to').value;
  const from=fromV?new Date(fromV):null,to=toV?new Date(toV+'T23:59:59'):null;

  let filtered=rows.filter(r=>{
    if(tipoF!=='todos'&&r.tipo!==tipoF)return false;
    if(sitioF!=='todos'&&r.sitio!==sitioF)return false;
    if(estadoF!=='todos'&&r.estado!==estadoF)return false;
    const d=parseDate(r.fecha);
    if(from&&d<from)return false;
    if(to&&d>to)return false;
    return true;
  });

  const groups={};
  filtered.forEach(r=>{const k=r.fecha?r.fecha.split(' ')[0]:'Sin fecha';if(!groups[k])groups[k]=[];groups[k].push(r);});
  const dates=Object.keys(groups).sort((a,b)=>parseDate(b)-parseDate(a));

  const scroll=document.getElementById('anno-scroll');scroll.innerHTML='';
  if(!filtered.length){scroll.innerHTML='<div class="empty-st"><big>📋</big><span>Sin anotaciones</span></div>';updateStats(filtered);return;}

  dates.forEach(dk=>{
    const grp=groups[dk];
    const sec=document.createElement('div');sec.className='day-sec';
    const dh=document.createElement('div');dh.className='day-hdr';
    dh.innerHTML=`<div class="day-bar"></div><span class="day-name">${fmtDay(dk)}</span><div class="day-line"></div><span class="day-badge">${grp.length}</span>`;
    sec.appendChild(dh);
    grp.slice().reverse().forEach(r=>{
      const idx=rows.indexOf(r);
      const cls=r.tipo==='Problema'?'prob':r.tipo==='Recordatorio'?'rec':'cam';
      const ecls=r.estado==='En proceso'?'en-proceso':r.estado==='Listo'?'listo':'';
      const row=document.createElement('div');row.className=`anno-row ${cls}`;row.onclick=(e)=>{if(e.target.closest('.kb-rm,.etag'))return;openAnnoDetail(idx);};
      row.innerHTML=`<div class="row-bar" style="background:${getTipoColor(r.tipo)||''};opacity:.9"></div><div class="rc"><span class="rtype ${cls}" style="background:${getTipoColor(r.tipo)}22;color:${getTipoColor(r.tipo)};border-color:${getTipoColor(r.tipo)}55">${esc(r.tipo==='Cambio/Comentario'?'Cambio':r.tipo)}</span></div><div class="rc rsite" title="${esc(r.sitio)}">${esc(r.sitio)}</div><div class="rc rtxt" title="${esc(r.texto)}">${esc(r.texto)}</div><div class="rc rpartner">${r.partner?esc(r.partner):''}</div><div class="rc restado-c" style="display:flex;gap:4px"><button class="tg-btn ${r.tgSent?'tg-sent':''}" onclick="sendTelegram(${idx},false)" title="${r.tgSent?'Enviado':'Enviar a Sigmundur'}">${r.tgRead?'&#10003;&#10003; Leído':r.tgSent?'&#10003; Sent':'&#9992; TG'}</button><button class="tg-btn" onclick="sendTelegram(${idx},true)" title="Test: enviar a mi mismo" style="font-size:11px;opacity:.6">&#128272;</button></div><div class="rc" style="display:flex;justify-content:center"><button class="kb-rm" title="Eliminar" onclick="deleteRow(${idx})">&#x2715;</button></div>`;
      sec.appendChild(row);
    });
    scroll.appendChild(sec);
  });
  updateStats(filtered);
}

function renderPartnersList(){
  var el=document.getElementById('kb-partners-list');if(!el)return;
  if(!kbPartners.length){el.innerHTML='<div style="font-size:16px;color:var(--text3);padding:6px 0">Sin partners.</div>';return;}
  el.innerHTML=kbPartners.map(function(p,i){
    var n=p.full||p.alias;
    return '<div class="kb-item" id="partrow_'+i+'" draggable="true" data-idx="'+i+'" data-list="partners" style="cursor:grab">'
      +'<span class="kb-drag" style="margin-right:8px">&#9783;</span>'
      +'<span class="kb-full" id="partnertxt_'+i+'" style="flex:1">'+n+'</span>'
      +'<div style="display:flex;gap:4px">'
      +'<button class="kb-rm" style="color:var(--text3);font-size:14px;padding:2px 5px;border:1px solid var(--border);border-radius:4px;background:var(--surface2)" onclick="editPartner('+i+')">&#9998;</button>'
      +'<button class="kb-rm" onclick="removePartner('+i+')">&#x2715;</button>'
      +'</div></div>';
  }).join('');
  bindDrag(el);
}

function renderSitesList(){
  try{var _s=ls('sgmr_sites');if(_s){var _p=JSON.parse(_s);if(_p.length>kbSites.length||kbSites.length===0){kbSites=_p;sites=kbSites;}}}catch(e){}
  var el=document.getElementById('kb-sites-list');if(!el)return;
  if(!kbSites.length){el.innerHTML='<div style="font-size:16px;color:var(--text3);padding:6px 0">Sin sitios.</div>';return;}
  el.innerHTML=kbSites.map(function(s,i){
    return '<div class="kb-item" id="siterow_'+i+'" draggable="true" data-idx="'+i+'" data-list="sites" style="cursor:grab">'
      +'<span class="kb-drag" style="margin-right:8px">&#9783;</span>'
      +'<span class="kb-full" id="sitetxt_'+i+'" style="flex:1">'+s+'</span>'
      +'<div style="display:flex;gap:4px">'
      +'<button class="kb-rm" style="color:var(--text3);font-size:14px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface2)" onclick="editSite('+i+')">&#9998;</button>'
      +'<button class="kb-rm" onclick="removeSite('+i+')">&#x2715;</button>'
      +'</div></div>';
  }).join('');
  bindDrag(el);
}

function renderStrip(){
  const s=document.getElementById('img-strip');s.innerHTML='';
  pendingImgs.forEach((img,i)=>{const d=document.createElement('div');d.className='img-thumb';d.innerHTML=`<img src="${img.dataUrl}"/><button class="img-rm" onclick="rmImg(${i})">✕</button>`;s.appendChild(d);});
}

function renderTodo(){
  const active=todos.filter(t=>!t.archived);
  const archived=todos.filter(t=>t.archived);

  // Group active by week
  const groups={};
  active.forEach(t=>{
    const wk=weekKey(t.created);
    if(!groups[wk])groups[wk]=[];
    groups[wk].push(t);
  });

  const list=document.getElementById('todo-lists');
  list.innerHTML='';

  if(active.length===0){
    list.innerHTML='<div style="color:var(--text3);font-size:16px;padding:20px 0;text-align:center">Sin tareas pendientes 🎉</div>';
  } else {
    Object.entries(groups).forEach(([wk,items])=>{
      const grp=document.createElement('div');
      grp.className='todo-week-group';
      grp.innerHTML=`<div class="todo-week-hdr">${wk}<span class="todo-week-badge">${items.length} tarea${items.length!==1?'s':''}</span></div>`;
      items.forEach(t=>{
        const row=document.createElement('div');
        row.className='todo-item';
        const d=new Date(t.created);
        const dateStr=d.toLocaleDateString('es-AR',{day:'numeric',month:'short'});
        row.innerHTML=`
          <div class="todo-check${t.done?' done':''}" onclick="toggleTodo(${t.id})">${t.done?'✓':''}</div>
          <span class="todo-text${t.done?' done':''}">${t.text}</span>
          <span class="todo-date">${dateStr}</span>
          <button class="todo-del" onclick="deleteTodo(${t.id})">✕</button>`;
        grp.appendChild(row);
      });
      list.appendChild(grp);
    });
  }

  // Archived
  const toggle=document.getElementById('archived-toggle');
  const archCount=document.getElementById('archived-count');
  const archList=document.getElementById('archived-list');
  toggle.style.display=archived.length?'flex':'none';
  archCount.textContent=archived.length;
  archList.innerHTML='';
  archived.forEach(t=>{
    const row=document.createElement('div');
    row.className='todo-item archived';
    const d=new Date(t.closedAt||t.created);
    const dateStr=d.toLocaleDateString('es-AR',{day:'numeric',month:'short'});
    row.innerHTML=`
      <div class="todo-check done" onclick="toggleTodo(${t.id})" title="Reabrir">✓</div>
      <span class="todo-text done">${t.text}</span>
      <span class="todo-date">${dateStr}</span>
      <button class="todo-del" onclick="deleteTodo(${t.id})">✕</button>`;
    archList.appendChild(row);
  });
}

async function saveAnnoEdit(){
  if(_currentDetailIdx<0)return;
  const r=rows[_currentDetailIdx];
  r.texto=document.getElementById('ad-texto-edit').value.trim();
  r.partner=document.getElementById('ad-partner-edit').value;
  const sitioEditEl=document.getElementById('ad-sitio-edit');
  if(sitioEditEl)r.sitio=sitioEditEl.value;
  r.estado=document.getElementById('ad-estado-edit').value;
  r.tipo=document.getElementById('ad-tipo-edit').value;
  r.notas=document.getElementById('ad-notas-edit').value.trim();
  ls('sgmr_rows',JSON.stringify(rows));
  if(r.id&&sbUrl&&sbKey){
    try{await fetch(sbUrl+'/rest/v1/anotaciones?id=eq.'+r.id,{method:'PATCH',headers:{'apikey':sbKey,'Authorization':'Bearer '+sbKey,'Content-Type':'application/json'},body:JSON.stringify({texto:r.texto,partner:r.partner,estado:r.estado,tipo:r.tipo})});}catch(e){}
  }
  cancelAnnoEdit();
  renderList();updateStats();showToast('Guardado ✓','ok');
  // Re-open with updated data
  setTimeout(()=>openAnnoDetail(_currentDetailIdx),100);
}

function saveCatTypes(){ls('sgmr_kb_cats',JSON.stringify(kbCatTypes));}

function saveCfg(){
  anthropicKey=document.getElementById('cfg-apikey').value.trim();
  sbUrl=document.getElementById('cfg-url').value.trim();
  sbKey=document.getElementById('cfg-key').value.trim();
  ls('sgmr_akey',anthropicKey);ls('sgmr_sb_url',sbUrl);ls('sgmr_sb_key',sbKey);
  closeCfg();showToast('Config guardada','ok');
  if(sbUrl&&sbKey)loadSB();

  saveConfigToSB();
}

function setCfgTab(name,el){
  document.querySelectorAll('.cfg-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.cfg-panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('cfg-'+name).classList.add('active');
  renderKB();
}

function setPreset(days,el){
  document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  datePreset=days;
  const now=new Date();
  document.getElementById('d-to').value=toInputDate(now);
  if(days>0){const f=new Date(now);f.setDate(f.getDate()-(days-1));document.getElementById('d-from').value=toInputDate(f);}
  else document.getElementById('d-from').value='';
  renderList();
}

function setTipo(t,el){filterTipo=t;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderList();}

function showCC(r){
  const cls=r.tipo==='Problema'?'prob':r.tipo==='Recordatorio'?'rec':'cam';
  addBotMsg(`¿Guardo esta anotación?<div class="cc">
    <div class="cc-row"><span class="cc-k">tipo</span><span class="cc-v"><span class="rtype ${cls}" style="display:inline-block">${esc(r.tipo)}</span></span></div>
    <div class="cc-row"><span class="cc-k">sitio</span><span class="cc-v">${esc(r.sitio)}</span></div>
    <div class="cc-row"><span class="cc-k">texto</span><span class="cc-v">${esc(r.texto)}</span></div>
    ${r.partner?`<div class="cc-row"><span class="cc-k">partner</span><span class="cc-v">${esc(r.partner)}</span></div>`:''}
    <div class="cc-acts">
      <button class="cc-btn ok" onclick="confirmSave()">✓ Guardar</button>
      <button class="cc-btn" onclick="confirmCancel()">✕ Cancelar</button>
      <button class="cc-btn" onclick="confirmEdit()">✏ Editar</button>
    </div>
  </div>`);
}

function showScreenshotThumb(src){
  const thumb=document.getElementById('ad-screenshot-thumb');
  const btn=document.getElementById('ad-screenshot-upload-btn');
  if(src){
    thumb.src=src;thumb.style.display='block';
    btn.querySelector('span').textContent='📎 Cambiar screenshot';
  } else {
    thumb.style.display='none';
    btn.querySelector('span').textContent='📎 Adjuntar screenshot';
  }
}

function showToast(msg,type){
  const t=document.getElementById('toast');t.textContent=msg;
  t.className='toast show'+(type?' '+type:'');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600);
}

function showTyping(){
  const w=document.createElement('div');w.className='msg bot';w.id='typing-w';
  const b=document.createElement('div');b.className='typing';b.innerHTML='<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  w.appendChild(b);document.getElementById('msgs').appendChild(w);scrollMsgs();
}

function switchView(view, el){
  document.querySelectorAll('.hdr-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('view-logs').style.display = view==='logs' ? 'contents' : 'none';
  document.getElementById('view-todo').style.display = view==='todo' ? 'flex' : 'none';
  if(view==='todo') renderTodo();
}

function toggleAnnoEdit(){
  const ov=document.getElementById('anno-detail-overlay');
  ov.classList.remove('anno-not-editing');
  ov.classList.add('anno-editing');
  document.getElementById('ad-edit-btn').style.display='none';
  document.getElementById('ad-save-btn').style.display='';
  document.getElementById('ad-cancel-btn').style.display='';
}

function toggleArchived(){
  archivedVisible=!archivedVisible;
  document.getElementById('archived-section').style.display=archivedVisible?'block':'none';
  document.getElementById('archived-arrow').textContent=archivedVisible?'▼':'▶';
}

function toggleTodo(id){
  const t=todos.find(x=>x.id===id);
  if(!t)return;
  t.done=!t.done;
  if(t.done){t.archived=true;t.closedAt=new Date().toISOString();}
  else{t.archived=false;t.closedAt=null;}
  saveTodos();renderTodo();
}

function updateStats(f){
  var src=f||rows;
  var ep=document.getElementById('s-prob');if(ep)ep.textContent=src.filter(function(r){return r.tipo==='Problema';}).length;
  var er=document.getElementById('s-rec');if(er)er.textContent=src.filter(function(r){return r.tipo==='Recordatorio';}).length;
  var ec=document.getElementById('s-cam');if(ec)ec.textContent=src.filter(function(r){return r.tipo==='Cambio/Comentario';}).length;
}

async function uploadScreenshot(base64,rowId,cb){
  if(!sbUrl||!sbKey||!base64||!rowId){cb(null);return;}
  try{
    var b64=base64.replace(/^data:[^;]+;base64,/,"");
    var bin=atob(b64);
    var arr=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    var blob=new Blob([arr],{type:"image/png"});
    var fname="screenshots/"+rowId+".png";
    fetch(sbUrl+"/storage/v1/object/"+fname,{
      method:"POST",
      headers:{"apikey":sbKey,"Authorization":"Bearer "+sbKey,"Content-Type":"image/png","x-upsert":"true"},
      body:blob
    }).then(function(res){return res.json();}).then(function(){
      cb(sbUrl+"/storage/v1/object/public/"+fname);
    }).catch(function(){cb(null);});
  }catch(e){cb(null);}
}

function weekKey(dateStr){
  const d=new Date(dateStr);
  const day=d.getDay()||7;
  const mon=new Date(d);mon.setDate(d.getDate()-day+1);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
  const fmt=x=>x.toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  return fmt(mon)+' – '+fmt(sun);
}