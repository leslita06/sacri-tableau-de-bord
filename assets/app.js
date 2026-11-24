(function(){
"use strict";
var D=window.D, ICO=window.ICO, T=D.today;
var $=function(id){return document.getElementById(id);};
var CAP=!!window.__CAPTURE;
function ic(n){return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+(ICO[n]||"")+'</svg>';}
function M(x,n){if(n===undefined)n=1;var v=(x/1e6).toFixed(n).replace(".",",");if(/,0+$/.test(v))v=v.replace(/,0+$/,"");return v;}
function F(x){return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"\u202f");}
function dd(s){return new Date(s+"T12:00:00");}
function iso(d){return d.toISOString().slice(0,10);}
function fr(s){var d=dd(s);return ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);}
var JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],MC=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function flong(s){var d=dd(s);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()];}
function fjour(s){var d=dd(s);return JOURS[d.getDay()].slice(0,3)+". "+d.getDate()+" "+MC[d.getMonth()];}
function days(a,b){return Math.round((dd(b)-dd(a))/864e5);}
function pl(n,s,p){return n+" "+(n>1?(p||s+"s"):s);}
function art(x,prep){var l=x.charAt(0).toLowerCase()+x.slice(1),f=/^(direction|chargée|cellule|comptabilité)/.test(l),v=/^[aeiouéèêh]/.test(l);
  if(prep==="à")return v?"à l'"+l:(f?"à la "+l:"au "+l);return v?prep+" l'"+l:(f?prep+" la "+l:prep+" le "+l);}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
