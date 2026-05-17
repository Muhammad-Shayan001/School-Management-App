import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  console.log('Checking Storage Buckets...');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error('Error listing buckets:', bErr);
  } else {
    console.log('Buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  console.log('\nChecking Policies on storage.objects...');
  const { data: policies, error: pErr } = await supabase
    .rpc('get_policies', { table_name: 'objects', schema_name: 'storage' });
  
  if (pErr) {
    // If RPC doesn't exist, try direct query on pg_policies
    const { data: pgPolicies, error: pgErr } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');
    
    if (pgErr) {
        console.error('Error fetching policies:', pgErr);
    } else {
        console.log('Existing Policies (storage.objects):');
        pgPolicies.forEach(p => console.log(`- ${p.policyname}: ${p.cmd} (${p.qual})`));
    }
  } else {
    console.log('Policies:', policies);
  }
}

checkStorage();
