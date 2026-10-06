(function(){
'use strict';
var HOTEL='Stülerstraße 6, 10787 Berlin';
var D=null, app=document.getElementById('app');
// ---------- Storage (try/catch: Privatmodus etc.) ----------
var mem={};
function sget(k,def){try{var v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return k in mem?mem[k]:def}}
function sset(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function done(){return sget('berlin.done',{})}
function notes(){return sget('berlin.notes',{})}
// ---------- Helpers ----------
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function byId(id){return D.stationen.filter(function(s){return s.id===id})[0]}
function mapsRoute(s){return 'https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lng+'&travelmode=transit'}
function mapsHotel(s){return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(HOTEL)+'&destination='+s.lat+','+s.lng+'&travelmode=transit'}
function mapsPlace(s){var q=s.id==='oernek-lahmacun-grillhaus'?'Örnek Lahmacun Grillhaus Berlin':s.lat+','+s.lng;return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q)}
function lineBadge(l){var c=/^S/.test(l)?'S':/^U/.test(l)?'U':/^M/.test(l)?'M':'B';return '<span class="l-'+c+'">'+esc(l)+'</span>'}
function stat(x){return '<span class="st '+x.s+'">'+esc(x.t)+'</span>'}
function minutes(s){var w=s.dd.join(' ').split(/\s+/).length;return Math.max(1,Math.round(w/200))}
function todayIdx(){var n=new Date(),y=n.getFullYear(),m=n.getMonth()+1,d=n.getDate();if(y===2026&&m===10&&d>=25&&d<=31)return d-25;return -1}
function resBadge(s){return s.res?'<span class="res '+(s.res.lvl==='m'?'':'r')+'">'+(s.res.lvl==='m'?'Reservieren!':'Reserv. empfohlen')+'</span>':''}
function ext(u,t,cls){return '<a class="ext '+(cls||'')+'" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(t)+'</a>'}
function itemRow(s,right){var dn=done()[s.id];return '<div class="card"><a class="item" style="--c:'+s.farbe+'" href="#/ort/'+s.id+'"><div class="row"><span class="t">'+(dn?'✓ ':'')+esc(s.kurz)+'</span>'+(right||'')+'</div><div class="s">'+esc(s.bezirk)+' · '+esc(s.station)+'</div></a></div>'}
function updProg(){var d=done(),n=D.stationen.filter(function(s){return d[s.id]}).length;document.getElementById('prog').textContent=n+' / '+D.stationen.length+' erledigt'}
// ---------- Views ----------
function vHeute(arg){
  var t=todayIdx(),i=arg!=null&&arg!==''?parseInt(arg,10):(t>=0?t:sget('berlin.day',0));
  if(!(i>=0&&i<7))i=0; sset('berlin.day',i);
  var rain=sget('berlin.rain',false);
  var h='<h1>Welcher Tag?</h1><div class="chips">'+D.info.tage.map(function(d,k){return '<a class="chip'+(k===i?' on':'')+'" style="text-decoration:none" href="#/heute/'+k+'">'+esc(d)+(k===t?' ·heute':'')+'</a>'}).join('')+'</div>';
  h+='<div class="chips"><button class="chip'+(rain?' on':'')+'" id="rain">☂ Regen-Modus (nur Innen/gemischt)</button></div>';
  var list=D.stationen.filter(function(s){return !rain||s.wetterkind!=='aussen'});
  var g={o:[],w:[],c:[]};
  list.forEach(function(s){g[s.sched[i].s].push(s)});
  var res=D.stationen.filter(function(s){return s.res&&s.res.lvl==='m'});
  h+='<div class="note"><b>Buchen/Reservieren:</b> '+res.map(function(s){return '<a href="#/ort/'+s.id+'">'+esc(s.kurz)+'</a>'}).join(' · ')+'</div>';
  [['o','Geöffnet / zugänglich'],['w','Eingeschränkt, buchen oder prüfen'],['c','Geschlossen']].forEach(function(p){
    if(!g[p[0]].length)return;
    h+='<div class="grp">'+p[1]+' ('+g[p[0]].length+')</div>';
    g[p[0]].forEach(function(s){h+=itemRow(s,'<span>'+stat(s.sched[i])+resBadge(s)+'</span>')});
  });
  h+='<p class="muted small">Öffnungszeiten Stand '+esc(D.stand)+'. Vor dem Besuch auf der Website prüfen – Zeiten ändern sich.</p>';
  app.innerHTML=h;
  document.getElementById('rain').onclick=function(){sset('berlin.rain',!rain);vHeute(String(i))};
}
function vOrte(){
  var f=sget('berlin.f',{q:'',b:'',rain:false,frei:false,res:false});
  var bez=Object.keys(D.info.bezirke);
  var h='<h1>Alle Orte</h1><input type="search" id="q" placeholder="Suchen …" value="'+esc(f.q)+'" aria-label="Suchen">';
  h+='<div class="chips"><button class="chip'+(f.b===''?' on':'')+'" data-b="">Alle</button>'+bez.map(function(b){return '<button class="chip'+(f.b===b?' on':'')+'" data-b="'+esc(b)+'">'+esc(b)+'</button>'}).join('')+'</div>';
  h+='<div class="chips"><button class="chip'+(f.rain?' on':'')+'" data-f="rain">☂ Regen-tauglich</button><button class="chip'+(f.frei?' on':'')+'" data-f="frei">Kostenlos</button><button class="chip'+(f.res?' on':'')+'" data-f="res">Reservierung</button></div><div id="lst"></div>';
  app.innerHTML=h;
  function draw(){
    var q=f.q.trim().toLowerCase();
    var l=D.stationen.filter(function(s){
      if(f.b&&s.bezirk!==f.b)return false;
      if(f.rain&&s.wetterkind==='aussen')return false;
      if(f.frei&&!s.frei)return false;
      if(f.res&&!s.res)return false;
      if(q&&(s.titel+' '+s.bezirk+' '+s.typ+' '+s.epoche+' '+s.ueberblick+' '+s.station).toLowerCase().indexOf(q)<0)return false;
      return true});
    var o='',last='';
    l.forEach(function(s){if(s.bezirk!==last){last=s.bezirk;o+='<div class="grp">'+esc(s.bezirk)+'</div>'} o+=itemRow(s,resBadge(s))});
    document.getElementById('lst').innerHTML=o||'<p class="muted">Keine Treffer.</p>';
  }
  draw();
  document.getElementById('q').oninput=function(e){f.q=e.target.value;sset('berlin.f',f);draw()};
  app.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){f.b=b.getAttribute('data-b');sset('berlin.f',f);vOrte()}});
  app.querySelectorAll('[data-f]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-f');f[k]=!f[k];sset('berlin.f',f);vOrte()}});
}
function box(c,title,body){return '<div class="box" style="--c:'+c+'"><h3>'+title+'</h3>'+body+'</div>'}
function vOrt(id){
  var s=byId(id); if(!s){app.innerHTML='<p>Unbekannter Ort.</p>';return}
  var dn=!!done()[id], c=s.farbe, nt=notes()[id]||'';
  var tags=[{Ost:'OST-BERLIN',West:'WEST-BERLIN',Grenze:'GRENZE'}[s.ort],s.typ.toUpperCase(),s.epoche.toUpperCase()].filter(Boolean);
  var h='<div class="card"><div class="band" style="--c:'+c+'"><div class="small">'+String(s.nr).padStart(2,'0')+' / '+(D.stationen.length+3)+' · '+esc(s.bezirk)+'</div><h1>'+esc(s.titel)+'</h1>'+tags.map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('')+'</div></div>';
  h+='<div class="btns"><button class="btn'+(dn?'':' sec')+'" id="dn">'+(dn?'✓ Erledigt':'☐ Als erledigt markieren')+'</button></div>';
  h+=box(c,'Überblick','<div>'+esc(s.ueberblick)+'</div>');
  h+=box(c,'Öffnungszeiten / Eintritt','<div><b>'+esc(s.oeff)+'</b><br>'+esc(s.preis)+'</div>'+(s.res?'<div style="margin-top:6px">'+resBadge(s)+' <span class="small">'+esc(s.res.txt)+'</span></div>':''));
  h+=box(c,'ÖPNV','<div><b>'+esc(s.station)+'</b> · '+esc(s.fussweg)+'</div><div class="lines" style="margin-top:6px">'+s.linien.map(lineBadge).join('')+'</div>');
  h+='<div class="btns">'+ext(mapsRoute(s),'🚇 Route ab Standort (ÖPNV)','btn')+ext(mapsHotel(s),'Route ab Hotel','btn sec')+ext(mapsPlace(s),'Ort in Google Maps','btn sec')+'</div>';
  h+=box(c,'Gut zu wissen','<ul>'+s.wissen.map(function(w){return '<li>'+esc(w)+'</li>'}).join('')+'</ul>');
  h+=box(c,'In der Nähe / Wetter','<div>'+esc(s.naehe)+'</div><div class="muted small" style="margin-top:4px">'+esc(s.wetter)+'</div>');
  if(s.vermerk)h+=box(c,'Vermerk','<div>'+esc(s.vermerk)+'</div>');
  h+='<h2>Öffnung in dieser Woche</h2><div class="tw"><table class="plan"><tr>'+D.info.tage.map(function(d){return '<th>'+esc(d.slice(0,5))+'</th>'}).join('')+'</tr><tr>'+s.sched.map(function(x){return '<td class="'+x.s+'">'+esc(x.t)+'</td>'}).join('')+'</tr></table></div>';
  h+='<div class="btns" style="margin-top:16px"><a class="btn" href="#/lesen/'+s.id+'">📖 Deep-Dive lesen (ca. '+minutes(s)+' Min.)</a></div>';
  if(s.links.length){h+='<h2>Weiterführende Links</h2><ul class="links">'+s.links.map(function(l){return '<li>'+ext(l.u,l.t)+' <span class="muted small">'+(l.k==='o'?'offiziell':'Lektüre')+'</span></li>'}).join('')+'</ul>'}
  h+='<h2>Notizen</h2><textarea id="nt" placeholder="Was hat überrascht? Fragen? (bleibt nur auf diesem Gerät)">'+esc(nt)+'</textarea>';
  h+='<p class="muted small">Karte-Stand: '+esc(D.stand)+'. Angaben ohne Gewähr; Öffnungszeiten und Preise vor Ort/auf der Website prüfen.</p>';
  app.innerHTML=h;
  document.getElementById('dn').onclick=function(){var d=done();d[id]=!d[id];sset('berlin.done',d);vOrt(id);updProg()};
  document.getElementById('nt').oninput=function(e){var n=notes();n[id]=e.target.value;sset('berlin.notes',n)};
}
function vLesen(id){
  var s=byId(id); if(!s){app.innerHTML='<p>Unbekannt.</p>';return}
  var i=D.stationen.indexOf(s), nx=D.stationen[i+1];
  var h='<p><a href="#/ort/'+s.id+'">← '+esc(s.kurz)+'</a></p><div class="card"><div class="band" style="--c:'+s.farbe+'"><div class="small">Deep-Dive · ca. '+minutes(s)+' Min. Lesezeit</div><h1>'+esc(s.titel)+'</h1></div></div><div class="dd" style="margin-top:14px">'+s.dd.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+'</div>';
  if(s.links.length)h+='<h2>Weiterlesen</h2><ul class="links">'+s.links.map(function(l){return '<li>'+ext(l.u,l.t)+'</li>'}).join('')+'</ul>';
  h+='<div class="btns"><a class="btn sec" href="#/ort/'+s.id+'">Zur Karte</a>'+(nx?'<a class="btn sec" href="#/lesen/'+nx.id+'">Nächster: '+esc(nx.kurz)+' →</a>':'')+'</div>';
  h+='<p class="muted small">Eigene Zusammenfassung zur Orientierung; Zahlen und Details bei Bedarf in den verlinkten Quellen prüfen.</p>';
  app.innerHTML=h; window.scrollTo(0,0);
}
function vCheck(){
  var d=done(),last='',n=D.stationen.filter(function(s){return d[s.id]}).length;
  var h='<h1>Checkliste</h1><p class="muted">'+n+' von '+D.stationen.length+' erledigt (nur auf diesem Handy gespeichert).</p>';
  D.stationen.forEach(function(s){
    if(s.bezirk!==last){last=s.bezirk;h+='<div class="grp" style="color:'+s.farbe+'">'+esc(s.bezirk)+'</div>'}
    h+='<div class="card"><div class="ck'+(d[s.id]?' done':'')+'" style="--c:'+s.farbe+'"><input type="checkbox" data-id="'+s.id+'" '+(d[s.id]?'checked':'')+' aria-label="'+esc(s.kurz)+' erledigt"><a class="nm" href="#/ort/'+s.id+'">'+esc(s.kurz)+'</a>'+resBadge(s)+'</div></div>';
  });
  app.innerHTML=h;
  app.querySelectorAll('input[type=checkbox]').forEach(function(c){c.onchange=function(){var x=done();x[c.getAttribute('data-id')]=c.checked;sset('berlin.done',x);c.closest('.ck').classList.toggle('done',c.checked);updProg();document.querySelector('#app .muted').textContent=D.stationen.filter(function(s){return done()[s.id]}).length+' von '+D.stationen.length+' erledigt (nur auf diesem Handy gespeichert).'}});
}
function vPlan(){
  var t=todayIdx(),last='';
  var h='<h1>Stundenplan</h1><p class="muted small">Grün = offen/zugänglich · Rot = geschlossen · Gelb = Einschränkung, buchen oder prüfen. Seitlich wischen.</p><div class="tw"><table class="plan"><tr><th>Ort</th>'+D.info.tage.map(function(d,k){return '<th class="'+(k===t?'today':'')+'">'+esc(d.replace(/\.$/,''))+'</th>'}).join('')+'</tr>';
  D.stationen.forEach(function(s){
    if(s.bezirk!==last){last=s.bezirk;h+='<tr><td colspan="8" style="text-align:left;font-weight:700;color:#fff;background:'+s.farbe+'">'+esc(s.bezirk)+'</td></tr>'}
    h+='<tr><td class="n"><a href="#/ort/'+s.id+'" style="text-decoration:none;color:inherit">'+esc(s.kurz)+'</a>'+(s.res?'<br>'+resBadge(s):'')+'</td>'+s.sched.map(function(x,k){return '<td class="'+x.s+(k===t?' today':'')+'">'+esc(x.t)+'</td>'}).join('')+'</tr>';
  });
  h+='</table></div>';
  app.innerHTML=h;
}
function vInfo(){
  var h='<h1>Infos & Links</h1><h2>Allgemeine Hinweise</h2>';
  D.info.hinweise.forEach(function(p){h+='<div class="box"><h3>'+esc(p[0])+'</h3><div>'+esc(p[1])+'</div></div>'});
  var g='';D.info.allg.forEach(function(l){if(l.g!==g){g=l.g;h+='<h2>'+esc(g)+'</h2>'} h+='<p style="margin:4px 0">'+ext(l.u,l.t)+'</p>'});
  h+='<h2>Hotel</h2><p>Pestana, '+esc(HOTEL)+'</p><p>'+ext('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Pestana Berlin Tiergarten '+HOTEL),'Hotel in Google Maps','btn sec')+'</p>';
  h+='<h2>Backup</h2><p class="muted small">Häkchen und Notizen liegen nur auf diesem Gerät (kein Sync). Zum Übertragen: exportieren und auf dem anderen Handy importieren.</p><div class="btns"><button class="btn sec" id="ex">Exportieren</button><button class="btn sec" id="im">Importieren</button><button class="btn sec" id="rs">Zurücksetzen</button></div><textarea id="bk" placeholder="Export-Text erscheint hier / zum Import einfügen" style="display:none"></textarea><div class="btns"><button class="btn" id="ok" style="display:none">Übernehmen</button></div>';
  h+='<h2>Hinweise zur App</h2><p class="muted small">Stand der Daten: '+esc(D.stand)+'. Die App funktioniert nach dem ersten Laden offline; Links und Routen brauchen Internet. Externe Links wurden nicht automatisch geprüft – bei einem toten Link bitte die Website der Einrichtung per Suche öffnen. „Route ab Standort“ nutzt den aktuellen Standort in Google Maps (Standortfreigabe nötig).</p>';
  app.innerHTML=h;
  var bk=document.getElementById('bk'),ok=document.getElementById('ok');
  document.getElementById('ex').onclick=function(){bk.style.display='block';ok.style.display='none';bk.value=JSON.stringify({done:done(),notes:notes()});bk.select()};
  document.getElementById('im').onclick=function(){bk.style.display='block';ok.style.display='inline-flex';bk.value='';bk.focus()};
  ok.onclick=function(){try{var o=JSON.parse(bk.value);if(o.done)sset('berlin.done',o.done);if(o.notes)sset('berlin.notes',o.notes);updProg();alert('Übernommen.')}catch(e){alert('Ungültiger Text.')}};
  document.getElementById('rs').onclick=function(){if(confirm('Alle Häkchen und Notizen auf diesem Gerät löschen?')){sset('berlin.done',{});sset('berlin.notes',{});updProg()}};
}
// ---------- Router ----------
function route(){
  if(!D)return;
  var p=(location.hash||'#/').replace(/^#\/?/,'').split('/'),v=p[0]||'heute';
  var tab={heute:'heute',orte:'orte',ort:'orte',lesen:'orte',check:'check',plan:'plan',info:'info'}[v]||'heute';
  document.querySelectorAll('#tabs a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-t')===tab)});
  ({heute:vHeute,orte:vOrte,ort:vOrt,lesen:vLesen,check:vCheck,plan:vPlan,info:vInfo}[v]||vHeute)(p[1]);
  if(v!=='lesen')window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
fetch('data/stationen.json').then(function(r){return r.json()}).then(function(j){D=j;updProg();route()}).catch(function(){app.innerHTML='<p class="pad">Daten konnten nicht geladen werden. Bitte über GitHub Pages (https) öffnen, nicht als lokale Datei.</p>'});
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