function sum(a){return a.reduce(function(x,y){return x+y;},0);}
function ini(s){var w=s.replace(/[’']/g," ").split(/[\s-]+/).filter(function(x){return x&&!/^(du|des|de|d|la|le|l|au|aux|et|groupe|PST|CI|SAFIR|DEFI|SACRI|Trans|Roulements)$/i.test(x);});
  if(!w.length)return s.slice(0,2).toUpperCase();return (w[0].charAt(0)+(w[1]?w[1].charAt(0):w[0].charAt(1))).toUpperCase();}

var SOC={};D.socs.forEach(function(s){SOC[s]=D.par[s];});
SOC.Groupe={court:"Groupe",ico:"building-2"};
function socsOf(str){return String(str).split(", ");}
function tile(s,cls){var m=SOC[s]||SOC.Groupe;return '<span class="ti'+(cls?" "+cls:"")+'">'+ic(m.ico)+"</span>";}
function stag(s){return '<span class="stag">'+ic((SOC[s]||SOC.Groupe).ico)+(s==="Groupe"?"Tout le groupe":s)+"</span>";}
var TYPES={valider:{l:"Valider",ico:"check"},arbitrer:{l:"Arbitrer",ico:"scale"},relancer:{l:"Relancer",ico:"send"},deleguer:{l:"Déléguer",ico:"user-round-check"}};
var CATS={tresorerie:{l:"Trésorerie",ico:"wallet"},impayes:{l:"Impayés",ico:"hand-coins"},stocks:{l:"Ruptures",ico:"package-x"},imports:{l:"Importations",ico:"ship"},atelier:{l:"Atelier",ico:"wrench"},clients:{l:"Clients",ico:"message-circle"},ao:{l:"Appels d'offres",ico:"file-check"}};
var KINDS={decision:{l:"Décisions",u:"Décision",ico:"gavel"},ao:{l:"Appels d'offres",u:"Appel d'offres",ico:"file-check"},import:{l:"Importations",u:"Importation",ico:"ship"},atelier:{l:"Atelier",u:"Atelier",ico:"wrench"},paie:{l:"Paie",u:"Paie",ico:"banknote"}};
var VNAME={ensemble:"Vue d'ensemble",decisions:"Décisions",echeancier:"Échéancier",tresorerie:"Trésorerie",alertes:"Alertes"};

/* ---------- filtre société, commun à toutes les vues ---------- */
var SF=null;
function inSF(str){return !SF||socsOf(str).indexOf(SF)>=0;}
function setSF(s){SF=(s&&s!==SF)?s:(s===SF?null:null);if(s&&s!==SF)SF=s;AF.cat=null;closeMenu();renderAll();}
function pickSF(s){SF=s||null;AF.cat=null;closeMenu();renderAll();toast(SF?"Filtré sur "+SF:"Toutes les sociétés");}

/* ---------- état des décisions, gardé sur l'appareil ---------- */
var KEY="sacri-decisions-v2",ST={};
function load(){try{ST=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){ST={};}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}}
function stat(d){var s=ST[d.id];return s?s.statut:d.statut;}
function journal(d){var base=(d.journal||[]).slice();var s=ST[d.id];return s?base.concat(s.journal):base;}
var DEC={};D.decisions.forEach(function(d){DEC[d.id]=d;d._ech=d.ech;});
function act(id,statut,texte){var d=DEC[id];var s=ST[id]||{statut:d.statut,journal:[]};s.statut=statut;s.journal.push([fr(T),texte]);ST[id]=s;save();renderAll();if(OPEN===id)openDec(id);toast(texte);}
function undo(id){delete ST[id];save();renderAll();if(OPEN===id)openDec(id);toast("Décision remise dans la liste à décider");}
var tt;function toast(m){var t=$("toast");t.innerHTML=ic("circle-check-big")+"<span>"+esc(m)+"</span>";t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on");},2400);}
function decs(){return D.decisions.filter(function(d){return !SF||d.soc===SF;});}
function pending(){return decs().filter(function(d){return stat(d)==="a_decider";});}

/* ---------- graphiques ---------- */
Chart.defaults.font.family='"Inter",system-ui,sans-serif';Chart.defaults.font.size=12;Chart.defaults.color="#6B6B6B";
Chart.defaults.plugins.legend.display=false;Chart.defaults.animation.duration=CAP?0:400;
Chart.defaults.plugins.tooltip.backgroundColor="#111";Chart.defaults.plugins.tooltip.padding=10;Chart.defaults.plugins.tooltip.cornerRadius=8;Chart.defaults.plugins.tooltip.displayColors=false;
var ORA="#E95B0F",GRY="#D6D6D2",GRY2="#A3A3A0",RED="#C8352B",INK="#111111";
var CH={};function mk(id,cfg){if(CH[id])CH[id].destroy();var el=$(id);if(!el)return;CH[id]=new Chart(el,cfg);}
var GRID={color:"#F1F1EF",drawTicks:false},NOG={display:false};
function yM(extra){return Object.assign({grid:GRID,border:{display:false},ticks:{padding:8,maxTicksLimit:5,callback:function(v){return M(v,0);}}},extra||{});}
var SEM=D.semaines.map(fr);
/* étiquettes directes : texte posé sur le graphique */
function labelsPlugin(fn){return{id:"lbl",afterDatasetsDraw:function(c){var x=c.ctx;x.save();fn(c,x);x.restore();}};}
function lbl(x,s,px,py,a,col,pts){x.font='600 12px "Inter",sans-serif';var w=x.measureText(s).width+12,h=20,bx=px-w/2;if(bx+w>a.right)bx=a.right-w;if(bx<a.left)bx=a.left;var top=py;(pts||[]).forEach(function(q,i){var n=pts[i+1];if(q.x<=bx+w&&(n?n.x:q.x)>=bx){top=Math.min(top,q.y,n?n.y:q.y);}});var by=Math.min(py-12,top-8)-h;if(by<a.top-22)by=py+12;x.save();x.fillStyle="#fff";x.strokeStyle=col;x.globalAlpha=1;x.lineWidth=1;x.beginPath();if(x.roundRect)x.roundRect(bx,by,w,h,5);else x.rect(bx,by,w,h);x.fill();x.stroke();x.restore();txt(x,s,bx+w/2,by+h/2+.5,{c:col,b:"middle"});}
function txt(x,s,px,py,o){o=o||{};x.font=(o.w||"600")+" "+(o.s||12)+'px "Inter",sans-serif';x.fillStyle=o.c||INK;x.textAlign=o.a||"center";x.textBaseline=o.b||"bottom";x.fillText(s,px,py);}

/* ---------- données agrégées ---------- */
function factM(s){if(s)return D.facture_mois[s];return D.mois.map(function(_,i){return sum(D.socs.map(function(x){return D.facture_mois[x][i];}));});}
function cur(){if(!SF)return Object.assign({},D.groupe,{tr:D.treso.Groupe});var m=SOC[SF];return Object.assign({},m,{tr:D.treso[SF]});}
function rythme(fm){var n=fm[fm.length-1]/19,o=fm[fm.length-2]/31;return (n/o-1)*100;}
function delta(p,lbl){var r=Math.round(p);var c=r>0?"up":r<0?"dn":"nt";return '<span class="dl '+c+'">'+(r>0?"▲ +":r<0?"▼ ":"")+(r<0?r:r>0?r:"0").toString().replace("-","−")+" %</span>"+(lbl?"<span>"+lbl+"</span>":"");}

/* ---------- vue d'ensemble ---------- */
function kc(o){return '<div class="kc'+(o.key?" key":"")+'"><p class="l">'+ic(o.ico)+o.l+'</p><div class="vr"><p class="v">'+o.v+(o.u?"<small>"+o.u+"</small>":"")+'</p>'+(o.sp?'<div class="sp">'+o.sp+"</div>":"")+'</div><div class="s">'+o.s+"</div>"+(o.after||"")+"</div>";}
function agebar(a){var t=sum(a)||1,c=["#E3E3DF","#C9C9C4","#A3A3A0","#F2A37B",RED];return '<div class="agebar">'+a.map(function(v,i){return v?'<i style="width:'+(v/t*100)+"%;background:"+c[i]+'"></i>':"";}).join("")+"</div>";}
function etat(s){var m=SOC[s],al=D.alertes.filter(function(a){return socsOf(a.soc).indexOf(s)>=0;}),h=al.filter(function(a){return a.niv==="haute";}).length;
  if(m.sous>0)return["r","Sous son seuil dès le "+fr(m.sous_des),"trending-down"];
  if(h>0)return["a",pl(h,"alerte forte","alertes fortes"),"triangle-alert"];return["g","Sous contrôle","shield-check"];}
function renderEnsemble(){
  var C=cur(),p=pending(),late=p.filter(function(d){return d.ech<T;}),fm=factM(SF),sous=D.socs.filter(function(s){return SOC[s].sous>0;});
  if(!SF)$("lede").innerHTML="En novembre, le groupe a facturé <b>"+M(C.facture)+" M FCFA</b> au 19, dont "+Math.round(SOC.SACRI.facture/C.facture*100)+" % par SACRI. La trésorerie du groupe tient sur 13 semaines, mais <b>"+sous.join(" et ")+" passent sous leur seuil d'ici février</b>. "+pl(p.length,"décision attend","décisions attendent")+" une réponse, dont "+late.length+" en retard.";
  else $("lede").innerHTML="En novembre, <b>"+SF+"</b> a facturé <b>"+M(C.facture,2)+" M FCFA</b> au 19, soit "+Math.round(C.facture/D.groupe.facture*100)+" % du groupe. "+(C.sous>0?'Sa trésorerie <span class="r">passe sous son seuil de '+M(C.seuil,0)+" M dès la semaine du "+fr(C.sous_des)+"</span>.":"Sa trésorerie reste au-dessus de son seuil de "+M(C.seuil,0)+" M sur 13 semaines.")+" "+(p.length?pl(p.length,"décision attend","décisions attendent")+" une réponse"+(late.length?", dont "+late.length+" en retard":"")+".":"Aucune décision ne l'attend.");
  var ag=C.aged,pb=(C.point_bas/C.treso-1)*100;
  $("kpis").innerHTML=
    kc({ico:"receipt",l:"Facturé en novembre",v:M(C.facture,SF?2:1),u:"M FCFA",key:1,sp:'<canvas id="sp-f"></canvas>',s:delta(rythme(fm),"rythme par jour vs octobre")})+
    kc({ico:"wallet",l:"Trésorerie disponible",v:M(C.treso),u:"M FCFA",sp:'<canvas id="sp-t"></canvas>',s:delta(pb,"au point bas le "+fr(C.point_bas_sem))+(C.sous>0?' <span class="pill r">'+ic("trending-down")+"sous le seuil</span>":"")})+
    kc({ico:"hand-coins",l:"Ce que les clients doivent",v:M(C.encours),u:"M FCFA",s:(C.imp60?'<span class="dl dn">'+M(C.imp60)+" M</span><span>à plus de 60 jours</span>":'<span class="dl up">0</span><span>rien à plus de 60 jours</span>'),after:agebar(ag)})+
    kc({ico:"gavel",l:"Décisions en attente",v:p.length,u:"",sp:'<div class="sp-dec">'+p.slice().sort(function(a,b){return a.ech<b.ech?-1:1;}).map(function(d){return '<i class="'+(d.ech<T?"l":"")+'" style="height:'+(d.ech<T?36:Math.max(10,36-days(T,d.ech)*2))+'px"></i>';}).join("")+"</div>",s:late.length?'<span class="dl dn">'+late.length+" en retard</span><span>"+pl(p.length-late.length,"dans les temps","dans les temps")+"</span>":'<span class="dl up">0 en retard</span>'});
  spark("sp-f",fm.slice(0,-1).concat([fm[fm.length-1]]),true);spark("sp-t",[C.treso].concat(C.tr.fin),false,C.seuil);
  /* tableau des sociétés */
  var G=D.groupe;
  $("t-socs").innerHTML="<thead><tr><th>Société</th><th>Facturé en nov.</th><th>Trésorerie</th><th>Point bas 13 sem.</th><th class=\"hm\">Clients doivent</th><th class=\"hm\">Devis en cours</th><th>Ruptures</th><th class=\"hm\">En atelier</th><th>État</th></tr></thead><tbody>"+
    D.socs.map(function(s){var m=SOC[s],e=etat(s),mx=Math.max(m.treso,m.seuil)*1.25;
      return '<tr data-soc="'+s+'" class="'+(SF===s?"on":"")+'"><td><div class="sn">'+tile(s)+'<div><p class="nm">'+s+'</p><p class="mt">'+m.metier+"</p></div></div></td>"+
      '<td class="num" data-l="Facturé en nov.">'+M(m.facture,2)+' M</td>'+
      '<td data-l="Trésorerie"><span class="mtr"><span class="tr" title="Trait noir : seuil de '+M(m.seuil,0)+' M"><i class="'+(m.sous?"bad":"")+'" style="width:'+(m.treso/mx*100)+'%"></i><b style="left:'+(m.seuil/mx*100)+'%"></b></span><span class="num">'+M(m.treso)+" M</span></span></td>"+
      '<td class="num'+(m.sous?" bad":"")+'" data-l="Point bas 13 sem.">'+M(m.point_bas)+' M</td>'+
      '<td class="num hm" data-l="Clients doivent">'+M(m.encours)+' M'+(m.imp60?'<span class="sub">dont '+M(m.imp60)+" M à 60 j+</span>":"")+'</td>'+
      '<td class="num hm" data-l="Devis en cours">'+M(m.devis)+' M</td>'+
      '<td class="num'+(m.rupt?" bad":" zero")+'" data-l="Ruptures">'+m.rupt+'</td>'+
      '<td class="num hm'+(m.atelier?"":" zero")+'" data-l="En atelier">'+m.atelier+(m.atelier_ret?'<span class="sub bad">dont '+m.atelier_ret+" en retard</span>":"")+'</td>'+
      '<td data-l="État"><span class="pill '+e[0]+'">'+ic(e[2])+e[1]+"</span></td></tr>";}).join("")+
    '</tbody><tfoot><tr><td>Groupe</td><td class="num" data-l="Facturé en nov.">'+M(G.facture)+' M</td><td class="num" data-l="Trésorerie">'+M(G.treso)+' M</td><td class="num" data-l="Point bas 13 sem.">'+M(G.point_bas)+' M</td><td class="num hm" data-l="Clients doivent">'+M(G.encours)+' M</td><td class="num hm" data-l="Devis en cours">'+M(G.devis)+' M</td><td class="num" data-l="Ruptures">'+sum(D.socs.map(function(s){return SOC[s].rupt;}))+'</td><td class="num hm" data-l="En atelier">'+sum(D.socs.map(function(s){return SOC[s].atelier;}))+'</td><td class="ra"></td></tr></tfoot>';
  [].forEach.call(document.querySelectorAll("#t-socs tbody tr"),function(r){r.onclick=function(){pickSF(SF===r.dataset.soc?null:r.dataset.soc);};});
  /* facturé par mois */
  var lab=D.mois.map(function(m,i){return MC[+m.slice(5)-1]+(i===D.mois.length-1?" (au 19)":"");}),tot=factM(null);
  var ds=SF?[{data:D.facture_mois[SF],backgroundColor:ORA,borderRadius:4,maxBarThickness:40,stack:"a"},{data:tot.map(function(v,i){return v-D.facture_mois[SF][i];}),backgroundColor:"#EDEDEA",borderRadius:4,maxBarThickness:40,stack:"a"}]
    :[{data:tot,backgroundColor:tot.map(function(_,i){return i===tot.length-1?ORA:GRY;}),borderRadius:5,maxBarThickness:44}];
  mk("c-fact",{type:"bar",data:{labels:lab,datasets:ds},
    options:{maintainAspectRatio:false,layout:{padding:{top:22}},plugins:{tooltip:{callbacks:{label:function(c){return (SF?(c.datasetIndex?"Autres sociétés":SF):"Groupe")+" : "+M(c.raw,2)+" M";}}}},scales:{x:{stacked:true,grid:NOG,border:{display:false},ticks:{font:{size:11.5}}},y:yM({stacked:true,display:false})}},
    plugins:[labelsPlugin(function(c,x){var me=c.getDatasetMeta(0);me.data.forEach(function(b,i){var v=c.data.datasets[0].data[i];txt(x,M(v,SF?1:1),b.x,b.y-6,{c:(i===me.data.length-1||SF)?ORA:"#3D3D3D",s:11.5});});})]});
  $("fact-n").innerHTML=SF?"<b>"+SF+"</b> en orange, le reste du groupe en gris.":"Novembre arrêté au 19 ; octobre a été le plus gros mois (<b>"+M(tot[3])+" M</b>).";
  /* trésorerie prévue (mini) */
  $("tr-mini-t").textContent=(SF?"Trésorerie "+SF:"Trésorerie du groupe")+", 13 semaines";
  trLine("c-trmini",C,false);
  $("trmini-n").innerHTML="Trait pointillé rouge : seuil d'alerte de <b>"+M(C.seuil,0)+" M</b>."+(C.sous>0?' <span class="bad">Sous le seuil '+pl(C.sous,"semaine")+".</span>":"");
  /* devis */
  var dv=D.socs.slice().sort(function(a,b){return SOC[b].devis-SOC[a].devis;}),mxd=SOC[dv[0]].devis;
  $("devis").innerHTML=dv.map(function(s,i){var on=SF?s===SF:i===0;return '<div class="r'+(on?" top":"")+'"><span class="n">'+s+'</span><span class="t"><i style="width:'+(SOC[s].devis/mxd*100)+'%"></i></span><span class="v">'+M(SOC[s].devis)+" M</span></div>";}).join("");
  $("devis-n").innerHTML=pl(D.groupe.devis_n,"devis envoyé, relancé ou en négociation","devis envoyés, relancés ou en négociation")+", <b>"+M(D.groupe.devis)+" M FCFA</b> au total.";
  /* décisions prioritaires */
  var pr=p.slice().sort(function(a,b){return a.ech<b.ech?-1:1;}).slice(0,5);
  $("prio").innerHTML=pr.length?pr.map(decRow).join(""):'<p class="empty">Aucune décision en attente'+(SF?" pour "+SF:"")+".</p>";
}
function spark(id,data,bar,seuil){var el=$(id);if(!el)return;
  if(bar)mk(id,{type:"bar",data:{labels:data.map(function(_,i){return i;}),datasets:[{data:data,backgroundColor:data.map(function(_,i){return i===data.length-1?ORA:"#E2E2DF";}),borderRadius:2,barPercentage:.75,categoryPercentage:.9}]},options:{maintainAspectRatio:false,animation:false,plugins:{tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false,min:0}}}});
  else mk(id,{type:"line",data:{labels:data.map(function(_,i){return i;}),datasets:[{data:data,borderColor:"#3D3D3D",borderWidth:1.6,pointRadius:0,tension:.35,fill:false,segment:{borderColor:function(c){return c.p1.parsed.y<seuil?RED:"#3D3D3D";}}},{data:data.map(function(){return seuil;}),borderColor:RED,borderDash:[3,3],borderWidth:1,pointRadius:0}]},options:{maintainAspectRatio:false,animation:false,plugins:{tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false,min:0}}}});}
