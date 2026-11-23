/**
 * Migración limpia de datos reales de producción hacia Railway PostgreSQL.
 *
 * Qué SÍ transfiere (conservando IDs e imágenes):
 *   - Administrador principal (admin@investments.pe — SIN cuentas de prueba ni auditores)
 *   - Imágenes subidas en BD (`media_assets`)
 *   - Categorías (`categories`)
 *   - Productos reales, imágenes, variantes y precios (`products`, `product_images`, `product_variants`, `product_prices`)
 *   - Secciones editables del Home (`hero_slides`, `home_line_slides`, `lookbook_slides`, `ecommerce_showcase_config`)
 *   - Promociones (`promotions`), Tiendas Físicas (`physical_stores`) y Zonas de Envío (`shipping_zones`)
 *
 * Qué NO transfiere (deja 100% limpio para producción en Railway):
 *   - Usuarios de prueba, clientes de simulación ni cuentas pendientes/aprobadas de test
 *   - Solicitudes empresariales (`business_applications`)
 *   - Pedidos de prueba, pagos, comprobantes, carritos, cotizaciones, devoluciones, sesiones ni logs de auditoría
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/migrate-clean-to-railway.ts "<RAILWAY_DATABASE_PUBLIC_URL>"
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });

type DbClient = ReturnType<typeof drizzleNeon<typeof schema>>;

function connectDb(url: string): { db: DbClient; close: () => Promise<void> } {
  if (url.includes("neon.tech")) {
    const client = neon(url);
    return {
      db: drizzleNeon({ client, schema }),
      close: async () => {},
    };
  }
  const pool = new Pool({
    connectionString: url,
    ssl:
      url.includes("localhost") || url.includes("127.0.0.1") || url.includes("railway.internal")
        ? false
        : { rejectUnauthorized: false },
  });
  return {
    db: drizzlePg({ client: pool, schema }) as unknown as DbClient,
    close: async () => {
      await pool.end();
    },
  };
}

async function resetSerialSequence(targetDb: DbClient, tableName: string) {
  await targetDb.execute(
    sql.raw(
      `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), (SELECT COUNT(*) > 0 FROM "${tableName}"));`,
    ),
  );
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL?.trim();
  const targetUrl = (process.argv[2] ?? process.env.TARGET_DATABASE_URL ?? "").trim();

  if (!sourceUrl) {
    console.error("❌ Falta DATABASE_URL de origen en .env.local.");
    process.exit(1);
  }
  if (!targetUrl) {
    console.error("❌ Debes pasar la URL pública de PostgreSQL de Railway como argumento:");
    console.error(
      '   npx tsx --env-file=.env.local scripts/migrate-clean-to-railway.ts "postgresql://postgres:...@...rlwy.net:PORT/railway"',
    );
    process.exit(1);
  }
  if (sourceUrl === targetUrl) {
    console.error("❌ Seguridad: La URL de origen y destino son iguales. Operación abortada.");
    process.exit(1);
  }

  console.log("🚀 Conectando a base de origen (actual) y destino (Railway)...");
  const source = connectDb(sourceUrl);
  const target = connectDb(targetUrl);

  try {
    // Verificar que el esquema ya fue creado en Railway
    await target.db.execute(sql`SELECT 1 FROM categories LIMIT 1`).catch(() => {
      throw new Error(
        'Las tablas aún no existen en Railway. Ejecuta primero: $env:DATABASE_URL="<URL_RAILWAY>"; npx drizzle-kit push --force',
      );
    });

    // Verificar que el destino no tenga pedidos/clientes reales previos para evitar sobrescrituras accidentales
    const existingTargetOrders = await target.db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .limit(1);
    if (existingTargetOrders.length > 0 && !process.argv.includes("--force")) {
      throw new Error(
        "La base de destino ya contiene pedidos. Si realmente deseas reiniciar y reimportar, ejecuta con --force.",
      );
    }

    // 1. Extraer ÚNICAMENTE datos limpios de origen
    const [
      mainAdmins,
      mediaRows,
      catRows,
      prodRows,
      promoRows,
      heroRows,
      lineRows,
      lookRows,
      cfgRows,
      storeRows,
      zoneRows,
    ] = await Promise.all([
      source.db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.role, "admin"),
            or(eq(schema.users.id, 1), eq(schema.users.email, "admin@investments.pe")),
          ),
        )
        .orderBy(asc(schema.users.id))
        .limit(1),
      source.db.select().from(schema.mediaAssets).orderBy(asc(schema.mediaAssets.id)),
      source.db.select().from(schema.categories).orderBy(asc(schema.categories.id)),
      source.db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.isDemo, false), ne(schema.products.status, "archived")))
        .orderBy(asc(schema.products.id)),
      source.db.select().from(schema.promotions).orderBy(asc(schema.promotions.id)),
      source.db.select().from(schema.heroSlides).orderBy(asc(schema.heroSlides.id)),
      source.db.select().from(schema.homeLineSlides).orderBy(asc(schema.homeLineSlides.id)),
      source.db.select().from(schema.lookbookSlides).orderBy(asc(schema.lookbookSlides.id)),
      source.db
        .select()
        .from(schema.ecommerceShowcaseConfig)
        .orderBy(asc(schema.ecommerceShowcaseConfig.id)),
      source.db.select().from(schema.physicalStores).orderBy(asc(schema.physicalStores.id)),
      source.db.select().from(schema.shippingZones).orderBy(asc(schema.shippingZones.id)),
    ]);

    const productIds = prodRows.map((p) => p.id);
    const [imgRows, varRows, priceRows] =
      productIds.length > 0
        ? await Promise.all([
            source.db
              .select()
              .from(schema.productImages)
              .where(inArray(schema.productImages.productId, productIds))
              .orderBy(asc(schema.productImages.id)),
            source.db
              .select()
              .from(schema.productVariants)
              .where(inArray(schema.productVariants.productId, productIds))
              .orderBy(asc(schema.productVariants.id)),
            source.db
              .select()
              .from(schema.productPrices)
              .where(inArray(schema.productPrices.productId, productIds))
              .orderBy(asc(schema.productPrices.id)),
          ])
        : [[], [], []];

    console.log("📦 Datos limpios extraídos de origen:");
    console.log(`   - Admin principal   : ${mainAdmins.length}`);
    console.log(`   - Imágenes media    : ${mediaRows.length}`);
    console.log(`   - Categorías        : ${catRows.length}`);
    console.log(`   - Productos reales  : ${prodRows.length} (${varRows.length} variantes, ${imgRows.length} fotos, ${priceRows.length} precios)`);
    console.log(`   - Promociones       : ${promoRows.length}`);
    console.log(`   - Portada (Hero)    : ${heroRows.length} slides`);
    console.log(`   - Nuestras Líneas   : ${lineRows.length} tarjetas`);
    console.log(`   - Lookbook / Marca  : ${lookRows.length} slides + ${cfgRows.length} configs`);
    console.log(`   - Tiendas / Envíos  : ${storeRows.length} tiendas, ${zoneRows.length} zonas`);

    // 2. Limpiar destino de posibles auto-seeds previos para conservar IDs exactos
    console.log("\n🧹 Preparando destino limpio en Railway (0 datos de simulación)...");
    await target.db.delete(schema.productPrices);
    await target.db.delete(schema.productVariants);
    await target.db.delete(schema.productImages);
    await target.db.delete(schema.products);
    await target.db.delete(schema.categories);
    await target.db.delete(schema.promotions);
    await target.db.delete(schema.heroSlides);
    await target.db.delete(schema.homeLineSlides);
    await target.db.delete(schema.lookbookSlides);
    await target.db.delete(schema.ecommerceShowcaseConfig);
    await target.db.delete(schema.physicalStores);
    await target.db.delete(schema.shippingZones);
    await target.db.delete(schema.mediaAssets);
    await target.db.delete(schema.users);

    // 3. Insertar datos limpios en destino
    if (mainAdmins.length > 0) {
      await target.db.insert(schema.users).values(mainAdmins);
    }
    if (mediaRows.length > 0) {
      await target.db.insert(schema.mediaAssets).values(mediaRows);
    }
    if (catRows.length > 0) {
      // Insertar primero categorías padre y luego hijas para respetar parentId FK
      const parents = catRows.filter((c) => c.parentId === null);
      const children = catRows.filter((c) => c.parentId !== null);
      if (parents.length > 0) await target.db.insert(schema.categories).values(parents);
      if (children.length > 0) await target.db.insert(schema.categories).values(children);
    }
    if (prodRows.length > 0) {
      await target.db.insert(schema.products).values(prodRows);
    }
    if (imgRows.length > 0) {
      await target.db.insert(schema.productImages).values(imgRows);
    }
    if (varRows.length > 0) {
      // Insertar en lotes para no saturar límite de parámetros de PostgreSQL
      for (let i = 0; i < varRows.length; i += 200) {
        await target.db.insert(schema.productVariants).values(varRows.slice(i, i + 200));
      }
    }
    if (priceRows.length > 0) {
      await target.db.insert(schema.productPrices).values(priceRows);
    }
    if (promoRows.length > 0) {
      await target.db.insert(schema.promotions).values(promoRows);
    }
    if (heroRows.length > 0) {
      await target.db.insert(schema.heroSlides).values(heroRows);
    }
    if (lineRows.length > 0) {
      await target.db.insert(schema.homeLineSlides).values(lineRows);
    }
    if (lookRows.length > 0) {
      await target.db.insert(schema.lookbookSlides).values(lookRows);
    }
    if (cfgRows.length > 0) {
      await target.db.insert(schema.ecommerceShowcaseConfig).values(cfgRows);
    }
    if (storeRows.length > 0) {
      await target.db.insert(schema.physicalStores).values(storeRows);
    }
    if (zoneRows.length > 0) {
      await target.db.insert(schema.shippingZones).values(zoneRows);
    }

    // 4. Sincronizar secuencias SERIAL en PostgreSQL
    const serialTables = [
      "users",
      "media_assets",
      "categories",
      "products",
      "product_images",
      "product_variants",
      "product_prices",
      "promotions",
      "hero_slides",
      "home_line_slides",
      "lookbook_slides",
      "ecommerce_showcase_config",
      "physical_stores",
      "shipping_zones",
    ];
    for (const t of serialTables) {
      await resetSerialSequence(target.db, t);
    }

    console.log("\n✅ ¡Migración limpia a Railway completada con éxito!");
    console.log("   - Base de origen intacta.");
    console.log("   - Railway quedó con: 1 Admin, productos reales, categorías, imágenes y todas las secciones.");
    console.log("   - Cero solicitudes de empresa, cero pedidos de prueba, cero usuarios de simulación.");
  } finally {
    await source.close();
    await target.close();
  }
}

main().catch((err) => {
  console.error("❌ Error en la migración a Railway:", err);
  process.exit(1);
});
