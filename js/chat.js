// ═══════════════════════════════════
// SGMR - chat.js
// Claxon AI: callAI, messages, annotations
// ═══════════════════════════════════

async function callAI(text,imgs){
  const kbCtx=buildKBContext();
  const sys=`Sos un asistente de gestión de anotaciones para sitios web de casino/crypto. SIEMPRE respondés SOLO con JSON válido. NUNCA respondés con texto libre.

SITIOS DISPONIBLES: ${sites.join(', ')}
${kbCtx}

ANOTACIONES RECIENTES (últimas 40):
${JSON.stringify(rows.slice(-40).map(r=>({fecha:r.fecha,tipo:r.tipo,sitio:r.sitio,texto:r.texto,partner:r.partner,estado:r.estado})))}

REGLAS ABSOLUTAS:
1. SIEMPRE respondés con uno de estos 3 JSON y nada más:
   - Para anotar: {"action":"annotate","tipo":"Problema|Recordatorio|Cambio/Comentario","sitio":"nombre exacto","texto":"descripcion","partner":"partner o vacio","estado":"Pendiente"}
   - Para preguntar algo: {"action":"ask","pregunta":"pregunta corta"}
   - Para responder consultas: {"action":"answer","respuesta":"texto de respuesta"}
2. Cuando ves una imagen: SIEMPRE creás una anotación. Describí lo que ves en "texto". Si no sabés el sitio usá "General".
3. El texto junto a la imagen (ej: "7 stars - crypto bonus bet") indica el partner y/o sitio.
4. Usá la base de conocimiento para resolver aliases.
5. Inferí el tipo: error/falla/pago=Problema, tarea/pendiente=Recordatorio, nota/cambio=Cambio/Comentario.
6. NUNCA escribas texto fuera del JSON. NUNCA uses markdown. SOLO JSON.`;

  const userContent=[];
  imgs.forEach(img=>{userContent.push({type:'image',source:{type:'base64',media_type:img.type,data:img.b64}});});
  userContent.push({type:'text',text:text||'Analizá esta imagen.'});
  chatHistory.push({role:'user',content:userContent});
  if(chatHistory.length>14)chatHistory=chatHistory.slice(-14);

  const res=await fetch('https://sgmr.arangurenjuanse.workers.dev/',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({apiKey:anthropicKey,payload:{model:'claude-sonnet-4-20250514',max_tokens:600,system:sys,messages:chatHistory}})
  });
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`HTTP ${res.status}`);}
  const data=await res.json();
  const raw=data.content?.find(c=>c.type==='text')?.text||'{}';
  chatHistory.push({role:'assistant',content:[{type:'text',text:raw}]});
  return JSON.parse(raw.replace(/```json|```/g,'').trim());
}

function addBotMsg(html){
  const w=document.createElement('div');w.className='msg bot';
  const b=document.createElement('div');b.className='bubble';b.innerHTML=html;
  const t=document.createElement('div');t.className='msg-meta';t.textContent=fmtTime(new Date());
  w.appendChild(b);w.appendChild(t);document.getElementById('msgs').appendChild(w);scrollMsgs();return b;
}

function addUserMsg(html){
  const w=document.createElement('div');w.className='msg user';
  const b=document.createElement('div');b.className='bubble';b.innerHTML=html;
  const t=document.createElement('div');t.className='msg-meta';t.textContent=fmtTime(new Date());
  w.appendChild(b);w.appendChild(t);document.getElementById('msgs').appendChild(w);scrollMsgs();
}

async function send(){
  if(isThinking)return;
  const inp=document.getElementById('msg');
  const text=inp.value.trim(),imgs=[...pendingImgs];
  if(!text&&!imgs.length)return;
  let userHtml='';imgs.forEach(img=>{userHtml+=`<img src="${img.dataUrl}"/>\n`;});
  if(text)userHtml+=esc(text);
  addUserMsg(userHtml);
  inp.value='';inp.style.height='auto';pendingImgs=[];renderStrip();
  if(pendingConfirm){handleConfirmReply(text,imgs);return;}
  isThinking=true;document.getElementById('send-btn').disabled=true;
  document.getElementById('chat-st').textContent='Pensando...';
  showTyping();
  try{const r=await callAI(text,imgs);hideTyping();processReply(r);}
  catch(e){hideTyping();addBotMsg('❌ Error: '+(e.message||'Verificá tu API key en Config.'));}
  isThinking=false;document.getElementById('send-btn').disabled=false;
  document.getElementById('chat-st').textContent='Online';
}

function onKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}

function processReply(r){
  if(r.action==='annotate'){pendingConfirm=r;showCC(r);}
  else if(r.action==='ask'){addBotMsg(esc(r.pregunta));}
  else if(r.action==='answer'){addBotMsg(r.respuesta.replace(/\n/g,'<br>'));}
  else addBotMsg('No entendí. ¿Podés reformular?');
}

function handleConfirmReply(text,imgs){
  if(!pendingConfirm)return;
  const t=(text||'').toLowerCase().trim();
  if(!text&&!imgs.length)return;
  if(/^(si|sí|yes|ok|dale|guardar|guardá|sure)$/.test(t)){confirmSave();}
  else if(/^(no|cancel|cancelar)$/.test(t)){confirmCancel();}
  else{
    showTyping();
    callAI(`Anotación actual: ${JSON.stringify(pendingConfirm)}. El usuario pide este cambio: "${text}". Devolvé JSON corregido con action:annotate.`,[])
      .then(r=>{hideTyping();if(r.action==='annotate'){pendingConfirm=r;showCC(r);}else addBotMsg(r.respuesta||'¿Qué querés cambiar?');})
      .catch(()=>{hideTyping();addBotMsg('Error. Intentá de nuevo.');});
  }
}

function generateSummary(r,eventSummary){
  var d=r.fecha||'';
  var parts=d.split('/');
  var fechaFmt=parts.length>=2?(parts[0]+'/'+parts[1]):d;
  var tipo=r.tipo==='Problema'?'Problem':r.tipo==='Recordatorio'?'Reminder':'Update';
  var msg=fechaFmt+'\n\n';
  msg+='Web: '+r.sitio+'\n';
  if(r.partner)msg+='Partner: '+r.partner+'\n';
  msg+='Category: '+tipo+'\n\n';
  msg+='Event: '+(eventSummary||r.texto||'');
  return msg;
}

function generateAISummary(r,cb){
  var akey=anthropicKey||PRESET_AKEY;
  if(!akey){cb(r.texto||'');return;}
  var prompt='You work in the online casino affiliate industry. Summarize the following event in 1-2 clear sentences in English. Be direct and informative — no suspensive points, no ellipsis, no incomplete sentences. Give only the essential information someone needs to understand what happened or was agreed.\n\nEvent details:\nSite: '+r.sitio+'\nPartner: '+(r.partner||'N/A')+'\nCategory: '+r.tipo+'\nNote: '+(r.texto||'')+'\n\nRespond with only the summary sentence(s), nothing else.';
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':akey,'anthropic-version':'2023-06-01','Content-Type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:120,messages:[{role:'user',content:prompt}]})
  }).then(function(res){return res.json();})
  .then(function(data){
    var summary=data.content&&data.content[0]?data.content[0].text:(r.texto||'');
    cb(summary);
  }).catch(function(){cb(r.texto||'');});
}

function clearChat(){document.getElementById('msgs').innerHTML='';chatHistory=[];addBotMsg('Chat limpiado. ¿En qué puedo ayudarte?');}

function scrollMsgs(){const m=document.getElementById('msgs');m.scrollTop=m.scrollHeight;}

function hideTyping(){const el=document.getElementById('typing-w');if(el)el.remove();}

function onAttach(e){
  Array.from(e.target.files).forEach(file=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      compressImg(ev.target.result,file.type||'image/png',(b64,dataUrl,type)=>{
        pendingImgs.push({b64,dataUrl,type});renderStrip();
      });
    };
    reader.readAsDataURL(file);
  });e.target.value='';
}

function rmImg(i){pendingImgs.splice(i,1);renderStrip();}

function resize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}