function trLine(id,C,big){
  var data=[C.treso].concat(C.tr.fin),lab=[fr(T)+" (auj.)"].concat(SEM.map(function(s,i){return i?s:s;})),mn=Math.min.apply(null,C.tr.fin),ix=C.tr.fin.lastIndexOf(mn)+1;
  lab=["auj."].concat(SEM.slice(0,13).map(function(s,i){var d=new Date(dd(D.semaines[i]).getTime()+7*864e5);return fr(iso(d));}));
  mk(id,{type:"line",data:{labels:lab,datasets:[
    {label:"Solde",data:data,borderColor:INK,backgroundColor:"rgba(17,17,17,.04)",fill:true,tension:.3,pointRadius:0,pointHoverRadius:4,borderWidth:2,segment:{borderColor:function(c){return c.p1.parsed.y<C.seuil?RED:INK;}}},
    {label:"Seuil",data:data.map(function(){return C.seuil;}),borderColor:RED,borderDash:[5,5],pointRadius:0,borderWidth:1.4,fill:false}]},
    options:{maintainAspectRatio:false,layout:{padding:{top:24,right:big?8:4}},interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{title:function(c){return c[0].dataIndex?"Fin de semaine, "+c[0].label:"Aujourd'hui";},label:function(c){return c.dataset.label+" : "+M(c.raw)+" M";}}}},
      scales:{x:{grid:NOG,border:{display:false},ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:big?8:5,font:{size:11.5}}},y:yM({min:0})}},
    plugins:[labelsPlugin(function(c,x){var me=c.getDatasetMeta(0),p0=me.data[0],pb=me.data[ix],pe=me.data[me.data.length-1],a=c.chartArea;
      x.fillStyle=INK;x.beginPath();x.arc(p0.x,p0.y,3.5,0,7);x.fill();
      txt(x,M(data[0])+" M",p0.x+4,p0.y-8,{a:"left"});
      x.fillStyle=C.sous?RED:ORA;x.beginPath();x.arc(pb.x,pb.y,4,0,7);x.fill();
      lbl(x,"point bas "+M(mn)+" M",pb.x,pb.y,a,C.sous?RED:ORA,me.data);
      var sy=c.scales.y.getPixelForValue(C.seuil);txt(x,"seuil "+M(C.seuil,0)+" M",a.left+4,sy-5,{a:"left",c:RED,w:"500",s:11});
    })]});
}

