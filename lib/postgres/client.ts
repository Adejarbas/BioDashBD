/**
 * Pool compartilhado do PostgreSQL (Azure Database for PostgreSQL Flexible Server)
 * Importar este módulo em todas as rotas que precisam de DB.
 */
import { Pool } from 'pg';
import logger from "@/lib/logger-winston";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error (BioDashBD)', { error: err.message });
});

export default pool;
