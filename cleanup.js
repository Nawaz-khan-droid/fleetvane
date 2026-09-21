const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.dazltmarinusghfugsux:Leo9NU3OaJJ7okim@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    const resTokens = await client.query(`
      DELETE FROM refresh_tokens WHERE user_id IN (
        SELECT id FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com')
      )
    `);
    console.log(`Deleted ${resTokens.rowCount} tokens`);

    const resShipments = await client.query(`
      DELETE FROM shipments WHERE client_id IN (
        SELECT id FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com')
      )
    `);
    console.log(`Deleted ${resShipments.rowCount} shipments`);
    
    // Check if driver profiles exist
    try {
      const resDrivers = await client.query(`
        DELETE FROM driver_profiles WHERE user_id IN (
          SELECT id FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com')
        )
      `);
      console.log(`Deleted ${resDrivers.rowCount} drivers`);
    } catch (e) { }

    const resUsers = await client.query(`
      DELETE FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com')
    `);
    console.log(`Deleted ${resUsers.rowCount} users`);

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
