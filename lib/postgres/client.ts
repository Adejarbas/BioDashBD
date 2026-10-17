/**
 * Pool compartilhado do PostgreSQL (Azure Database for PostgreSQL Flexible Server)
 * Importar este módulo em todas as rotas que precisam de DB.
 */
import { Pool, PoolConfig } from 'pg';

function getPoolConfig(): PoolConfig {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    return {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  let sanitizedUrl = connectionString;
  let useSsl = true;

  try {
    const parsedUrl = new URL(connectionString);
    const sslmode = parsedUrl.searchParams.get('sslmode');

    // Desativa SSL se explicitamente desativado ou se localhost sem sslmode
    if (sslmode === 'disable') {
      useSsl = false;
    } else if ((parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') && !sslmode) {
      useSsl = false;
    }

    // Removemos os parâmetros de SSL da URL para que o pg-connection-string não
    // sobrescreva a configuração ssl com {}, o que força rejectUnauthorized: true
    // no Node.js e causa SELF_SIGNED_CERT_IN_CHAIN com Azure PostgreSQL / Supabase.
    parsedUrl.searchParams.delete('sslmode');
    parsedUrl.searchParams.delete('ssl');
    sanitizedUrl = parsedUrl.toString();
  } catch {
    sanitizedUrl = connectionString
      .replace(/[?&]sslmode=[^&]+/g, (m) => (m.startsWith('?') ? '?' : ''))
      .replace(/[?&]ssl=[^&]+/g, (m) => (m.startsWith('?') ? '?' : ''))
      .replace(/\?$/, '');
  }

  return {
    connectionString: sanitizedUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  console.error('🔴 PostgreSQL pool error (BioDashBD):', err.message);
});

export default pool;
