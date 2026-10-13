alter table public.user_profiles add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.user_profiles add constraint user_profiles_details_object check(jsonb_typeof(details)='object' and octet_length(details::text)<=25000);
alter table public.user_profiles add constraint user_profiles_username_length check(username is null or char_length(username) between 1 and 120);
alter table public.user_profiles add constraint user_profiles_avatar_owner check(
  coalesce(details->>'avatarPath','')='' or left(details->>'avatarPath',37)=id::text || '/'
);
alter table public.user_profiles enable row level security;
grant update(username,details) on public.user_profiles to authenticated;
create policy profile_self_update on public.user_profiles for update to authenticated
 using ((select auth.uid())=id)
 with check ((select auth.uid())=id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('starcast-profile-photos','starcast-profile-photos',false,4194304,array['image/jpeg','image/png','image/webp']);
create policy starcast_profile_photo_read on storage.objects for select to authenticated
 using(bucket_id='starcast-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy starcast_profile_photo_insert on storage.objects for insert to authenticated
 with check(bucket_id='starcast-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy starcast_profile_photo_update on storage.objects for update to authenticated
 using(bucket_id='starcast-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text)
 with check(bucket_id='starcast-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
