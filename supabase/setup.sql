-- StarCast Supabase schema. Execute with the SQL Editor (database owner).
-- No service_role key is required in the browser or in Vercel.
begin;
create table if not exists public.starcast_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100),
 role text not null check(role in ('client','star','admin')) default 'client'
);
create table if not exists public.starcast_stars (
 id text primary key, user_id uuid unique references auth.users(id) on delete cascade,
 approved boolean not null default false,
 data jsonb not null check(jsonb_typeof(data)='object'),
 check(data->>'id'=id), check((data->>'approved')::boolean=approved)
);
create table if not exists public.starcast_orders (
 id uuid primary key, user_id uuid not null references auth.users(id),
 creator_id text not null references public.starcast_stars(id),
 data jsonb not null, created_at timestamptz not null default now(),
 check(data->>'id'=id::text), check(data->>'userId'=user_id::text), check(data->>'creatorId'=creator_id)
);
create table if not exists public.starcast_messages (
 id uuid primary key, order_id uuid not null references public.starcast_orders(id),
 data jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.starcast_reviews (
 id uuid primary key, order_id uuid unique not null references public.starcast_orders(id),
 creator_id text not null references public.starcast_stars(id),
 rating integer not null check(rating between 1 and 5),
 data jsonb not null, created_at timestamptz not null default now()
);
create index if not exists starcast_orders_user on public.starcast_orders(user_id);
create index if not exists starcast_orders_creator on public.starcast_orders(creator_id);
create index if not exists starcast_messages_order on public.starcast_messages(order_id);
create index if not exists starcast_reviews_creator on public.starcast_reviews(creator_id);
alter table public.starcast_profiles enable row level security;
alter table public.starcast_stars enable row level security;
alter table public.starcast_orders enable row level security;
alter table public.starcast_messages enable row level security;
alter table public.starcast_reviews enable row level security;
-- Helpers have fixed search paths and never trust editable user metadata for admin.
create or replace function public.starcast_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.starcast_profiles where id=auth.uid() and role='admin');
$$;
create or replace function public.starcast_can_access(project_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from public.starcast_orders o left join public.starcast_stars s on s.id=o.creator_id
  where o.id=project_id and (o.user_id=auth.uid() or s.user_id=auth.uid() or public.starcast_is_admin())
 );
$$;
drop policy if exists starcast_profile_read on public.starcast_profiles;
create policy starcast_profile_read on public.starcast_profiles for select to authenticated using(id=auth.uid() or public.starcast_is_admin());
drop policy if exists starcast_stars_read on public.starcast_stars;
create policy starcast_stars_read on public.starcast_stars for select to anon,authenticated using(approved or user_id=auth.uid() or public.starcast_is_admin());
drop policy if exists starcast_orders_read on public.starcast_orders;
create policy starcast_orders_read on public.starcast_orders for select to authenticated using(public.starcast_can_access(id));
drop policy if exists starcast_messages_read on public.starcast_messages;
create policy starcast_messages_read on public.starcast_messages for select to authenticated using(public.starcast_can_access(order_id));
drop policy if exists starcast_reviews_read on public.starcast_reviews;
create policy starcast_reviews_read on public.starcast_reviews for select to anon,authenticated using(true);
-- Revoke ALL direct writes. Every change passes through a checked RPC.
revoke all on public.starcast_profiles,public.starcast_stars,public.starcast_orders,public.starcast_messages,public.starcast_reviews from public,anon,authenticated;
grant select on public.starcast_profiles,public.starcast_orders,public.starcast_messages to authenticated;
grant select on public.starcast_stars,public.starcast_reviews to anon,authenticated;

