/* SACRI 2027 : tableau de bord du groupe */
(function(){
"use strict";
var D=window.D,H=window.H,K=window.K,T=D.today,$=K.$,ic=K.ic,M=K.M,F=K.F,fr=K.fr,pl=K.pl,esc=K.esc,sum=K.sum;
var SOC={};D.socs.forEach(function(s){SOC[s]=D.par[s];});
function socsOf(s){return String(s).split(", ");}
function SF(){return K.S.soc;}
function inSF(str){var s=SF();return !s||socsOf(str).indexOf(s)>=0;}
function col(v){return K.css(v);}
function art(x,prep){var l=x.charAt(0).toLowerCase()+x.slice(1),f=/^(direction|chargée|cellule|comptabilité)/.test(l),v=/^[aeiouéèêh]/.test(l);
  if(prep==="à")return v?"à l'"+l:(f?"à la "+l:"au "+l);return v?prep+" l'"+l:(f?prep+" la "+l:prep+" le "+l);}
var TYPES={valider:{l:"Valider",ico:"check",c:"#0EA5E9"},arbitrer:{l:"Arbitrer",ico:"scale",c:"#8B5CF6"},relancer:{l:"Relancer",ico:"send",c:"#E95B0F"},deleguer:{l:"Déléguer",ico:"user-round-check",c:"#10B981"}};
var CATS={tresorerie:{l:"Trésorerie",ico:"wallet",c:"#0EA5E9"},impayes:{l:"Impayés",ico:"hand-coins",c:"#E95B0F"},stocks:{l:"Ruptures",ico:"package-x",c:"#F59E0B"},imports:{l:"Importations",ico:"ship",c:"#8B5CF6"},atelier:{l:"Atelier",ico:"wrench",c:"#10B981"},clients:{l:"Clients",ico:"message-circle",c:"#64748B"},ao:{l:"Appels d'offres",ico:"file-check",c:"#0F766E"}};
var KINDS={decision:{l:"Décisions",u:"Décision",ico:"gavel",c:"#E95B0F"},ao:{l:"Appels d'offres",u:"Appel d'offres",ico:"file-check",c:"#0EA5E9"},import:{l:"Importations",u:"Importation",ico:"ship",c:"#8B5CF6"},atelier:{l:"Atelier",u:"Atelier",ico:"wrench",c:"#10B981"},paie:{l:"Paie",u:"Paie",ico:"banknote",c:"#F59E0B"}};
var VNAME={ensemble:"Vue d'ensemble",decisions:"Décisions",echeancier:"Échéancier",tresorerie:"Trésorerie",alertes:"Alertes"};
function legend(el,items){$(el).innerHTML=items.map(function(x){return '<span><i style="background:'+x[1]+'"></i>'+x[0]+"</span>";}).join("");}

/* ---------- regroupement par période : jours, semaines ou mois ---------- */
function buckets(per,f){var w=K.win(per),lab=[],v=[],d,a,b,k;
  if(per==="an"){for(k=11;k>=0;k--){d=K.dd(T);d.setDate(1);d.setMonth(d.getMonth()-k);a=K.iso(d);var e=new Date(d.getTime());e.setMonth(e.getMonth()+1);e.setDate(0);b=K.iso(e);if(b>T)b=T;lab.push(K.MC[d.getMonth()]);v.push(f(a,b));}}
  else if(per==="tri"){for(k=12;k>=0;k--){b=K.add(T,-7*k);a=K.add(b,-6);lab.push(fr(b));v.push(f(a,b));}}
  else{d=w.a;while(d<=w.b){lab.push(fr(d));v.push(f(d,d));d=K.add(d,1);}}
  return{lab:lab,v:v};}
function rng(dates,arr,a,b){var s=0;for(var i=0;i<dates.length;i++){if(dates[i]>=a&&dates[i]<=b)s+=arr[i]||0;}return s;}
var GRAN={"7":"par jour","30":"par jour","mois":"par jour","tri":"par semaine","an":"par mois"};

/* ---------- état des décisions, gardé sur l'appareil ---------- */
var KEY="sacri-decisions-v2",ST={};
function load(){try{ST=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){ST={};}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}}
function stat(d){var s=ST[d.id];return s?s.statut:d.statut;}
function journal(d){var base=(d.journal||[]).slice();var s=ST[d.id];return s?base.concat(s.journal):base;}
var DEC={};D.decisions.forEach(function(d){DEC[d.id]=d;d._ech=d.ech;});
function act(id,statut,texte){var d=DEC[id];var s=ST[id]||{statut:d.statut,journal:[]};s.statut=statut;s.journal.push([fr(T),texte]);ST[id]=s;save();renderAll();if(OPEN===id)openDec(id);K.toast(texte);}
function undo(id){delete ST[id];save();renderAll();if(OPEN===id)openDec(id);K.toast("Décision remise dans la liste à décider");}
function decs(){return D.decisions.filter(function(d){return !SF()||d.soc===SF();});}
function pending(){return decs().filter(function(d){return stat(d)==="a_decider";});}
function etat(s){var m=SOC[s],al=D.alertes.filter(function(a){return socsOf(a.soc).indexOf(s)>=0;}),h=al.filter(function(a){return a.niv==="haute";}).length;
  if(m.sous>0)return["r","Sous seuil le "+fr(m.sous_des),"trending-down"];
  if(h>0)return["a",pl(h,"alerte forte","alertes fortes"),"triangle-alert"];return["g","Sous contrôle","shield-check"];}
function cur(){var s=SF();if(!s)return Object.assign({},D.groupe,{tr:D.treso.Groupe});return Object.assign({},SOC[s],{tr:D.treso[s]});}
function startOf(arr){return arr[K.wStart()];}

/* ======================= VUE D'ENSEMBLE ======================= */
var EX={mes:"fact"};
var MES={fact:"Facturé sur la période",treso:"Trésorerie disponible",enc:"Ce que les clients doivent",imp:"Impayés à plus de 60 jours",devis:"Devis en cours"};
function mesVal(s,k){var m=SOC[s];return k==="fact"?K.fact(s).v:k==="treso"?m.treso:k==="enc"?m.encours:k==="imp"?m.imp60:m.devis;}
function renderEnsemble(){
  var s=SF(),C=cur(),p=pending(),late=p.filter(function(d){return d.ech<T;}),f=K.fact(s),per=K.S.per,sous=D.socs.filter(function(x){return SOC[x].sous>0;});
  K.fbar($("f-ensemble"),{extra:[{id:"mes",label:"Comparer",ico:"chart-column",opts:Object.keys(MES).map(function(k){return[k,MES[k].replace(" sur la période","")];}),val:EX.mes,on:function(v){EX.mes=v;renderEnsemble();}}]});
  var gf=K.fact(null);
  if(!s)$("lede").innerHTML="Le groupe a facturé <b>"+M(f.v)+" M FCFA</b> "+K.PLAB[per]+", dont "+Math.round(K.fact("SACRI").v/(gf.v||1)*100)+" % par SACRI. La trésorerie tient sur 13 semaines, mais <b>"+sous.join(" et ")+" passent sous leur seuil d'ici février</b>. "+pl(p.length,"décision attend","décisions attendent")+" une réponse, dont "+late.length+" en retard.";
  else $("lede").innerHTML="<b>"+s+"</b> a facturé <b>"+M(f.v,2)+" M FCFA</b> "+K.PLAB[per]+", soit "+Math.round(f.v/(gf.v||1)*100)+" % du groupe. "+(C.sous>0?'Sa trésorerie <span class="r">passe sous son seuil de '+M(C.seuil,0)+" M dès la semaine du "+fr(C.sous_des)+"</span>.":"Sa trésorerie reste au-dessus de son seuil de "+M(C.seuil,0)+" M sur 13 semaines.")+" "+(p.length?pl(p.length,"décision attend","décisions attendent")+" une réponse"+(late.length?", dont "+late.length+" en retard":"")+".":"Aucune décision ne l'attend.");
  var trh=K.weekly("tr_hist",s),trs=trh.slice(K.wStart()),enh=K.weekly("enc_hist",s),ens=enh.slice(K.wStart()),dw=K.decWin(s);
  $("kpis").innerHTML=
    K.kc({ico:"receipt",l:"Facturé "+K.PLAB[per].replace("en novembre (au 19)","en novembre"),v:M(f.v,s?2:1),u:"M FCFA",key:1,sp:'<canvas id="sp-f"></canvas>',s:K.delta(K.pct(f.v,f.p),K.PPREV[per])})+
    K.kc({ico:"wallet",l:"Trésorerie disponible",v:M(C.treso),u:"M FCFA",sp:'<canvas id="sp-t"></canvas>',s:K.delta(K.pct(C.treso,trs[0]),"vs début de période")+(C.sous>0?' <span class="pill r">'+ic("trending-down")+"sous le seuil en "+(C.sous_des<"2027-02-01"?"janvier":"février")+"</span>":"")})+
    K.kc({ico:"hand-coins",l:"Ce que les clients doivent",v:M(C.encours),u:"M FCFA",sp:'<canvas id="sp-e"></canvas>',s:K.delta(K.pct(C.encours,ens[0]),"vs début de période",true)+(C.imp60?'<span><b>'+M(C.imp60)+" M</b> à plus de 60 jours</span>":"<span>rien à plus de 60 jours</span>")})+
    K.kc({ico:"gavel",l:"Décisions en attente",v:p.length,u:late.length?"dont "+late.length+" en retard":"",sp:'<canvas id="sp-d"></canvas>',s:K.delta(K.pct(dw.v,dw.p),pl(dw.v,"prise","prises")+" sur la période")});
  var fs=K.factSeries(s);
  K.spark("sp-f",fs.v,{bar:1,col:col("--acc")});K.spark("sp-t",trs,{col:col("--sky"),seuil:C.seuil,min:0});K.spark("sp-e",ens,{col:col("--vio")});
  K.spark("sp-d",buckets(per,function(a,b){return sum((s?[s]:D.socs).map(function(x){return rng(H.jours_al,H.decisions_hist[x].prises,a,b);}));}).v,{bar:1,col:col("--grn")});
  /* courbe du facturé */
  $("c-fact-t").textContent="Facturé "+GRAN[fs.g==="mois"?"an":fs.g==="semaine"?"tri":"7"]+(s?", "+s:", groupe");
  $("lg-fact-a").textContent=K.PLAB[per].replace(/^(sur|en) /,"").replace(/^./,function(c){return c.toUpperCase();});$("lg-fact-b").textContent="Période précédente";
  K.mk("c-fact",{type:"line",data:{labels:fs.lab,datasets:[
    {label:"Période",data:fs.v,borderColor:col("--acc"),backgroundColor:function(c){return K.grad(c,col("--acc"),"38","02");},fill:true,tension:.35,borderWidth:2.2,pointRadius:0,pointHoverRadius:4},
    {label:"Période précédente",data:fs.p,borderColor:col("--mut2"),borderDash:[4,4],borderWidth:1.6,pointRadius:0,tension:.35,fill:false}]},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{label:function(c){return " "+c.dataset.label+" : "+M(c.raw,2)+" M FCFA";}}}},scales:{x:K.xC(),y:K.yM({min:0,ticks:{padding:8,maxTicksLimit:5,callback:function(v){return M(v,1);}}})}}});
  /* anneau */
  var sh=D.socs.map(function(x){return K.fact(x).v;}),tot=sum(sh);
  $("donut-u").textContent=K.PLAB[per];
  K.mk("c-donut",{type:"doughnut",data:{labels:D.socs,datasets:[{data:sh,backgroundColor:D.socs.map(function(x){return K.SC[x]+(s&&s!==x?"40":"");}),borderColor:col("--card"),borderWidth:3,hoverOffset:6}]},
    options:{maintainAspectRatio:false,cutout:"70%",plugins:{tooltip:{callbacks:{label:function(c){return " "+c.label+" : "+M(c.raw,2)+" M ("+Math.round(c.raw/tot*100)+" %)";}}}},onClick:function(e,el){if(el.length)K.setSoc(SF()===D.socs[el[0].index]?null:D.socs[el[0].index]);}},
    plugins:[K.center(M(s?K.fact(s).v:tot)+" M",s?s:"groupe")]});
  $("lg-donut").innerHTML=D.socs.map(function(x,i){return '<span><i style="background:'+K.SC[x]+'"></i>'+x+" <b>"+Math.round(sh[i]/(tot||1)*100)+" %</b></span>";}).join("");
  /* comparaison */
  var mv=D.socs.map(function(x){return mesVal(x,EX.mes);}),order=D.socs.map(function(x,i){return i;}).sort(function(a,b){return mv[b]-mv[a];});
  $("cmp-u").textContent=MES[EX.mes].replace(" sur la période","")+", M FCFA";
  K.mk("c-cmp",{type:"bar",data:{labels:order.map(function(i){return D.socs[i];}),datasets:[{data:order.map(function(i){return mv[i];}),backgroundColor:order.map(function(i){var x=D.socs[i];return (EX.mes==="treso"&&SOC[x].sous>0)?col("--red"):K.SC[x]+(s&&s!==x?"40":"");}),borderRadius:8,barThickness:22}]},
    options:{indexAxis:"y",maintainAspectRatio:false,layout:{padding:{right:52}},plugins:{tooltip:{callbacks:{label:function(c){return " "+M(c.raw,2)+" M FCFA";}}}},scales:{x:{display:false,beginAtZero:true},y:{grid:{display:false},border:{display:false},ticks:{font:{size:12.5,weight:"500"},color:col("--ink2")}}},onClick:function(e,el){if(el.length){var x=D.socs[order[el[0].index]];K.setSoc(SF()===x?null:x);}}},
    plugins:[{id:"vals",afterDatasetsDraw:function(c){var x=c.ctx;x.save();x.font='600 12px "Inter",sans-serif';x.fillStyle=col("--ink");x.textBaseline="middle";c.getDatasetMeta(0).data.forEach(function(b,i){x.fillText(M(c.data.datasets[0].data[i],1)+" M",b.x+8,b.y);});x.restore();}}]});
  $("cmp-n").innerHTML=EX.mes==="treso"?"En rouge : société qui passe sous son seuil sur les 13 prochaines semaines.":EX.mes==="fact"?"Facturé "+K.PLAB[per]+". Cliquez une barre pour filtrer.":"Situation au "+fr(T)+". Cliquez une barre pour filtrer.";
  /* jauges d'objectif */
  $("gauges").innerHTML=D.socs.map(function(x){var o=H.objectif_mois[x],v=H.facture_mois[x][H.mois.length-1];return '<div class="gauge'+(s&&s!==x?" dim":"")+'"><div class="gc"><canvas id="g-'+x+'"></canvas><p class="gv">'+Math.round(v/o*100)+"<small> %</small></p></div><p class=\"gn\">"+x+'</p><p class="gs">'+M(v,1)+" sur "+M(o,1)+" M</p></div>";}).join("");
  D.socs.forEach(function(x){var o=H.objectif_mois[x],v=H.facture_mois[x][H.mois.length-1],r=v/o;K.gauge("g-"+x,v,o,r>=19/30?col("--grn"):r>=.4?col("--amb"):col("--red"));});
  $("gauges-n").innerHTML="Au 19 novembre, le rythme attendu est de <b>63 %</b> de l'objectif du mois. Vert : en avance ; ambre : en retard ; rouge : très en retard.";
  /* mois par mois */
  var n=H.mois.length,ml=H.mois.slice(n-12).map(function(m,i){return K.MC[+m.slice(5)-1]+(i===11?" (au 19)":"");}),L=s?[s]:D.socs;
  K.mk("c-mois",{type:"bar",data:{labels:ml,datasets:L.map(function(x){return{type:"bar",label:x,data:H.facture_mois[x].slice(n-12),backgroundColor:K.SC[x],borderRadius:4,stack:"a",maxBarThickness:46};}).concat([{type:"line",label:"Même mois un an plus tôt",data:H.mois.slice(n-12).map(function(_,i){return sum(L.map(function(x){return H.facture_mois[x][n-24+i];}));}),borderColor:col("--ink2"),borderDash:[4,4],borderWidth:1.6,pointRadius:2.5,pointBackgroundColor:col("--ink2"),tension:.3}])},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{label:function(c){return " "+c.dataset.label+" : "+M(c.raw,2)+" M";}}}},scales:{x:K.xC({stacked:true}),y:K.yM({stacked:true})}}});
  legend("lg-mois",L.map(function(x){return[x,K.SC[x]];}).concat([["Même mois un an plus tôt",col("--ink2")]]));
  /* tableau des sociétés */
  var rows=D.socs.map(function(x){var m=SOC[x],fx=K.fact(x);return{soc:x,m:m,fact:fx.v,var:K.pct(fx.v,fx.p),treso:m.treso,pb:m.point_bas,enc:m.encours,devis:m.devis,rupt:m.rupt,atelier:m.atelier,etat:etat(x)};});
  function tcols(){return[
    {k:"soc",l:"Société",num:false,html:function(r){return '<div class="sn">'+K.tile(r.soc)+'<div><p class="nm">'+r.soc+'</p><p class="mt">'+esc(r.m.metier)+"</p></div></div>";}},
    {k:"fact",l:"Facturé",num:1,dl:"Facturé",html:function(r){return M(r.fact,2)+' M<span class="sub">'+K.delta(r.var)+"</span>";}},
    {k:"treso",l:"Trésorerie",num:1,dl:"Trésorerie",html:function(r){var mx=Math.max(r.treso,r.m.seuil)*1.25;return '<span class="pb"><span class="tr" title="Trait : seuil de '+M(r.m.seuil,0)+' M"><i class="'+(r.m.sous?"bad":"ok")+'" style="width:'+(r.treso/mx*100)+'%"></i><b style="left:'+(r.m.seuil/mx*100)+'%"></b></span>'+M(r.treso)+" M</span>";}},
    {k:"pb",l:"Point bas 13 sem.",num:1,dl:"Point bas",cls:"",html:function(r){return '<span class="'+(r.m.sous?"bad":"")+'">'+M(r.pb)+" M</span>";}},
    {k:"enc",l:"Clients doivent",num:1,dl:"Clients doivent",cls:"hm",html:function(r){return M(r.enc)+" M"+(r.m.imp60?'<span class="sub bad">dont '+M(r.m.imp60)+" M à 60 j+</span>":"");}},
    {k:"devis",l:"Devis en cours",num:1,dl:"Devis",cls:"hm hm2",html:function(r){return M(r.devis)+" M";}},
    {k:"rupt",l:"Ruptures",num:1,dl:"Ruptures",html:function(r){return '<span class="'+(r.rupt?"bad":"zero")+'">'+r.rupt+"</span>";}},
    {k:"atelier",l:"Atelier",num:1,dl:"Atelier",cls:"hm",html:function(r){return '<span class="'+(r.atelier?"":"zero")+'">'+r.atelier+"</span>"+(r.m.atelier_ret?'<span class="sub bad">'+r.m.atelier_ret+" en retard</span>":"");}},
    {k:"etat",l:"État",num:false,dl:"État",cls:"wide",sort:function(r){return r.etat[0];},html:function(r){return '<span class="pill '+r.etat[0]+'">'+ic(r.etat[2])+r.etat[1]+"</span>";}}];}
  var G=D.groupe;
  function draw(){K.table($("t-socs"),tcols(),rows,{cards:1,sortK:"fact",text:function(r){return r.soc+" "+r.m.metier;},
    rowAttr:function(r){return ' data-soc="'+r.soc+'" class="ck'+(SF()===r.soc?" on":"")+'"';},
    foot:'<tr><td class="l">Groupe</td><td class="num">'+M(gf.v)+' M</td><td class="num">'+M(G.treso)+' M</td><td class="num">'+M(G.point_bas)+' M</td><td class="num hm">'+M(G.encours)+' M</td><td class="num hm hm2">'+M(G.devis)+' M</td><td class="num">'+sum(D.socs.map(function(x){return SOC[x].rupt;}))+'</td><td class="num hm">'+sum(D.socs.map(function(x){return SOC[x].atelier;}))+'</td><td class="ra"></td></tr>',
    count:function(n){$("t-socs-n").textContent=pl(n,"société")+", facturé "+K.PLAB[per];},
    after:function(el){[].forEach.call(el.querySelectorAll("tr[data-soc]"),function(r){r.onclick=function(){K.setSoc(SF()===r.dataset.soc?null:r.dataset.soc);};});}});}
  draw();K.search($("q-socs"),$("t-socs"),draw);
  var pr=p.slice().sort(function(a,b){return a.ech<b.ech?-1:1;}).slice(0,5);
  $("prio").innerHTML=pr.length?pr.map(decRow).join(""):'<p class="empty">Aucune décision en attente'+(s?" pour "+s:"")+".</p>";
}

