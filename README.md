# 🍰 Tres Leches – Pedidos

App web sencilla, **online y compartida**, para llevar la contabilidad de la venta de un
postre de tres leches entre 3 personas. Sin login: con abrir el link alcanza. Los 3 ven y
editan los mismos pedidos **en tiempo real**.

- **Producto:** Tres Leches casero — $9.00 c/u
- **Pago:** Yappy a Liel (+507 6982-4595)
- **Causa:** las ventas ayudan a una persona que necesita ayuda auditiva 💙

## ✨ Qué hace

- Pantalla **"¿Quién eres?"** con 3 botones (se guarda en `localStorage`, se puede cambiar).
- **Dashboard** con contadores (pedidos, recaudado $, pendientes, entregados), filtros
  (Pendientes / Entregados / Todos), buscador por cliente y lista en tarjetas.
- **Nuevo pedido** con cliente, dirección, cantidad, monto autocalculado (editable) y
  **foto del comprobante opcional** (cámara o galería).
- **Detección de comprobantes duplicados** con hash perceptual (aHash) calculado en el
  navegador: avisa si una foto se parece a otra ya registrada, pero deja continuar.
- **Marcar como entregado** (guarda quién y cuándo) y revertir a pendiente.
- **Exportar CSV** con todos los pedidos para pasarle la cuenta a Liel.
- **Tiempo real** con Supabase Realtime.

## 🧱 Stack

Vite + React (JavaScript) · Supabase (Postgres + Storage + Realtime) · mobile-first · deploy en Vercel.

---

## 1. Instalar y correr en local

```bash
npm install
cp .env.example .env   # y completa tus claves (ver más abajo)
npm run dev
```

Abre la URL que muestra Vite (normalmente http://localhost:5173).

> Si ves la pantalla "Falta conectar Supabase", es porque el `.env` no está completo o no
> reiniciaste el servidor después de crearlo.

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega **todo** el contenido de
   [`supabase.sql`](./supabase.sql) y ejecútalo. Eso crea:
   - La tabla `pedidos`.
   - Las políticas RLS abiertas para el rol anónimo (lectura/escritura).
   - El bucket de Storage `comprobantes` con sus políticas.
   - La publicación de Realtime para la tabla.
3. Ve a **Project Settings → Data API** (o **API**) y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
     (⚠️ usa la `anon public`, **nunca** la `service_role`).

### Variables de entorno

En el archivo `.env` (local) y en Vercel (producción):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

## 3. Editar los 3 nombres de vendedores

Abre [`src/config.js`](./src/config.js) y cambia:

```js
export const VENDEDORES = ["Vendedor 1", "Vendedor 2", "Vendedor 3"];
```

En ese mismo archivo también puedes ajustar el precio (`PRECIO_UNITARIO`), los datos de
Yappy, el texto de la causa y la sensibilidad del detector de duplicados (`UMBRAL_DUPLICADO`).

## 4. Desplegar en Vercel

1. Sube el proyecto a un repo de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. Vercel detecta Vite automáticamente (Build: `vite build`, Output: `dist`).
4. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
5. **Deploy**. Comparte el link con los otros 2 vendedores y listo.

> Alternativa por CLI: `npm i -g vercel && vercel` (te pedirá las variables) y luego
> `vercel --prod`.

---

## 🔗 Links

- **App (deploy):** https://tres-leches-pedidos.vercel.app
- **Repo:** https://github.com/tommyhanono/tres-leches-pedidos

## 🔒 Nota de seguridad

No hay autenticación: **cualquiera con el link puede ver y editar** los pedidos. Es
intencional para este caso de uso (uso interno entre 3 personas). No compartas el link
públicamente.

## 📁 Estructura

```
tres-leches-pedidos/
├─ supabase.sql              # SQL: tabla + RLS + bucket + realtime
├─ .env.example              # plantilla de variables de entorno
├─ index.html
├─ src/
│  ├─ config.js              # ← nombres, precio, datos de pago
│  ├─ supabaseClient.js
│  ├─ App.jsx                # estado + realtime
│  ├─ index.css              # paleta cálida, mobile-first
│  ├─ lib/
│  │  ├─ ahash.js            # hash perceptual de comprobantes
│  │  └─ utils.js            # moneda, fechas, export CSV
│  └─ components/
│     ├─ SelectorVendedor.jsx
│     ├─ Header.jsx
│     ├─ Dashboard.jsx
│     ├─ PedidoCard.jsx
│     ├─ NuevoPedido.jsx
│     └─ VerComprobante.jsx
└─ README.md
```
