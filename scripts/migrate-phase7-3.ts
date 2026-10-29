/**
 * Migración segura para la Fase 7.3 de INVESTMENTS:
 * - Crea la tabla `user_favorites` para favoritos persistentes de usuarios autenticados.
 * - Crea la tabla `newsletter_subscribers` para suscripción al boletín en base de datos.
 * - Asegura que los productos activos del catálogo en PostgreSQL no tengan `is_demo = true` residual.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Falta DATABASE_URL en .env.local");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id serial PRIMARY KEY NOT NULL,
      email varchar(255) NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers USING btree (email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id serial PRIMARY KEY NOT NULL,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_product_idx ON user_favorites USING btree (user_id, product_id)`;
  await sql`CREATE INDEX IF NOT EXISTS user_favorites_user_idx ON user_favorites USING btree (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS user_favorites_product_idx ON user_favorites USING btree (product_id)`;

  await sql`UPDATE products SET is_demo = false, is_featured = true WHERE status = 'active'`;

  const rows = await sql`
    SELECT id, slug, name, is_featured, is_demo, status
    FROM products
    WHERE status = 'active'
    ORDER BY sort_order ASC, id ASC
  `;
  console.log(`✅ Migración Fase 7.3 completada. Productos activos en base de datos: ${rows.length}`);
  for (const r of rows) {
    console.log(`  - [${r.id}] ${r.slug} | ${r.name} (featured: ${r.is_featured}, demo: ${r.is_demo})`);
  }
}

main().catch((err) => {
  console.error("❌ Error en migración Fase 7.3:", err);
  process.exit(1);
});
