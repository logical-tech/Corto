import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { pool } from "./db"
import { env } from "./env"

const client = await pool.connect()
const migrationDb = drizzle(client)

await migrationDb.execute(
  sql`SELECT pg_advisory_lock(hashtext('shorts:migrate'))`
)

try {
  await migrate(migrationDb, {
    migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
  })
  await migrationDb.execute(sql`
    UPDATE "user"
    SET "role" = 'admin'
    WHERE lower("email") = ${env.ADMIN_EMAIL}
      AND "role" IS DISTINCT FROM 'admin'
  `)
  console.log("Migrations complete")
} finally {
  await migrationDb.execute(
    sql`SELECT pg_advisory_unlock(hashtext('shorts:migrate'))`
  )
  client.release()
  await pool.end()
}
