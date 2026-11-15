-- Spec 004 · Migración 002: misiones guardadas.
-- Se aplica una sola vez, después de 001. En Neon: pegar completo en el SQL Editor y ejecutar.
-- Sin datos personales (RF-004-03): la tripulación son identificadores de avatar.

begin;

create table missions (
  id                text primary key check (id ~ '^m-[A-Za-z0-9_-]{8,32}$'),
  created_at        timestamptz not null default now(),
  name              text check (name is null or length(name) <= 80),
  region_id         text not null references regions (id) on delete cascade,
  selected_profile  text not null check (selected_profile in ('shortest', 'fastest', 'safest')),
  crew              jsonb not null default '[]'::jsonb check (jsonb_typeof(crew) = 'array' and jsonb_array_length(crew) <= 6),
  route_request     jsonb not null,
  params_used       jsonb not null,
  route             jsonb not null,           -- Route del contrato, recalculada en el servidor (RF-004-01)
  is_example        boolean not null,
  dataset_version   text not null,
  algorithm_version text not null,
  check (pg_column_size(route) < 1000000)    -- tope de tamaño por misión (CE-3)
);

create index missions_created_at on missions (created_at);

insert into schema_migrations (version) values ('002_misiones');

commit;
