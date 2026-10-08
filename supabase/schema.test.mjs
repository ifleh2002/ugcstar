import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const client = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const admin = '10000000-0000-4000-8000-000000000003';
const star = '10000000-0000-4000-8000-000000000004';

test('Supabase PostgreSQL: migration, RLS, safe roles, prices, commissions, workflow and reviews', async () => {
 const db = new PGlite();
 try {
  // Local stand-in for Supabase's auth schema and JWT context; no live accounts.
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const schema = readFileSync(new URL('migrations/202610080001_starcast.sql', import.meta.url), 'utf8');
  const seed = readFileSync(new URL('seed.sql', import.meta.url), 'utf8');
  await db.exec(schema); await db.exec(seed);
  await db.exec(schema); await db.exec(seed); // Repeatability.
  for (const [id, name, role] of [[client,'Client','admin'],[other,'Other','client'],[admin,'Admin','client'],[star,'Star','star']]) {
   await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id, name+'@example.com',JSON.stringify({name,role,handle:'@test',ai_consent:true})]);
  }
  assert.equal((await db.query('select role from public.starcast_profiles where id=$1',[client])).rows[0].role,'client');
  await db.query("update public.starcast_profiles set role='admin' where id=$1",[admin]);
  async function as(id, role='authenticated') {
   await db.exec('reset role');
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
   await db.exec('set role '+role);
  }
  async function rpc(name, args=[]) {
   const result = await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args.map(a=>typeof a==='object'?JSON.stringify(a):a));
   return result.rows[0].value;
  }
  const brief={creatorId:'c-01',brand:'Demo',product:'Product',briefing:'Campaign',style:'Testimonial',duration:30,voiceover:'non',videoType:'ai',budget:1,commissionRate:0,userId:other};
  await as(null,'anon');
  assert.ok((await rpc('starcast_list_stars')).length>0);
  await assert.rejects(()=>rpc('starcast_create_order',[brief]),/permission denied/);
  await assert.rejects(()=>db.query('select * from public.starcast_profiles'),/permission denied/);
  await as(client);
  await assert.rejects(()=>db.query("update public.starcast_profiles set role='admin' where id=$1",[client]),/permission denied/);
  const ai=await rpc('starcast_create_order',[brief]);
  assert.equal(ai.userId,client); assert.equal(ai.budget,850); assert.equal(ai.commissionRate,20); assert.equal(ai.commission,170);
  const real=await rpc('starcast_create_order',[{...brief,videoType:'real'}]); assert.ok(real.budget>ai.budget);
  await assert.rejects(()=>rpc('starcast_admin_star',['c-01',{aiPrice:10,realPrice:20,commissionRate:0,approved:true}]),/administrateur/);
  await assert.rejects(()=>db.query("update public.starcast_orders set data=data||'{\"paymentStatus\":\"paid\"}'::jsonb where id=$1",[ai.id]),/permission denied/);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{paymentStatus:'paid'}]),/rendu/);
  await as(other);
  assert.equal((await db.query('select * from public.starcast_orders')).rows.length,0);
  assert.equal((await db.query('select * from public.starcast_messages')).rows.length,0);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{action:'approve'}]),/introuvable/);
  await assert.rejects(()=>rpc('starcast_send_message',[ai.id,'Hello']),/introuvable/);
  await as(admin);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{status:'en_production'}]),/Paiement/);
  await rpc('starcast_update_order',[ai.id,{paymentStatus:'paid',status:'en_production'}]);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{status:'en_validation'}]),/vidéo/);
  await rpc('starcast_update_order',[ai.id,{renderUrl:'https://example.com/video.mp4',status:'en_validation'}]);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{status:'livree'}]),/Transition/);
  // Two revisions, then rejection of an additional cycle.
  for (let revision=1; revision<=2; revision++) {
   await as(client); assert.equal((await rpc('starcast_update_order',[ai.id,{action:'revision'}])).revisionsUsed,revision);
   await as(admin); await rpc('starcast_update_order',[ai.id,{status:'en_production'}]); await rpc('starcast_update_order',[ai.id,{status:'en_validation'}]);
  }
  await as(client); await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{action:'revision'}]),/Limite/);
  await rpc('starcast_update_order',[ai.id,{action:'approve'}]);
  await as(admin); await rpc('starcast_update_order',[ai.id,{status:'livree'}]);
  await assert.rejects(()=>rpc('starcast_update_order',[ai.id,{renderUrl:'https://example.com/other.mp4'}]),/verrouillé/);
  await rpc('starcast_admin_star',['c-01',{aiPrice:100,realPrice:200,commissionRate:15,approved:true}]);
  assert.equal((await db.query('select data from public.starcast_orders where id=$1',[ai.id])).rows[0].data.commission,170);
  await assert.rejects(()=>rpc('starcast_admin_star',['c-01',{aiPrice:200,realPrice:100,commissionRate:20,approved:true}]),/Tarifs/);
  await as(client);
  await rpc('starcast_send_message',[ai.id,'Hello team']);
  assert.equal((await db.query('select * from public.starcast_messages')).rows.length,1);
  await rpc('starcast_post_review',[ai.id,5,'Great']);
  await assert.rejects(()=>rpc('starcast_post_review',[ai.id,4,'Duplicate']),/déposé/);
  assert.equal((await rpc('starcast_list_stars')).find(s=>s.id==='c-01').rating,5);
  await as(star);
  assert.equal((await db.query('select * from public.starcast_orders')).rows.length,0);
  await rpc('starcast_save_profile',[{bio:'Bio',city:'Casablanca',avatar:'https://example.com/avatar.jpg',socials:[{network:'TikTok',followers:2500}],aiConsent:false,approved:true,aiPrice:1}]);
  let own=(await db.query('select * from public.starcast_stars where user_id=$1',[star])).rows[0];
  assert.equal(own.approved,false); assert.equal(own.data.aiPrice,0);
  await as(admin); await rpc('starcast_admin_star',[star,{aiPrice:100,realPrice:300,commissionRate:20,approved:true}]);
  await as(client);
  await assert.rejects(()=>rpc('starcast_create_order',[{...brief,creatorId:star}]),/Autorisation/);
  const starOrder=await rpc('starcast_create_order',[{...brief,creatorId:star,videoType:'real'}]);
  await as(star);
  assert.equal((await db.query('select * from public.starcast_orders')).rows.length,1);
  await assert.rejects(()=>rpc('starcast_update_order',[starOrder.id,{action:'approve'}]),/réservée/);
  await rpc('starcast_send_message',[starOrder.id,'Ready']);
  await as(admin);
  await rpc('starcast_update_order',[ai.id,{paymentStatus:'refunded'}]);
  assert.equal((await db.query("select * from public.starcast_orders where data->>'paymentStatus'='paid'")).rows.length,0);
 } finally { await db.close(); }
});
