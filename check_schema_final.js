const supabase = require('./server/supabase');

async function check() {
    try {
        const { data, error } = await supabase.from('employees').select('cnic').limit(1);
        if (error) {
            console.log('Check Result: ERROR - ' + error.message);
        } else {
            console.log('Check Result: SUCCESS - Column exists');
        }
    } catch (e) {
        console.log('Check Result: EXCEPTION - ' + e.message);
    }
}

check();
