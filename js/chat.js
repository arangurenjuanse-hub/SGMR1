// ═══════════════════════════════════════

// SGMR - chat.js

// Claxon AI chat: callAI, messages, annotation confirm

// ═══════════════════════════════════════



function buildKBContext(){
  let ctx='';
  if(kbPartners.length){ctx+='\nPARTNERS (alias → nombre real):\n'+kbPartners.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  if(kbSites.length){ctx+='\nSITIOS (alias → nombre real):\n'+kbSites.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  if(kbCats.length){ctx+='\nCATEGORÍAS (alias → descripción):\n'+kbCats.map(x=>`  "${x.alias}" → "${x.full}"`).join('\n');}
  return ctx;
}

async function callAI(text,imgs){
  const kbCtx=buildKBContext();
  const sys='You are Claxon, an annotation management assistant for casino/crypto affiliate websites. The user may write in any language — ALWAYS translate all content to English before saving. ALWAYS respond ONLY with valid JSON. NEVER respond with free text. CONTEXT:\n'+kbCtx+'\nRESPOND ONLY with this JSON format: {"action":"annotate"|"ask"|"answer", "tipo":"Problem"|"Reminder"|"Change/Comment", "sitio":"site name", "partner":"partner name", "texto":"short description in English", "notas":"additional notes in English", "respuesta":"response in English"}. IMPORTANT: texto and notas must ALWAYS be in English regardless of input language.';

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