/* ======================= DÉCISIONS ======================= */
function due(d,st){
  if(st!=="a_decider")return '<span class="due">'+ic("calendar-clock")+"Échéance "+fr(d.ech)+"</span>";
  var n=K.days(T,d.ech);
  if(n<0)return '<span class="due late">'+ic("clock")+"En retard depuis le "+fr(d.ech)+"</span>";
  if(n===0)return '<span class="due late">'+ic("clock")+"Aujourd'hui</span>";
  return '<span class="due'+(n<=3?" soon":"")+'">'+ic("calendar-clock")+K.fjour(d.ech)+"</span>";}
function money(v){return v>=1e6?M(v)+" M":F(v)+" FCFA";}
function tyc(t){return {valider:"b",arbitrer:"v",relancer:"o",deleguer:"g"}[t];}
function decRow(d){var st=stat(d),late=st==="a_decider"&&d.ech<T;
  return '<button class="row" data-open="'+d.id+'"><span class="ty '+(late?"late":tyc(d.type))+'" title="'+TYPES[d.type].l+'">'+ic(TYPES[d.type].ico)+'</span><span style="min-width:0"><span class="tt">'+esc(d.titre)+'</span><span class="mm"><span class="pill n">'+TYPES[d.type].l+"</span>"+K.stag(d.soc)+due(d,st)+'</span></span><span class="rr">'+(d.montant?'<span class="amt">'+money(d.montant)+"</span>":"")+K.av(d.resp,"Décide : "+d.resp)+'<span class="rowact">Ouvrir'+ic("chevron-right")+"</span></span></button>";}
