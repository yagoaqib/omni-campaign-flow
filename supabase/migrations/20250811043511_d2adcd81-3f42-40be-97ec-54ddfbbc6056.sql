-- Fresh migration (fix: CREATE POLICY does not support IF NOT EXISTS)
create extension if not exists pgcrypto;

-- Helper functions (security definer, schema-qualified)
create or replace function public.is_member(_workspace_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = _workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(_workspace_id uuid, _roles text[])
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = _workspace_id
      and m.user_id = auth.uid()
      and m.role = any(_roles)
  );
$$;

-- Tables
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Manaus',
  created_at timestamptz default now()
);

create table if not exists public.members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);
create index if not exists idx_members_user on public.members(user_id);

create table if not exists public.wabas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  meta_business_id text not null,
  waba_id text not null,
  name text,
  created_at timestamptz default now()
);
create index if not exists idx_wabas_workspace on public.wabas(workspace_id);
create unique index if not exists ux_wabas_workspace_waba on public.wabas(workspace_id, waba_id);

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  waba_ref uuid not null references public.wabas(id) on delete cascade,
  phone_number_id text not null,
  display_number text not null,
  mps_target int not null default 80,
  quality_rating text not null default 'UNKNOWN',
  status text not null default 'ACTIVE',
  last_health_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_phone_numbers_workspace on public.phone_numbers(workspace_id);
create index if not exists idx_phone_numbers_waba on public.phone_numbers(waba_ref);
create unique index if not exists ux_phone_numbers_workspace_pnid on public.phone_numbers(workspace_id, phone_number_id);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  waba_ref uuid not null references public.wabas(id) on delete cascade,
  name text not null,
  language text not null,
  category text not null,
  status text not null,
  components_schema jsonb not null,
  created_at timestamptz default now()
);
create index if not exists idx_templates_workspace on public.templates(workspace_id);
create index if not exists idx_templates_waba on public.templates(waba_ref);
create unique index if not exists ux_templates_workspace_name_lang on public.templates(workspace_id, name, language);

create table if not exists public.template_stacks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category text not null
);
create index if not exists idx_template_stacks_workspace on public.template_stacks(workspace_id);

create table if not exists public.template_stack_items (
  stack_id uuid not null references public.template_stacks(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  pos int not null,
  primary key (stack_id, template_id)
);
create index if not exists idx_tsi_stack_pos on public.template_stack_items(stack_id, pos);

create table if not exists public.audiences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  total int default 0,
  valid_count int default 0,
  invalid_count int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_audiences_workspace on public.audiences(workspace_id);

create table if not exists public.audience_items (
  id uuid primary key default gen_random_uuid(),
  audience_id uuid not null references public.audiences(id) on delete cascade,
  raw_msisdn text not null,
  e164 text,
  wa_id text,
  validation_status text not null default 'PENDING',
  opt_in boolean default false
);
create index if not exists idx_audience_items_audience on public.audience_items(audience_id);
create index if not exists idx_audience_items_e164 on public.audience_items(e164);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  audience_id uuid references public.audiences(id),
  desired_category text not null default 'UTILITY',
  deadline_at timestamptz,
  status text not null default 'DRAFT',
  created_at timestamptz default now()
);
create index if not exists idx_campaigns_workspace on public.campaigns(workspace_id);
create index if not exists idx_campaigns_audience on public.campaigns(audience_id);

create table if not exists public.campaign_numbers (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  phone_number_ref uuid not null references public.phone_numbers(id) on delete cascade,
  pos int not null,
  quota int not null,
  min_quality text not null default 'HIGH',
  primary key (campaign_id, phone_number_ref)
);
create index if not exists idx_campaign_numbers_campaign_pos on public.campaign_numbers(campaign_id, pos);

create table if not exists public.campaign_template_stacks (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  category text not null,
  stack_ref uuid not null references public.template_stacks(id) on delete cascade,
  primary key (campaign_id, category)
);
create index if not exists idx_campaign_template_stacks_campaign on public.campaign_template_stacks(campaign_id);

