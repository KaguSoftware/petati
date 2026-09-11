-- Proof-of-delivery photos need their own PRIVATE bucket.
--
-- `store-media` (0002) is public-read by policy: anyone with the URL sees the object. That is right for
-- product shots and wrong for a photo of somebody's front door with them standing in it. This bucket is
-- private, capped at 2 MB and image-only; staff read it through short-lived signed URLs, and writes
-- happen only through the service-role client (the courier has no session to authorise an upload).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-proof', 'delivery-proof', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Path convention `<store_id>/<delivery_id>/<uuid>.jpg`, so the first segment is what authorises the read.
create policy "delivery-proof: staff read" on storage.objects for select
  using (bucket_id = 'delivery-proof' and public.has_store_access((split_part(name, '/', 1))::uuid, 'staff'));

-- No insert/update/delete policy on purpose: uploads are service-role only, after the courier's token
-- has been verified in a server action.
