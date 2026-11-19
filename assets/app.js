(function(){
"use strict";
var D=window.D, ICO=window.ICO, T=D.today;
var $=function(id){return document.getElementById(id);};
function ic(n){return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+(ICO[n]||"")+'</svg>';}
function M(x,n){if(n===undefined)n=1;var v=(x/1e6).toFixed(n).replace(".",",");if(/,0+$/.test(v))v=v.replace(/,0+$/,"");return v;}
function F(x){return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"\u202f");}
function dd(s){var d=new Date(s+"T12:00:00");return d;}
function fr(s){var d=dd(s);return ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);}
var JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],MC=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function flong(s){var d=dd(s);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()];}
function fjour(s){var d=dd(s);return JOURS[d.getDay()].slice(0,3)+". "+d.getDate()+" "+MC[d.getMonth()];}
function days(a,b){return Math.round((dd(b)-dd(a))/864e5);}
function pl(n,s,p){return n+" "+(n>1?(p||s+"s"):s);}
function art(x,prep){var l=x.charAt(0).toLowerCase()+x.slice(1),f=/^(direction|chargée|cellule|comptabilité)/.test(l),v=/^[aeiouéèêh]/.test(l);
  if(prep==="à")return v?"à l'"+l:(f?"à la "+l:"au "+l);return v?prep+" l'"+l:(f?prep+" la "+l:prep+" le "+l);}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}

var SOC={};D.socs.forEach(function(s){SOC[s]=D.par[s];});
SOC.Groupe={court:"Groupe",ico:"building-2",col:"#55534F"};
function socIco(s){var m=SOC[s]||SOC.Groupe;return '<span class="soc-ico" style="background:'+m.col+'">'+ic(m.ico)+'</span>';}
function socsOf(str){return String(str).split(", ");}
var TYPES={valider:{l:"Valider",ico:"check",c:"#1E7A46",b:"#E6F3EB"},arbitrer:{l:"Arbitrer",ico:"scale",c:"#2F6F8F",b:"#E7F0F5"},relancer:{l:"Relancer",ico:"send",c:"#B26A00",b:"#FFF3DC"},deleguer:{l:"Déléguer",ico:"user-round-check",c:"#6B4FA0",b:"#EFEAF7"}};
var CATS={tresorerie:{l:"Trésorerie",ico:"wallet"},impayes:{l:"Impayés",ico:"hand-coins"},stocks:{l:"Ruptures",ico:"package-x"},imports:{l:"Importations",ico:"ship"},atelier:{l:"Atelier",ico:"wrench"},clients:{l:"Clients",ico:"message-circle"},ao:{l:"Appels d'offres",ico:"file-check"}};
var KINDS={decision:{l:"Décisions",ico:"gavel"},ao:{l:"Appels d'offres",ico:"file-check"},import:{l:"Importations",ico:"ship"},atelier:{l:"Atelier",ico:"wrench"},paie:{l:"Paie",ico:"banknote"}};

