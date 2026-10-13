import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Creator, CreatorCategory, VideoStyle } from '@/types';
export type DirectoryProfile = {id:string;name:string;role:'creator'|'user';data:Record<string,unknown>;avatar:string};
const placeholder='/placeholder.svg';
const safeUrl=(value:unknown)=>typeof value==='string'&&/^https?:\/\//i.test(value)?value:'';
const items=(value:unknown):Record<string,unknown>[]=>Array.isArray(value)?value.filter(x=>x&&typeof x==='object'):[];
const number=(value:unknown)=>Math.max(0,Math.min(1000000000,Number(value)||0));
const text=(value:unknown)=>typeof value==='string'?value:'';
const language=(value:string)=>({français:'FR',francais:'FR',french:'FR',anglais:'EN',english:'EN',arabe:'AR',arabic:'AR',espagnol:'ES',spanish:'ES'}[value.trim().toLowerCase()]||value.trim().toUpperCase());
function toCreator(p:DirectoryProfile):Creator {
 const d=p.data;const socials=items(d.socials).map(s=>({network:text(s.network),url:safeUrl(s.url),followers:number(s.followers)}));
 return {id:p.id,name:p.name||'Nouveau créateur',handle:socials[0]?.url||'',avatar:p.avatar,cover:p.avatar,city:text(d.city)||'Ville non renseignée',country:text(d.country),
 languages:text(d.languages).split(/[,;\/]/).filter(Boolean).map(language),categories:(Array.isArray(d.categories)?d.categories:[]).filter(x=>typeof x==='string') as CreatorCategory[],styles:text(d.styles).split(/[,;]/).filter(Boolean) as VideoStyle[],
 tagline:text(d.bio).slice(0,140)||'Nouveau profil StarCast',bio:text(d.bio)||'Ce créateur n’a pas encore ajouté de présentation.',followers:socials.reduce((sum,s)=>sum+s.followers,0),avgViews:0,engagement:0,rating:0,reviews:0,
 pricePerVideo:number(d.realPrice)||number(d.aiPrice),aiPrice:number(d.aiPrice),realPrice:number(d.realPrice),turnaroundDays:number(d.turnaround),verified:false,demo:false,socials,
 portfolio:items(d.portfolio).filter(x=>safeUrl(x.url)).map((x,i)=>({id:p.id+'-'+i,title:text(x.title)||'Réalisation',cover:placeholder,duration:0,brand:'',visibility:'public' as const,url:safeUrl(x.url)}))};
}
export function useDirectory() {
 const [profiles,setProfiles]=useState<DirectoryProfile[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const {data,error}=await supabase.rpc('starcast_public_directory');
   if(!active)return;
   if(error){setError(error.message);setLoading(false);return;}
   const rows=Array.isArray(data)?data:[];
   const results=await Promise.all(rows.map(async(row)=>{
    const data=row.data&&typeof row.data==='object'?row.data:{};let avatar=placeholder;
    if(data.avatarPath){const {data:photo}=await supabase.storage.from('starcast-profile-photos').createSignedUrl(String(data.avatarPath),3600);if(photo)avatar=photo.signedUrl;}
    return {id:String(row.id),name:String(row.name||''),role:row.role,data,avatar} as DirectoryProfile;
   }));
   if(active){setProfiles(results);setError('');setLoading(false);}
  };load();
  return()=>{active=false;};
 },[]);
 return {profiles,creators:profiles.filter(p=>p.role==='creator').map(toCreator),brands:profiles.filter(p=>p.role==='user'),loading,error};
}
