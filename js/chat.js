// ═══════════════════════════════════
// SGMR - chat.js
// Claxon AI: callAI, messages, annotations
// ═══════════════════════════════════

function buildKBContext(){
  let ctx='';
  if(kbPartners.length){ctx+='\nPARTNERS (alias → nombre real):\n'+kbPartners.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  if(kbSites.length){ctx+='\nSITIOS (alias → nombre real):\n'+kbSites.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  if(kbCats.length){ctx+='\nCATEGORÍAS (alias → descripción):\n'+kbCats.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  return ctx;
}

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