-- Comentarios sobre la aplicación (pruebas con usuarios). Ejecútalo una vez en el SQL Editor.
create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  usuario text not null,                -- quien comentó (usuario de Kafa)
  nombre text not null,                 -- nombre para mostrar
  pantalla text not null,               -- ruta desde donde se envió, por ejemplo /registros
  tipo text not null default 'idea' check (tipo in ('idea','error','diseno','otro')),
  texto text not null,
  resuelto boolean not null default false
);
alter table comentarios enable row level security;
