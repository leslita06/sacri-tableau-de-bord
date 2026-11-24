/* SACRI 2027 : outils communs (formats, filtres, graphes, tableaux) */
(function(){
"use strict";
var D=window.D,H=window.H,ICO=window.ICO,T=D.today;
var K={};window.K=K;
K.$=function(id){return document.getElementById(id);};
K.CAP=!!window.__CAPTURE;
K.ic=function(n,c){return '<svg class="i'+(c?" "+c:"")+'" viewBox="0 0 24 24" aria-hidden="true">'+(ICO[n]||"")+"</svg>";};
K.M=function(x,n){if(n===undefined)n=1;var v=(x/1e6).toFixed(n).replace(".",",");if(/,0+$/.test(v))v=v.replace(/,0+$/,"");return v;};
K.F=function(x){return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"\u202f");};
K.N1=function(x){return (Math.round(x*10)/10).toString().replace(".",",");};
K.dd=function(s){return new Date(s+"T12:00:00");};
K.iso=function(d){return d.toISOString().slice(0,10);};
K.add=function(s,n){return K.iso(new Date(K.dd(s).getTime()+n*864e5));};
K.fr=function(s){var d=K.dd(s);return ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);};
var JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],MC=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
K.MOIS=MOIS;K.MC=MC;K.JOURS=JOURS;
K.flong=function(s){var d=K.dd(s);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()];};
K.fjour=function(s){var d=K.dd(s);return JOURS[d.getDay()].slice(0,3)+". "+d.getDate()+" "+MC[d.getMonth()];};
K.days=function(a,b){return Math.round((K.dd(b)-K.dd(a))/864e5);};
K.pl=function(n,s,p){return (typeof n==="number"?n.toString():n)+" "+(n>1?(p||s+"s"):s);};
K.esc=function(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");};
K.sum=function(a){return a.reduce(function(x,y){return x+(y||0);},0);};
K.ini=function(s){var w=String(s).replace(/[’']/g," ").split(/[\s-]+/).filter(function(x){return x&&!/^(du|des|de|d|la|le|l|au|aux|et|groupe|PST|CI|SAFIR|DEFI|SACRI|Trans|Roulements)$/i.test(x);});
  if(!w.length)return String(s).slice(0,2).toUpperCase();return (w[0].charAt(0)+(w[1]?w[1].charAt(0):w[0].charAt(1))).toUpperCase();};
K.avc=function(s){var h=0;String(s).split("").forEach(function(c){h=(h*31+c.charCodeAt(0))%997;});return "c"+(h%6+1);};
K.av=function(s,title){return '<span class="av '+K.avc(s)+'" title="'+K.esc(title||s)+'">'+K.ini(s)+"</span>";};

/* sociétés */
K.SOCS=D.socs;
K.SC={"SACRI":"#E95B0F","DEFI":"#0EA5E9","Trans-Roulements":"#10B981","SAFIR":"#8B5CF6","PST-CI":"#F59E0B","Groupe":"#64748B"};
K.SICO={"SACRI":"trees","DEFI":"factory","Trans-Roulements":"cog","SAFIR":"axe","PST-CI":"gauge","Groupe":"building-2"};
K.socsOf=function(str){return String(str).split(", ");};
K.dot=function(s){return '<span class="soc-dot" style="background:'+(K.SC[s]||K.SC.Groupe)+'"></span>';};
K.tile=function(s){var c=K.SC[s]||K.SC.Groupe;return '<span class="ti" style="background:'+c+'1A;color:'+c+'">'+K.ic(K.SICO[s]||"building-2")+"</span>";};
K.stag=function(s){return '<span class="stag">'+K.dot(s)+(s==="Groupe"?"Tout le groupe":s)+"</span>";};

/* ---------- état des filtres, partagé par toutes les vues ---------- */
K.S={soc:null,per:"mois"};
K.PERS=[["7","7 j"],["30","30 j"],["mois","Mois"],["tri","Trimestre"],["an","Année"]];
K.PLAB={"7":"sur 7 jours","30":"sur 30 jours","mois":"en novembre (au 19)","tri":"sur le trimestre","an":"sur 12 mois"};
K.PPREV={"7":"vs 7 j précédents","30":"vs 30 j précédents","mois":"vs octobre à date","tri":"vs trimestre précédent","an":"vs 12 mois précédents"};
K.win=function(per){per=per||K.S.per;
  if(per==="mois")return{a:"2026-11-01",b:T,pa:"2026-10-01",pb:"2026-10-19",w:3};
  var n={"7":7,"30":30,"tri":92,"an":365}[per];
  return{a:K.add(T,-(n-1)),b:T,pa:K.add(T,-(2*n-1)),pb:K.add(T,-n),w:{"7":1,"30":4,"tri":13,"an":52}[per]};};
function rng(dates,arr,a,b){var s=0;for(var i=0;i<dates.length;i++){if(dates[i]>=a&&dates[i]<=b)s+=arr[i]||0;}return s;}
function socList(s){return s?[s]:K.SOCS;}
/* facturé sur la période, et la même période précédente */
K.fact=function(s,per){per=per||K.S.per;var L=socList(s);
  if(per==="an"){var n=H.mois.length;return{v:K.sum(L.map(function(x){return K.sum(H.facture_mois[x].slice(n-12));})),p:K.sum(L.map(function(x){return K.sum(H.facture_mois[x].slice(n-24,n-12));}))};}
  var w=K.win(per);return{v:K.sum(L.map(function(x){return rng(H.jours,H.facture_jour[x],w.a,w.b);})),p:K.sum(L.map(function(x){return rng(H.jours,H.facture_jour[x],w.pa,w.pb);}))};};
/* série de facturé pour un graphe : libellés + valeurs (période et période précédente) */
K.factSeries=function(s,per){per=per||K.S.per;var L=socList(s),lab=[],v=[],p=[];
  function day(x,d){var i=H.jours.indexOf(d);return i<0?0:H.facture_jour[x][i];}
  if(per==="an"){var n=H.mois.length;for(var i=n-12;i<n;i++){lab.push(MC[+H.mois[i].slice(5)-1]+(i===n-1?" (au 19)":""));v.push(K.sum(L.map(function(x){return H.facture_mois[x][i];})));p.push(K.sum(L.map(function(x){return H.facture_mois[x][i-12];})));}return{lab:lab,v:v,p:p,g:"mois"};}
  if(per==="tri"){for(var k=12;k>=0;k--){var b=K.add(T,-7*k),a=K.add(b,-6);lab.push(K.fr(b));v.push(K.sum(L.map(function(x){return rng(H.jours,H.facture_jour[x],a,b);})));p.push(K.sum(L.map(function(x){return rng(H.jours,H.facture_jour[x],K.add(a,-91),K.add(b,-91));})));}return{lab:lab,v:v,p:p,g:"semaine"};}
  var w=K.win(per),d=w.a,pd=w.pa;while(d<=w.b){lab.push(K.fr(d));v.push(K.sum(L.map(function(x){return day(x,d);})));p.push(pd<=w.pb?K.sum(L.map(function(x){return day(x,pd);})):0);d=K.add(d,1);pd=K.add(pd,1);}
  return{lab:lab,v:v,p:p,g:"jour"};};
/* séries hebdomadaires réalisées (53 points jusqu'à aujourd'hui) */
K.weekly=function(key,s){var L=socList(s);var o=[];for(var i=0;i<53;i++)o.push(K.sum(L.map(function(x){return H[key][x][i];})));return o;};
K.wStart=function(per){return {"7":51,"30":48,"mois":49,"tri":39,"an":0}[per||K.S.per];};
K.alertWin=function(s,per){var L=socList(s),w=K.win(per),f=function(k,a,b){return K.sum(L.map(function(x){return rng(H.jours_al,H.alertes_hist[x][k],a,b);}));};
  return{nv:f("new",w.a,w.b),res:f("res",w.a,w.b),pnv:f("new",w.pa,w.pb),pres:f("res",w.pa,w.pb)};};
K.decWin=function(s,per){var L=socList(s),w=K.win(per),f=function(a,b){return K.sum(L.map(function(x){return rng(H.jours_al,H.decisions_hist[x].prises,a,b);}));},
  dl=function(a,b){var n=0,t=0;L.forEach(function(x){for(var i=0;i<H.jours_al.length;i++){var d=H.jours_al[i];if(d>=a&&d<=b){n+=H.decisions_hist[x].prises[i];t+=H.decisions_hist[x].delai[i]*H.decisions_hist[x].prises[i];}}});return n?t/n:0;};
  return{v:f(w.a,w.b),p:f(w.pa,w.pb),dl:dl(w.a,w.b),pdl:dl(w.pa,w.pb)};};

/* variation */
K.pct=function(v,p){return p?(v/p-1)*100:0;};
K.delta=function(pc,lbl,inv){var r=Math.round(pc),good=inv?r<0:r>0,c=r===0?"nt":(good?"up":"dn");
  return '<span class="dl '+c+'">'+(r>0?"▲ +":r<0?"▼ ":"")+(r===0?"0":Math.abs(r))+" %</span>"+(lbl?"<span>"+lbl+"</span>":"");};

/* ---------- barre de filtres ---------- */
/* extra : [{id,label,ico,opts:[[val,lib]],val,on}] */
K.fbar=function(el,o){o=o||{};var h="";
  h+='<div class="fg"><span class="fl">'+K.ic("building-2")+'Société</span><span class="sel2"><select data-f="soc" aria-label="Société"><option value="">Toutes les sociétés</option>'+K.SOCS.map(function(s){return '<option value="'+s+'"'+(K.S.soc===s?" selected":"")+">"+s+"</option>";}).join("")+"</select>"+K.ic("chevron-down")+"</span></div>";
  if(o.per!==false){h+='<span class="fsep"></span><div class="fg"><span class="fl">'+K.ic("calendar-range")+'Période</span><div class="seg" role="group" aria-label="Période">'+K.PERS.map(function(p){return '<button data-per="'+p[0]+'" class="'+(K.S.per===p[0]?"on":"")+'">'+p[1]+"</button>";}).join("")+"</div></div>";}
  (o.extra||[]).forEach(function(x){h+='<span class="fsep"></span><div class="fg"><span class="fl">'+K.ic(x.ico||"list-filter")+x.label+"</span>";
    if(x.type==="seg")h+='<div class="seg">'+x.opts.map(function(p){return '<button data-x="'+x.id+'" data-xv="'+p[0]+'" class="'+(x.val===p[0]?"on":"")+'">'+p[1]+"</button>";}).join("")+"</div>";
    else h+='<span class="sel2"><select data-x="'+x.id+'" aria-label="'+K.esc(x.label)+'">'+x.opts.map(function(p){return '<option value="'+p[0]+'"'+(x.val===p[0]?" selected":"")+">"+p[1]+"</option>";}).join("")+"</select>"+K.ic("chevron-down")+"</span>";
    h+="</div>";});
  if(o.note)h+='<span class="note-f">'+K.ic("info")+o.note+"</span>";
  el.innerHTML=h;
  el.querySelector('[data-f="soc"]').onchange=function(){K.setSoc(this.value||null);};
  [].forEach.call(el.querySelectorAll("[data-per]"),function(b){b.onclick=function(){K.S.per=b.dataset.per;K.rerender();};});
  (o.extra||[]).forEach(function(x){
    [].forEach.call(el.querySelectorAll('[data-x="'+x.id+'"]'),function(c){
      if(c.tagName==="SELECT")c.onchange=function(){x.on(c.value);};else c.onclick=function(){x.on(c.dataset.xv);};});});
};
K.setSoc=function(s){K.S.soc=s||null;K.rerender();K.toast(s?"Filtré sur "+s:"Toutes les sociétés");};
K.rerender=function(){};

/* ---------- graphes ---------- */
K.css=function(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();};
K.theme=function(){var C=window.Chart;if(!C)return;C.defaults.font.family='"Inter",system-ui,sans-serif';C.defaults.font.size=12;C.defaults.color=K.css("--mut");
  C.defaults.plugins.legend.display=false;C.defaults.animation.duration=K.CAP?0:350;C.defaults.borderColor=K.css("--line2");
  var tp=C.defaults.plugins.tooltip;tp.backgroundColor="#0F172A";tp.padding=10;tp.cornerRadius=10;tp.displayColors=true;tp.boxWidth=8;tp.boxHeight=8;tp.usePointStyle=true;tp.titleFont={weight:"600"};};
K.CH={};
K.mk=function(id,cfg){if(K.CH[id]){K.CH[id].destroy();delete K.CH[id];}var el=K.$(id);if(!el)return null;K.CH[id]=new Chart(el,cfg);return K.CH[id];};
K.grid=function(){return{color:K.css("--line2"),drawTicks:false};};
K.yM=function(extra){return Object.assign({grid:K.grid(),border:{display:false},ticks:{padding:8,maxTicksLimit:5,callback:function(v){return K.M(v,0);}}},extra||{});};
K.xC=function(extra){return Object.assign({grid:{display:false},border:{display:false},ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:8,font:{size:11.5}}},extra||{});};
K.grad=function(ctx,col,a1,a2){var c=ctx.chart,ar=c.chartArea;if(!ar)return col+"22";var g=c.ctx.createLinearGradient(0,ar.top,0,ar.bottom);g.addColorStop(0,col+(a1||"40"));g.addColorStop(1,col+(a2||"00"));return g;};
/* texte au centre d'un anneau */
K.center=function(l1,l2){return{id:"ctr",afterDraw:function(c){var a=c.chartArea,x=(a.left+a.right)/2,y=(a.top+a.bottom)/2,ctx=c.ctx;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle=K.css("--ink");ctx.font='700 22px "Inter",sans-serif';ctx.fillText(l1,x,y-8);ctx.fillStyle=K.css("--mut");ctx.font='500 11.5px "Inter",sans-serif';ctx.fillText(l2,x,y+14);ctx.restore();}};};
/* mini-courbe dans une carte */
K.spark=function(id,data,o){o=o||{};var col=o.col||K.css("--mut");
  return K.mk(id,{type:o.bar?"bar":"line",data:{labels:data.map(function(_,i){return i;}),datasets:[{data:data,borderColor:col,backgroundColor:o.bar?data.map(function(_,i){return i===data.length-1?col:K.css("--line");}):function(c){return K.grad(c,col,"38","00");},fill:!o.bar,borderWidth:1.8,pointRadius:0,tension:.35,borderRadius:2,barPercentage:.75,categoryPercentage:.9}].concat(o.seuil!=null?[{data:data.map(function(){return o.seuil;}),borderColor:K.css("--red"),borderDash:[3,3],borderWidth:1,pointRadius:0,fill:false}]:[])},
    options:{maintainAspectRatio:false,animation:false,events:[],plugins:{tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false,min:o.min!=null?o.min:undefined}}}});};
/* jauge en demi-cercle */
K.gauge=function(id,val,max,col){var v=Math.max(0,Math.min(val,max));return K.mk(id,{type:"doughnut",data:{datasets:[{data:[v,max-v],backgroundColor:[col,K.css("--hov")],borderWidth:0,borderRadius:6}]},options:{rotation:-90,circumference:180,cutout:"76%",maintainAspectRatio:false,animation:K.CAP?false:{duration:350},events:[],plugins:{tooltip:{enabled:false}}}});};

/* ---------- tableau triable avec recherche ---------- */
/* cols : [{k,l,num,cls,html(row),sort(row),dl}] */
K.table=function(el,cols,rows,o){o=o||{};var st=el._st||(el._st={k:o.sortK||null,d:o.sortD||-1,q:""});
  var q=st.q.toLowerCase(),r=rows.filter(function(x){return !q||(o.text?o.text(x):JSON.stringify(x)).toLowerCase().indexOf(q)>=0;});
  if(st.k){var c=cols.filter(function(c){return c.k===st.k;})[0];if(c){var f=c.sort||function(x){return x[c.k];};r=r.slice().sort(function(a,b){var x=f(a),y=f(b);return (x<y?-1:x>y?1:0)*st.d;});}}
  var h='<table class="tbl'+(o.cards?" cards":"")+'"><thead><tr>'+cols.map(function(c){var s=c.k&&c.sortable!==false;return '<th class="'+(c.num?"":"l ")+(c.cls||"")+(s?" so":"")+(st.k===c.k?(st.d>0?" asc":" desc"):"")+'"'+(s?' data-sk="'+c.k+'"':"")+">"+c.l+(s?'<span class="sa">'+K.ic(st.k===c.k?(st.d>0?"arrow-up":"arrow-down"):"arrow-up-down")+"</span>":"")+"</th>";}).join("")+"</tr></thead><tbody>";
  h+=r.length?r.map(function(x,i){return '<tr'+(o.rowAttr?o.rowAttr(x):"")+">"+cols.map(function(c){return '<td class="'+(c.num?"num ":"l ")+(c.cls||"")+'"'+(c.dl?' data-l="'+c.dl+'"':"")+">"+(c.html?c.html(x):K.esc(x[c.k]))+"</td>";}).join("")+"</tr>";}).join(""):'<tr><td colspan="'+cols.length+'" class="l"><p class="empty">Aucune ligne pour ce filtre.</p></td></tr>';
  h+="</tbody>"+(o.foot?"<tfoot>"+o.foot+"</tfoot>":"")+"</table>";
  el.innerHTML=h;
  [].forEach.call(el.querySelectorAll("[data-sk]"),function(th){th.onclick=function(){if(st.k===th.dataset.sk)st.d=-st.d;else{st.k=th.dataset.sk;st.d=-1;}K.table(el,cols,rows,o);};});
  if(o.after)o.after(el);
  if(o.count)o.count(r.length);
};
K.search=function(inp,el,redo){inp.oninput=function(){(el._st||(el._st={k:null,d:-1,q:""})).q=inp.value;redo();};};

/* ---------- divers ---------- */
var tt;K.toast=function(m){var t=K.$("toast");if(!t)return;t.innerHTML=K.ic("circle-check-big")+"<span>"+K.esc(m)+"</span>";t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on");},2400);};
K.hydrate=function(root){[].forEach.call((root||document).querySelectorAll("i[data-i]"),function(el){var w=document.createElement("span");w.innerHTML=K.ic(el.dataset.i);var sv=w.firstChild;if(el.className)sv.setAttribute("class","i "+el.className);el.replaceWith(sv);});};
K.kc=function(o){return '<div class="kc'+(o.key?" key":"")+'"><p class="l"><span class="kic">'+K.ic(o.ico)+"</span>"+o.l+'</p><div class="vr"><p class="v">'+o.v+(o.u?"<small>"+o.u+"</small>":"")+"</p>"+(o.sp?'<div class="sp">'+o.sp+"</div>":"")+'</div><div class="s">'+o.s+"</div>"+(o.after||"")+"</div>";};
/* thème clair ou sombre */
K.THEME_KEY="sacri-theme";
K.setTheme=function(t){document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem(K.THEME_KEY,t);}catch(e){}var b=K.$("theme");if(b)b.innerHTML=K.ic(t==="dark"?"sun":"moon");K.theme();K.rerender();};
K.initTheme=function(){var t="light";try{t=localStorage.getItem(K.THEME_KEY)||"light";}catch(e){}if(K.CAP&&window.__THEME)t=window.__THEME;document.documentElement.setAttribute("data-theme",t);var b=K.$("theme");if(b){b.innerHTML=K.ic(t==="dark"?"sun":"moon");b.onclick=function(){K.setTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");};}K.theme();};
})();
