/* First-room NPC narration. Speech runs only after a player interaction. */
(()=>{
 const supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 let current=null,serial=0;
 function status(message){const el=document.getElementById('npc-voice-status');if(el)el.textContent=message;}
 function stop(){serial++;if(supported)speechSynthesis.cancel();current=null;status('음성을 멈췄어요. 다시 듣기를 누르면 처음부터 읽어요.');}
 function speak(){
  stop();if(!supported){status('이 브라우저는 음성 읽기를 지원하지 않아요. 아래 글로 읽어 주세요.');return;}
  const utterance=new SpeechSynthesisUtterance(escapeNodes.welcome.text);
  utterance.lang='ko-KR';utterance.rate=.88;utterance.pitch=1.08;
  const voice=speechSynthesis.getVoices().find(v=>/^ko(?:-|_)/i.test(v.lang));if(voice)utterance.voice=voice;
  const id=serial;current=utterance;status('독이의 음성을 준비하고 있어요…');
  utterance.onstart=()=>{if(id===serial)status('독이가 이야기하고 있어요. 아래 글을 함께 읽어 봐요.');};
  utterance.onend=()=>{if(id===serial){current=null;status('이야기를 다 들었어요. 수첩을 받고 탐험을 시작해 봐요.');}};
  utterance.onerror=()=>{if(id===serial){current=null;status('음성을 재생하지 못했어요. 기기 소리와 한국어 음성 설정을 확인하거나 다시 듣기를 눌러 주세요.');}};
  speechSynthesis.speak(utterance);
 }
 const previousModal=modal;
 modal=function(title,body,actions=[]){
  stop();previousModal(title,body,actions);
  if(title!==escapeNodes.welcome.name)return;
  const controls=document.createElement('div');controls.className='npc-voice-controls';
  controls.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="npc-voice-play">🔊 독이 이야기 듣기</button><button type="button" id="npc-voice-stop">음성 멈추기</button></div><p id="npc-voice-status" role="status" style="font-size:12px">버튼을 누르면 독이가 안내해 줘요.</p><p class="note">기기의 한국어 음성으로 읽어 줍니다. 목소리는 기기마다 다를 수 있어요.</p>';
  activity.querySelector('.activity-body').prepend(controls);
  document.getElementById('npc-voice-play').onclick=speak;
  document.getElementById('npc-voice-stop').onclick=stop;
  if(supported)speak();else status('이 브라우저는 음성 읽기를 지원하지 않아요. 아래 글로 읽어 주세요.');
 };
 activity.addEventListener('close',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop);
})();
