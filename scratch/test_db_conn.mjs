import pkg from 'pg';
const { Client } = pkg;

async function test() {
  const passwords = ['Superadmin123@', 'vnfojlxtztczntem'];
  const projectId = 'xtwknrpdprvqkrqlqfel';
  
  for (const pwd of passwords) {
    const escPwd = encodeURIComponent(pwd);
    // Try direct host
    const connectionString = `postgres://postgres:${escPwd}@db.${projectId}.supabase.co:5432/postgres`;
    const client = new Client({ connectionString });
    
    try {
      console.log(`Trying direct password: ${pwd}`);
      await client.connect();
      console.log(`✅ Success! Database connected with password: ${pwd}`);
      
      const res = await client.query('SELECT NOW()');
      console.log('Result:', res.rows[0]);
      
      await client.end();
      return;
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  console.log('Could not connect to database with direct credentials.');
}

test();
