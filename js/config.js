// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
// SGMR - config.js
// Global variables, constants, helpers
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

/* Ã¢ÂÂÃ¢ÂÂ DEFAULT DATA Ã¢ÂÂÃ¢ÂÂ */
const DEFAULT_SITES=['Crypto Casino Zone','Crypto Bonus Bet','Top Royal Casinos','Sushi Casinos','Lucky Crypto Bonus','Neon Bonuses','Best Casino Vault','Crypto Bonus Dragon','Bonusinos','Top Legit Casinos','General'];

// Pre-set keys
const PRESET_AKEY='';
const PRESET_SBURL='https://xvxkkewyvccnhnitdhwd.supabase.co';
const PRESET_SBKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eGtrZXd5dmNjbmhuaXRkaHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTAzMjgsImV4cCI6MjA4OTY4NjMyOH0.kbhaQp4wUEUxrDZfeCCStcssmRLh1iuLsBp__t9bE_c';
let PROXY='https://sgmr.arangurenjuanse.workers.dev';

let rows=[],sites=[...DEFAULT_SITES];
let anthropicKey='',sbUrl='',sbKey='';
// KB: {alias, full}[]
let kbPartners=[],kbSites=[],kbCats=[];
let filterTipo='todos',datePreset=5;
let pendingImgs=[],pendingConfirm=null,chatHistory=[];
let isThinking=false;

/* Ã¢ÂÂÃ¢ÂÂ UTILS Ã¢ÂÂÃ¢ÂÂ */
function ls(k,v){if(v===undefined){try{return localStorage.getItem(k)}catch(e){return null}}try{localStorage.setItem(k,v)}catch(e){}}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function pad(n){return String(n).padStart(2,'0');}
function nowFecha(){const n=new Date();return`${pad(n.getDate())}/${pad(n.getMonth()+1)}/${n.getFullYear()} ${pad(n.getHours())}:${pad(n.getMinutes())}`;}
function parseDate(str){if(!str||str==='Sin fecha')return new Date(0);const p=str.split(' ')[0].split('/');if(p.length===3)return new Date(+p[2],+p[1]-1,+p[0]);return new Date(str);}
function dateKey(d){return`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;}
function fmtTime(d){return`${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function fmtDay(str){const d=parseDate(str);if(isNaN(d.getTime()))return str;const n=new Date(),t=dateKey(n),y=new Date(n);y.setDate(y.getDate()-1);if(str===t)return'Hoy';if(str===dateKey(y))return'Ayer';return d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'short'});}
function toInputDate(d){return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}

/* Ã¢ÂÂÃ¢ÂÂ KNOWLEDGE BASE context Ã¢ÂÂÃ¢ÂÂ */
function buildKBContext(){
  let ctx='';
  if(kbPartners.length){ctx+='\nPARTNERS (alias Ã¢ÂÂ nombre real):\n'+kbPartners.map(x=>`  "${x.alias}" Ã¢ÂÂ "${x.full}"`).join('\n');}
  if(kbSites.length){ctx+='\nSITIOS (alias Ã¢ÂÂ nombre real):\n'+kbSites.map(x=>`  "${x.alias}" Ã¢ÂÂ "${x.full}"`).join('\n');}
  if(kbCats.length){ctx+='\nCATEGORÃÂAS (alias Ã¢ÂÂ descripciÃÂ³n):\n'+kbCats.map(x=>`  "${x.alias}" Ã¢ÂÂ "${x.full}"`).join('\n');}
  return ctx;
}

/* Ã¢ÂÂÃ¢ÂÂ LOAD Ã¢ÂÂÃ¢ÂÂ */