/* ---------- état des décisions, gardé sur l'appareil ---------- */
var KEY="sacri-decisions-v2",ST={};
function load(){try{ST=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){ST={};}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}}
function stat(d){var s=ST[d.id];return s?s.statut:d.statut;}
function journal(d){var base=(d.journal||[]).slice();var s=ST[d.id];return s?base.concat(s.journal):base;}
var DEC={};D.decisions.forEach(function(d){DEC[d.id]=d;});
function todayFr(){return fr(T);}
function act(id,statut,texte){
  var d=DEC[id];var s=ST[id]||{statut:d.statut,journal:[]};
  s.statut=statut;s.journal.push([todayFr(),texte]);ST[id]=s;save();renderAll();toast(texte);
}
function undo(id){delete ST[id];save();renderAll();toast("Décision remise dans la liste à décider");}
var tt;function toast(m){var t=$("toast");t.innerHTML=ic("circle-check-big")+"<span>"+esc(m)+"</span>";t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on");},2600);}

/* ---------- graphes ---------- */
Chart.defaults.font.family='"Inter",system-ui,sans-serif';Chart.defaults.font.size=12;Chart.defaults.color="#7A7671";
Chart.defaults.plugins.legend.display=false;Chart.defaults.animation.duration=(window.__CAPTURE?0:450);
Chart.defaults.plugins.tooltip.backgroundColor="#1F1D1B";Chart.defaults.plugins.tooltip.padding=10;Chart.defaults.plugins.tooltip.cornerRadius=8;
var CH={};function mk(id,cfg){if(CH[id])CH[id].destroy();CH[id]=new Chart($(id),cfg);}
var GRID={color:"#F1EFEC"},NOG={display:false};
function yM(){return{grid:GRID,border:{display:false},ticks:{callback:function(v){return M(v,0);}}};}
var SEM=D.semaines.map(fr);

/* ---------- vue d'ensemble ---------- */
function kpi(ico,l,v,u,s,cls){return '<div class="kpi '+(cls||"")+'"><div class="k-top"><span class="k-ico">'+ic(ico)+'</span><span class="l">'+l+'</span></div><div class="v">'+v+(u?"<small>"+u+"</small>":"")+'</div><div class="s">'+s+'</div></div>';}
function alertsOf(s){return D.alertes.filter(function(a){return socsOf(a.soc).indexOf(s)>=0;});}
function pending(){return D.decisions.filter(function(d){return stat(d)==="a_decider";});}
function renderEnsemble(){
  var G=D.groupe,p=pending(),late=p.filter(function(d){return d.ech<T;}),sous=D.socs.filter(function(s){return SOC[s].sous>0;});
  $("lede").innerHTML="En novembre, le groupe a facturé <b>"+M(G.facture)+" M FCFA</b> au 19, dont "+Math.round(SOC.SACRI.facture/G.facture*100)+" % par SACRI. La trésorerie du groupe tient sur 13 semaines, mais <b>"+sous.join(" et ")+" passent sous leur seuil d'ici février</b>. "+pl(p.length,"décision attend","décisions attendent")+" une réponse, dont "+late.length+" en retard.";
  $("kpis").innerHTML=
    kpi("receipt","Facturé en novembre",M(G.facture),"M FCFA","au 19, cinq sociétés")+
    kpi("wallet","Trésorerie disponible",M(G.treso),"M FCFA","point bas <b>"+M(G.point_bas)+" M</b> le "+fr(G.point_bas_sem)+", seuil "+M(G.seuil,0)+" M","ok")+
    kpi("hand-coins","Ce que les clients doivent",M(G.encours),"M FCFA",'<span class="bad"><b>'+M(G.imp60)+" M</b> à plus de 60 jours</span>","warn")+
    kpi("gavel","Décisions en attente",p.length,"",late.length?'<span class="bad"><b>'+late.length+"</b> en retard</span>":"aucune en retard",late.length?"warn":"");
  $("socs").innerHTML=D.socs.map(function(s){
    var m=SOC[s],al=alertsOf(s),h=al.filter(function(a){return a.niv==="haute";}).length,st;
    if(m.sous>0)st='<span class="soc-st r">'+ic("trending-down")+"Sous son seuil dès le "+fr(m.sous_des)+"</span>";
    else if(h>0)st='<span class="soc-st a">'+ic("triangle-alert")+pl(h,"alerte forte","alertes fortes")+"</span>";
    else st='<span class="soc-st g">'+ic("shield-check")+"Sous contrôle</span>";
    var mx=Math.max(m.treso,m.seuil)*1.25;
    return '<button class="soc" data-soc="'+s+'"><div class="soc-h">'+socIco(s)+'<div style="min-width:0"><p class="soc-n">'+s+'</p><p class="soc-m">'+m.metier+"</p></div></div>"+st+
      '<div class="soc-rows">'+
      '<div class="sr">'+ic("receipt")+'<span class="sl">Facturé en nov.</span><span class="sv">'+M(m.facture,2)+" M</span></div>"+
      '<div><div class="sr">'+ic("wallet")+'<span class="sl">Trésorerie</span><span class="sv">'+M(m.treso)+' M</span></div><div class="meter" title="Trait noir : seuil de '+M(m.seuil,0)+' M"><i style="width:'+(m.treso/mx*100)+'%;background:'+m.col+'"></i><b style="left:'+(m.seuil/mx*100)+'%"></b></div></div>'+
      '<div class="sr">'+ic("trending-down")+'<span class="sl">Point bas à 13 sem.</span><span class="sv'+(m.sous?" bad":"")+'">'+M(m.point_bas)+" M</span></div>"+
      '<div class="sr">'+ic("file-text")+'<span class="sl">Devis en cours</span><span class="sv">'+M(m.devis)+" M</span></div>"+
      '<div class="sr">'+ic("package-x")+'<span class="sl">Ruptures</span><span class="sv'+(m.rupt?" bad":"")+'">'+m.rupt+"</span></div>"+
      '<div class="sr">'+ic("wrench")+'<span class="sl">En atelier</span><span class="sv">'+m.atelier+(m.atelier_ret?' <span class="bad">('+m.atelier_ret+" en retard)</span>":"")+"</span></div>"+
      '<div class="sr">'+ic("triangle-alert")+'<span class="sl">Alertes</span><span class="sv">'+al.length+"</span></div>"+
      '</div><span class="soc-f">Voir ses alertes'+ic("arrow-right")+"</span></button>";
  }).join("");
  [].forEach.call(document.querySelectorAll(".soc"),function(b){b.onclick=function(){AF={soc:b.dataset.soc,cat:null,niv:null};show("alertes");};});
  mk("c-fact",{type:"bar",data:{labels:D.mois.map(function(m){return MC[+m.slice(5)-1];}),datasets:D.socs.map(function(s){return{label:s,data:D.facture_mois[s],backgroundColor:SOC[s].col,borderRadius:3,maxBarThickness:46};})},
    options:{maintainAspectRatio:false,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,boxHeight:10,padding:10,font:{size:11.5}}},tooltip:{callbacks:{label:function(c){return c.dataset.label+" : "+M(c.raw,2)+" M";}}}},scales:{x:{stacked:true,grid:NOG},y:Object.assign(yM(),{stacked:true})}}});
  mk("c-cmp",{data:{labels:D.socs.map(function(s){return s==="Trans-Roulements"?["Trans-","Roulements"]:s;}),datasets:[
    {type:"bar",label:"Aujourd'hui",data:D.socs.map(function(s){return SOC[s].treso;}),backgroundColor:D.socs.map(function(s){return SOC[s].col;}),borderRadius:4,maxBarThickness:26,order:2},
    {type:"bar",label:"Point bas à 13 semaines",data:D.socs.map(function(s){return SOC[s].point_bas;}),backgroundColor:D.socs.map(function(s){return SOC[s].sous?"#E8A79F":"#E3E0DC";}),borderRadius:4,maxBarThickness:26,order:2},
    {type:"line",label:"Seuil d'alerte",data:D.socs.map(function(s){return SOC[s].seuil;}),showLine:false,pointStyle:"line",pointRadius:22,pointBorderWidth:2.5,borderColor:"#B42318",order:1}]},
    options:{maintainAspectRatio:false,plugins:{tooltip:{callbacks:{label:function(c){return c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:{grid:NOG,ticks:{font:{size:11},maxRotation:0,autoSkip:false}},y:yM()}}});
  var dv=D.socs.map(function(s){return SOC[s].devis;});
  mk("c-devis",{type:"doughnut",data:{labels:D.socs,datasets:[{data:dv,backgroundColor:D.socs.map(function(s){return SOC[s].col;}),borderWidth:2,borderColor:"#fff"}]},
    options:{maintainAspectRatio:false,cutout:"62%",plugins:{legend:{display:true,position:"right",labels:{boxWidth:10,boxHeight:10,padding:9,font:{size:11.5},generateLabels:function(c){return D.socs.map(function(s,i){return{text:s+"  "+M(dv[i])+" M",fillStyle:SOC[s].col,strokeStyle:SOC[s].col,index:i};});}}},tooltip:{callbacks:{label:function(c){return c.label+" : "+M(c.raw)+" M";}}}}}});
  $("devis-n").innerHTML=pl(D.groupe.devis_n,"devis envoyé, relancé ou en négociation","devis envoyés, relancés ou en négociation")+", <b>"+M(D.groupe.devis)+" M FCFA</b> au total.";
}

/* ---------- décisions ---------- */
function due(d,st){
  if(st!=="a_decider")return '<span class="due">'+ic("calendar-clock")+"Échéance "+fr(d.ech)+"</span>";
  var n=days(T,d.ech);
  if(n<0)return '<span class="due late">'+ic("clock")+"En retard depuis le "+fr(d.ech)+"</span>";
  if(n===0)return '<span class="due late">'+ic("clock")+"Aujourd'hui</span>";
  return '<span class="due'+(n<=3?" soon":"")+'">'+ic("calendar-clock")+"Pour le "+fjour(d.ech)+"</span>";
}
function tag(t){var m=TYPES[t];return '<span class="tag" style="--tc:'+m.c+";--tb:"+m.b+'">'+ic(m.ico)+m.l+"</span>";}
function stag(s){var m=SOC[s]||SOC.Groupe;return '<span class="stag"><span class="dot" style="background:'+m.col+'"></span>'+(s==="Groupe"?"Tout le groupe":s)+"</span>";}
function btns(d){
  var b=[],del=d.delegue?'<button class="btn" data-a="del" data-id="'+d.id+'">'+ic("user-round-check")+"Déléguer "+art(d.delegue,"à")+"</button>":"";
  if(d.type==="valider"){b.push('<button class="btn pri" data-a="ok" data-id="'+d.id+'">'+ic("check")+"Valider</button>");b.push('<button class="btn" data-a="no" data-id="'+d.id+'">'+ic("x")+"Refuser</button>");b.push(del);}
  else if(d.type==="arbitrer"){(d.options||[]).forEach(function(o,i){b.push('<button class="btn'+(i?"":" pri")+'" data-a="opt" data-o="'+i+'" data-id="'+d.id+'">'+ic(i?"scale":"check")+esc(o)+"</button>");});b.push(del);}
  else if(d.type==="relancer"){b.push('<button class="btn pri" data-a="rel" data-id="'+d.id+'">'+ic("send")+"Lancer la relance</button>");b.push(del);}
  else{b.push(del.replace('class="btn"','class="btn pri"'));b.push('<button class="btn" data-a="moi" data-id="'+d.id+'">'+ic("user")+"Je m'en charge</button>");}
  b.push('<button class="btn ghost" data-a="rep" data-id="'+d.id+'">'+ic("history")+"Reporter d'une semaine</button>");
  return b.join("");
}
function renderDecisions(){
  $("types").innerHTML=Object.keys(TYPES).map(function(t){var m=TYPES[t];return '<span class="lt" style="color:'+m.c+'">'+ic(m.ico)+'<span style="color:#4F4C48">'+{valider:"Valider : accord sur une dépense ou une offre",arbitrer:"Arbitrer : choisir entre deux voies",relancer:"Relancer : un tiers doit agir",deleguer:"Déléguer : confier à un responsable"}[t]+"</span></span>";}).join("");
  var a=D.decisions.filter(function(d){return stat(d)==="a_decider";}).sort(function(x,y){return x.ech<y.ech?-1:1;});
  $("n-afaire").textContent=a.length;
  $("d-afaire").innerHTML=a.length?a.map(function(d){
    var late=d.ech<T;
    return '<article class="dc'+(late?" late":"")+'" id="dc-'+d.id+'" style="--tc:'+TYPES[d.type].c+";--tb:"+TYPES[d.type].b+'"><div class="dc-h">'+tag(d.type)+stag(d.soc)+due(d,"a_decider")+"</div>"+
      "<h3>"+esc(d.titre)+'</h3><p class="why">'+esc(d.pourquoi)+"</p>"+
      '<div class="dc-m"><span>'+ic("user")+"Décide : <b>"+d.resp+"</b></span>"+(d.montant?"<span>"+ic("banknote")+"En jeu : <b>"+(d.montant>=1e6?M(d.montant)+" M FCFA":F(d.montant)+" FCFA")+"</b></span>":"")+"</div>"+
      '<div class="dc-a">'+btns(d)+"</div></article>";
  }).join(""):'<p class="empty">Toutes les décisions ont été prises. Elles sont dans le suivi.</p>';
  function item(d,done){
    var st=ST[d.id],j=journal(d),last=st&&st.choix?st.choix:"";
    return '<div class="si'+(done?" done":"")+'"><p class="t">'+ic(done?"circle-check-big":TYPES[d.type].ico)+"<span>"+esc(d.titre)+"</span></p>"+
      '<p class="who">'+stag(d.soc)+"<span>"+ic("calendar-clock")+" Échéance "+fr(d.ech)+"</span></p>"+
      '<div class="jr">'+j.map(function(x){return "<p><b>"+x[0]+"</b>"+esc(x[1])+"</p>";}).join("")+"</div>"+
      '<div class="acts">'+(done?"":'<button class="btn" data-a="fait" data-id="'+d.id+'">'+ic("check-check")+"Marquer comme fait</button>")+(ST[d.id]?'<button class="btn ghost" data-a="undo" data-id="'+d.id+'">'+ic("undo-2")+"Annuler</button>":"")+"</div></div>";
  }
  var ec=D.decisions.filter(function(d){return stat(d)==="en_cours";}),fa=D.decisions.filter(function(d){return stat(d)==="fait";});
  $("n-encours").textContent=ec.length;$("n-fait").textContent=fa.length;
  $("d-encours").innerHTML=ec.length?ec.map(function(d){return item(d,false);}).join(""):'<p class="empty">Rien en cours.</p>';
  $("d-fait").innerHTML=fa.length?fa.map(function(d){return item(d,true);}).join(""):'<p class="empty">Rien de terminé pour l\'instant.</p>';
}
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-a]");if(!b)return;var d=DEC[b.dataset.id],a=b.dataset.a;if(!d)return;
  var who=art(d.resp,"par").slice(4);
  if(a==="ok")act(d.id,"en_cours","Validé par "+who);
  else if(a==="no")act(d.id,"fait","Refusé par "+who);
  else if(a==="opt"){act(d.id,"en_cours","Arbitré par "+who+" : "+d.options[+b.dataset.o].toLowerCase());}
  else if(a==="rel")act(d.id,"en_cours","Relance lancée, suivie par "+art(d.delegue,"par").slice(4));
  else if(a==="del")act(d.id,"en_cours","Délégué "+art(d.delegue,"à"));
  else if(a==="moi")act(d.id,"en_cours","Pris en charge par "+who);
  else if(a==="rep"){var n=new Date(dd(d.ech>T?d.ech:T).getTime()+7*864e5),iso=n.toISOString().slice(0,10);ST[d.id]={statut:"a_decider",journal:[[todayFr(),"Reporté au "+fr(iso)]]};d.ech=iso;save();renderAll();toast("Reporté au "+fr(iso));}
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
function monday(s){var d=dd(s),k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);return d.toISOString().slice(0,10);}
function renderEch(){
  var ev=D.echeancier.map(function(e){return Object.assign({},e,{date:evDate(e)});}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  var late=ev.filter(function(e){return evStatus(e)[0]==="late";});
  var wk=monday(T),nwk=new Date(dd(wk).getTime()+7*864e5).toISOString().slice(0,10),nnwk=new Date(dd(wk).getTime()+14*864e5).toISOString().slice(0,10);
  var thisw=ev.filter(function(e){return e.date>=T&&e.date<nwk&&evStatus(e)[0]!=="done";});
  $("ech-lede").innerHTML="Décisions, appels d'offres, arrivées de marchandise, restitutions d'atelier et paies, au même endroit. <b>"+pl(late.length,"échéance est dépassée","échéances sont dépassées")+"</b>, "+pl(thisw.length,"tombe","tombent")+" d'ici dimanche.";
  // frise
  var cols=[],w0=new Date(dd(wk).getTime()-21*864e5);
  for(var i=0;i<8;i++){var a=new Date(w0.getTime()+i*7*864e5).toISOString().slice(0,10);cols.push({a:a,l:fr(a),now:a===wk});}
  cols.push({a:new Date(w0.getTime()+56*864e5).toISOString().slice(0,10),l:"ensuite"});
  var COL={late:"#D9534F",todo:"#E95B0F",prog:"#2F6F8F",done:"#1E7A46",plan:"#CFCBC6"};
  $("frise").innerHTML=cols.map(function(c,i){
    var nx=i<8?cols[i+1].a:"9999",it=ev.filter(function(e){return (i===0?true:e.date>=c.a)&&e.date<nx;});
    return '<div class="fw'+(c.now?" now":"")+'"><span class="wn">'+(it.length||"")+'</span><div class="stack">'+it.map(function(e){var s=evStatus(e);return '<i style="background:'+COL[s[0]]+'" title="'+esc(e.titre)+'"></i>';}).join("")+'</div><span class="wl">'+(c.now?"cette sem.":(i===8?c.l:"sem. "+c.l))+"</span></div>";
  }).join("");
  $("frise").insertAdjacentHTML("afterend","");
  // filtres
  var ks=["tous"].concat(Object.keys(KINDS));
  $("ech-filt").innerHTML=ks.map(function(k){var n=k==="tous"?ev.length:ev.filter(function(e){return e.kind===k;}).length;return '<button class="chip'+(EF===k?" on":"")+'" data-ef="'+k+'">'+(k==="tous"?ic("list-checks")+"Tout":ic(KINDS[k].ico)+KINDS[k].l)+" ("+n+")</button>";}).join("");
  [].forEach.call(document.querySelectorAll("[data-ef]"),function(b){b.onclick=function(){EF=b.dataset.ef;renderEch();};});
  var f=ev.filter(function(e){return EF==="tous"||e.kind===EF;});
  var groups=[["late","En retard",function(e){return evStatus(e)[0]==="late";}],["w","Cette semaine",function(e){return evStatus(e)[0]!=="late"&&e.date<nwk;}],["n","Semaine prochaine",function(e){return evStatus(e)[0]!=="late"&&e.date>=nwk&&e.date<nnwk;}],["p","Plus tard",function(e){return evStatus(e)[0]!=="late"&&e.date>=nnwk;}]];
  $("ech").innerHTML=groups.map(function(g){
    var it=f.filter(g[2]);if(!it.length)return "";
    return '<div class="eg"><p class="eg-h'+(g[0]==="late"?" late":"")+'">'+ic(g[0]==="late"?"triangle-alert":"calendar-days")+g[1]+'<span class="cnt">'+it.length+"</span></p>"+it.map(function(e){
      var s=evStatus(e),k=KINDS[e.kind],retard=s[0]==="late"?" ("+pl(days(e.date,T),"jour")+")":"";
      return '<div class="er"><div class="dt">'+fjour(e.date)+(e.heure?"<small>"+e.heure+"</small>":"")+'</div><span class="ei">'+ic(k.ico)+'</span><div style="min-width:0"><p class="et">'+esc(e.titre)+'</p><p class="es">'+socsOf(e.soc).map(stag).join("")+"<span>"+k.l.replace(/s$/,"").replace("Décision","Décision").replace("Appels d'offre","Appel d'offres")+"</span>"+(e.kind==="decision"&&s[0]!=="done"&&s[0]!=="prog"?'<button class="lnk" data-go="'+e.ref+'">Décider'+ic("chevron-right")+"</button>":"")+'</p></div><span class="stw"><span class="st '+s[0]+'">'+ic(s[1])+s[2]+retard+"</span></span></div>";
    }).join("")+"</div>";
  }).join("");
  $("b-ech").textContent=late.length||"";
}
document.addEventListener("click",function(e){var b=e.target.closest("[data-go]");if(!b)return;goDec(b.dataset.go);});
function goDec(id){show("decisions");setTimeout(function(){var el=$("dc-"+id);if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.style.boxShadow="0 0 0 3px #F7A574";setTimeout(function(){el.style.boxShadow="";},1800);}},60);}