var DT="tous";
function renderDecisions(){
  var s=SF(),per=K.S.per,all=pending(),a=all.filter(function(d){return DT==="tous"||d.type===DT;}).sort(function(x,y){return x.ech<y.ech?-1:1;}),late=all.filter(function(d){return d.ech<T;}),dw=K.decWin(s);
  K.fbar($("f-decisions"),{extra:[{id:"dt",label:"Nature",ico:"list-filter",opts:[["tous","Toutes"]].concat(Object.keys(TYPES).map(function(t){return[t,TYPES[t].l+" ("+all.filter(function(d){return d.type===t;}).length+")"];})),val:DT,on:function(v){DT=v;renderDecisions();}}]});
  $("dec-lede").innerHTML="<b>"+pl(all.length,"décision attend","décisions attendent")+"</b> une réponse"+(s?" pour "+s:"")+(late.length?', dont <span class="r">'+late.length+" en retard</span>":"")+". "+pl(dw.v,"décision a été prise","décisions ont été prises")+" "+K.PLAB[per]+". Ouvrez une ligne pour voir ce qui est en jeu, qui décide, et enregistrer la décision.";
  var mt=sum(all.map(function(d){return d.montant||0;}));
  $("dec-kpis").innerHTML=
    K.kc({ico:"hourglass",l:"À décider",v:all.length,key:1,s:"<span><b>"+M(mt)+" M FCFA</b> en jeu</span>"})+
    K.kc({ico:"clock",l:"En retard",v:late.length,s:late.length?'<span class="pill r">'+ic("triangle-alert")+"à traiter d'abord</span>":'<span class="pill g">'+ic("shield-check")+"rien en retard</span>"})+
    K.kc({ico:"check-check",l:"Prises "+K.PLAB[per].replace(" (au 19)",""),v:dw.v,sp:'<canvas id="sp-dp"></canvas>',s:K.delta(K.pct(dw.v,dw.p),K.PPREV[per])})+
    K.kc({ico:"timer",l:"Délai moyen pour décider",v:K.N1(dw.dl),u:"jours",s:K.delta(K.pct(dw.dl,dw.pdl),K.PPREV[per],true)});
  var L=s?[s]:D.socs,bk=L.map(function(x){return buckets(per,function(a,b){return rng(H.jours_al,H.decisions_hist[x].prises,a,b);});});
  K.spark("sp-dp",bk.reduce(function(acc,b){return b.v.map(function(v,i){return v+(acc[i]||0);});},[]),{bar:1,col:col("--grn")});
  $("c-decw-u").textContent=GRAN[per]+", "+K.PLAB[per];
  K.mk("c-decw",{type:"bar",data:{labels:bk[0].lab,datasets:L.map(function(x,i){return{label:x,data:bk[i].v,backgroundColor:K.SC[x],borderRadius:3,stack:"a",maxBarThickness:28};})},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},scales:{x:K.xC({stacked:true}),y:K.yM({stacked:true,ticks:{padding:8,maxTicksLimit:5,precision:0}})}}});
  legend("lg-decw",L.map(function(x){return[x,K.SC[x]];}));
  var tk=Object.keys(TYPES),tv=tk.map(function(t){return all.filter(function(d){return d.type===t;}).length;});
  K.mk("c-dectype",{type:"doughnut",data:{labels:tk.map(function(t){return TYPES[t].l;}),datasets:[{data:tv,backgroundColor:tk.map(function(t){return TYPES[t].c+(DT!=="tous"&&DT!==t?"40":"");}),borderColor:col("--card"),borderWidth:3}]},
    options:{maintainAspectRatio:false,cutout:"68%",onClick:function(e,el){if(el.length){var t=tk[el[0].index];DT=DT===t?"tous":t;renderDecisions();}}},plugins:[K.center(String(all.length),"à décider")]});
  legend("lg-dectype",tk.map(function(t,i){return[TYPES[t].l+" <b>"+tv[i]+"</b>",TYPES[t].c];}));
  var nwk=K.add(monday(T),7);
  var gr=[["En retard","triangle-alert",function(d){return d.ech<T;},1],["Cette semaine","calendar-days",function(d){return d.ech>=T&&d.ech<nwk;}],["Plus tard","calendar-clock",function(d){return d.ech>=nwk;}]];
  $("d-afaire").innerHTML=a.length?gr.map(function(g){var it=a.filter(g[2]);if(!it.length)return"";return '<p class="lg-h'+(g[3]?" late":"")+'">'+ic(g[1])+g[0]+' <span class="c">'+it.length+"</span></p>"+it.map(decRow).join("");}).join(""):'<p class="empty">Aucune décision à prendre pour ce filtre. Les décisions prises sont dans le suivi.</p>';
  function item(d){var j=journal(d),last=j[j.length-1];var done=stat(d)==="fait";
    return '<button class="row" data-open="'+d.id+'"><span class="ty '+(done?"g":"b")+'">'+ic(done?"circle-check-big":TYPES[d.type].ico)+'</span><span style="min-width:0"><span class="tt">'+esc(d.titre)+'</span><span class="mm">'+K.stag(d.soc)+(last?"<span><b>"+last[0]+"</b>, "+esc(last[1])+"</span>":"")+'</span></span><span class="rr"><span class="pill '+(done?"g":"b")+'">'+ic(done?"check":"clock")+(done?"Fait":"En cours")+"</span></span></button>";}
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
  return '<p class="lbl">Décider</p>'+b.join("");}