/* ---------- décisions ---------- */
function due(d,st){
  if(st!=="a_decider")return '<span class="due">'+ic("calendar-clock")+"Échéance "+fr(d.ech)+"</span>";
  var n=days(T,d.ech);
  if(n<0)return '<span class="due late">'+ic("clock")+"En retard depuis le "+fr(d.ech)+"</span>";
  if(n===0)return '<span class="due late">'+ic("clock")+"Aujourd'hui</span>";
  return '<span class="due'+(n<=3?" soon":"")+'">'+ic("calendar-clock")+fjour(d.ech)+"</span>";
}
function money(v){return v>=1e6?M(v)+" M":F(v)+" FCFA";}
function decRow(d){var st=stat(d),late=st==="a_decider"&&d.ech<T;
  return '<button class="row" data-open="'+d.id+'"><span class="ty'+(late?" late":"")+'" title="'+TYPES[d.type].l+'">'+ic(TYPES[d.type].ico)+'</span><span style="min-width:0"><span class="tt" style="display:block">'+esc(d.titre)+'</span><span class="mm"><span>'+TYPES[d.type].l+"</span>"+stag(d.soc)+due(d,st)+'</span></span><span class="rr">'+(d.montant?'<span class="amt">'+money(d.montant)+"</span>":'<span class="amt"></span>')+'<span class="av" title="Décide : '+esc(d.resp)+'">'+ini(d.resp)+'</span><span class="rowact">Ouvrir'+ic("chevron-right")+"</span></span></button>";}