/* ---------- trésorerie ---------- */
function renderTreso(){
  var G=D.groupe,TG=D.treso.Groupe,enc=TG.enc.reduce(function(a,b){return a+b;},0),dec=TG.dec.reduce(function(a,b){return a+b;},0),sous=D.socs.filter(function(s){return SOC[s].sous>0;});
  $("tr-lede").innerHTML="Le groupe reste au-dessus de son seuil de "+M(G.seuil,0)+" M FCFA sur les 13 semaines, avec un point bas de <b>"+M(G.point_bas)+" M</b> la semaine du "+fr(G.point_bas_sem)+". Deux sociétés passent pourtant sous le leur : <b>SAFIR dès la semaine du "+fr(SOC.SAFIR.sous_des)+"</b> et <b>DEFI la semaine du "+fr(SOC.DEFI.sous_des)+"</b>. Les deux arbitrages attendent dans les décisions.";
  $("tr-kpis").innerHTML=kpi("wallet","Solde aujourd'hui",M(G.treso),"M FCFA","cinq sociétés")+
    kpi("trending-down","Point bas sur 13 semaines",M(G.point_bas),"M FCFA","semaine du "+fr(G.point_bas_sem)+", seuil "+M(G.seuil,0)+" M","ok")+
    kpi("banknote","Entrées et sorties prévues",M(enc,0)+" / "+M(dec,0),"M FCFA","encaissements puis décaissements sur 13 semaines")+
    kpi("triangle-alert","Sociétés sous leur seuil",sous.length,"",'<span class="bad">'+sous.join(" et ")+"</span>","warn");
  mk("c-tr",{type:"line",data:{labels:SEM,datasets:[{label:"Solde",data:TG.fin,borderColor:"#E95B0F",backgroundColor:"rgba(233,91,15,.08)",fill:true,tension:.3,pointRadius:3,pointBackgroundColor:"#E95B0F",borderWidth:2.4},{label:"Seuil",data:SEM.map(function(){return G.seuil;}),borderColor:"#B42318",borderDash:[6,5],pointRadius:0,borderWidth:1.6}]},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{title:function(c){return "Semaine du "+c[0].label;},label:function(c){return c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:{grid:NOG,ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:7}},y:Object.assign(yM(),{min:0})}}});
  mk("c-flux",{type:"bar",data:{labels:SEM,datasets:[{label:"Encaissements",data:TG.enc,backgroundColor:"#B9B6B2",borderRadius:3},{label:"Décaissements",data:TG.dec,backgroundColor:"#E95B0F",borderRadius:3}]},
    options:{maintainAspectRatio:false,plugins:{tooltip:{callbacks:{title:function(c){return "Semaine du "+c[0].label;},label:function(c){return c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:{grid:NOG,ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:7}},y:yM()}}});
  $("multi").innerHTML=D.socs.map(function(s){var m=SOC[s];return '<div class="mc"><p class="mc-h">'+socIco(s)+s+'</p><p class="mv">'+M(m.treso)+' M</p><p class="ms'+(m.sous?" bad":"")+'">'+(m.sous?pl(m.sous,"semaine")+" sous le seuil":(m.point_bas>=m.treso?"au plus bas aujourd'hui":"point bas "+M(m.point_bas)+" M"))+'</p><div class="mch"><canvas id="mc-'+s+'"></canvas></div></div>';}).join("");
  D.socs.forEach(function(s){var m=SOC[s],t=D.treso[s];
    mk("mc-"+s,{type:"line",data:{labels:SEM,datasets:[{data:t.fin,borderColor:m.sous?"#B42318":m.col,borderWidth:2,pointRadius:0,tension:.3,fill:false,segment:{borderColor:function(c){return c.p1.parsed.y<m.seuil?"#B42318":(m.col==="#1F1D1B"?"#1F1D1B":m.col);}}},{data:SEM.map(function(){return m.seuil;}),borderColor:"#B42318",borderDash:[4,4],borderWidth:1.2,pointRadius:0}]},
      options:{maintainAspectRatio:false,animation:false,plugins:{tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false,min:0}}}});});
  var a=G.aged,tot=a.reduce(function(x,y){return x+y;},0),lab=["Pas encore dû","1 à 30 jours","31 à 60 jours","61 à 90 jours","Plus de 90 jours"],col=["#9BC4A8","#C9C5C0","#F2A65A","#E06A3B","#B42318"];
  $("aged").innerHTML='<div class="ag-bar">'+a.map(function(v,i){return '<div style="width:'+(v/tot*100)+'%;background:'+col[i]+'">'+(v/tot>.08?Math.round(v/tot*100)+" %":"")+"</div>";}).join("")+'</div><div class="ag-l">'+a.map(function(v,i){return "<div><span><i style=\"background:"+col[i]+"\"></i>"+lab[i]+"</span><b>"+M(v)+" M</b></div>";}).join("")+"</div>";
}

