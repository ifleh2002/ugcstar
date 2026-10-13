create or replace function public.starcast_public_directory() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',p.id,'name',p.username,'role',p.role,
  'data',jsonb_build_object(
    'country',p.details->>'country','city',p.details->>'city','bio',p.details->>'bio',
    'website',p.details->>'website','company',p.details->>'company','industry',p.details->>'industry',
    'avatarPath',p.details->>'avatarPath','languages',p.details->>'languages',
    'categories',p.details->'categories','styles',p.details->>'styles',
    'socials',p.details->'socials','portfolio',p.details->'portfolio',
    'aiPrice',p.details->>'aiPrice','realPrice',p.details->>'realPrice',
    'turnaround',p.details->>'turnaround','available',p.details->'available'
  )
 ) order by p.username),'[]'::jsonb)
 from public.user_profiles p where p.role in ('creator','user')
 and coalesce(p.details->>'directoryVisible','true')='true';
$$;
revoke all on function public.starcast_public_directory() from public;
grant execute on function public.starcast_public_directory() to anon,authenticated;
create or replace function starcast_internal.is_directory_photo(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_profiles p
 where p.role in ('creator','user') and coalesce(p.details->>'directoryVisible','true')='true'
 and p.details->>'avatarPath'=object_name and object_name<>'' );
$$;
revoke all on function starcast_internal.is_directory_photo(text) from public;
grant usage on schema starcast_internal to anon;
grant execute on function starcast_internal.is_directory_photo(text) to anon,authenticated;
create policy starcast_directory_photo_read on storage.objects for select to anon,authenticated
 using (bucket_id='starcast-profile-photos' and starcast_internal.is_directory_photo(name));