create or replace function public.starcast_handle_signup() returns trigger
language plpgsql security definer set search_path='' as $$
declare r text; n text; s jsonb;
begin
 r:=case when new.raw_user_meta_data->>'role'='star' then 'star' else 'client' end;
 n:=left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Utilisateur'),100);
 insert into public.starcast_profiles(id,name,role) values(new.id,n,r) on conflict(id) do nothing;
 if r='star' then
  s:=jsonb_build_object('id',new.id::text,'name',n,'handle',left(coalesce(new.raw_user_meta_data->>'handle',''),200),
   'avatar','/placeholder.svg','cover','/placeholder.svg','city',left(coalesce(new.raw_user_meta_data->>'city',''),100),
   'tagline','Nouvelle star','bio','Profil en cours de validation','languages',jsonb_build_array('FR'),
   'categories',jsonb_build_array('Lifestyle'),'styles',jsonb_build_array('Testimonial'),
   'followers',0,'avgViews',0,'engagement',0,'rating',0,'reviews',0,'pricePerVideo',0,'aiPrice',0,
   'realPrice',0,'commissionRate',20,'turnaroundDays',7,'verified',false,'approved',false,
   'aiConsent',coalesce(new.raw_user_meta_data->>'ai_consent','false')='true',
   'portfolio','[]'::jsonb,'socials','[]'::jsonb,'demo',false);
  insert into public.starcast_stars(id,user_id,approved,data) values(new.id::text,new.id,false,s) on conflict(id) do nothing;
 end if;
 return new;
end $$;
drop trigger if exists starcast_auth_signup on auth.users;
create trigger starcast_auth_signup after insert on auth.users for each row execute function public.starcast_handle_signup();
-- Existing Supabase accounts receive client profiles; roles are never inferred as admin.
insert into public.starcast_profiles(id,name,role)
 select id,left(coalesce(nullif(trim(raw_user_meta_data->>'name'),''),'Utilisateur'),100),'client' from auth.users on conflict(id) do nothing;

create or replace function public.starcast_list_stars() returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(s.data || case when r.count>0 then jsonb_build_object('rating',r.rating,'reviews',r.count) else '{}'::jsonb end order by s.id),'[]'::jsonb)
 from public.starcast_stars s left join lateral(
  select count(*) as count,round(avg(rating),1) as rating from public.starcast_reviews where creator_id=s.id
 )r on true;
