import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFileSync, mkdirSync, existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, extname } from 'node:path';
const root=resolve(import.meta.dirname,'..');
mkdirSync(resolve(root,'data'),{recursive:true});
const db=new DatabaseSync(resolve(root,'data/starcast.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,name TEXT,role TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT,expires INTEGER); CREATE TABLE IF NOT EXISTS stars(id TEXT PRIMARY KEY,data TEXT); CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,userId TEXT,data TEXT); CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,orderId TEXT UNIQUE,data TEXT); CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,orderId TEXT,data TEXT);`);
const hash=(p,s=randomBytes(16).toString('hex'))=>s+':'+scryptSync(p,s,64).toString('hex');
const verify=(p,h)=>{const [s,k]=h.split(':');return timingSafeEqual(Buffer.from(k,'hex'),scryptSync(p,s,64));};
const allStars=()=>{const reviews=db.prepare('SELECT data FROM reviews').all().map(r=>JSON.parse(r.data));return db.prepare('SELECT data FROM stars').all().map(r=>{const s=JSON.parse(r.data),actual=reviews.filter(x=>x.creatorId===s.id);return actual.length?{...s,rating:Math.round(actual.reduce((a,x)=>a+x.rating,0)/actual.length*10)/10,reviews:actual.length}:s;});};
const saveStar=s=>db.prepare('INSERT OR REPLACE INTO stars VALUES(?,?)').run(s.id,JSON.stringify(s));
if(!allStars().length) for(const s of JSON.parse(readFileSync(resolve(root,'server/stars.json'),'utf8'))) saveStar({...s,approved:true,aiConsent:true,aiPrice:s.pricePerVideo,realPrice:s.pricePerVideo*2,commissionRate:20,socials:[{network:'Instagram',followers:s.followers}],demo:true});
if(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !db.prepare('SELECT id FROM users WHERE email=?').get(process.env.ADMIN_EMAIL.toLowerCase())) {if(process.env.ADMIN_PASSWORD.length<12)throw Error('ADMIN_PASSWORD: 12 caractères minimum');db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(randomUUID(),process.env.ADMIN_EMAIL.toLowerCase(),hash(process.env.ADMIN_PASSWORD),'Administration','admin');}
const getOrder=id=>{const r=db.prepare('SELECT * FROM orders WHERE id=?').get(id);return r?{...JSON.parse(r.data),userId:r.userId}:null;};
const putOrder=o=>db.prepare('UPDATE orders SET data=? WHERE id=?').run(JSON.stringify(o),o.id);
const publicUser=u=>u?{id:u.id,name:u.name,email:u.email,role:u.role}:null;
const attempts=new Map();
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'), path=url.pathname; res.setHeader('X-Content-Type-Options','nosniff');
 const reply=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 try {
 if(!path.startsWith('/api/')) {let f=resolve(root,'dist','.'+path);if(!f.startsWith(resolve(root,'dist')+'/'))f=resolve(root,'dist/index.html');if(!existsSync(f)||!statSync(f).isFile())f=resolve(root,'dist/index.html');if(!existsSync(f))return reply(404,{error:'Lancez npm run build ou utilisez Vite.'});res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ico':'image/x-icon'})[extname(f)]||'application/octet-stream');createReadStream(f).pipe(res);return;}
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('starcast='))?.slice(9);
 const session=token?db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(token,Date.now()):null;
 const user=session?db.prepare('SELECT * FROM users WHERE id=?').get(session.userId):null;
 let body={};if(['POST','PATCH'].includes(req.method)){if(req.headers.origin && req.headers.origin!==`${process.env.COOKIE_SECURE==='true'?'https':'http'}://${req.headers.host}`)return reply(403,{error:'Origine refusée'});let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000)return reply(413,{error:'Requête trop volumineuse'});}body=raw?JSON.parse(raw):{};}
 const login=u=>{const t=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(t,u.id,Date.now()+7*86400000);res.setHeader('Set-Cookie',`starcast=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);reply(200,{user:publicUser(u)});};
 if(path==='/api/auth/me')return reply(200,{user:publicUser(user)});
 if(path==='/api/auth/logout'&&req.method==='POST'){if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(token);res.setHeader('Set-Cookie','starcast=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');return reply(200,{});}
 if(['/api/auth/login','/api/auth/register'].includes(path)&&req.method==='POST') {
 const ip=req.socket.remoteAddress;const a=attempts.get(ip)||{count:0,time:Date.now()};if(Date.now()-a.time>600000){a.count=0;a.time=Date.now();}a.count++;attempts.set(ip,a);if(a.count>30)return reply(429,{error:'Trop de tentatives. Réessayez dans 10 minutes.'});
 const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||(password.length<10||password.length>256))return reply(400,{error:'Email valide et mot de passe de 10 caractères minimum requis.'});
 const existing=db.prepare('SELECT * FROM users WHERE email=?').get(email);
 if(path.endsWith('login')) {if(!existing||!verify(password,existing.password))return reply(401,{error:'Identifiants incorrects'});return login(existing);}
 if(existing)return reply(409,{error:'Cet email est déjà utilisé.'});if(!String(body.name||'').trim())return reply(400,{error:'Nom requis'});
 const u={id:randomUUID(),email,password:hash(password),name:String(body.name).trim().slice(0,100),role:body.role==='star'?'star':'client'};
 if(u.role==='star'&&(!body.consent||!body.handle))return reply(400,{error:'Profil social et autorisation requis.'});
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(u.id,u.email,u.password,u.name,u.role);
 if(u.role==='star')saveStar({id:u.id,name:u.name,handle:String(body.handle),avatar:'/placeholder.svg',cover:'/placeholder.svg',city:String(body.city||''),tagline:'Nouvelle star',bio:'Profil en cours de validation',languages:['FR'],categories:['Lifestyle'],styles:['Testimonial'],followers:0,avgViews:0,engagement:0,rating:0,reviews:0,pricePerVideo:0,aiPrice:0,realPrice:0,commissionRate:20,turnaroundDays:7,verified:false,approved:false,aiConsent:true,portfolio:[],socials:[]});return login(u);
 }
 if(path==='/api/stars'&&req.method==='GET')return reply(200,allStars().filter(s=>s.approved||user?.role==='admin'||s.id===user?.id));
 const sr=path.match(/^\/api\/stars\/([^/]+)$/);
 if(sr&&req.method==='PATCH') {if(user?.role!=='admin')return reply(403,{error:'Accès administrateur requis'});const s=allStars().find(s=>s.id===sr[1]);if(!s)return reply(404,{error:'Star introuvable'});const {aiPrice,realPrice,commissionRate,approved}=body;if(![aiPrice,realPrice,commissionRate].every(Number.isFinite)||aiPrice<=0||realPrice<=aiPrice||commissionRate<0||commissionRate>100||typeof approved!=='boolean')return reply(400,{error:'Tarifs positifs : le réel doit coûter plus que l’IA. Commission entre 0 et 100.'});saveStar({...s,aiPrice,realPrice,commissionRate,approved,pricePerVideo:aiPrice,verified:approved});return reply(200,{});}
 if(path==='/api/profile'&&user?.role==='star') {
 const s=allStars().find(s=>s.id===user.id);if(req.method==='GET')return reply(200,s);
 if(req.method==='PATCH'){const {bio,city,avatar,socials,aiConsent}=body;if(typeof bio!=='string'||typeof city!=='string'||typeof avatar!=='string'||(avatar&&!avatar.startsWith('https://'))||!Array.isArray(socials)||socials.length>6||socials.some(x=>!['Instagram','TikTok','YouTube','Facebook','X','LinkedIn'].includes(x.network)||!Number.isSafeInteger(x.followers)||x.followers<0)||typeof aiConsent!=='boolean')return reply(400,{error:'Profil invalide : photo HTTPS et audiences positives requises'});saveStar({...s,bio:bio.slice(0,3000),city:city.slice(0,100),avatar:avatar||'/placeholder.svg',socials,followers:socials.reduce((a,x)=>a+x.followers,0),aiConsent,approved:false,verified:false});return reply(200,{});}
 }
 if(path==='/api/reviews'&&req.method==='GET')return reply(200,db.prepare('SELECT data FROM reviews').all().map(r=>JSON.parse(r.data)));
 if(!user)return reply(401,{error:'Connexion nécessaire'});
 const allowed=o=>o&&(user.role==='admin'||o.userId===user.id||o.creatorId===user.id);
 if(path==='/api/orders'&&req.method==='GET'){const rows=user.role==='admin'?db.prepare('SELECT * FROM orders').all():db.prepare('SELECT * FROM orders').all().filter(r=>allowed({...JSON.parse(r.data),userId:r.userId}));return reply(200,rows.map(r=>({...JSON.parse(r.data),userId:r.userId})));}
 if(path==='/api/orders'&&req.method==='POST') {if(user.role!=='client')return reply(403,{error:'Compte client requis'});const s=allStars().find(s=>s.id===body.creatorId&&s.approved);if(!s||!['ai','real'].includes(body.videoType))return reply(400,{error:'Star ou type de vidéo invalide'});if(body.videoType==='ai'&&!s.aiConsent)return reply(400,{error:'Autorisation IA manquante'});if(!['Testimonial','Unboxing','Tutorial','Narrative','Skit'].includes(body.style)||!['oui_fr','oui_en','non'].includes(body.voiceover)||![15,30,45,60,90].includes(body.duration)||!body.brand?.trim()||!body.product?.trim()||!body.briefing?.trim())return reply(400,{error:'Brief incomplet'});
 const budget=(body.videoType==='ai'?s.aiPrice:s.realPrice)+(body.duration>60?200:0)+(body.voiceover!=='non'?80:0);if(budget<=0)return reply(400,{error:'Tarif non configuré'});const o={id:randomUUID(),userId:user.id,creatorId:s.id,brand:body.brand,product:body.product,briefing:body.briefing,style:body.style,duration:body.duration,voiceover:body.voiceover,videoType:body.videoType,budget,commissionRate:s.commissionRate,commission:Math.round(budget*s.commissionRate)/100,status:'briefing',paymentStatus:'pending',createdAt:new Date().toISOString(),dueDate:new Date(Date.now()+(s.turnaroundDays+(body.videoType==='real'?5:0))*86400000).toISOString(),revisionsUsed:0,revisionsAllowed:2};db.prepare('INSERT INTO orders VALUES(?,?,?)').run(o.id,user.id,JSON.stringify(o));return reply(201,o);}
 const match=path.match(/^\/api\/orders\/([^/]+)(?:\/(messages|review))?$/);
 if(match){const o=getOrder(match[1]);if(!allowed(o))return reply(404,{error:'Projet introuvable'});
 if(match[2]==='messages'){if(req.method==='GET')return reply(200,db.prepare('SELECT data FROM messages WHERE orderId=?').all(o.id).map(r=>JSON.parse(r.data)));if(req.method==='POST'){if(!body.content?.trim())return reply(400,{error:'Message vide'});const m={id:randomUUID(),orderId:o.id,author:user.role==='admin'?'plateforme':user.role,authorName:user.name,content:String(body.content).slice(0,5000),createdAt:new Date().toISOString()};db.prepare('INSERT INTO messages VALUES(?,?,?)').run(m.id,o.id,JSON.stringify(m));return reply(201,m);}}
 if(match[2]==='review'&&req.method==='POST'){if(user.id!==o.userId||o.status!=='livree'||!Number.isInteger(body.rating)||body.rating<1||body.rating>5||!body.content?.trim())return reply(400,{error:'Avis réservé au client après livraison. Note de 1 à 5.'});if(db.prepare('SELECT id FROM reviews WHERE orderId=?').get(o.id))return reply(409,{error:'Avis déjà déposé'});const r={id:randomUUID(),orderId:o.id,creatorId:o.creatorId,name:user.name,rating:body.rating,content:String(body.content).slice(0,2000)};db.prepare('INSERT INTO reviews VALUES(?,?,?)').run(r.id,o.id,JSON.stringify(r));return reply(201,r);}
 if(req.method==='GET')return reply(200,o);
 if(req.method==='PATCH') {if(user.role==='admin'){
 if(body.paymentStatus){if(!['pending','paid','refunded'].includes(body.paymentStatus))return reply(400,{error:'État de paiement invalide'});o.paymentStatus=body.paymentStatus;}
 if(body.renderUrl!==undefined){if(['validee','livree'].includes(o.status)&&body.renderUrl!==o.renderUrl)return reply(400,{error:'Le rendu approuvé est verrouillé'});if(body.renderUrl&&!/^https:\/\//.test(body.renderUrl))return reply(400,{error:'URL HTTPS requise'});o.renderUrl=body.renderUrl;}
 const transitions={briefing:['en_production'],en_production:['en_validation'],en_validation:[],validee:['livree'],rejetee:['en_production'],livree:[]};
 if(body.status&&body.status!==o.status){if(!transitions[o.status].includes(body.status))return reply(400,{error:'Transition non autorisée'});if(o.paymentStatus!=='paid')return reply(400,{error:'Paiement confirmé requis'});if(['en_validation','livree'].includes(body.status)&&!o.renderUrl)return reply(400,{error:'Ajoutez le lien vidéo avant validation ou livraison'});o.status=body.status;}
 }else if(user.id===o.userId){if(o.status!=='en_validation'||!o.renderUrl)return reply(400,{error:'Aucun rendu à valider'});if(body.action==='approve')o.status='validee';else if(body.action==='revision'){if(o.revisionsUsed>=o.revisionsAllowed)return reply(400,{error:'Limite de révisions atteinte'});o.revisionsUsed++;o.status='rejetee';}else return reply(400,{error:'Action invalide'});}else return reply(403,{error:'Action réservée au client ou à l’administration'});putOrder(o);return reply(200,o);}
 }
 reply(404,{error:'Route introuvable'});
 }catch(e){console.error(e.message);reply(400,{error:'Requête impossible. Vérifiez les données.'});}
});
server.listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log('StarCast API : http://127.0.0.1:'+(process.env.PORT||3001)));