var OPEN=null;
function openDec(id){var d=DEC[id];if(!d)return;OPEN=id;var st=stat(d),j=journal(d);
  $("dr-id").textContent="Décision "+d.id.replace("D","n° ");
  $("dr-b").innerHTML='<div class="tags"><span class="pill n">'+ic(TYPES[d.type].ico)+TYPES[d.type].l+"</span>"+(st==="a_decider"?(d.ech<T?'<span class="pill r">'+ic("clock")+"En retard</span>":'<span class="pill o">'+ic("hourglass")+"À décider</span>"):st==="fait"?'<span class="pill g">'+ic("check")+"Fait</span>":'<span class="pill b">'+ic("clock")+"En cours</span>")+"</div>"+
    "<h3>"+esc(d.titre)+'</h3><p class="why">'+esc(d.pourquoi)+"</p>"+
    '<dl class="props"><dt>Société</dt><dd>'+K.stag(d.soc)+"</dd><dt>Décide</dt><dd>"+K.av(d.resp)+esc(d.resp)+"</dd>"+(d.delegue?"<dt>Peut confier à</dt><dd>"+K.av(d.delegue)+esc(d.delegue)+"</dd>":"")+(d.montant?"<dt>En jeu</dt><dd>"+(d.montant>=1e6?M(d.montant)+" M FCFA":F(d.montant)+" FCFA")+"</dd>":"")+"<dt>Échéance</dt><dd>"+due(d,st)+"</dd></dl>"+
    '<div class="acts">'+btns(d)+"</div>"+
    (j.length?'<div class="tl"><h4>Historique</h4>'+j.map(function(x,i){return '<p class="e'+(i===j.length-1&&ST[d.id]?" new":"")+'"><b>'+x[0]+"</b>"+esc(x[1])+"</p>";}).join("")+"</div>":"");
  K.hydrate($("dr-b"));
  $("drawer").classList.add("on");$("scrim").classList.add("on");$("drawer").setAttribute("aria-hidden","false");}
function closeDec(){OPEN=null;$("drawer").classList.remove("on");$("scrim").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");}
$("dr-x").onclick=closeDec;$("scrim").onclick=closeDec;
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeDec();});
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
  else if(a==="rep"){var is=K.add(d.ech>T?d.ech:T,7);ST[d.id]={statut:"a_decider",journal:[[fr(T),"Reporté au "+fr(is)]]};d.ech=is;save();renderAll();openDec(d.id);K.toast("Reporté au "+fr(is));}
  else if(a==="fait")act(d.id,"fait","Marqué comme fait");
  else if(a==="undo")undo(d.id);
});