$$;
create or replace function public.starcast_admin_star(star_id text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.starcast_stars; a numeric; r numeric; c numeric; published boolean;
begin
 if not public.starcast_is_admin() then raise exception 'Accès administrateur requis'; end if;
 a:=(payload->>'aiPrice')::numeric; r:=(payload->>'realPrice')::numeric; c:=(payload->>'commissionRate')::numeric;
 if a is null or r is null or c is null or a<=0 or r<=a or a>1000000 or r>1000000 or c<0 or c>100 or jsonb_typeof(payload->'approved') is distinct from 'boolean' then raise exception 'Tarifs invalides : le réel doit coûter plus que l’IA, commission entre 0 et 100'; end if;
 select * into s from public.starcast_stars where id=star_id for update;
 if not found then raise exception 'Star introuvable'; end if;
 published:=(payload->>'approved')::boolean;
 update public.starcast_stars set approved=published,data=s.data||jsonb_build_object('aiPrice',a,'realPrice',r,'pricePerVideo',a,'commissionRate',c,'approved',published,'verified',published) where id=star_id returning * into s;
 return s.data;
end $$;
create or replace function public.starcast_save_profile(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.starcast_stars; social jsonb; followers bigint:=0; avatar text;
begin
 if not exists(select 1 from public.starcast_profiles where id=auth.uid() and role='star') then raise exception 'Compte star requis'; end if;
 if jsonb_typeof(payload->'socials') is distinct from 'array' or jsonb_typeof(payload->'aiConsent') is distinct from 'boolean' or jsonb_typeof(payload->'bio') is distinct from 'string' or jsonb_typeof(payload->'city') is distinct from 'string' or jsonb_typeof(payload->'avatar') is distinct from 'string' then raise exception 'Profil invalide'; end if;
 if jsonb_array_length(payload->'socials')>6 then raise exception '6 réseaux maximum'; end if;
 avatar:=payload->>'avatar'; if avatar<>'' and avatar not like 'https://%' then raise exception 'Photo HTTPS requise'; end if;
 for social in select value from jsonb_array_elements(payload->'socials') loop
  if coalesce(social->>'network','') not in ('Instagram','TikTok','YouTube','Facebook','X','LinkedIn') or coalesce(social->>'followers','') !~ '^[0-9]{1,12}$' then raise exception 'Audience invalide'; end if;
  followers:=followers+(social->>'followers')::bigint;
 end loop;
 select * into s from public.starcast_stars where user_id=auth.uid() for update;
 if not found then raise exception 'Profil star introuvable'; end if;
 update public.starcast_stars set approved=false,data=s.data||jsonb_build_object('bio',left(payload->>'bio',3000),'city',left(payload->>'city',100),'avatar',coalesce(nullif(avatar,''),'/placeholder.svg'),'socials',payload->'socials','followers',followers,'aiConsent',(payload->>'aiConsent')::boolean,'approved',false,'verified',false) where id=s.id returning * into s;
 return s.data;
end $$;

create or replace function public.starcast_create_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.starcast_stars; o jsonb; amount numeric; commission numeric; duration integer; project uuid:=gen_random_uuid(); mode text:=payload->>'videoType';
begin
 if not exists(select 1 from public.starcast_profiles where id=auth.uid() and role='client') then raise exception 'Compte client requis'; end if;
 select * into s from public.starcast_stars where id=payload->>'creatorId' and approved for share;
 if not found then raise exception 'Star introuvable ou non publiée'; end if;
 if mode is null or mode not in ('ai','real') then raise exception 'Type de vidéo invalide'; end if;
 if mode='ai' and not coalesce((s.data->>'aiConsent')::boolean,false) then raise exception 'Autorisation IA manquante'; end if;
 if coalesce(payload->>'style','') not in ('Testimonial','Unboxing','Tutorial','Narrative','Skit') or coalesce(payload->>'voiceover','') not in ('oui_fr','oui_en','non') or coalesce(payload->>'duration','') not in ('15','30','45','60','90') then raise exception 'Options du brief invalides'; end if;
 if coalesce(length(trim(payload->>'brand')),0) not between 1 and 200 or coalesce(length(trim(payload->>'product')),0) not between 1 and 300 or coalesce(length(trim(payload->>'briefing')),0) not between 1 and 10000 then raise exception 'Brief incomplet ou trop long'; end if;
 duration:=(payload->>'duration')::integer;
 amount:=(s.data->>case when mode='ai' then 'aiPrice' else 'realPrice' end)::numeric;
 if amount is null or amount<=0 then raise exception 'Tarif non configuré'; end if;
 amount:=amount+case when duration>60 then 200 else 0 end+case when payload->>'voiceover'<>'non' then 80 else 0 end;
 commission:=round(amount*(s.data->>'commissionRate')::numeric/100,2);
 o:=jsonb_build_object('id',project,'userId',auth.uid(),'creatorId',s.id,'brand',payload->>'brand','product',payload->>'product','briefing',payload->>'briefing','style',payload->>'style','duration',duration,'voiceover',payload->>'voiceover','videoType',mode,'budget',amount,'commissionRate',(s.data->>'commissionRate')::numeric,'commission',commission,'status','briefing','paymentStatus','pending','createdAt',now(),'dueDate',now()+make_interval(days=>coalesce((s.data->>'turnaroundDays')::integer,7)+case when mode='real' then 5 else 0 end),'revisionsUsed',0,'revisionsAllowed',2);
 insert into public.starcast_orders(id,user_id,creator_id,data) values(project,auth.uid(),s.id,o);
 return o;
end $$;
create or replace function public.starcast_update_order(project_id uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.starcast_orders; d jsonb; previous text; target text; payment text; render text;
begin
 if not public.starcast_can_access(project_id) then raise exception 'Projet introuvable'; end if;
 select * into o from public.starcast_orders where id=project_id for update;
 d:=o.data; previous:=d->>'status';
 if public.starcast_is_admin() then
  if payload ? 'paymentStatus' then
   payment:=payload->>'paymentStatus'; if payment is null or payment not in ('pending','paid','refunded') then raise exception 'Paiement invalide'; end if;
   d:=d||jsonb_build_object('paymentStatus',payment);
  end if;
  if payload ? 'renderUrl' then
   render:=payload->>'renderUrl';
   if previous in ('validee','livree') and render is distinct from d->>'renderUrl' then raise exception 'Le rendu approuvé est verrouillé'; end if;
   if render is null or (render<>'' and render not like 'https://%') then raise exception 'URL HTTPS requise'; end if;
   d:=d||jsonb_build_object('renderUrl',render);
  end if;
  if payload ? 'status' then
   target:=payload->>'status'; if target is null then raise exception 'Statut invalide'; end if;
   if target<>previous then
    if not ((previous='briefing' and target='en_production') or (previous='en_production' and target='en_validation') or (previous='validee' and target='livree') or (previous='rejetee' and target='en_production')) then raise exception 'Transition non autorisée'; end if;
    if d->>'paymentStatus'<>'paid' then raise exception 'Paiement confirmé requis'; end if;
    if target in ('en_validation','livree') and coalesce(d->>'renderUrl','')='' then raise exception 'Lien vidéo requis'; end if;
    d:=d||jsonb_build_object('status',target);
   end if;
  end if;
 elsif o.user_id=auth.uid() then
  if previous<>'en_validation' or coalesce(d->>'renderUrl','')='' then raise exception 'Aucun rendu à valider'; end if;
  if payload->>'action'='approve' then d:=d||jsonb_build_object('status','validee');
  elsif payload->>'action'='revision' then
   if (d->>'revisionsUsed')::integer >= (d->>'revisionsAllowed')::integer then raise exception 'Limite de révisions atteinte'; end if;
   d:=d||jsonb_build_object('status','rejetee','revisionsUsed',(d->>'revisionsUsed')::integer+1);
  else raise exception 'Action client invalide'; end if;
 else raise exception 'Action réservée au client ou à l’administration'; end if;
 update public.starcast_orders set data=d where id=project_id;
 return d;
end $$;
create or replace function public.starcast_send_message(project_id uuid,content text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.starcast_profiles; m jsonb; mid uuid:=gen_random_uuid();
begin
 if not public.starcast_can_access(project_id) then raise exception 'Projet introuvable'; end if;
 if content is null or length(trim(content)) not between 1 and 5000 then raise exception 'Message invalide'; end if;
 select * into p from public.starcast_profiles where id=auth.uid();
 m:=jsonb_build_object('id',mid,'orderId',project_id,'author',case when p.role='admin' then 'plateforme' else p.role end,'authorName',p.name,'content',trim(content),'createdAt',now());
 insert into public.starcast_messages(id,order_id,data) values(mid,project_id,m); return m;
end $$;
create or replace function public.starcast_post_review(project_id uuid,stars_rating integer,content text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.starcast_orders; r jsonb; rid uuid:=gen_random_uuid();
begin
 select * into o from public.starcast_orders where id=project_id and user_id=auth.uid() for update;
 if not found or o.data->>'status'<>'livree' then raise exception 'Avis réservé au client après livraison'; end if;
 if stars_rating is null or stars_rating not between 1 and 5 or content is null or length(trim(content)) not between 1 and 2000 then raise exception 'Avis invalide'; end if;
 if exists(select 1 from public.starcast_reviews where order_id=project_id) then raise exception 'Avis déjà déposé'; end if;
 r:=jsonb_build_object('id',rid,'orderId',project_id,'creatorId',o.creator_id,'name',(select name from public.starcast_profiles where id=auth.uid()),'rating',stars_rating,'content',trim(content));
 insert into public.starcast_reviews(id,order_id,creator_id,rating,data) values(rid,project_id,o.creator_id,stars_rating,r); return r;
end $$;
-- PostgreSQL grants EXECUTE to PUBLIC by default: explicitly narrow every RPC.
revoke all on function public.starcast_handle_signup() from public,anon,authenticated;
revoke all on function public.starcast_is_admin(), public.starcast_can_access(uuid),public.starcast_list_stars(),public.starcast_admin_star(text,jsonb),public.starcast_save_profile(jsonb),public.starcast_create_order(jsonb),public.starcast_update_order(uuid,jsonb),public.starcast_send_message(uuid,text),public.starcast_post_review(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.starcast_is_admin(),public.starcast_list_stars() to anon,authenticated;
grant execute on function public.starcast_can_access(uuid),public.starcast_admin_star(text,jsonb),public.starcast_save_profile(jsonb),public.starcast_create_order(jsonb),public.starcast_update_order(uuid,jsonb),public.starcast_send_message(uuid,text),public.starcast_post_review(uuid,integer,text) to authenticated;
commit;

-- Profils fictifs de démonstration, aucune identité réelle.
begin;
insert into public.starcast_stars(id,approved,data) values ('c-01',true,'{"id": "c-01", "name": "Léa Marchand", "handle": "@leamarchand", "tagline": "Beauté clean & tutoriels skincare", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=600&fit=crop", "city": "Paris", "languages": ["FR", "EN"], "categories": ["Beauté", "Lifestyle"], "styles": ["Tutorial", "Testimonial"], "followers": 184000, "avgViews": 42000, "engagement": 7.2, "rating": 4.9, "reviews": 128, "pricePerVideo": 850, "turnaroundDays": 5, "verified": true, "bio": "Créatrice beauté, formée en cosmétologie. Je produis des vidéos courtes, authentiques, orientées démonstration produit.", "portfolio": [{"id": "p1", "title": "Routine matinale Lumi", "cover": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop", "duration": 38, "brand": "Lumi", "visibility": "public"}, {"id": "p2", "title": "Démo sérum vitamine C", "cover": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=800&fit=crop", "duration": 45, "brand": "Skinpure", "visibility": "public"}, {"id": "p3", "title": "Test confidentiel marque X", "cover": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=800&fit=crop", "duration": 60, "brand": "Confidentiel", "visibility": "private"}], "approved": true, "aiConsent": true, "aiPrice": 850, "realPrice": 1700, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 184000}], "demo": true}'::jsonb) on conflict(id) do nothing;
insert into public.starcast_stars(id,approved,data) values ('c-02',true,'{"id": "c-02", "name": "Yacine Berkane", "handle": "@yacineb", "tagline": "Tech reviews & unboxings premium", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop", "city": "Lyon", "languages": ["FR", "EN", "AR"], "categories": ["Tech"], "styles": ["Unboxing", "Narrative"], "followers": 312000, "avgViews": 98000, "engagement": 5.8, "rating": 4.8, "reviews": 214, "pricePerVideo": 1450, "turnaroundDays": 7, "verified": true, "bio": "Journaliste tech reconverti. Je sublime les produits avec une direction artistique soignée et un storytelling clair.", "portfolio": [{"id": "p1", "title": "Unboxing Pro Max", "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=800&fit=crop", "duration": 55, "brand": "NovaTech", "visibility": "public"}, {"id": "p2", "title": "Casque audio ANC", "cover": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=800&fit=crop", "duration": 42, "brand": "AudioLab", "visibility": "public"}], "approved": true, "aiConsent": true, "aiPrice": 1450, "realPrice": 2900, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 312000}], "demo": true}'::jsonb) on conflict(id) do nothing;
insert into public.starcast_stars(id,approved,data) values ('c-03',true,'{"id": "c-03", "name": "Chloé Vidal", "handle": "@chloevidal", "tagline": "Food storytelling & recettes rapides", "avatar": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop", "city": "Bordeaux", "languages": ["FR"], "categories": ["Food", "Famille"], "styles": ["Tutorial", "Skit"], "followers": 92000, "avgViews": 36000, "engagement": 8.9, "rating": 4.9, "reviews": 86, "pricePerVideo": 620, "turnaroundDays": 4, "verified": false, "bio": "Cuisinière autodidacte. Je crée des contenus food courts, lumineux, pensés pour l''engagement.", "portfolio": [{"id": "p1", "title": "Recette 30s avec marque A", "cover": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=800&fit=crop", "duration": 30, "brand": "Épicerie B.", "visibility": "public"}], "approved": true, "aiConsent": true, "aiPrice": 620, "realPrice": 1240, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 92000}], "demo": true}'::jsonb) on conflict(id) do nothing;
insert into public.starcast_stars(id,approved,data) values ('c-04',true,'{"id": "c-04", "name": "Marius Lefèvre", "handle": "@mariuslfv", "tagline": "Sport & outdoor, cinématique terrain", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=600&fit=crop", "city": "Chamonix", "languages": ["FR", "EN"], "categories": ["Sport", "Voyage"], "styles": ["Narrative", "Testimonial"], "followers": 221000, "avgViews": 71000, "engagement": 6.4, "rating": 4.7, "reviews": 142, "pricePerVideo": 1100, "turnaroundDays": 10, "verified": true, "bio": "Vidéaste de terrain. Captation drone, action-cam, color grading maison.", "portfolio": [{"id": "p1", "title": "Trail nocturne — PeakGear", "cover": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=800&fit=crop", "duration": 68, "brand": "PeakGear", "visibility": "public"}], "approved": true, "aiConsent": true, "aiPrice": 1100, "realPrice": 2200, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 221000}], "demo": true}'::jsonb) on conflict(id) do nothing;
insert into public.starcast_stars(id,approved,data) values ('c-05',true,'{"id": "c-05", "name": "Aïcha Diop", "handle": "@aichad", "tagline": "Mode éthique & direction artistique", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&h=600&fit=crop", "city": "Marseille", "languages": ["FR", "EN"], "categories": ["Mode", "Lifestyle"], "styles": ["Narrative", "Skit"], "followers": 148000, "avgViews": 51000, "engagement": 7.9, "rating": 4.8, "reviews": 97, "pricePerVideo": 980, "turnaroundDays": 6, "verified": true, "bio": "Styliste de formation. Je produis des contenus mode avec une identité visuelle forte.", "portfolio": [{"id": "p1", "title": "Capsule FW26 — Maison L.", "cover": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=800&fit=crop", "duration": 50, "brand": "Maison L.", "visibility": "public"}], "approved": true, "aiConsent": true, "aiPrice": 980, "realPrice": 1960, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 148000}], "demo": true}'::jsonb) on conflict(id) do nothing;
insert into public.starcast_stars(id,approved,data) values ('c-06',true,'{"id": "c-06", "name": "Tomás Rivera", "handle": "@tomrivera", "tagline": "Humour & skits pour marques FMCG", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", "cover": "https://images.unsplash.com/photo-1513569771920-c9e1d31714af?w=1200&h=600&fit=crop", "city": "Toulouse", "languages": ["FR", "ES"], "categories": ["Lifestyle", "Famille"], "styles": ["Skit", "Testimonial"], "followers": 268000, "avgViews": 112000, "engagement": 9.2, "rating": 4.9, "reviews": 176, "pricePerVideo": 1250, "turnaroundDays": 5, "verified": true, "bio": "Comédien et scénariste. Spécialisé dans les formats courts à fort engagement.", "portfolio": [{"id": "p1", "title": "Skit yaourt — DairyCo", "cover": "https://images.unsplash.com/photo-1513569771920-c9e1d31714af?w=600&h=800&fit=crop", "duration": 25, "brand": "DairyCo", "visibility": "public"}], "approved": true, "aiConsent": true, "aiPrice": 1250, "realPrice": 2500, "commissionRate": 20, "socials": [{"network": "Instagram", "followers": 268000}], "demo": true}'::jsonb) on conflict(id) do nothing;
commit;
