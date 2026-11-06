-- Esquema de Kafa para Supabase (Postgres).
-- Ejecútalo en el SQL Editor de tu proyecto. La aplicación usa la clave service_role
-- solo en el servidor; por eso las tablas tienen RLS activado y sin políticas públicas.

create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  caficultor text not null,           -- identificador, nunca el nombre
  calidad text not null check (calidad in ('consumo','excelso','premium','especial')),
  unidad text not null check (unidad in ('cps','verde')),
  kilos numeric not null check (kilos > 0),
  precio_kg numeric not null check (precio_kg > 0),
  destino text not null check (destino in ('sustituir','migrar','nuevo')),
  nota text,
  leida_por_ia boolean default false,
  created_at timestamptz default now()
);

create table if not exists baches (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('servicio','propio')),
  caficultor text,
  kilos_cps numeric not null check (kilos_cps > 0),
  minutos integer not null check (minutos > 0),
  perfil text not null check (perfil in ('claro','medio','oscuro')),
  operadores text[] not null default '{}',
  pedagogico boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cliente text not null,              -- identificador, nunca el nombre
  linea text not null check (linea in ('institucional','premium','especial')),
  origen text not null check (origen in ('maquila','tena')),
  libras numeric not null check (libras > 0),
  precio_lb numeric not null check (precio_lb > 0),
  created_at timestamptz default now()
);

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('flete','energia','mantenimiento','otro')),
  valor numeric not null check (valor > 0),
  descripcion text,
  created_at timestamptz default now()
);

create table if not exists estado (
  id integer primary key default 1 check (id = 1),
  escenario integer not null default 1,
  taza_aprobada date,
  inicio_piloto date,
  reclamos_premium integer not null default 0
);
insert into estado (id) values (1) on conflict do nothing;

alter table compras enable row level security;
alter table baches enable row level security;
alter table ventas enable row level security;
alter table gastos enable row level security;
alter table estado enable row level security;

-- Usuarios y autor de cada registro (también en supabase/usuarios.sql).
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,
  nombre text not null,
  rol text not null default 'registro' check (rol in ('admin','registro')),
  clave_hash text not null,
  activo boolean not null default true,
  created_at timestamptz default now()
);
alter table usuarios enable row level security;
alter table compras add column if not exists registrado_por text;
alter table baches add column if not exists registrado_por text;
alter table ventas add column if not exists registrado_por text;
alter table gastos add column if not exists registrado_por text;