var DT="tous";
function renderDecisions(){
  var all=pending(),a=all.filter(function(d){return DT==="tous"||d.type===DT;}).sort(function(x,y){return x.ech<y.ech?-1:1;}),late=all.filter(function(d){return d.ech<T;});
  $("dec-lede").innerHTML="<b>"+pl(all.length,"décision attend","décisions attendent")+"</b> une réponse"+(SF?" pour "+SF:"")+(late.length?', dont <span class="r">'+late.length+" en retard</span>":"")+". Ouvrez une ligne pour voir ce qui est en jeu, qui décide, et enregistrer la décision : elle passe alors dans le suivi.";
  $("dec-seg").innerHTML=["tous"].concat(Object.keys(TYPES)).map(function(t){var n=t==="tous"?all.length:all.filter(function(d){return d.type===t;}).length;return '<button class="'+(DT===t?"on":"")+'" data-dt="'+t+'">'+(t==="tous"?ic("list-checks")+"Toutes":ic(TYPES[t].ico)+TYPES[t].l)+' <span class="c">'+n+"</span></button>";}).join("");
  [].forEach.call(document.querySelectorAll("[data-dt]"),function(b){b.onclick=function(){DT=b.dataset.dt;renderDecisions();};});
  var nwk=iso(new Date(dd(monday(T)).getTime()+7*864e5));
  var gr=[["En retard","triangle-alert",function(d){return d.ech<T;},1],["Cette semaine","calendar-days",function(d){return d.ech>=T&&d.ech<nwk;}],["Plus tard","calendar-clock",function(d){return d.ech>=nwk;}]];
  $("d-afaire").innerHTML=a.length?gr.map(function(g){var it=a.filter(g[2]);if(!it.length)return"";return '<p class="lg-h'+(g[3]?" late":"")+'">'+ic(g[1])+g[0]+' <span class="c">'+it.length+"</span></p>"+it.map(decRow).join("");}).join(""):'<p class="empty">Aucune décision à prendre ici. Les décisions prises sont dans le suivi.</p>';
  function item(d){var j=journal(d),last=j[j.length-1];var done=stat(d)==="fait";
    return '<button class="row" data-open="'+d.id+'"><span class="ty">'+ic(done?"circle-check-big":TYPES[d.type].ico)+'</span><span style="min-width:0"><span class="tt" style="display:block">'+esc(d.titre)+'</span><span class="mm">'+stag(d.soc)+(last?"<span><b style=\"font-weight:500;color:#3D3D3D\">"+last[0]+"</b>, "+esc(last[1])+"</span>":"")+'</span></span><span class="rr"><span class="pill '+(done?"g":"b")+'">'+ic(done?"check":"clock")+(done?"Fait":"En cours")+"</span></span></button>";}
  var ec=decs().filter(function(d){return stat(d)==="en_cours";}),fa=decs().filter(function(d){return stat(d)==="fait";});
  $("n-encours").textContent=ec.length;$("n-fait").textContent=fa.length;
  $("d-encours").innerHTML=ec.length?ec.map(item).join(""):'<p class="empty">Rien en cours.</p>';
  $("d-fait").innerHTML=fa.length?fa.map(item).join(""):'<p class="empty">Rien de terminé pour l\'instant.</p>';
}
function btns(d){
  var b=[],st=stat(d),del=d.delegue?'<button class="btn" data-a="del" data-id="'+d.id+'">'+ic("user-round-check")+"Déléguer "+art(d.delegue,"à")+"</button>":"";
  if(st==="en_cours")return '<p class="lbl">Suite</p><button class="btn pri" data-a="fait" data-id="'+d.id+'">'+ic("check-check")+'Marquer comme fait</button><button class="btn ghost" data-a="undo" data-id="'+d.id+'">'+ic("undo-2")+"Annuler et remettre à décider</button>";
  if(st==="fait")return '<p class="lbl">Décision close</p><button class="btn ghost" data-a="undo" data-id="'+d.id+'">'+ic("undo-2")+"Annuler et remettre à décider</button>";
  if(d.type==="valider"){b.push('<button class="btn pri" data-a="ok" data-id="'+d.id+'">'+ic("check")+"Valider</button>");b.push('<button class="btn" data-a="no" data-id="'+d.id+'">'+ic("x")+"Refuser</button>");b.push(del);}
  else if(d.type==="arbitrer"){(d.options||[]).forEach(function(o,i){b.push('<button class="btn'+(i?"":" pri")+'" data-a="opt" data-o="'+i+'" data-id="'+d.id+'">'+ic(i?"scale":"check")+esc(o)+"</button>");});b.push(del);}
  else if(d.type==="relancer"){b.push('<button class="btn pri" data-a="rel" data-id="'+d.id+'">'+ic("send")+"Lancer la relance</button>");b.push(del);}
  else{b.push(del.replace('class="btn"','class="btn pri"'));b.push('<button class="btn" data-a="moi" data-id="'+d.id+'">'+ic("user")+"Je m'en charge</button>");}
  b.push('<button class="btn ghost" data-a="rep" data-id="'+d.id+'">'+ic("history")+"Reporter d'une semaine</button>");
  return '<p class="lbl">Décider</p>'+b.join("");
}
var OPEN=null;
function openDec(id){var d=DEC[id];if(!d)return;OPEN=id;var st=stat(d),j=journal(d);
  $("dr-id").textContent="Décision "+d.id.replace("D","n° ");
  $("dr-b").innerHTML='<div class="tags"><span class="pill n">'+ic(TYPES[d.type].ico)+TYPES[d.type].l+"</span>"+(st==="a_decider"?(d.ech<T?'<span class="pill r">'+ic("clock")+"En retard</span>":'<span class="pill o">'+ic("hourglass")+"À décider</span>"):st==="fait"?'<span class="pill g">'+ic("check")+"Fait</span>":'<span class="pill b">'+ic("clock")+"En cours</span>")+"</div>"+
    "<h3>"+esc(d.titre)+'</h3><p class="why">'+esc(d.pourquoi)+"</p>"+
    '<dl class="props"><dt>Société</dt><dd>'+stag(d.soc)+'</dd><dt>Décide</dt><dd><span class="av">'+ini(d.resp)+"</span>"+esc(d.resp)+"</dd>"+(d.delegue?'<dt>Peut confier à</dt><dd><span class="av">'+ini(d.delegue)+"</span>"+esc(d.delegue)+"</dd>":"")+(d.montant?"<dt>En jeu</dt><dd>"+(d.montant>=1e6?M(d.montant)+" M FCFA":F(d.montant)+" FCFA")+"</dd>":"")+"<dt>Échéance</dt><dd>"+due(d,st)+"</dd></dl>"+
    '<div class="acts">'+btns(d)+"</div>"+
    (j.length?'<div class="tl"><h4>Historique</h4>'+j.map(function(x,i){return '<p class="e'+(i===j.length-1&&ST[d.id]?" new":"")+'"><b>'+x[0]+"</b>"+esc(x[1])+"</p>";}).join("")+"</div>":"");
  $("drawer").classList.add("on");$("scrim").classList.add("on");$("drawer").setAttribute("aria-hidden","false");}
