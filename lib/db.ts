import postgres from 'postgres';

if (!process.env.LEGISCAN_DB_URL) {
  throw new Error('LEGISCAN_DB_URL environment variable is required');
}

const sql = postgres(process.env.LEGISCAN_DB_URL, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idle_timeout: 20
});

export default sql;

