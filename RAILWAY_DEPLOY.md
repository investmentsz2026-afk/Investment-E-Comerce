# Guía de Despliegue en Railway (Frontend + Backend + PostgreSQL)

Tu proyecto **American Colt JEANS™** está 100% preparado para ejecutarse en **Railway** con base de datos PostgreSQL nativa (o Neon), sin registros de simulación ni cuentas de prueba.

---

## 1. Preparar servicios en Railway

1. Crea un proyecto nuevo en [railway.app](https://railway.app).
2. Haz clic en **+ Create → Database → Add PostgreSQL**.
3. Haz clic en **+ Create → GitHub Repo** y selecciona tu repositorio.
4. En **Variables** del servicio Next.js (Backend + Frontend):
   * `DATABASE_URL` → Vincula la variable de tu PostgreSQL de Railway (`${{Postgres.DATABASE_URL}}`).
   * `NEXT_PUBLIC_SITE_URL` → La URL pública asignada por Railway (ej. `https://tu-tienda.up.railway.app` o tu dominio propio).
   * `ENABLE_PAYMENT_SANDBOX` → `false` en producción real (`true` solo si quieres modo pruebas).
   * `NODE_ENV` → `production`.
   * *(Opcional)* Tus llaves de `RESEND_API_KEY`, `MERCADOPAGO_*` / `CULQI_*`, `SUNAT_PSE_*` y datos de contacto `NEXT_PUBLIC_*` según [.env.example](./.env.example).

---

## 2. Subir el esquema y migrar SOLO los datos limpios

Desde tu computadora (en la carpeta `d:\InvestementPag`), copia la **URL pública** (`DATABASE_PUBLIC_URL`) de tu PostgreSQL en Railway (pestaña *Variables* o *Connect* del servicio Postgres en Railway) y ejecuta en PowerShell:

```powershell
# 1. Crear todas las tablas en el PostgreSQL de Railway
$env:DATABASE_URL="postgresql://postgres:TU_CLAVE@HOST_PUBLICO.rlwy.net:PUERTO/railway"
npx drizzle-kit push --force

# 2. Copiar SOLO admin principal + productos + categorías + imágenes + secciones (CERO pruebas)
Remove-Item Env:DATABASE_URL
npx tsx --env-file=.env.local scripts/migrate-clean-to-railway.ts "postgresql://postgres:TU_CLAVE@HOST_PUBLICO.rlwy.net:PUERTO/railway"
```

### ¿Qué pasa a Railway y qué se excluye?
* **Se transfiere íntegro:**
  * Tu usuario Administrador principal (`admin@investments.pe` con tu contraseña actual).
  * Todos los **productos reales activos**, sus variantes (tallas/colores/stock), precios (minorista y mayorista) e imágenes.
  * Todas las **categorías**, **promociones**, **tiendas físicas** y **zonas de envío**.
  * Todas las **secciones editables del Home** (Portada Principal, Explora Nuestras Líneas, Lookbook B2B 3D, Marca Oficial Peruana) e **imágenes subidas en BD** (`media_assets`).
* **NO se transfiere (queda completamente limpio):**
  * Ninguna cuenta de usuario/empresa de prueba ni auditores de test.
  * Ninguna solicitud de cuenta empresarial (`business_applications`).
  * Ningún pedido, carrito, cotización, devolución ni log de auditoría de pruebas.

*(Opcional)* Si deseas crear un nuevo usuario administrador en Railway desde cero:
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CLAVE@HOST_PUBLICO.rlwy.net:PUERTO/railway"
npx tsx scripts/create-admin.ts "correo@tuempresa.pe" "TuClaveSegura123*" "Nombre" "Apellido"
```

---

## 3. Verificación automática en Railway

El archivo [railway.json](./railway.json) configura automáticamente:
* Build con `RAILPACK` (`npm run build`).
* Arranque con `npm run start`.
* Healthcheck en `/api/health` verificando servidor + conexión a PostgreSQL.
