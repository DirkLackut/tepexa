-- Spec 001 · Migración 001: catálogo (regiones, hechos, fuentes, capas, puntos de interés).
-- Se aplica una sola vez. En Neon: pegar completo en el SQL Editor y ejecutar.

begin;

create extension if not exists postgis;

create table schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);

-- Texto bilingüe: exactamente {"es": "...", "en": "..."} con ambos no vacíos (RF-001-07).
create function tepexa_is_localized(t jsonb) returns boolean
language sql immutable as $$
  select t is not null
     and jsonb_typeof(t) = 'object'
     and (select count(*) from jsonb_object_keys(t)) = 2
     and jsonb_typeof(t -> 'es') = 'string'
     and jsonb_typeof(t -> 'en') = 'string'
     and length(btrim(t ->> 'es')) > 0
     and length(btrim(t ->> 'en')) > 0
$$;

create table sources (
  id           text primary key,
  mission      text not null,
  instrument   text,
  product_id   text,
  url          text not null,
  attribution  text not null,
  license_note text
);

create table regions (
  id                   text primary key check (id ~ '^[a-z0-9-]+$'),
  display_order        int not null,
  status               text not null check (status in ('active', 'preview')),
  is_example           boolean not null,
  dataset_version      text not null,
  name                 jsonb not null check (tepexa_is_localized(name)),
  summary              jsonb not null check (tepexa_is_localized(summary)),
  center_lat_deg       double precision not null check (center_lat_deg between -90 and 90),
  center_lon_east_deg  double precision not null check (center_lon_east_deg >= 0 and center_lon_east_deg < 360),
  center_approximate   boolean not null,
  thumbnail_url        text,
  frame_id             text not null unique,
  frame_description    jsonb not null check (tepexa_is_localized(frame_description)),
  source_crs           text,
  min_x                double precision,
  min_y                double precision,
  max_x                double precision,
  max_y                double precision,
  elevation_min_m      double precision,
  elevation_max_m      double precision,
  mission_objective    jsonb not null check (tepexa_is_localized(mission_objective)),
  route_defaults       jsonb,
  available_layers     boolean not null,
  available_pois       boolean not null,
  available_routes     boolean not null,
  available_terrain_3d boolean not null,
  check ((min_x is null and min_y is null and max_x is null and max_y is null)
         or (min_x < max_x and min_y < max_y)),
  check ((elevation_min_m is null and elevation_max_m is null) or elevation_min_m <= elevation_max_m),
  check (status = 'active' or (route_defaults is null and min_x is null and not available_routes))
);

create table region_facts (
  region_id text not null references regions (id) on delete cascade,
  ord       int not null,
  text      jsonb not null check (tepexa_is_localized(text)),
  certainty text not null check (certainty in ('confirmed', 'interpretation', 'hypothesis')),
  primary key (region_id, ord)
);

create table region_fact_sources (
  region_id text not null,
  fact_ord  int not null,
  ord       int not null,
  source_id text not null references sources (id),
  primary key (region_id, fact_ord, ord),
  foreign key (region_id, fact_ord) references region_facts (region_id, ord) on delete cascade
);

create table layers (
  region_id       text not null references regions (id) on delete cascade,
  id              text not null,
  kind            text not null check (kind in ('orthoimage', 'elevation', 'hillshade',
                                                 'thermal_inertia', 'mineralogy', 'geology')),
  title           jsonb not null check (tepexa_is_localized(title)),
  description     jsonb not null check (tepexa_is_localized(description)),
  source_id       text not null references sources (id),
  resolution_m    double precision not null check (resolution_m > 0),
  units           text,
  legend          jsonb,
  tiles           jsonb not null,
  default_visible boolean not null,
  default_opacity double precision not null check (default_opacity between 0 and 1),
  z_order         int not null,
  used_in_routing boolean not null,
  limitations     jsonb not null check (tepexa_is_localized(limitations)),
  is_example      boolean not null,
  dataset_version text not null,
  primary key (region_id, id)
);

create table pois (
  region_id       text not null references regions (id) on delete cascade,
  id              text not null,
  ord             int not null,
  geom            geometry(Point, 0) not null,
  name            jsonb not null check (tepexa_is_localized(name)),
  category        text not null check (category in ('base', 'science_target', 'hazard', 'waypoint')),
  description     jsonb not null check (tepexa_is_localized(description)),
  water_episode   smallint check (water_episode between 1 and 3),
  elevation_m     double precision,
  confidence_note jsonb check (confidence_note is null or tepexa_is_localized(confidence_note)),
  is_example      boolean not null,
  primary key (region_id, id)
);
create index pois_geom_gist on pois using gist (geom);

create table poi_sources (
  region_id text not null,
  poi_id    text not null,
  ord       int not null,
  source_id text not null references sources (id),
  primary key (region_id, poi_id, ord),
  foreign key (region_id, poi_id) references pois (region_id, id) on delete cascade
);

create table poi_images (
  region_id text not null,
  poi_id    text not null,
  ord       int not null,
  url       text not null,
  credit    text not null,
  caption   jsonb not null check (tepexa_is_localized(caption)),
  primary key (region_id, poi_id, ord),
  foreign key (region_id, poi_id) references pois (region_id, id) on delete cascade
);

insert into schema_migrations (version) values ('001_catalogo');

commit;
