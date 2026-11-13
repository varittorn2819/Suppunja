const fs=require('fs'),path=require('path'),matter=require('gray-matter'),{marked}=require('marked');
const R=p=>fs.readFileSync(p,'utf8'),W=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
const cfg=JSON.parse(R('src/config.json')),SITE=(process.env.URL||cfg.siteUrl).replace(/\/$/,''),OUT='dist',LANGS=['th','en','zh'];
const PH=/xxx|YOUR|yourdomain/i,hl=v=>PH.test(v)?`<mark>${v}</mark>`:v;
Object.entries(cfg).forEach(([k,v])=>PH.test(v)&&console.warn('⚠ placeholder in config.json:',k,'=',v));
const cfgV={...cfg,license:hl(cfg.license),phone:hl(cfg.phone),email:hl(cfg.email)};
const meta=JSON.parse(R('src/i18n/meta.json')),mark=s=>s.replace(/\[\[(.*?)\]\]/g,'<mark>$1</mark>');
const T={};LANGS.forEach(l=>{const t={...meta[l],...JSON.parse(mark(R(`src/i18n/${l}.json`)))},priv=t.prefix+'/privacy-policy.html',sp=l==='zh'?'':' ',lk=x=>`<a href="${priv}" style="text-decoration:underline">${x}</a>`;
  t.contact.consent+=sp+lk(t.contact.consent_link);t.cookie.text+=sp+lk(t.cookie.link);['p1','p2','p3'].forEach(k=>t.about[k]=marked.parseInline(t.about[k]));T[l]=t});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get=(o,k)=>k.split('.').reduce((a,x)=>a&&a[x],o);
const render=(tpl,ctx)=>tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g,(m,k)=>{const v=get(ctx,k);if(v==null)console.warn('⚠ missing key:',k);return v??''});
const card=i=>`<div class="card"><div class="ic">${i.ic}</div><h3>${i.title}</h3><p>${i.text}</p></div>`;
const grid=(id,d,alt)=>`<section id="${id}"${alt?' class="alt-bg"':''}><div class="wrap"><div class="eyebrow">${d.eyebrow}</div><h2>${d.title}</h2>${d.lead?`<p class="lead">${d.lead}</p>`:''}<div class="grid">${d.items.map(card).join('')}</div></div></section>`;
const loadMd=dir=>fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith('.md')).map(f=>{const {data,content}=matter(R(path.join(dir,f)));return {...data,slug:f.slice(0,-3),html:marked(mark(content))}}).filter(p=>p.title&&p.html.trim()):[];
const layout=R('src/templates/layout.html'),home=R('src/templates/home.html');
fs.rmSync(OUT,{recursive:true,force:true});
fs.cpSync('src/assets',OUT+'/assets',{recursive:true});fs.existsSync('static')&&fs.cpSync('static',OUT,{recursive:true});

