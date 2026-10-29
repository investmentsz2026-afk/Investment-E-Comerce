# INVESTMENTS — E-commerce de moda premium

Plataforma de moda para el mercado peruano con dos modalidades de compra en una sola experiencia:
**B2C (por menor)** y **B2B (por mayor)**.

> **Estado actual: Fase 1** — arquitectura, identidad visual y experiencia de la página principal.
> Las funciones comerciales (catálogo, cuentas, carrito, pagos) aún **no están operativas** y la interfaz lo indica
> con avisos "Próximamente".

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript estricto |
| Estilos | Tailwind CSS v4 (tokens en `src/app/globals.css`) |
| Animación | Motion (`motion/react`) + CSS para bucles (marquee) |
| Iconos | lucide-react |
| Datos | Neon PostgreSQL + Drizzle ORM (preparado, sin tablas aún) |
| Tipografía | Instrument Serif (display) · Geist (UI) · Geist Mono (etiquetas) |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

> En Windows PowerShell con scripts deshabilitados, usa `npm.cmd` en lugar de `npm`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run typecheck` | Verificación de tipos (tsc) |
| `npm run lint` | ESLint (reglas de Next.js + TypeScript) |
| `npm run check` | typecheck + lint |
| `npm run format` | Prettier con orden de clases Tailwind |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle Kit (a partir de la Fase 2) |

## Arquitectura

```
src/
├─ app/                 Rutas, layout raíz, SEO (robots, sitemap, manifest, icon)
├─ assets/images/       Fotografía (importación estática → blur + dimensiones)
├─ components/
│  ├─ brand/            Logotipo
│  ├─ feedback/         Sistema de avisos "Próximamente" (aria-live)
│  ├─ home/             Secciones de la página principal
│  ├─ layout/           Header (mega menú, buscador, menú móvil, tab bar) y footer
│  ├─ motion/           Primitivas de animación reutilizables
│  ├─ product/          Tarjeta de producto
│  ├─ providers/        Proveedores globales (MotionConfig, avisos)
│  └─ ui/               Botones, acciones, encabezados de sección
├─ config/              Marca, navegación, medios y registro de funcionalidades (roadmap)
├─ data/demo/           ⚠️ Datos de demostración tipados (se reemplazan en Fase 2)
├─ hooks/               Hooks de overlays (scroll lock, Escape)
├─ lib/                 Utilidades: cn, formato PEN, sistema de movimiento
├─ server/              Solo servidor: env y cliente de base de datos (server-only)
└─ types/               Tipos de dominio (catálogo, navegación)
```

### Principios

- **Sin enlaces falsos**: cada destino es un ancla real o una funcionalidad registrada en `src/config/roadmap.ts`,
  que muestra un aviso honesto al activarse.
- **Sin datos inventados**: contacto y redes sociales se configuran por variables `NEXT_PUBLIC_*`; si faltan, no se muestran.
- **Secretos protegidos**: `DATABASE_URL` solo se lee en `src/server/*` (módulos `server-only`) y `.env.local` no se versiona.
- **Precios en céntimos** (`number`) y formato `es-PE` / `PEN` en `src/lib/format.ts`.
- **Movimiento responsable**: solo `transform`/`opacity`, `MotionConfig reducedMotion="user"` y reglas CSS para
  `prefers-reduced-motion`.

## Roadmap

1. ✅ **Fase 1** — Arquitectura, identidad visual y página principal
2. Fase 2 — Catálogo real, categorías, búsqueda, filtros y páginas de producto
3. Fase 3 — Autenticación, cuentas, registro empresarial y aprobación de mayoristas
4. Fase 4 — Carrito, reglas de precios mayoristas, mínimos y cotizaciones
5. Fase 5 — Checkout, pagos en Perú, pedidos y notificaciones
6. Fase 6 — Panel administrativo, inventario, clientes y reportes
7. Fase 7 — Optimización, pruebas, seguridad (CSP), SEO avanzado y despliegue

Origen y licencias de imágenes: [`docs/ASSETS.md`](docs/ASSETS.md).
