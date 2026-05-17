
import { createClient } from './src/app/_lib/supabase/server.js';
import { createAdminClient } from './src/app/_lib/supabase/admin.js';

async function check() {
  const admin = createAdminClient();
  const { data, error } = await admin.from('announcements').select('*').limit(1);
  if (error) {
    console.error('Error fetching announcements:', error);
  } else if (data && data.length > 0) {
    console.log('Announcement columns:', Object.keys(data[0]));
  } else {
    console.log('No announcements found to check columns.');
  }
}

check();
