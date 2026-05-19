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
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name, section')
    .eq('school_id', 'f6ec245b-1c7e-430d-9d8b-427e09d82e16');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log("ALi Grammer School classes count:", classes.length);
  // Group by name
  const grouped = {};
  classes.forEach(c => {
    grouped[c.name] = (grouped[c.name] || 0) + 1;
  });
  console.log("Grouped class names:", grouped);
}
inspect();
