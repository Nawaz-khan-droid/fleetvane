const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new Client({ connectionString: 'postgres://postgres.dazltmarinusghfugsux:Leo9NU3OaJJ7okim@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });
  await client.connect();

  try {
    // 1. Delete nawazkhanofficialac@gmail.com (handling foreign keys)
    const emailToDelete = 'nawazkhanofficialac@gmail.com';
    const resUser = await client.query("SELECT id FROM users WHERE email = $1", [emailToDelete]);
    if (resUser.rows.length > 0) {
      const userId = resUser.rows[0].id;
      console.log(`Deleting user ${emailToDelete} with ID ${userId}...`);
      
      // Delete from driver_profiles
      await client.query("DELETE FROM driver_profiles WHERE user_id = $1", [userId]);
      // Delete from tokens
      await client.query("DELETE FROM invitation_tokens WHERE user_id = $1", [userId]);
      // Delete user
      await client.query("DELETE FROM users WHERE id = $1", [userId]);
      console.log(`Successfully deleted ${emailToDelete}.`);
    } else {
      console.log(`User ${emailToDelete} not found.`);
    }

    // 2. Fix client@fleetvane.com demo account
    const clientEmail = 'client@fleetvane.com';
    const clientPass = 'Client123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(clientPass, salt);
    
    // Check if client exists
    const resClient = await client.query("SELECT id FROM users WHERE email = $1", [clientEmail]);
    if (resClient.rows.length > 0) {
      await client.query("UPDATE users SET password_hash = $1, status = 'ACTIVE' WHERE email = $2", [hash, clientEmail]);
      console.log(`Updated existing ${clientEmail} password to ${clientPass}.`);
    } else {
      await client.query(`INSERT INTO users (email, name, role, status, password_hash, company_id) 
                          VALUES ($1, $2, 'CLIENT', 'ACTIVE', $3, 1)`, 
                          [clientEmail, 'Demo Client', hash]);
      console.log(`Created missing ${clientEmail} account.`);
    }
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