const reg={},add=(k,l,o)=>((reg[k]??={})[l]=o);
for(const l of LANGS){const t=T[l],h=t.prefix+'/';
  const fmt=d=>new Date(d).toLocaleDateString(t.dateLocale,{year:'numeric',month:'long',day:'numeric'});
  const posts=loadMd(`src/content/posts/${l}`).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const catOf=p=>t.cat[p.category]||p.category||'';
  const html={aboutVis:`${t.about.image?`<img src="${esc(t.about.image)}" alt="${esc(t.short)}" style="width:100%;border-radius:16px">`:`<div class="ph">${t.about.ph}</div>`}`,techVis:`${t.tech.image?`<img src="${esc(t.tech.image)}" alt="${esc(t.short)}" style="width:100%;border-radius:16px">`:`<div class="ph">${t.tech.ph}</div>`}`,news:posts.length?`<section id="news"><div class="wrap"><div class="eyebrow">${t.news.eyebrow}</div><h2>${t.news.title}</h2><div class="grid">${posts.slice(0,3).map(p=>`<div class="card"><span class="m">${esc(catOf(p))} · ${fmt(p.date)}</span><h3><a href="${h}blog/${p.slug}.html">${esc(p.title)}</a></h3><p>${esc(p.description)}</p></div>`).join('')}</div><p style="margin-top:18px"><a href="${h}blog/" style="color:var(--blue);font-weight:700">${t.news.more} →</a></p></div></section>`:'',stats:t.stats.map(s=>`<div><strong>${s.n}</strong>${s.l}</div>`).join(''),timeline:t.history.items.map(i=>`<div><div class="y">${i.y}</div>${i.text}</div>`).join(''),
    services:grid('services',t.services),why:grid('why',t.why,1),benefits:grid('benefits',t.benefits),offices:grid('offices',t.offices)};
  add('home',l,{path:'/',title:t.meta.title,desc:t.meta.desc,type:'website',html:render(home,{t,cfg:cfgV,html,home:h,lang:l})});
  add('blog',l,{path:'/blog/',title:t.blog.title+' | '+t.short,desc:t.blog.desc,type:'website',
    html:`<div class="prose list"><h1>${t.blog.title}</h1>${posts.length?posts.map(p=>`<div class="card"><span class="m">${esc(catOf(p))} · ${fmt(p.date)}</span><br><a href="${h}blog/${p.slug}.html">${esc(p.title)}</a><div>${esc(p.description)}</div></div>`).join(''):`<p>${t.blog.empty}</p>`}</div>`});
  posts.forEach(p=>add('post:'+p.slug,l,{path:`/blog/${p.slug}.html`,title:p.title+' | '+t.short,desc:p.description||'',type:'article',img:p.image,
    html:`<article class="prose"><p class="m">${esc(catOf(p))} · ${fmt(p.date)}</p><h1>${esc(p.title)}</h1>${p.image?`<img src="${esc(p.image)}" alt="">`:''}${p.html}</article>`}));
  loadMd(`src/content/pages/${l}`).forEach(p=>add('page:'+p.slug,l,{path:`/${p.slug}.html`,title:p.title+' | '+t.short,desc:p.description||'',type:'website',html:`<article class="prose">${p.html}</article>`}));
}
const urlFor=(l,p)=>SITE+T[l].prefix+p;let sm='';
for(const [key,v] of Object.entries(reg)){
  const ls=Object.keys(v),xd=ls.includes('th')?'th':ls[0];
  const alt=ls.map(l=>`<link rel="alternate" hreflang="${T[l].hreflang}" href="${urlFor(l,v[l].path)}">`);alt.push(`<link rel="alternate" hreflang="x-default" href="${urlFor(xd,v[xd].path)}">`);
  const xh=alt.map(a=>a.replace('<link','<xhtml:link').replace('>','/>')).join('');
  for(const l of ls){const t=T[l],o=v[l],h=t.prefix+'/',url=urlFor(l,o.path);
    const switcher=LANGS.map(x=>`<a href="${T[x].prefix+(v[x]?v[x].path:'/')}" hreflang="${T[x].hreflang}" lang="${T[x].lang}"${x===l?' aria-current="true"':''}>${T[x].label}</a>`).join('');
    const p={title:esc(o.title),desc:esc(o.desc),url,alternates:alt.join('\n'),type:o.type,switcher,
      ogLocales:LANGS.filter(x=>x!==l&&v[x]).map(x=>`<meta property="og:locale:alternate" content="${T[x].locale}">`).join(''),image:SITE+(o.img||'/uploads/og-cover.jpg')};
    W(OUT+t.prefix+o.path+(o.path.endsWith('/')?'index.html':''),render(layout,{t,cfg:cfgV,site:SITE,home:h,p,content:o.html}));
    sm+=`<url><loc>${url}</loc>${xh}</url>`;}
}
W(OUT+'/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sm}</urlset>`);
W(OUT+'/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('built',Object.keys(reg).length,'page groups');