function closeDec(){OPEN=null;$("drawer").classList.remove("on");$("scrim").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");}
$("dr-x").onclick=closeDec;$("scrim").onclick=closeDec;
document.addEventListener("keydown",function(e){if(e.key==="Escape"){closeDec();closeMenu();}});
document.addEventListener("click",function(e){
  var o=e.target.closest("[data-open]");if(o){openDec(o.dataset.open);return;}
  var g=e.target.closest("[data-goto]");if(g){show(g.dataset.goto);return;}
  var b=e.target.closest("[data-a]");if(!b)return;var d=DEC[b.dataset.id],a=b.dataset.a;if(!d)return;
  var who=art(d.resp,"par").slice(4);
  if(a==="ok")act(d.id,"en_cours","Validé par "+who);
  else if(a==="no")act(d.id,"fait","Refusé par "+who);
  else if(a==="opt")act(d.id,"en_cours","Arbitré par "+who+" : "+d.options[+b.dataset.o].toLowerCase());
  else if(a==="rel")act(d.id,"en_cours","Relance lancée, suivie par "+art(d.delegue,"par").slice(4));
  else if(a==="del")act(d.id,"en_cours","Délégué "+art(d.delegue,"à"));
  else if(a==="moi")act(d.id,"en_cours","Pris en charge par "+who);
  else if(a==="rep"){var n=new Date(dd(d.ech>T?d.ech:T).getTime()+7*864e5),is=iso(n);ST[d.id]={statut:"a_decider",journal:[[fr(T),"Reporté au "+fr(is)]]};d.ech=is;save();renderAll();openDec(d.id);toast("Reporté au "+fr(is));}
  else if(a==="fait")act(d.id,"fait","Marqué comme fait");
  else if(a==="undo")undo(d.id);
});

/* ---------- échéancier ---------- */
var EF="tous";
function evStatus(e){
  if(e.kind==="decision"){var d=DEC[e.ref],s=stat(d);
    if(s==="fait")return["done","circle-check-big","Fait"];
    if(s==="en_cours")return["prog","clock","En cours"];
    return d.ech<T?["late","clock","En retard"]:["todo","hourglass","À décider"];}
  return e.date<T?["late","clock","En retard"]:["plan","calendar-clock","Prévu"];
}
function evDate(e){return e.kind==="decision"?DEC[e.ref].ech:e.date;}
function monday(s){var d=dd(s),k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);return iso(d);}
var DOTC={late:RED,todo:ORA,prog:"#7C8796",done:"#5DAE82",plan:"#CFCFCB"};
function events(){return D.echeancier.map(function(e){return Object.assign({},e,{date:evDate(e)});}).filter(function(e){return inSF(e.soc);}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});}
function renderEch(){
  var ev=events(),late=ev.filter(function(e){return evStatus(e)[0]==="late";});
  var wk=monday(T),nwk=iso(new Date(dd(wk).getTime()+7*864e5)),nnwk=iso(new Date(dd(wk).getTime()+14*864e5));
  var thisw=ev.filter(function(e){return e.date>=T&&e.date<nwk&&evStatus(e)[0]!=="done";});
  $("ech-lede").innerHTML="Décisions, appels d'offres, arrivées de marchandise, restitutions d'atelier et paies"+(SF?" de "+SF:"")+", au même endroit. "+(late.length?'<span class="r">'+pl(late.length,"échéance est dépassée","échéances sont dépassées")+"</span>":"<b>Aucune échéance dépassée</b>")+", "+pl(thisw.length,"tombe","tombent")+" d'ici dimanche.";
  var cols=[],w0=new Date(dd(wk).getTime()-21*864e5);
  for(var i=0;i<8;i++){var a=iso(new Date(w0.getTime()+i*7*864e5));cols.push({a:a,l:fr(a),now:a===wk});}
  cols.push({a:iso(new Date(w0.getTime()+56*864e5)),l:"ensuite"});
  $("wk-u").textContent=pl(ev.length,"échéance","échéances")+" au total";
  $("frise").innerHTML=cols.map(function(c,i){
    var nx=i<8?cols[i+1].a:"9999",it=ev.filter(function(e){return (i===0?true:e.date>=c.a)&&e.date<nx;});
    return '<div class="wc'+(c.now?" now":"")+'"><span class="n'+(it.length?"":" z")+'">'+(it.length||"–")+'</span><div class="dots">'+it.map(function(e){var s=evStatus(e);return '<i style="background:'+DOTC[s[0]]+'" title="'+esc(e.titre)+'"></i>';}).join("")+'</div><span class="w">'+(c.now?"cette sem.":(i===8?"plus tard":(i===0?"avant le "+fr(cols[1].a):"sem. "+c.l)))+"</span></div>";
  }).join("")+"";
  if(!$("wleg")){$("frise").insertAdjacentHTML("afterend",'<div class="wleg" id="wleg"><span><i style="background:'+RED+'"></i>En retard</span><span><i style="background:'+ORA+'"></i>À décider</span><span><i style="background:#7C8796"></i>En cours</span><span><i style="background:#5DAE82"></i>Fait</span><span><i style="background:#CFCFCB"></i>Prévu</span></div>');}
  var ks=["tous"].concat(Object.keys(KINDS));
  $("ech-seg").innerHTML=ks.map(function(k){var n=k==="tous"?ev.length:ev.filter(function(e){return e.kind===k;}).length;if(k!=="tous"&&!n)return"";return '<button class="'+(EF===k?"on":"")+'" data-ef="'+k+'">'+(k==="tous"?ic("list-checks")+"Tout":ic(KINDS[k].ico)+KINDS[k].l)+' <span class="c">'+n+"</span></button>";}).join("");
  [].forEach.call(document.querySelectorAll("[data-ef]"),function(b){b.onclick=function(){EF=b.dataset.ef;renderEch();};});
  if(EF!=="tous"&&!ev.some(function(e){return e.kind===EF;}))EF="tous";
  var f=ev.filter(function(e){return EF==="tous"||e.kind===EF;});
  var groups=[["late","En retard",function(e){return evStatus(e)[0]==="late";}],["w","Cette semaine",function(e){return evStatus(e)[0]!=="late"&&e.date<nwk;}],["n","Semaine prochaine",function(e){return evStatus(e)[0]!=="late"&&e.date>=nwk&&e.date<nnwk;}],["p","Plus tard",function(e){return evStatus(e)[0]!=="late"&&e.date>=nnwk;}]];
  $("ech").innerHTML=groups.map(function(g){
    var it=f.filter(g[2]);if(!it.length)return "";
    return '<p class="lg-h'+(g[0]==="late"?" late":"")+'">'+ic(g[0]==="late"?"triangle-alert":"calendar-days")+g[1]+' <span class="c">'+it.length+"</span></p>"+it.map(function(e){
      var s=evStatus(e),k=KINDS[e.kind],retard=s[0]==="late"?" ("+pl(days(e.date,T),"jour")+")":"",isd=e.kind==="decision";
      return '<div class="erow"'+(isd?' data-open="'+e.ref+'" style="cursor:pointer"':"")+'><div class="d">'+fjour(e.date)+(e.heure?"<small>"+e.heure+"</small>":"")+'</div><span class="ty ei'+(s[0]==="late"?" late":"")+'">'+ic(k.ico)+'</span><div style="min-width:0"><p class="tt">'+esc(e.titre)+'</p><p class="mm"><span>'+k.u+"</span>"+socsOf(e.soc).map(stag).join("")+(isd&&s[0]!=="done"&&s[0]!=="prog"?'<span class="lnk">Décider'+ic("chevron-right")+"</span>":"")+'</p></div><span class="stw"><span class="pill '+{late:"r",todo:"o",prog:"b",done:"g",plan:"n"}[s[0]]+'">'+ic(s[1])+s[2]+retard+"</span></span></div>";
    }).join("");
  }).join("")||'<p class="empty">Aucune échéance pour ce filtre.</p>';
}

