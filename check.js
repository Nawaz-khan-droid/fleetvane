const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres.dazltmarinusghfugsux:Leo9NU3OaJJ7okim@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query("SELECT id, email, status FROM users WHERE email='nawazkhanofficialac@gmail.com'"))
.then(res => { console.table(res.rows); process.exit(0); });
