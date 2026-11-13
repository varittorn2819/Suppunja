(function(){
var d=document,ga=d.body.dataset.ga,b=d.getElementById('ck'),c=null;
d.getElementById('y').textContent=new Date().getFullYear()+(d.documentElement.lang==='th'?543:0);
function loadGA(){if(!ga||/XXXX/.test(ga))return;var s=d.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+ga;d.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',ga);}
try{c=localStorage.getItem('ck')}catch(e){}
if(c==='y')loadGA();else if(!c)b.style.display='flex';
function set(v){try{localStorage.setItem('ck',v)}catch(e){}b.style.display='none';if(v==='y')loadGA();}
d.getElementById('ckOk').onclick=function(){set('y')};d.getElementById('ckNo').onclick=function(){set('n')};
})();