create table if not exists public.dispatch_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  audience_item_id uuid not null references public.audience_items(id) on delete cascade,
  phone_number_ref uuid references public.phone_numbers(id),
  template_ref uuid references public.templates(id),
  client_msg_id text,
  status text not null default 'QUEUED',
  error_code text,
  attempts int not null default 0,
  sent_at timestamptz,
  last_status_at timestamptz
);
create index if not exists idx_dispatch_jobs_campaign on public.dispatch_jobs(campaign_id);
create index if not exists idx_dispatch_jobs_audience_item on public.dispatch_jobs(audience_item_id);
create index if not exists idx_dispatch_jobs_status on public.dispatch_jobs(status);
create unique index if not exists ux_dispatch_jobs_client_msg on public.dispatch_jobs(client_msg_id) where client_msg_id is not null;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  related_dispatch_job_id uuid,
  created_at timestamptz default now()
);
create index if not exists idx_webhook_events_workspace on public.webhook_events(workspace_id);
create index if not exists idx_webhook_events_type on public.webhook_events(event_type);

-- Enable RLS
alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.wabas enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.templates enable row level security;
alter table public.template_stacks enable row level security;
alter table public.template_stack_items enable row level security;
alter table public.audiences enable row level security;
alter table public.audience_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_numbers enable row level security;
alter table public.campaign_template_stacks enable row level security;
alter table public.dispatch_jobs enable row level security;
alter table public.webhook_events enable row level security;

-- Policies (drop/create to be idempotent)
-- Workspaces
drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces for select to authenticated using (public.is_member(id));

drop policy if exists "workspaces_insert_any_auth" on public.workspaces;
create policy "workspaces_insert_any_auth" on public.workspaces for insert to authenticated with check (true);

drop policy if exists "workspaces_update_member" on public.workspaces;
create policy "workspaces_update_member" on public.workspaces for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "workspaces_delete_owner_admin" on public.workspaces;
create policy "workspaces_delete_owner_admin" on public.workspaces for delete to authenticated using (public.has_workspace_role(id, array['owner','admin']::text[]));

-- Members
drop policy if exists "members_select_member" on public.members;
create policy "members_select_member" on public.members for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "members_insert_self_or_admin" on public.members;
create policy "members_insert_self_or_admin" on public.members for insert to authenticated
  with check (
    user_id = auth.uid() and (
      public.has_workspace_role(workspace_id, array['owner','admin']::text[])
      or not exists (select 1 from public.members m2 where m2.workspace_id = workspace_id)
    )
  );

drop policy if exists "members_update_admin" on public.members;
create policy "members_update_admin" on public.members for update to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']::text[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::text[]));

drop policy if exists "members_delete_admin" on public.members;
create policy "members_delete_admin" on public.members for delete to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']::text[]));

-- WABAs
drop policy if exists "wabas_sel" on public.wabas;
create policy "wabas_sel" on public.wabas for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "wabas_ins" on public.wabas;
create policy "wabas_ins" on public.wabas for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "wabas_upd" on public.wabas;
create policy "wabas_upd" on public.wabas for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "wabas_del" on public.wabas;
create policy "wabas_del" on public.wabas for delete to authenticated using (public.is_member(workspace_id));

-- Phone Numbers
drop policy if exists "pn_sel" on public.phone_numbers;
create policy "pn_sel" on public.phone_numbers for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "pn_ins" on public.phone_numbers;
create policy "pn_ins" on public.phone_numbers for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "pn_upd" on public.phone_numbers;
create policy "pn_upd" on public.phone_numbers for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "pn_del" on public.phone_numbers;
create policy "pn_del" on public.phone_numbers for delete to authenticated using (public.is_member(workspace_id));

-- Templates
drop policy if exists "tpl_sel" on public.templates;
create policy "tpl_sel" on public.templates for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "tpl_ins" on public.templates;
create policy "tpl_ins" on public.templates for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "tpl_upd" on public.templates;
create policy "tpl_upd" on public.templates for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "tpl_del" on public.templates;
create policy "tpl_del" on public.templates for delete to authenticated using (public.is_member(workspace_id));

-- Template Stacks
drop policy if exists "tst_sel" on public.template_stacks;
create policy "tst_sel" on public.template_stacks for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "tst_ins" on public.template_stacks;
create policy "tst_ins" on public.template_stacks for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "tst_upd" on public.template_stacks;
create policy "tst_upd" on public.template_stacks for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "tst_del" on public.template_stacks;
create policy "tst_del" on public.template_stacks for delete to authenticated using (public.is_member(workspace_id));

