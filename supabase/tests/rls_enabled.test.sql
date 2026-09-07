-- Fails if any table in the public schema does not have row level security enabled.
begin;
select plan(1);
select is(
  (select count(*)::int from pg_tables t
   join pg_class c on c.relname = t.tablename
   join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
   where t.schemaname = 'public' and not c.relrowsecurity),
  0,
  'every public table has RLS enabled'
);
select * from finish();
rollback;
