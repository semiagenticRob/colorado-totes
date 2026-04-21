create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb := event->'claims';
  u record;
begin
  select role, company_id, building_id
  into u
  from public.users
  where id = (event->>'user_id')::uuid;

  if u.role is not null then
    claims := claims || jsonb_build_object(
      'user_role', u.role::text,
      'company_id', coalesce(u.company_id::text, ''),
      'building_id', coalesce(u.building_id::text, '')
    );
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
