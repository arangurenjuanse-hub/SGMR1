// ═══════════════════════════════════
// SGMR - telegram.js
// Telegram: preview, send, photo
// ═══════════════════════════════════

function sendTelegram(idx){
  var r=rows[idx];
  if(!r)return;
  _tgPreviewIdx=idx;
  _tgPreviewImg=null;
  showToast('Generando resumen...','ok');
  generateAISummary(r,function(summary){
    var msg=generateSummary(r,summary);
    var ov=document.getElementById('tg-preview-overlay');
    var ta=document.getElementById('tg-preview-text');
    var thumb=document.getElementById('tg-preview-thumb');
    var fname=document.getElementById('tg-preview-fname');
    var finp=document.getElementById('tg-preview-file');
    ta.value=msg;
    thumb.style.display='none';
    fname.textContent='';
    _tgPreviewImg=null;
    finp.value='';
    finp.onchange=function(){
      var file=finp.files[0];
      if(!file)return;
      var reader=new FileReader();
      reader.onload=function(e){
        _tgPreviewImg=e.target.result;
        thumb.src=_tgPreviewImg;
        thumb.style.display='block';
        fname.textContent=file.name;
      };
      reader.readAsDataURL(file);
    };
    var annoOv=document.getElementById('anno-detail-overlay');
    if(annoOv)annoOv.classList.remove('open');
    ov.classList.add('open');
    showToast('','ok');
  });
}

function closeTgPreview(){
  document.getElementById('tg-preview-overlay').classList.remove('open');
  _tgPreviewIdx=null;
  _tgPreviewImg=null;
}

function confirmTgSend(test){
  var idx=_tgPreviewIdx;
  if(idx===null||idx===undefined)return;
  var plainMsg=document.getElementById('tg-preview-text').value.trim();
  if(!plainMsg)return;
  var htmlMsg=plainMsg
    .replace('Web: ','<b>Web:</b> ')
    .replace('Partner: ','<b>Partner:</b> ')
    .replace('Category: ','<b>Category:</b> ')
    .replace('Event: ','<b>Event:</b> ');
  var BOT=test?'8290249003:AAGT4vDIM6XnExlqex7a7_k2JkmCzulXw18':'8606033239:AAGsqsxOaKSbW8UwjcobnoQSEzQAW6SWD10';
  var CHAT=test?'1842693553':'832763879';
  var url='https://api.telegram.org/bot'+BOT+'/sendMessage';
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CHAT,text:htmlMsg,parse_mode:'HTML'})})
  .then(function(res){return res.json();})
  .then(function(data){
    if(data.ok){
      if(!test){rows[idx].tgSent=true;ls('sgmr_rows',JSON.stringify(rows));patchSB(rows[idx]);renderList();}
      closeTgPreview();
      showToast(test?'Test enviado a vos':'Enviado a Sigmundur','ok');
    } else {
      showToast('Error: '+data.description,'err');
    }
  })
  .catch(function(e){showToast('Error: '+e.message,'err');});
}