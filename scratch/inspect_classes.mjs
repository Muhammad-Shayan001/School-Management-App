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
  const { data: schools } = await supabase.from('schools').select('id, name');
  const { data: classes } = await supabase.from('classes').select('id, name, section, school_id');

  for (const s of schools || []) {
    const sClasses = classes?.filter(c => c.school_id === s.id) || [];
    console.log(`School: ${s.name} (${s.id})`);
    console.log(`  Count of classes: ${sClasses.length}`);
    console.log(`  Classes:`, sClasses.map(c => `${c.name} (${c.section})`).join(', '));
  }
}
inspect();