/* ======================= ÉCHÉANCIER ======================= */
var EF="tous";
function evStatus(e){
  if(e.kind==="decision"){var d=DEC[e.ref],s=stat(d);
    if(s==="fait")return["done","circle-check-big","Fait"];
    if(s==="en_cours")return["prog","clock","En cours"];
    return d.ech<T?["late","clock","En retard"]:["todo","hourglass","À décider"];}
  return e.date<T?["late","clock","En retard"]:["plan","calendar-clock","Prévu"];}
function evDate(e){return e.kind==="decision"?DEC[e.ref].ech:e.date;}
function monday(s){var d=K.dd(s),k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);return K.iso(d);}
function horizon(per){return per==="mois"?"2026-11-30":K.add(T,{"7":7,"30":30,"tri":92,"an":365}[per]);}
var HLAB={"7":"sur les 7 prochains jours","30":"sur les 30 prochains jours","mois":"d'ici la fin de novembre","tri":"sur les 3 prochains mois","an":"sur les 12 prochains mois"};
function events(all){var h=horizon(K.S.per);return D.echeancier.map(function(e){return Object.assign({},e,{date:evDate(e)});}).filter(function(e){return inSF(e.soc)&&(all||e.date<=h||evStatus(e)[0]==="late");}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});}
function renderEch(){
  var per=K.S.per,s=SF(),evA=events(),ev=evA.filter(function(e){return EF==="tous"||e.kind===EF;}),late=ev.filter(function(e){return evStatus(e)[0]==="late";});
  var wk=monday(T),nwk=K.add(wk,7),nnwk=K.add(wk,14);
  var thisw=ev.filter(function(e){return e.date>=T&&e.date<nwk&&evStatus(e)[0]!=="done";});
  K.fbar($("f-echeancier"),{extra:[{id:"ef",label:"Nature",ico:"list-filter",opts:[["tous","Tout"]].concat(Object.keys(KINDS).map(function(k){return[k,KINDS[k].l+" ("+evA.filter(function(e){return e.kind===k;}).length+")"];})),val:EF,on:function(v){EF=v;renderEch();}}],note:"La période règle l'horizon regardé."});
  $("ech-lede").innerHTML="Décisions, appels d'offres, arrivées de marchandise, restitutions d'atelier et paies"+(s?" de "+s:"")+", "+HLAB[per]+". "+(late.length?'<span class="r">'+pl(late.length,"échéance est dépassée","échéances sont dépassées")+"</span>":"<b>Aucune échéance dépassée</b>")+", "+pl(thisw.length,"tombe","tombent")+" d'ici dimanche.";
  var dec=ev.filter(function(e){return e.kind==="decision"&&evStatus(e)[0]!=="done";}).length,nx=ev.filter(function(e){return e.date>=T&&evStatus(e)[0]!=="done";})[0];
  $("ech-kpis").innerHTML=
    K.kc({ico:"calendar-days",l:"Échéances "+HLAB[per].replace("sur les ","").replace("d'ici ","d'ici "),v:ev.length,key:1,s:"<span>"+pl(ev.filter(function(e){return evStatus(e)[0]==="done";}).length,"déjà faite","déjà faites")+"</span>"})+
    K.kc({ico:"clock",l:"En retard",v:late.length,s:late.length?'<span class="pill r">'+ic("triangle-alert")+"la plus ancienne le "+fr(late[0].date)+"</span>":'<span class="pill g">'+ic("shield-check")+"rien en retard</span>"})+
    K.kc({ico:"calendar-check",l:"D'ici dimanche",v:thisw.length,s:nx?"<span>prochaine : <b>"+K.fjour(nx.date)+"</b></span>":"<span>rien de prévu</span>"})+
    K.kc({ico:"gavel",l:"Dont décisions",v:dec,s:"<span>les autres sont des jalons à surveiller</span>"});
  var cols=[],w0=K.add(wk,-21);
  for(var i=0;i<8;i++){var a=K.add(w0,i*7);cols.push({a:a,l:fr(a),now:a===wk});}
  cols.push({a:K.add(w0,56),l:"ensuite"});
  $("wk-u").textContent=pl(ev.length,"échéance","échéances")+" "+HLAB[per];
  var DOTC={late:col("--red"),todo:col("--acc"),prog:col("--sky"),done:col("--grn"),plan:col("--mut2")};
  $("frise").innerHTML=cols.map(function(c,i){
    var nx2=i<8?cols[i+1].a:"9999",it=ev.filter(function(e){return (i===0?true:e.date>=c.a)&&e.date<nx2;});
    return '<div class="wc'+(c.now?" now":"")+'"><span class="n'+(it.length?"":" z")+'">'+(it.length||"0")+'</span><div class="dots">'+it.map(function(e){var st=evStatus(e);return '<i style="background:'+DOTC[st[0]]+'" title="'+esc(e.titre)+'"></i>';}).join("")+'</div><span class="w">'+(c.now?"cette sem.":(i===8?"plus tard":(i===0?"avant le "+fr(cols[1].a):"sem. "+c.l)))+"</span></div>";}).join("");
  $("wleg").innerHTML=[["En retard","late"],["À décider","todo"],["En cours","prog"],["Fait","done"],["Prévu","plan"]].map(function(x){return '<span><i style="background:'+DOTC[x[1]]+'"></i>'+x[0]+"</span>";}).join("");
  var wl=[],wa=[];for(var k=0;k<9;k++){wa.push(K.add(wk,7*k));wl.push(k?"sem. "+fr(K.add(wk,7*k)):"cette sem.");}
  var kk=Object.keys(KINDS).filter(function(k){return EF==="tous"||k===EF;});
  K.mk("c-ech",{type:"bar",data:{labels:wl,datasets:kk.map(function(k){return{label:KINDS[k].l,data:wa.map(function(a){var b=K.add(a,6);return events(true).filter(function(e){return e.kind===k&&e.date>=a&&e.date<=b;}).length;}),backgroundColor:KINDS[k].c,borderRadius:3,stack:"a",maxBarThickness:34};})},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},scales:{x:K.xC({stacked:true}),y:K.yM({stacked:true,ticks:{padding:8,maxTicksLimit:4,precision:0}})}}});
  legend("lg-ech",kk.map(function(k){return[KINDS[k].l,KINDS[k].c];}));
  var groups=[["late","En retard",function(e){return evStatus(e)[0]==="late";}],["w","Cette semaine",function(e){return evStatus(e)[0]!=="late"&&e.date<nwk;}],["n","Semaine prochaine",function(e){return evStatus(e)[0]!=="late"&&e.date>=nwk&&e.date<nnwk;}],["p","Plus tard",function(e){return evStatus(e)[0]!=="late"&&e.date>=nnwk;}]];
  $("ech").innerHTML=groups.map(function(g){
    var it=ev.filter(g[2]);if(!it.length)return "";
    return '<p class="lg-h'+(g[0]==="late"?" late":"")+'">'+ic(g[0]==="late"?"triangle-alert":"calendar-days")+g[1]+' <span class="c">'+it.length+"</span></p>"+it.map(function(e){
      var st=evStatus(e),k=KINDS[e.kind],retard=st[0]==="late"?" ("+pl(K.days(e.date,T),"jour")+")":"",isd=e.kind==="decision";
      return '<div class="erow"'+(isd?' data-open="'+e.ref+'" style="cursor:pointer"':"")+'><div class="d">'+K.fjour(e.date)+(e.heure?"<small>"+e.heure+"</small>":"")+'</div><span class="ty ei '+(st[0]==="late"?"late":"")+'" style="'+(st[0]==="late"?"":"background:"+k.c+"1A;color:"+k.c)+'">'+ic(k.ico)+'</span><div style="min-width:0"><p class="tt">'+esc(e.titre)+'</p><p class="mm"><span>'+k.u+"</span>"+socsOf(e.soc).map(K.stag).join("")+(isd&&st[0]!=="done"&&st[0]!=="prog"?'<span class="lnk">Décider'+ic("chevron-right")+"</span>":"")+'</p></div><span class="stw"><span class="pill '+{late:"r",todo:"o",prog:"b",done:"g",plan:"n"}[st[0]]+'">'+ic(st[1])+st[2]+retard+"</span></span></div>";
    }).join("");}).join("")||'<p class="empty">Aucune échéance pour ce filtre.</p>';
}

