const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (url && serviceRoleKey) {
  supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  console.warn(
    '[db] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY חסרים — עובד עם מאגר נתונים זמני בזיכרון. ' +
      'הנתונים לא יישמרו! הוסיפו את המפתחות ל-.env (ראו README).'
  );
}

module.exports = { supabase };