/* ---------- alertes ---------- */
var AF={soc:null,cat:null,niv:null};
function renderAlertes(){
  var A=D.alertes,h=A.filter(function(a){return a.niv==="haute";}).length,cnt={};
  A.forEach(function(a){cnt[a.cat]=(cnt[a.cat]||0)+1;});
  var top=Object.keys(cnt).sort(function(x,y){return cnt[y]-cnt[x];})[0];
  $("al-lede").innerHTML="<b>"+A.length+" alertes</b>, dont <b>"+h+" fortes</b>. Le sujet le plus chargé : "+CATS[top].l.toLowerCase()+" ("+cnt[top]+"). Cliquez une case pour ne garder que ses alertes.";
  var cats=Object.keys(CATS);
  $("mx").innerHTML="<thead><tr><th></th>"+cats.map(function(c){return "<th>"+ic(CATS[c].ico)+CATS[c].l+"</th>";}).join("")+"</tr></thead><tbody>"+D.socs.map(function(s){
    return '<tr><td class="rh"><span>'+socIco(s)+s+"</span></td>"+cats.map(function(c){
      var it=A.filter(function(a){return a.cat===c&&socsOf(a.soc).indexOf(s)>=0;}),n=it.length,hh=it.filter(function(a){return a.niv==="haute";}).length;
      var cl=n===0?"z":(hh>=2||n>=3?"l3":hh?"l2":"l1");
      return '<td class="'+cl+(AF.soc===s&&AF.cat===c?" sel":"")+'" data-ms="'+s+'" data-mc="'+c+'">'+(n||"0")+"</td>";
    }).join("")+"</tr>";}).join("")+"</tbody>";
  [].forEach.call(document.querySelectorAll("[data-ms]"),function(td){if(td.classList.contains("z"))return;td.onclick=function(){if(AF.soc===td.dataset.ms&&AF.cat===td.dataset.mc)AF={soc:null,cat:null,niv:null};else AF={soc:td.dataset.ms,cat:td.dataset.mc,niv:null};renderAlertes();};});
  var chips=[["Toutes",{soc:null,cat:null,niv:null},"list-checks"],["Fortes seulement",{soc:null,cat:null,niv:"haute"},"siren"]].concat(D.socs.map(function(s){return[s,{soc:s,cat:null,niv:null},SOC[s].ico];}));
  $("al-filt").innerHTML=chips.map(function(c,i){var on=c[1].soc===AF.soc&&c[1].cat===AF.cat&&c[1].niv===AF.niv;return '<button class="chip'+(on?" on":"")+'" data-af="'+i+'">'+ic(c[2])+c[0]+"</button>";}).join("")+(AF.cat?'<button class="chip on">'+ic(CATS[AF.cat].ico)+AF.soc+", "+CATS[AF.cat].l.toLowerCase()+"</button>":"");
  [].forEach.call(document.querySelectorAll("[data-af]"),function(b){b.onclick=function(){AF=Object.assign({},chips[+b.dataset.af][1]);renderAlertes();};});
  var f=A.filter(function(a){return (!AF.soc||socsOf(a.soc).indexOf(AF.soc)>=0)&&(!AF.cat||a.cat===AF.cat)&&(!AF.niv||a.niv===AF.niv);}).sort(function(x,y){return (x.niv===y.niv?0:x.niv==="haute"?-1:1);});
  $("al-list").innerHTML=f.map(function(a){
    var d=a.dec&&DEC[a.dec],ds=d&&stat(d);
    var link=d?(ds==="a_decider"?'<button class="lnk" data-go="'+a.dec+'">Décision à prendre'+ic("chevron-right")+"</button>":'<span class="st '+(ds==="fait"?"done":"prog")+'">'+ic(ds==="fait"?"circle-check-big":"clock")+(ds==="fait"?"Décision prise":"Décision en cours")+"</span>"):"";
    return '<div class="al '+a.niv+'"><span class="ai">'+ic(CATS[a.cat].ico)+'</span><div style="min-width:0"><p class="at">'+esc(a.titre)+'</p><p class="ad">'+esc(a.detail)+'</p><p class="am"><span class="niv '+a.niv+'">'+(a.niv==="haute"?"Forte":"À surveiller")+"</span>"+socsOf(a.soc).map(stag).join("")+link+"</p></div></div>";
  }).join("")||'<p class="empty">Aucune alerte pour ce filtre.</p>';
  $("b-al").textContent=h;
}

