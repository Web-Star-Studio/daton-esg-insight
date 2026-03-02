-- Associate waste log records with branches for module-level management and filtering.
alter table public.waste_logs
add column if not exists branch_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'waste_logs_branch_id_fkey'
  ) then
    alter table public.waste_logs
    add constraint waste_logs_branch_id_fkey
    foreign key (branch_id)
    references public.branches(id)
    on delete set null;
  end if;
end;
$$;

create index if not exists idx_waste_logs_branch_id
on public.waste_logs(branch_id);