/* ======================= TRÉSORERIE ======================= */
var FX="tous";
var FLUX={clients:["Encaissements clients","#10B981",1],fournisseurs:["Fournisseurs","#E95B0F",-1],salaires:["Salaires","#8B5CF6",-1],autres:["Impôts et autres","#F59E0B",-1]};
function renderTreso(){
  var s=SF(),per=K.S.per,C=cur(),G=D.groupe,TG=C.tr,enc=sum(TG.enc),dec=sum(TG.dec),sous=D.socs.filter(function(x){return SOC[x].sous>0;});
  K.fbar($("f-tresorerie"),{extra:[{id:"fx",label:"Flux",ico:"banknote",opts:[["tous","Tous les flux"]].concat(Object.keys(FLUX).map(function(k){return[k,FLUX[k][0]];})),val:FX,on:function(v){FX=v;renderTreso();}}],note:"La période règle l'historique ; la prévision couvre 13 semaines."});
  $("tr-h1").textContent=s?"Trésorerie de "+s+" sur 13 semaines":"Trésorerie du groupe sur 13 semaines";
  if(!s)$("tr-lede").innerHTML="Le groupe reste au-dessus de son seuil de "+M(G.seuil,0)+" M FCFA sur les 13 semaines, avec un point bas de <b>"+M(G.point_bas)+" M</b> la semaine du "+fr(G.point_bas_sem)+". Deux sociétés passent pourtant sous le leur : <b class=\"r\">SAFIR dès la semaine du "+fr(SOC.SAFIR.sous_des)+"</b> et <b class=\"r\">DEFI la semaine du "+fr(SOC.DEFI.sous_des)+"</b>. Les deux arbitrages attendent dans les décisions.";
  else $("tr-lede").innerHTML=s+" part de <b>"+M(C.treso)+" M FCFA</b> et atteint son point bas de <b>"+M(C.point_bas)+" M</b> la semaine du "+fr(C.point_bas_sem)+". "+(C.sous>0?'<span class="r">Elle passe sous son seuil de '+M(C.seuil,0)+" M dès la semaine du "+fr(C.sous_des)+", "+pl(C.sous,"semaine")+" sur 13.</span>":"Elle reste au-dessus de son seuil de "+M(C.seuil,0)+" M sur les 13 semaines.");
  var hk=s||"Groupe",hist=H.tr_hist[hk],hs=hist.slice(K.wStart());
  $("tr-kpis").innerHTML=
    K.kc({ico:"wallet",l:"Solde aujourd'hui",v:M(C.treso),u:"M FCFA",key:1,sp:'<canvas id="sp-tr"></canvas>',s:K.delta(K.pct(C.treso,hs[0]),"vs début de période")})+
    K.kc({ico:"trending-down",l:"Point bas sur 13 semaines",v:M(C.point_bas),u:"M FCFA",sp:'<canvas id="sp-pb"></canvas>',s:K.delta((C.point_bas/C.treso-1)*100,"semaine du "+fr(C.point_bas_sem))})+
    K.kc({ico:"arrow-up-down",l:"Entrées et sorties prévues",v:M(enc,0)+" / "+M(dec,0),u:"M FCFA",s:"<span>encaissements puis décaissements, 13 semaines</span>"})+
    (s?K.kc({ico:"triangle-alert",l:"Semaines sous le seuil",v:C.sous,u:"sur 13",s:C.sous?'<span class="pill r">'+ic("trending-down")+"dès le "+fr(C.sous_des)+"</span>":'<span class="pill g">'+ic("shield-check")+"jamais sous le seuil</span>"})
      :K.kc({ico:"triangle-alert",l:"Sociétés sous leur seuil",v:sous.length,u:"sur 5",s:sous.map(function(x){return '<span class="pill r">'+x+" dès le "+fr(SOC[x].sous_des)+"</span>";}).join("")}));
  K.spark("sp-tr",hs,{col:col("--sky"),seuil:C.seuil,min:0});K.spark("sp-pb",[C.treso].concat(TG.fin),{col:col("--sky"),seuil:C.seuil,min:0});
  $("c-tr-t").textContent="Solde prévu en fin de semaine"+(s?", "+s:", groupe");
  var data=[C.treso].concat(TG.fin),lab=["auj."].concat(D.semaines.map(function(x){return fr(K.add(x,7));})),mn=Math.min.apply(null,TG.fin),ix=TG.fin.lastIndexOf(mn)+1;
  K.mk("c-tr",{type:"line",data:{labels:lab,datasets:[
    {label:"Solde prévu",data:data,borderColor:col("--sky"),backgroundColor:function(c){return K.grad(c,col("--sky"),"30","02");},fill:true,tension:.3,pointRadius:0,pointHoverRadius:4,borderWidth:2.2,segment:{borderColor:function(c){return c.p1.parsed.y<C.seuil?col("--red"):col("--sky");}}},
    {label:"Seuil",data:data.map(function(){return C.seuil;}),borderColor:col("--red"),borderDash:[5,5],pointRadius:0,borderWidth:1.4,fill:false}]},
    options:{maintainAspectRatio:false,layout:{padding:{top:22}},interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{title:function(c){return c[0].dataIndex?"Fin de semaine, "+c[0].label:"Aujourd'hui";},label:function(c){return " "+c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:K.xC(),y:K.yM({min:0})}},
    plugins:[{id:"pb",afterDatasetsDraw:function(c){var me=c.getDatasetMeta(0),pb=me.data[ix];if(!pb)return;var x=c.ctx,t="point bas "+M(mn)+" M";x.save();x.fillStyle=C.sous?col("--red"):col("--acc");x.beginPath();x.arc(pb.x,pb.y,4.5,0,7);x.fill();
      x.font='600 12px "Inter",sans-serif';var w=x.measureText(t).width+14,bx=Math.min(Math.max(pb.x-w/2,c.chartArea.left),c.chartArea.right-w),by=Math.max(c.chartArea.top-18,pb.y-34);
      x.fillStyle=col("--card");x.strokeStyle=C.sous?col("--red"):col("--acc");x.beginPath();if(x.roundRect)x.roundRect(bx,by,w,22,6);else x.rect(bx,by,w,22);x.fill();x.stroke();x.fillStyle=C.sous?col("--red"):col("--acct");x.textAlign="center";x.textBaseline="middle";x.fillText(t,bx+w/2,by+11.5);x.restore();}}]});
  var fl=H.flux[hk],ks=Object.keys(FLUX).filter(function(k){return FX==="tous"||k===FX;});
  K.mk("c-flux",{type:"bar",data:{labels:D.semaines.map(function(x){return fr(K.add(x,7));}),datasets:ks.map(function(k){return{label:FLUX[k][0],data:fl[k].map(function(v){return FLUX[k][2]*Math.abs(v);}),backgroundColor:FLUX[k][1],borderRadius:3,stack:FLUX[k][2]>0?"e":"d",maxBarThickness:22};})},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{title:function(c){return "Semaine finissant le "+c[0].label;},label:function(c){return " "+c.dataset.label+" : "+M(Math.abs(c.raw))+" M";}}}},scales:{x:K.xC({stacked:true}),y:K.yM({stacked:true,ticks:{padding:8,maxTicksLimit:5,callback:function(v){return M(Math.abs(v),0);}}})}}});
  legend("lg-flux",ks.map(function(k){return[FLUX[k][0]+(FLUX[k][2]>0?" (entrées)":""),FLUX[k][1]];}));
  var hl=[];for(var i=0;i<hist.length;i++)hl.push(fr(K.add(T,-7*(hist.length-1-i))));
  $("c-hist-t").textContent="Solde constaté "+K.PLAB[per].replace(" (au 19)","")+(s?", "+s:", groupe");
  K.mk("c-hist",{type:"line",data:{labels:hl.slice(K.wStart()),datasets:[{label:"Solde",data:hs,borderColor:col("--vio"),backgroundColor:function(c){return K.grad(c,col("--vio"),"30","02");},fill:true,tension:.3,borderWidth:2,pointRadius:hs.length<6?3:0,pointHoverRadius:4},{label:"Seuil",data:hs.map(function(){return C.seuil;}),borderColor:col("--red"),borderDash:[5,5],borderWidth:1.2,pointRadius:0}]},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{label:function(c){return " "+c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:K.xC(),y:K.yM({min:0})}}});
  var mx=Math.max.apply(null,hs),mi=Math.min.apply(null,hs);
  $("hist-n").innerHTML="Sur la période, le solde a varié entre <b>"+M(mi)+" M</b> et <b>"+M(mx)+" M</b>. Le trait rouge rappelle le seuil d'alerte.";
  $("multi").innerHTML=D.socs.map(function(x){var m=SOC[x];return '<div class="mc'+(s===x?" on":(s?" dim":""))+'" data-msoc="'+x+'"><p class="h">'+K.tile(x)+x+'</p><p class="v">'+M(m.treso)+'<small>M FCFA</small></p><p class="s'+(m.sous?" bad":"")+'">'+(m.sous?pl(m.sous,"semaine")+" sous le seuil":(m.point_bas>=m.treso?"au plus bas aujourd'hui":"point bas "+M(m.point_bas)+" M"))+'</p><div class="cv"><canvas id="mc-'+x+'"></canvas></div></div>';}).join("");
  [].forEach.call(document.querySelectorAll("[data-msoc]"),function(el){el.onclick=function(){K.setSoc(SF()===el.dataset.msoc?null:el.dataset.msoc);};});
  D.socs.forEach(function(x){var m=SOC[x];K.spark("mc-"+x,[m.treso].concat(D.treso[x].fin),{col:m.sous?col("--red"):K.SC[x],seuil:m.seuil,min:0});});
  var a=C.aged,tot=sum(a),lb=["Pas encore dû","1 à 30 jours","31 à 60 jours","61 à 90 jours","Plus de 90 jours"],ac=["#CBD5E1","#94A3B8","#64748B","#F59E0B","#EF4444"];
  $("aged-t").textContent="Ce que les clients doivent"+(s?" à "+s:" au groupe");
  $("aged").innerHTML='<p class="ag-tot">'+M(tot)+' <small>M FCFA</small></p><div class="ag-bar">'+a.map(function(v,i){return v?'<div style="width:'+(v/tot*100)+"%;background:"+ac[i]+'" title="'+lb[i]+" : "+M(v)+' M"></div>':"";}).join("")+'</div><div class="ag-l">'+a.map(function(v,i){return '<div class="'+(i>=3&&v?"bad":"")+'"><span><i style="background:'+ac[i]+'"></i>'+lb[i]+"</span><b>"+M(v)+"<small>M, "+(tot?Math.round(v/tot*100):0)+" %</small></b></div>";}).join("")+"</div>";
  K.mk("c-aged",{type:"bar",data:{labels:D.socs,datasets:lb.map(function(l,i){return{label:l,data:D.socs.map(function(x){return SOC[x].aged[i];}),backgroundColor:D.socs.map(function(x){return ac[i]+(s&&s!==x?"55":"");}),stack:"a",barThickness:18};})},
    options:{indexAxis:"y",maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:{callbacks:{label:function(c){return " "+c.dataset.label+" : "+M(c.raw)+" M";}}}},scales:{x:K.yM({stacked:true,grid:K.grid()}),y:{stacked:true,grid:{display:false},border:{display:false},ticks:{font:{size:12.5,weight:"500"},color:col("--ink2")}}}}});
}