/* ---------- trésorerie ---------- */
function renderTreso(){
  var C=cur(),G=D.groupe,TG=C.tr,enc=sum(TG.enc),dec=sum(TG.dec),sous=D.socs.filter(function(s){return SOC[s].sous>0;});
  $("tr-h1").textContent=SF?"Trésorerie de "+SF+" sur 13 semaines":"Trésorerie du groupe sur 13 semaines";
  if(!SF)$("tr-lede").innerHTML="Le groupe reste au-dessus de son seuil de "+M(G.seuil,0)+" M FCFA sur les 13 semaines, avec un point bas de <b>"+M(G.point_bas)+" M</b> la semaine du "+fr(G.point_bas_sem)+". Deux sociétés passent pourtant sous le leur : <b class=\"r\">SAFIR dès la semaine du "+fr(SOC.SAFIR.sous_des)+"</b> et <b class=\"r\">DEFI la semaine du "+fr(SOC.DEFI.sous_des)+"</b>. Les deux arbitrages attendent dans les décisions.";
  else $("tr-lede").innerHTML=SF+" part de <b>"+M(C.treso)+" M FCFA</b> et atteint son point bas de <b>"+M(C.point_bas)+" M</b> la semaine du "+fr(C.point_bas_sem)+". "+(C.sous>0?'<span class="r">Elle passe sous son seuil de '+M(C.seuil,0)+" M dès la semaine du "+fr(C.sous_des)+", "+pl(C.sous,"semaine")+" sur 13.</span>":"Elle reste au-dessus de son seuil de "+M(C.seuil,0)+" M sur les 13 semaines.");
  $("tr-kpis").innerHTML=
    kc({ico:"wallet",l:"Solde aujourd'hui",v:M(C.treso),u:"M FCFA",key:1,s:"<span>"+(SF?"seuil d'alerte "+M(C.seuil,0)+" M":"cinq sociétés, seuil "+M(G.seuil,0)+" M")+"</span>"})+
    kc({ico:"trending-down",l:"Point bas sur 13 semaines",v:M(C.point_bas),u:"M FCFA",s:delta((C.point_bas/C.treso-1)*100,"semaine du "+fr(C.point_bas_sem))})+
    kc({ico:"banknote",l:"Entrées et sorties prévues",v:M(enc,0)+" / "+M(dec,0),u:"M FCFA",s:"<span>encaissements puis décaissements sur 13 semaines</span>"})+
    (SF?kc({ico:"triangle-alert",l:"Semaines sous le seuil",v:C.sous,u:"sur 13",s:C.sous?'<span class="pill r">'+ic("trending-down")+"dès le "+fr(C.sous_des)+"</span>":'<span class="pill g">'+ic("shield-check")+"jamais sous le seuil</span>"})
      :kc({ico:"triangle-alert",l:"Sociétés sous leur seuil",v:sous.length,u:"sur 5",s:sous.map(function(s){return '<span class="pill r">'+s+" dès le "+fr(SOC[s].sous_des)+"</span>";}).join("")}));
  $("c-tr-t").textContent="Solde en fin de semaine"+(SF?", "+SF:", groupe");
  trLine("c-tr",C,true);
  var lab=D.semaines.map(function(s){return fr(iso(new Date(dd(s).getTime()+7*864e5)));});
  mk("c-flux",{type:"bar",data:{labels:lab,datasets:[{label:"Encaissements",data:TG.enc,backgroundColor:"#C9C9C4",borderRadius:3,barPercentage:.8,categoryPercentage:.7},{label:"Décaissements",data:TG.dec,backgroundColor:ORA,borderRadius:3,barPercentage:.8,categoryPercentage:.7}]},
    options:{maintainAspectRatio:false,plugins:{tooltip:{displayColors:true,callbacks:{title:function(c){return "Semaine finissant le "+c[0].label;},label:function(c){return c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:{grid:NOG,border:{display:false},ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:7,font:{size:11.5}}},y:yM()}}});
  $("multi").innerHTML=D.socs.map(function(s){var m=SOC[s];return '<div class="mc'+(SF===s?" on":(SF?" dim":""))+'" data-msoc="'+s+'"><p class="h">'+tile(s)+s+'</p><p class="v">'+M(m.treso)+'<small>M</small></p><p class="s'+(m.sous?" bad":"")+'">'+(m.sous?pl(m.sous,"semaine")+" sous le seuil":(m.point_bas>=m.treso?"au plus bas aujourd'hui":"point bas "+M(m.point_bas)+" M"))+'</p><div class="cv"><canvas id="mc-'+s+'"></canvas></div></div>';}).join("");
  [].forEach.call(document.querySelectorAll("[data-msoc]"),function(el){el.onclick=function(){pickSF(SF===el.dataset.msoc?null:el.dataset.msoc);};});
  D.socs.forEach(function(s){var m=SOC[s],t=D.treso[s];
    mk("mc-"+s,{type:"line",data:{labels:[0].concat(SEM),datasets:[{data:[m.treso].concat(t.fin),borderColor:"#3D3D3D",borderWidth:1.8,pointRadius:0,tension:.3,fill:{target:"origin",above:"rgba(17,17,17,.035)"},segment:{borderColor:function(c){return c.p1.parsed.y<m.seuil?RED:"#3D3D3D";}}},{data:[0].concat(SEM).map(function(){return m.seuil;}),borderColor:RED,borderDash:[3,3],borderWidth:1.1,pointRadius:0}]},
      options:{maintainAspectRatio:false,animation:false,plugins:{tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false,min:0}}}});});
  var a=C.aged,tot=sum(a),lb=["Pas encore dû","1 à 30 jours","31 à 60 jours","61 à 90 jours","Plus de 90 jours"],col=["#E3E3DF","#C9C9C4","#A3A3A0","#F2A37B",RED];
  $("aged-t").textContent="Ce que les clients doivent"+(SF?" à "+SF:" au groupe")+", par ancienneté";
  $("aged").innerHTML='<div class="ag-bar">'+a.map(function(v,i){return v?'<div style="width:'+(v/tot*100)+"%;background:"+col[i]+'" title="'+lb[i]+" : "+M(v)+' M"></div>':"";}).join("")+'</div><div class="ag-l">'+a.map(function(v,i){return '<div class="'+(i>=3&&v?"bad":"")+'"><span><i style="background:'+col[i]+'"></i>'+lb[i]+"</span><b>"+M(v)+"<small>M, "+(tot?Math.round(v/tot*100):0)+" %</small></b></div>";}).join("")+"</div>";
}

/* ---------- alertes ---------- */
var AF={cat:null,niv:null};
function renderAlertes(){
  var A=D.alertes.filter(function(a){return inSF(a.soc);}),h=A.filter(function(a){return a.niv==="haute";}).length,cnt={};
  A.forEach(function(a){cnt[a.cat]=(cnt[a.cat]||0)+1;});
  var top=Object.keys(cnt).sort(function(x,y){return cnt[y]-cnt[x];})[0];
  $("al-lede").innerHTML="<b>"+pl(A.length,"alerte")+"</b>"+(SF?" pour "+SF:"")+", dont <span class=\"r\">"+pl(h,"forte","fortes")+"</span>."+(top?" Le sujet le plus chargé : "+CATS[top].l.toLowerCase()+" ("+cnt[top]+").":"")+" Cliquez une case pour ne garder que ses alertes.";
  var cats=Object.keys(CATS);
var c=document.querySelector(".mx-wrap");if(c&&!c._scroller){c._scroller=true;c.setAttribute("role","region");c.setAttribute("aria-label","Matrice des alertes par société et sujet, défilement horizontal disponible");c.setAttribute("tabindex","0");}
  $("mx").innerHTML="<thead><tr><th></th>"+cats.map(function(c){return "<th>"+ic(CATS[c].ico)+CATS[c].l+"</th>";}).join("")+"</tr></thead><tbody>"+D.socs.map(function(s){
    return '<tr class="'+(SF&&SF!==s?"dim":"")+'"><td class="rh"><span>'+tile(s)+s+"</span></td>"+cats.map(function(c){
      var it=D.alertes.filter(function(a){return a.cat===c&&socsOf(a.soc).indexOf(s)>=0;}),n=it.length,hh=it.filter(function(a){return a.niv==="haute";}).length;
      var cl=n===0?"z":(hh>=2||n>=3?"l3":hh?"l2":"l1");
      return '<td class="'+cl+(SF===s&&AF.cat===c?" on":"")+'" data-ms="'+s+'" data-mc="'+c+'">'+(n||"0")+"</td>";
    }).join("")+"</tr>";}).join("")+"</tbody>";
  [].forEach.call(document.querySelectorAll("[data-ms]"),function(td){if(td.classList.contains("z"))return;td.onclick=function(){if(SF===td.dataset.ms&&AF.cat===td.dataset.mc){AF.cat=null;}else{SF=td.dataset.ms;AF.cat=td.dataset.mc;}AF.niv=null;renderAll();};});
  var segs=[["Toutes",null,"list-checks",A.length],["Fortes",{niv:"haute"},"siren",h],["À surveiller",{niv:"moyenne"},"eye",A.length-h]];
  $("al-seg").innerHTML=segs.map(function(c,i){var on=(c[1]?c[1].niv:null)===AF.niv;return '<button class="'+(on?"on":"")+'" data-af="'+i+'">'+ic(c[2]==="eye"?"bell":c[2])+c[0]+' <span class="c">'+c[3]+"</span></button>";}).join("")+(AF.cat?'<button class="on" data-afx="1">'+ic(CATS[AF.cat].ico)+CATS[AF.cat].l+" "+ic("x")+"</button>":"");
  [].forEach.call(document.querySelectorAll("[data-af]"),function(b){b.onclick=function(){var c=segs[+b.dataset.af];AF.niv=c[1]?c[1].niv:null;renderAlertes();};});
  var x=document.querySelector("[data-afx]");if(x)x.onclick=function(){AF.cat=null;renderAlertes();};
  var f=A.filter(function(a){return (!AF.cat||a.cat===AF.cat)&&(!AF.niv||a.niv===AF.niv);}).sort(function(x,y){return (x.niv===y.niv?0:x.niv==="haute"?-1:1);});
  $("al-list").innerHTML=f.map(function(a){
    var d=a.dec&&DEC[a.dec],ds=d&&stat(d);
    var link=d?(ds==="a_decider"?'<button class="lnk" data-open="'+a.dec+'">Décision à prendre'+ic("chevron-right")+"</button>":'<span class="pill '+(ds==="fait"?"g":"b")+'">'+ic(ds==="fait"?"circle-check-big":"clock")+(ds==="fait"?"Décision prise":"Décision en cours")+"</span>"):"";
    return '<div class="al '+a.niv+'"><span class="ty">'+ic(CATS[a.cat].ico)+'</span><div style="min-width:0"><p class="at">'+esc(a.titre)+'</p><p class="ad">'+esc(a.detail)+'</p><p class="am"><span class="pill '+(a.niv==="haute"?"r":"n")+'">'+(a.niv==="haute"?"Forte":"À surveiller")+"</span>"+socsOf(a.soc).map(stag).join("")+'</p></div><div class="lnkw">'+link+"</div></div>";
  }).join("")||'<p class="empty">Aucune alerte pour ce filtre.</p>';
}

/* ---------- barre latérale, filtre, navigation ---------- */
function renderSide(){
  $("side-socs").innerHTML=D.socs.map(function(s){var e=etat(s);return '<button class="ni'+(SF===s?" on":"")+'" data-side="'+s+'">'+tile(s)+s+'<span class="sd '+e[0]+'" title="'+e[1]+'"></span></button>';}).join("");
  [].forEach.call(document.querySelectorAll("[data-side]"),function(b){b.onclick=function(){pickSF(SF===b.dataset.side?null:b.dataset.side);};});
  $("menu").innerHTML='<button class="mi'+(SF?"":" on")+'" data-pick=""><span class="ti">'+ic("building-2")+"</span><span>Toutes les sociétés<small>Groupe consolidé</small></span>"+ic("check").replace('class="i"','class="i ck"')+'</button><div class="msep"></div>'+
    D.socs.map(function(s){return '<button class="mi'+(SF===s?" on":"")+'" data-pick="'+s+'">'+tile(s)+"<span>"+s+"<small>"+SOC[s].metier+"</small></span>"+ic("check").replace('class="i"','class="i ck"')+"</button>";}).join("");
  [].forEach.call(document.querySelectorAll("[data-pick]"),function(b){b.onclick=function(e){e.stopPropagation();pickSF(b.dataset.pick||null);};});
  $("sel-l").textContent=SF||"Toutes les sociétés";$("sel-dot").innerHTML=SF?tile(SF):"";$("sel-b").classList.toggle("on",!!SF);
}
function closeMenu(){$("menu").classList.remove("on");}
$("sel-b").onclick=function(e){e.stopPropagation();$("menu").classList.toggle("on");};
document.addEventListener("click",function(e){if(!e.target.closest(".sel"))closeMenu();});

var CUR="ensemble";
function show(v){
  CUR=v;[].forEach.call(document.querySelectorAll(".ni[data-v],.tabbar button"),function(b){b.classList.toggle("on",b.dataset.v===v);});
  [].forEach.call(document.querySelectorAll(".view"),function(s){s.classList.toggle("on",s.id==="v-"+v);});
  $("crumb-v").textContent=VNAME[v];
  if(history.replaceState)history.replaceState(null,"","#"+v);
  render(v);window.scrollTo({top:0});
}
function render(v){({ensemble:renderEnsemble,decisions:renderDecisions,echeancier:renderEch,tresorerie:renderTreso,alertes:renderAlertes})[v]();}
function badges(){var p=pending().length,ev=events().filter(function(e){return evStatus(e)[0]==="late";}).length,al=D.alertes.filter(function(a){return inSF(a.soc)&&a.niv==="haute";}).length;
  $("k-dec").textContent=p||"";$("k-ech").textContent=ev||"";$("k-al").textContent=al||"";$("m-dec").textContent=p||"";$("m-ech").textContent=ev||"";$("m-al").textContent=al||"";}
function renderAll(){renderSide();badges();render(CUR);}
[].forEach.call(document.querySelectorAll(".ni[data-v],.tabbar button"),function(b){b.onclick=function(){show(b.dataset.v);};});
$("reset").onclick=function(){ST={};save();D.decisions.forEach(function(d){d.ech=d._ech;});renderAll();toast("Suivi remis à zéro");};

load();
Object.keys(ST).forEach(function(id){var s=ST[id];if(DEC[id]&&s.journal)s.journal.forEach(function(j){var m=/^Reporté au (\d\d)\/(\d\d)$/.exec(j[1]);if(m)DEC[id].ech=(+m[2]<6?"2027":"2026")+"-"+m[2]+"-"+m[1];});});
[].forEach.call(document.querySelectorAll("i[data-i]"),function(el){var w=document.createElement("span");w.innerHTML=ic(el.dataset.i);var sv=w.firstChild;if(el.className)sv.setAttribute("class","i "+el.className);el.replaceWith(sv);});
$("date").textContent=flong(T)+" 2026";
var h=(location.hash||"").slice(1);
renderSide();badges();
show(["ensemble","decisions","echeancier","tresorerie","alertes"].indexOf(h)>=0?h:"ensemble");
window.__sacri={pickSF:pickSF,openDec:openDec,closeDec:closeDec,show:show};
})();
