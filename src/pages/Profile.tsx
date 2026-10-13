import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { UserRound, Camera, CheckCircle2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTRIES } from "@/lib/marketing";
import { ROLE_LABELS } from "@/types/auth";
import { z } from "zod";
const link = z.string().max(500).refine(value => !value || /^https?:\/\//i.test(value), "Utilisez une URL commençant par https:// ou http://");
const schema = z.object({
 directoryVisible:z.boolean(), fullName:z.string().max(120), phone:z.string().max(40), country:z.string().max(2), city:z.string().max(100),
 bio:z.string().max(2000), website:link, avatarPath:z.string().max(250),
 company:z.string().max(150), jobTitle:z.string().max(120), industry:z.string().max(100),
 address:z.string().max(250), postalCode:z.string().max(20), companyId:z.string().max(100), taxId:z.string().max(100),
 languages:z.string().max(250), equipment:z.string().max(500), styles:z.string().max(500), categories:z.array(z.string().max(50)).max(12),
 ageRange:z.string().max(30), gender:z.string().max(30), available:z.boolean(), aiConsent:z.boolean(),
 aiPrice:z.string().max(15).refine(v=>!v||(/^\d+(\.\d{1,2})?$/.test(v)&&Number(v)<=1000000),"Tarif invalide"),
 realPrice:z.string().max(15).refine(v=>!v||(/^\d+(\.\d{1,2})?$/.test(v)&&Number(v)<=1000000),"Tarif invalide"),
 turnaround:z.string().max(4).refine(v=>!v||(/^\d+$/.test(v)&&Number(v)>0&&Number(v)<=365),"Délai : de 1 à 365 jours"),
 socials:z.array(z.object({network:z.string().max(50),url:link,followers:z.string().max(12).refine(v=>!v||/^\d+$/.test(v),"Audience invalide")})).max(6),
 portfolio:z.array(z.object({title:z.string().max(120),url:link})).max(6),
});
type Details = z.infer<typeof schema>;
const initial:Details = {directoryVisible:true,fullName:"",phone:"",country:"",city:"",bio:"",website:"",avatarPath:"",company:"",jobTitle:"",industry:"",address:"",postalCode:"",companyId:"",taxId:"",languages:"",equipment:"",styles:"",categories:[],ageRange:"",gender:"",available:true,aiConsent:false,aiPrice:"",realPrice:"",turnaround:"",socials:[],portfolio:[]};
const categories = ["Beauté","Food","Lifestyle","Tech","Mode","Sport","Famille","Voyage"];
export default function Profile() {
 const { user, login } = useAuth();
 const creator = user?.role === 'creator';
 const [name,setName]=useState('');
 const [details,setDetails]=useState<Details>(initial);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
 const [photo,setPhoto]=useState(''),[error,setError]=useState(''),[dirty,setDirty]=useState(false);
 const field = (key:keyof Details,value:unknown) => {setDetails(previous=>({...previous,[key]:value}));setDirty(true);};
 useEffect(()=>{
  if(!user) return;
  let active=true;
  setLoading(true); setError('');
  supabase.from('user_profiles').select('username,details').eq('id',user.id).single().then(({data,error})=>{
   if(!active)return;
   if(error){setError(error.message);setLoading(false);return;}
   setName(data.username||user.username);
   const parsed=schema.safeParse({...initial,...data.details});
   const next=parsed.success?parsed.data:initial;
   setDetails(next);setLoading(false);setDirty(false);
   if(next.avatarPath)supabase.storage.from('starcast-profile-photos').createSignedUrl(next.avatarPath,3600).then(({data})=>{if(active)setPhoto(data?.signedUrl||'');});
  });
  return ()=>{active=false;};
 },[user?.id]);
 const upload = async (event:ChangeEvent<HTMLInputElement>) => {
  const file=event.target.files?.[0];event.target.value='';
  if(!file||!user)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024){toast.error('Photo JPG, PNG ou WebP, 4 Mo maximum.');return;}
  setUploading(true);
  try {
   const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
   const {error}=await supabase.storage.from('starcast-profile-photos').upload(path,file,{contentType:file.type});
   if(error)throw error;
   const {data,error:signedError}=await supabase.storage.from('starcast-profile-photos').createSignedUrl(path,3600);
   if(signedError)throw signedError;
   field('avatarPath',path);setPhoto(data.signedUrl);toast.success('Photo prête. Enregistrez le profil pour la conserver.');
  } catch(e){toast.error((e as Error).message);} finally {setUploading(false);}
 };
 const save = async(event:React.FormEvent)=>{
  event.preventDefault();if(!user||saving||uploading)return;
  const parsed=schema.safeParse(details);
  if(!name.trim()||!parsed.success){toast.error(!name.trim()?'Nom d’affichage requis.':parsed.success?'Informations invalides.':parsed.error.issues[0].message);return;}
  setSaving(true);
  try {
   const {data,error}=await supabase.from('user_profiles').update({username:name.trim(),details:parsed.data}).eq('id',user.id).select('id').single();
   if(error||!data)throw error||new Error('Le profil n’a pas été enregistré.');
   const {error:metadataError}=await supabase.auth.updateUser({data:{username:name.trim()}});
   login({...user,username:name.trim()});setDirty(false);
   toast.success('Votre profil est enregistré.');
   if(metadataError)toast.info('Profil sauvegardé. Le nom de session sera actualisé à la prochaine connexion.');
  } catch(e){toast.error((e as Error).message);} finally{setSaving(false);}
 };
 const input = (key:keyof Details,label:string,type='text',placeholder='') => <label className="block text-xs font-semibold text-muted-foreground">{label}<input className="input-base mt-2" type={type} value={String(details[key]??'')} placeholder={placeholder} maxLength={type==='url'?500:250} min={type==='number'?0:undefined} step={type==='number'?'0.01':undefined} onChange={e=>field(key,e.target.value)}/></label>;
 if(loading)return <div className="container py-16">Chargement de votre profil…</div>;
 if(error)return <div className="container py-16"><h1 className="text-2xl font-bold">Profil indisponible</h1><p className="mt-3 text-red-600">{error}</p><button className="sc-button mt-5" onClick={()=>window.location.reload()}>Réessayer</button></div>;
 const completion = Math.round([!!name,!!details.fullName,!!details.phone,!!details.country,!!details.city,!!details.avatarPath,creator?!!details.bio:!!details.company,creator?details.socials.some(s=>!!s.url):!!details.industry].filter(Boolean).length/8*100);
 return <div className="container py-10 md:py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><span className="sc-eyebrow">VOTRE ESPACE STARCAST</span><h1 className="mt-3 text-4xl font-extrabold">Mon profil</h1><p className="mt-3 text-sm text-muted-foreground">{creator?'Présentez votre univers, vos réseaux et vos prestations.':'Complétez vos coordonnées et les informations de votre marque.'}</p></div><Link className="btn-outline" to="/dashboard">Mes projets ↗</Link></div>
 <form onSubmit={save} className="mt-8 grid items-start gap-7 lg:grid-cols-[250px_1fr]">
 <aside className="card-base space-y-5 p-6 lg:sticky lg:top-28"><div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted">{photo?<img src={photo} className="h-full w-full object-cover" alt="Votre photo de profil"/>:<UserRound className="h-10 w-10 text-primary"/>}</div><label className="btn-outline flex cursor-pointer items-center justify-center gap-2 text-xs"><Camera size={16}/>{uploading?'Envoi en cours…':'Choisir une photo'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={saving||uploading}/></label><p className="text-center text-[10px] text-muted-foreground">JPG, PNG ou WebP · 4 Mo maximum</p><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={details.directoryVisible} onChange={e=>field('directoryVisible',e.target.checked)}/>Afficher mon profil dans l’annuaire StarCast</label><div className="border-t pt-4"><strong className="text-sm">{ROLE_LABELS[user!.role]}</strong><p className="mt-2 text-xs text-muted-foreground">Profil complété à {completion} %</p><progress className="mt-3 h-2 w-full accent-purple-600" max={100} value={completion}/></div><p className="text-xs leading-relaxed text-muted-foreground">Le nom, la photo, la présentation, la ville, les réseaux et les prestations apparaissent dans l’annuaire si vous activez sa visibilité. Email, téléphone et facturation restent privés.</p><button type="submit" className="sc-button w-full" disabled={saving||uploading}><Save size={16}/>{saving?'Enregistrement…':'Enregistrer'}</button>{dirty&&<p className="text-center text-xs text-amber-700">Modifications non enregistrées</p>}</aside>
 <div className="space-y-6">
 <section className="card-base p-6 md:p-8"><h2 className="mb-6 flex items-center gap-2 text-lg font-bold"><UserRound size={19}/>Informations générales</h2><div className="grid gap-5 sm:grid-cols-2"><label className="block text-xs font-semibold text-muted-foreground">Nom d’affichage *<input required maxLength={120} className="input-base mt-2" value={name} onChange={e=>{setName(e.target.value);setDirty(true);}}/></label>{input('fullName','Nom complet')}
 <label className="block text-xs font-semibold text-muted-foreground">Email du compte<input type="email" disabled className="input-base mt-2 opacity-65" value={user!.email}/><span className="mt-2 block text-[10px] font-normal">L’email de connexion ne peut pas être modifié ici.</span></label>{input('phone','Téléphone','tel','+212…')}
 <label className="block text-xs font-semibold text-muted-foreground">Pays<select className="input-base mt-2" value={details.country} onChange={e=>field('country',e.target.value)}><option value="">Choisir un pays</option>{COUNTRIES.map(([code,flag,name])=><option key={code} value={code}>{flag} {name}</option>)}</select></label>{input('city','Ville')}{input('website','Site web','url','https://…')}
 </div><label className="mt-5 block text-xs font-semibold text-muted-foreground">{creator?'Présentation / biographie':'Présentation de la marque'}<textarea rows={5} maxLength={2000} className="input-base mt-2" value={details.bio} onChange={e=>field('bio',e.target.value)}/><span className="mt-1 block text-right text-[10px]">{details.bio.length}/2000</span></label></section>
 {!creator&&<section className="card-base p-6 md:p-8"><h2 className="mb-6 text-lg font-bold">Votre entreprise & coordonnées de facturation</h2><div className="grid gap-5 sm:grid-cols-2">{input('company','Entreprise / marque')}{input('jobTitle','Votre fonction')}{input('industry','Secteur d’activité')}{input('companyId','ICE / numéro d’immatriculation')}{input('taxId','Identifiant fiscal / TVA')}{input('address','Adresse professionnelle')}{input('postalCode','Code postal')}</div></section>}
 {creator&&<section className="card-base p-6 md:p-8"><h2 className="mb-6 text-lg font-bold">Votre univers créatif</h2><div className="grid gap-5 sm:grid-cols-2">{input('languages','Langues parlées','text','Français, arabe, anglais…')}{input('equipment','Matériel / équipement','text','Smartphone, caméra, studio…')}{input('styles','Formats de vidéos','text','Unboxing, tutoriel, témoignage…')}
 <label className="text-xs font-semibold text-muted-foreground">Tranche d’âge (facultatif)<select className="input-base mt-2" value={details.ageRange} onChange={e=>field('ageRange',e.target.value)}><option value="">Non renseignée</option>{['18–24','25–34','35–44','45–54','55+'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label className="text-xs font-semibold text-muted-foreground">Genre (facultatif)<select className="input-base mt-2" value={details.gender} onChange={e=>field('gender',e.target.value)}><option value="">Non renseigné</option>{['Femme','Homme','Autre','Ne souhaite pas préciser'].map(x=><option key={x}>{x}</option>)}</select></label></div><p className="mt-6 text-xs font-semibold text-muted-foreground">Vos catégories</p><div className="mt-3 flex flex-wrap gap-2">{categories.map(cat=><button type="button" key={cat} aria-pressed={details.categories.includes(cat)} className={'pill '+(details.categories.includes(cat)?'bg-primary text-white':'')} onClick={()=>field('categories',details.categories.includes(cat)?details.categories.filter(x=>x!==cat):[...details.categories,cat])}>{cat}</button>)}</div><label className="mt-6 flex items-center gap-3 text-sm"><input type="checkbox" checked={details.available} onChange={e=>field('available',e.target.checked)}/>Disponible pour de nouvelles collaborations</label></section>}
 <section className="card-base p-6 md:p-8"><h2 className="mb-2 text-lg font-bold">Réseaux sociaux</h2><p className="mb-5 text-xs text-muted-foreground">Ajoutez les liens de vos comptes. {creator?'Indiquez votre nombre d’abonnés par réseau.':''}</p><div className="space-y-4">{details.socials.map((social,i)=><div key={i} className="grid items-end gap-3 sm:grid-cols-[125px_1fr_100px_30px]"><label className="text-[10px] text-muted-foreground">Réseau<select className="input-base mt-1" value={social.network} onChange={e=>field('socials',details.socials.map((x,j)=>j===i?{...x,network:e.target.value}:x))}>{['Instagram','TikTok','YouTube','Facebook','LinkedIn','X','Autre'].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-[10px] text-muted-foreground">Lien<input type="url" className="input-base mt-1" placeholder="https://…" value={social.url} onChange={e=>field('socials',details.socials.map((x,j)=>j===i?{...x,url:e.target.value}:x))}/></label><label className="text-[10px] text-muted-foreground">Abonnés<input type="number" min={0} step={1} className="input-base mt-1" value={social.followers} onChange={e=>field('socials',details.socials.map((x,j)=>j===i?{...x,followers:e.target.value}:x))}/></label><button type="button" className="mb-3 text-muted-foreground" aria-label={`Retirer ${social.network}`} onClick={()=>field('socials',details.socials.filter((_,j)=>j!==i))}><Trash2 size={17}/></button></div>)}</div><button type="button" disabled={details.socials.length>=6} className="btn-outline mt-5 text-xs" onClick={()=>field('socials',[...details.socials,{network:'Instagram',url:'',followers:''}])}><Plus size={15}/>Ajouter un réseau</button></section>
 {creator&&<><section className="card-base p-6 md:p-8"><h2 className="mb-6 text-lg font-bold">Prestations & tarifs indicatifs</h2><div className="grid gap-5 sm:grid-cols-3">{input('aiPrice','Vidéo IA (€)','number')}{input('realPrice','Tournage réel (€)','number')}{input('turnaround','Délai habituel (jours)','number')}</div><label className="mt-6 flex items-start gap-3 text-sm leading-relaxed"><input className="mt-1" type="checkbox" checked={details.aiConsent} onChange={e=>field('aiConsent',e.target.checked)}/><span>Je suis intéressé(e) par l’utilisation autorisée de mon image pour une production IA. Les droits et modalités devront être définis pour chaque projet.</span></label></section>
 <section className="card-base p-6 md:p-8"><h2 className="mb-2 text-lg font-bold">Votre portfolio</h2><p className="mb-5 text-xs text-muted-foreground">Liens vers vos réalisations (YouTube, Vimeo, site personnel…).</p><div className="space-y-4">{details.portfolio.map((item,i)=><div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1.5fr_30px]"><label className="text-[10px] text-muted-foreground">Titre<input maxLength={120} className="input-base mt-1" value={item.title} onChange={e=>field('portfolio',details.portfolio.map((x,j)=>j===i?{...x,title:e.target.value}:x))}/></label><label className="text-[10px] text-muted-foreground">Lien de la réalisation<input type="url" className="input-base mt-1" placeholder="https://…" value={item.url} onChange={e=>field('portfolio',details.portfolio.map((x,j)=>j===i?{...x,url:e.target.value}:x))}/></label><button type="button" className="mb-3 text-muted-foreground" aria-label="Retirer cette réalisation" onClick={()=>field('portfolio',details.portfolio.filter((_,j)=>j!==i))}><Trash2 size={17}/></button></div>)}</div><button type="button" disabled={details.portfolio.length>=6} className="btn-outline mt-5 text-xs" onClick={()=>field('portfolio',[...details.portfolio,{title:'',url:''}])}><Plus size={15}/>Ajouter une réalisation</button></section></>}
 <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5"><span className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 size={17}/>Vos modifications seront conservées dans votre compte.</span><button type="submit" className="sc-button" disabled={saving||uploading}><Save size={16}/>{saving?'Enregistrement…':'Enregistrer mon profil'}</button></div>
 </div></form></div>;
}