/* ======================= ALERTES ======================= */
var AF={cat:null,niv:null};
function renderAlertes(){
  var s=SF(),per=K.S.per,A=D.alertes.filter(function(a){return inSF(a.soc);}),h=A.filter(function(a){return a.niv==="haute";}).length,cnt={},aw=K.alertWin(s);
  A.forEach(function(a){cnt[a.cat]=(cnt[a.cat]||0)+1;});
  var top=Object.keys(cnt).sort(function(x,y){return cnt[y]-cnt[x];})[0],cats=Object.keys(CATS);
  K.fbar($("f-alertes"),{extra:[
    {id:"niv",type:"seg",label:"Gravité",ico:"siren",opts:[["","Toutes"],["haute","Fortes"],["moyenne","À surveiller"]],val:AF.niv||"",on:function(v){AF.niv=v||null;renderAlertes();}},
    {id:"cat",label:"Sujet",ico:"layers",opts:[["","Tous les sujets"]].concat(cats.map(function(c){return[c,CATS[c].l];})),val:AF.cat||"",on:function(v){AF.cat=v||null;renderAlertes();}}]});
  $("al-lede").innerHTML="<b>"+pl(A.length,"alerte ouverte","alertes ouvertes")+"</b>"+(s?" pour "+s:"")+", dont <span class=\"r\">"+pl(h,"forte","fortes")+"</span>."+(top?" Le sujet le plus chargé : "+CATS[top].l.toLowerCase()+" ("+cnt[top]+").":"")+" "+pl(aw.nv,"nouvelle","nouvelles")+" et "+pl(aw.res,"résolue","résolues")+" "+K.PLAB[per]+". Cliquez une case de la carte pour ne garder que ses alertes.";
  $("al-kpis").innerHTML=
    K.kc({ico:"bell",l:"Alertes ouvertes",v:A.length,key:1,s:"<span>sur "+pl(Object.keys(cnt).length,"sujet")+"</span>"})+
    K.kc({ico:"siren",l:"Alertes fortes",v:h,s:h?'<span class="pill r">'+ic("triangle-alert")+"à traiter cette semaine</span>":'<span class="pill g">'+ic("shield-check")+"aucune</span>"})+
    K.kc({ico:"circle-alert",l:"Nouvelles "+K.PLAB[per].replace(" (au 19)",""),v:aw.nv,sp:'<canvas id="sp-an"></canvas>',s:K.delta(K.pct(aw.nv,aw.pnv),K.PPREV[per],true)})+
    K.kc({ico:"circle-check",l:"Résolues "+K.PLAB[per].replace(" (au 19)",""),v:aw.res,sp:'<canvas id="sp-ar"></canvas>',s:K.delta(K.pct(aw.res,aw.pres),K.PPREV[per])});
  var L=s?[s]:D.socs,f=function(k){return function(a,b){return sum(L.map(function(x){return rng(H.jours_al,H.alertes_hist[x][k],a,b);}));};},bn=buckets(per,f("new")),br=buckets(per,f("res"));
  K.spark("sp-an",bn.v,{bar:1,col:col("--red")});K.spark("sp-ar",br.v,{bar:1,col:col("--grn")});
  $("c-alw-u").textContent=GRAN[per]+", "+K.PLAB[per];
  K.mk("c-alw",{type:"bar",data:{labels:bn.lab,datasets:[{label:"Nouvelles",data:bn.v,backgroundColor:col("--red"),borderRadius:3,maxBarThickness:16},{label:"Résolues",data:br.v,backgroundColor:col("--grn"),borderRadius:3,maxBarThickness:16}]},
    options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},scales:{x:K.xC(),y:K.yM({ticks:{padding:8,maxTicksLimit:5,precision:0}})}}});
  var cv=cats.map(function(c){return A.filter(function(a){return a.cat===c&&(!AF.niv||a.niv===AF.niv);}).length;});
  K.mk("c-alcat",{type:"doughnut",data:{labels:cats.map(function(c){return CATS[c].l;}),datasets:[{data:cv,backgroundColor:cats.map(function(c){return CATS[c].c+(AF.cat&&AF.cat!==c?"40":"");}),borderColor:col("--card"),borderWidth:3}]},
    options:{maintainAspectRatio:false,cutout:"66%",onClick:function(e,el){if(el.length){var c=cats[el[0].index];AF.cat=AF.cat===c?null:c;renderAlertes();}}},plugins:[K.center(String(sum(cv)),"ouvertes")]});
  legend("lg-alcat",cats.map(function(c,i){return[CATS[c].l+" <b>"+cv[i]+"</b>",CATS[c].c];}));
  $("mx").innerHTML="<thead><tr><th></th>"+cats.map(function(c){return "<th>"+ic(CATS[c].ico)+CATS[c].l+"</th>";}).join("")+"</tr></thead><tbody>"+D.socs.map(function(x){
    return '<tr class="'+(s&&s!==x?"dim":"")+'"><td class="rh"><span>'+K.tile(x)+x+"</span></td>"+cats.map(function(c){
      var it=D.alertes.filter(function(a){return a.cat===c&&socsOf(a.soc).indexOf(x)>=0;}),n=it.length,hh=it.filter(function(a){return a.niv==="haute";}).length;
      var cl=n===0?"z":(hh>=2||n>=3?"l3":hh?"l2":"l1");
      return '<td class="'+cl+(s===x&&AF.cat===c?" on":"")+'" data-ms="'+x+'" data-mc="'+c+'" title="'+x+", "+CATS[c].l+" : "+n+'">'+n+"</td>";}).join("")+"</tr>";}).join("")+"</tbody>";
  [].forEach.call(document.querySelectorAll("[data-ms]"),function(td){if(td.classList.contains("z"))return;td.onclick=function(){if(SF()===td.dataset.ms&&AF.cat===td.dataset.mc){AF.cat=null;}else{K.S.soc=td.dataset.ms;AF.cat=td.dataset.mc;}renderAll();};});
  var fl=A.filter(function(a){return (!AF.cat||a.cat===AF.cat)&&(!AF.niv||a.niv===AF.niv);}).sort(function(x,y){return (x.niv===y.niv?0:x.niv==="haute"?-1:1);});
  $("al-list").innerHTML=fl.map(function(a){
    var d=a.dec&&DEC[a.dec],ds=d&&stat(d),c=CATS[a.cat];
    var link=d?(ds==="a_decider"?'<button class="lnk" data-open="'+a.dec+'">Décision à prendre'+ic("chevron-right")+"</button>":'<span class="pill '+(ds==="fait"?"g":"b")+'">'+ic(ds==="fait"?"circle-check-big":"clock")+(ds==="fait"?"Décision prise":"Décision en cours")+"</span>"):"";
    return '<div class="al '+a.niv+'"><span class="ty" style="background:'+(a.niv==="haute"?"var(--redb);color:var(--red)":c.c+"1A;color:"+c.c)+'">'+ic(c.ico)+'</span><div style="min-width:0"><p class="at">'+esc(a.titre)+'</p><p class="ad">'+esc(a.detail)+'</p><p class="am"><span class="pill '+(a.niv==="haute"?"r":"a")+'"><span class="pd"></span>'+(a.niv==="haute"?"Forte":"À surveiller")+'</span><span class="pill n">'+c.l+"</span>"+socsOf(a.soc).map(K.stag).join("")+'</p></div><div class="lnkw">'+link+"</div></div>";
  }).join("")||'<p class="empty">Aucune alerte pour ce filtre.</p>';
}

