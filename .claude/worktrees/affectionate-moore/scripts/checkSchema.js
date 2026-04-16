import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://naoygdqjlkreypjwzqex.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LnXGomnboVp61covNL6lRQ_yLoeMN7_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  try {
    // Try to get one event to see the structure
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Sample event structure:', JSON.stringify(data, null, 2));
      if (data && data.length > 0) {
        console.log('\nColumns found:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();

