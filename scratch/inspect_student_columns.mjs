import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envConfig = String(readFileSync('.env.local'))
  .split('\n')
  .reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data, error } = await supabase
    .rpc('get_table_columns', { table_name: 'student_profiles' });

  if (error) {
    // If helper function doesn't exist, query query_to_json or a simple record to inspect properties
    const { data: record, error: rErr } = await supabase.from('student_profiles').select('*').limit(1);
    if (rErr) {
      console.error(rErr);
    } else {
      console.log("student_profiles columns:", Object.keys(record[0] || {}));
    }
  } else {
    console.log("Columns:", data);
  }
}
inspect();
