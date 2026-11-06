-- Usuarios de Kafa y autor de cada registro. Ejecútalo una vez en el SQL Editor.
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,         -- en minúsculas, por ejemplo "alejandro"
  nombre text not null,                 -- nombre para el saludo, por ejemplo "Alejandro Torres"
  rol text not null default 'registro' check (rol in ('admin','registro')),
  clave_hash text not null,             -- contraseña cifrada con scrypt; nunca en texto plano
  activo boolean not null default true,
  created_at timestamptz default now()
);
alter table usuarios enable row level security;

alter table compras add column if not exists registrado_por text;
alter table baches add column if not exists registrado_por text;
alter table ventas add column if not exists registrado_por text;
alter table gastos add column if not exists registrado_por text;