/* ---------- navigation ---------- */
var CUR="ensemble";
function show(v){
  CUR=v;[].forEach.call(document.querySelectorAll(".tabs button"),function(b){b.classList.toggle("on",b.dataset.v===v);});
  [].forEach.call(document.querySelectorAll(".view"),function(s){s.classList.toggle("on",s.id==="v-"+v);});
  if(history.replaceState)history.replaceState(null,"","#"+v);
  render(v);window.scrollTo({top:0});
}
function render(v){({ensemble:renderEnsemble,decisions:renderDecisions,echeancier:renderEch,tresorerie:renderTreso,alertes:renderAlertes})[v]();}
function renderAll(){var p=pending();$("b-dec").textContent=p.length||"";renderEch();renderAlertes();renderDecisions();if(CUR==="ensemble")renderEnsemble();if(CUR==="tresorerie")renderTreso();}
[].forEach.call(document.querySelectorAll(".tabs button"),function(b){b.onclick=function(){show(b.dataset.v);};});
$("reset").onclick=function(){ST={};save();D.decisions.forEach(function(d){if(d._ech)d.ech=d._ech;});renderAll();toast("Suivi remis à zéro");};
D.decisions.forEach(function(d){d._ech=d.ech;});

load();
Object.keys(ST).forEach(function(id){var s=ST[id];if(DEC[id]&&s.journal)s.journal.forEach(function(j){var m=/^Reporté au (\d\d)\/(\d\d)$/.exec(j[1]);if(m)DEC[id].ech=(+m[2]<6?"2027":"2026")+"-"+m[2]+"-"+m[1];});});
[].forEach.call(document.querySelectorAll("i[data-i]"),function(el){el.outerHTML=ic(el.dataset.i);});
$("date").textContent=flong(T)+" 2026";
renderAll();
var h=(location.hash||"").slice(1);show(["ensemble","decisions","echeancier","tresorerie","alertes"].indexOf(h)>=0?h:"ensemble");
})();