/* ======================= NAVIGATION ======================= */
function renderSide(){
  $("side-socs").innerHTML=D.socs.map(function(x){var e=etat(x);return '<button class="ni'+(SF()===x?" on":"")+'" data-side="'+x+'">'+K.dot(x)+x+'<span class="sd '+e[0]+'" title="'+e[1]+'"></span></button>';}).join("");
  [].forEach.call(document.querySelectorAll("[data-side]"),function(b){b.onclick=function(){K.setSoc(SF()===b.dataset.side?null:b.dataset.side);};});}
var CUR="ensemble";
function show(v){
  CUR=v;[].forEach.call(document.querySelectorAll(".ni[data-v],.tabbar button"),function(b){b.classList.toggle("on",b.dataset.v===v);});
  [].forEach.call(document.querySelectorAll(".view"),function(s){s.classList.toggle("on",s.id==="v-"+v);});
  $("crumb-v").textContent=VNAME[v];
  if(history.replaceState)history.replaceState(null,"","#"+v);
  render(v);window.scrollTo({top:0});}
function render(v){({ensemble:renderEnsemble,decisions:renderDecisions,echeancier:renderEch,tresorerie:renderTreso,alertes:renderAlertes})[v]();}
function badges(){var p=pending().length,ev=events(true).filter(function(e){return evStatus(e)[0]==="late";}).length,al=D.alertes.filter(function(a){return inSF(a.soc)&&a.niv==="haute";}).length;
  $("k-dec").textContent=p||"";$("k-ech").textContent=ev||"";$("k-al").textContent=al||"";$("m-dec").textContent=p||"";$("m-ech").textContent=ev||"";$("m-al").textContent=al||"";}
function renderAll(){renderSide();badges();render(CUR);}
K.rerender=renderAll;
[].forEach.call(document.querySelectorAll(".ni[data-v],.tabbar button"),function(b){b.onclick=function(){show(b.dataset.v);};});
$("reset").onclick=function(){ST={};save();D.decisions.forEach(function(d){d.ech=d._ech;});renderAll();K.toast("Suivi remis à zéro");};

load();
Object.keys(ST).forEach(function(id){var s=ST[id];if(DEC[id]&&s.journal)s.journal.forEach(function(j){var m=/^Reporté au (\d\d)\/(\d\d)$/.exec(j[1]);if(m)DEC[id].ech=(+m[2]<6?"2027":"2026")+"-"+m[2]+"-"+m[1];});});
K.hydrate();
K.initTheme();
$("date").textContent=K.flong(T)+" 2026";
var h0=(location.hash||"").slice(1);
renderSide();badges();
show(["ensemble","decisions","echeancier","tresorerie","alertes"].indexOf(h0)>=0?h0:"ensemble");
window.__sacri={setSoc:K.setSoc,openDec:openDec,closeDec:closeDec,show:show,K:K};
})();