-- Template Stack Items
drop policy if exists "tsi_sel" on public.template_stack_items;
create policy "tsi_sel" on public.template_stack_items for select to authenticated using (
  exists (
    select 1 from public.template_stacks ts where ts.id = stack_id and public.is_member(ts.workspace_id)
  )
);

drop policy if exists "tsi_ins" on public.template_stack_items;
create policy "tsi_ins" on public.template_stack_items for insert to authenticated with check (
  exists (
    select 1 from public.template_stacks ts where ts.id = stack_id and public.is_member(ts.workspace_id)
  )
);

drop policy if exists "tsi_upd" on public.template_stack_items;
create policy "tsi_upd" on public.template_stack_items for update to authenticated using (
  exists (
    select 1 from public.template_stacks ts where ts.id = stack_id and public.is_member(ts.workspace_id)
  )
) with check (
  exists (
    select 1 from public.template_stacks ts where ts.id = stack_id and public.is_member(ts.workspace_id)
  )
);

drop policy if exists "tsi_del" on public.template_stack_items;
create policy "tsi_del" on public.template_stack_items for delete to authenticated using (
  exists (
    select 1 from public.template_stacks ts where ts.id = stack_id and public.is_member(ts.workspace_id)
  )
);

-- Audiences
drop policy if exists "aud_sel" on public.audiences;
create policy "aud_sel" on public.audiences for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "aud_ins" on public.audiences;
create policy "aud_ins" on public.audiences for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "aud_upd" on public.audiences;
create policy "aud_upd" on public.audiences for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "aud_del" on public.audiences;
create policy "aud_del" on public.audiences for delete to authenticated using (public.is_member(workspace_id));

-- Audience Items
drop policy if exists "ai_sel" on public.audience_items;
create policy "ai_sel" on public.audience_items for select to authenticated using (
  exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
);

drop policy if exists "ai_ins" on public.audience_items;
create policy "ai_ins" on public.audience_items for insert to authenticated with check (
  exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
);

drop policy if exists "ai_upd" on public.audience_items;
create policy "ai_upd" on public.audience_items for update to authenticated using (
  exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
) with check (
  exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
);

drop policy if exists "ai_del" on public.audience_items;
create policy "ai_del" on public.audience_items for delete to authenticated using (
  exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
);

-- Campaigns
drop policy if exists "cmp_sel" on public.campaigns;
create policy "cmp_sel" on public.campaigns for select to authenticated using (public.is_member(workspace_id));

drop policy if exists "cmp_ins" on public.campaigns;
create policy "cmp_ins" on public.campaigns for insert to authenticated with check (public.is_member(workspace_id));

drop policy if exists "cmp_upd" on public.campaigns;
create policy "cmp_upd" on public.campaigns for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

drop policy if exists "cmp_del" on public.campaigns;
create policy "cmp_del" on public.campaigns for delete to authenticated using (public.is_member(workspace_id));

-- Campaign Numbers
drop policy if exists "cn_sel" on public.campaign_numbers;
create policy "cn_sel" on public.campaign_numbers for select to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cn_ins" on public.campaign_numbers;
create policy "cn_ins" on public.campaign_numbers for insert to authenticated with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cn_upd" on public.campaign_numbers;
create policy "cn_upd" on public.campaign_numbers for update to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
) with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cn_del" on public.campaign_numbers;
create policy "cn_del" on public.campaign_numbers for delete to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

-- Campaign Template Stacks
drop policy if exists "cts_sel" on public.campaign_template_stacks;
create policy "cts_sel" on public.campaign_template_stacks for select to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cts_ins" on public.campaign_template_stacks;
create policy "cts_ins" on public.campaign_template_stacks for insert to authenticated with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cts_upd" on public.campaign_template_stacks;
create policy "cts_upd" on public.campaign_template_stacks for update to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
) with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

drop policy if exists "cts_del" on public.campaign_template_stacks;
create policy "cts_del" on public.campaign_template_stacks for delete to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

-- Dispatch Jobs (read-only for app)
drop policy if exists "dj_sel" on public.dispatch_jobs;
create policy "dj_sel" on public.dispatch_jobs for select to authenticated using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id))
);

-- Webhook Events (read-only for app)
drop policy if exists "wh_sel" on public.webhook_events;
create policy "wh_sel" on public.webhook_events for select to authenticated using (public.is_member(workspace_id));
