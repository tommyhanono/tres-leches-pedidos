-- ═══════════════════════════════════════════════════════════════
--  Tres Leches – Pedidos · Esquema de Supabase
--  Cópialo y córrelo completo en:  Supabase > SQL Editor > New query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tabla de pedidos ────────────────────────────────────────
create table if not exists public.pedidos (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  cliente_nombre    text        not null,
  direccion         text        not null,
  cantidad          int         not null    default 1,
  monto             numeric     not null,
  comprobante_url   text,                       -- foto OPCIONAL
  comprobante_hash  text,                       -- hash perceptual (si hay foto)
  estado_entrega    text        not null    default 'pendiente',  -- 'pendiente' | 'entregado'
  registrado_por    text,                       -- (sin uso: es un registro del grupo)
  entregado_por     text,                       -- (sin uso)
  entregado_at      timestamptz
);

-- ── 2. RLS abierto para el rol anónimo ─────────────────────────
--  Sin login: cualquiera con el link puede leer y escribir.
--  (Es una herramienta interna y privada entre 3 personas.)
alter table public.pedidos enable row level security;

drop policy if exists "pedidos_select_anon" on public.pedidos;
drop policy if exists "pedidos_insert_anon" on public.pedidos;
drop policy if exists "pedidos_update_anon" on public.pedidos;
drop policy if exists "pedidos_delete_anon" on public.pedidos;

create policy "pedidos_select_anon" on public.pedidos
  for select to anon, authenticated using (true);
create policy "pedidos_insert_anon" on public.pedidos
  for insert to anon, authenticated with check (true);
create policy "pedidos_update_anon" on public.pedidos
  for update to anon, authenticated using (true) with check (true);
create policy "pedidos_delete_anon" on public.pedidos
  for delete to anon, authenticated using (true);

-- ── 3. Realtime ────────────────────────────────────────────────
--  Para que los 3 vean los cambios al instante.
alter publication supabase_realtime add table public.pedidos;

-- ── 4. Bucket de Storage para los comprobantes ─────────────────
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', true)
on conflict (id) do nothing;

-- ── 5. Políticas del bucket (subir y leer sin auth) ────────────
drop policy if exists "comprobantes_read_anon" on storage.objects;
drop policy if exists "comprobantes_insert_anon" on storage.objects;
drop policy if exists "comprobantes_update_anon" on storage.objects;
drop policy if exists "comprobantes_delete_anon" on storage.objects;

create policy "comprobantes_read_anon" on storage.objects
  for select to anon, authenticated using (bucket_id = 'comprobantes');
create policy "comprobantes_insert_anon" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'comprobantes');
create policy "comprobantes_update_anon" on storage.objects
  for update to anon, authenticated using (bucket_id = 'comprobantes');
create policy "comprobantes_delete_anon" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'comprobantes');

-- ¡Listo! Ahora copia tu URL y anon key al archivo .env del proyecto.
