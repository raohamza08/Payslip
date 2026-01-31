const supabase = require('./server/supabase');

(async () => {
    try {
        console.log('--- Checking Storage Buckets ---');
        const { data: buckets, error: bError } = await supabase.storage.listBuckets();
        if (bError) console.error('Error listing buckets:', bError);
        else {
            console.log('Buckets:', buckets.map(b => b.name));
            if (!buckets.find(b => b.name === 'payslips')) {
                console.error('CRITICAL: "payslips" bucket is MISSING.');
            } else {
                console.log('PASS: "payslips" bucket exists.');
            }
        }

        console.log('\n--- Checking Payslips Table Schema ---');
        // valid check: try to insert a dummy record with all columns and see if it fails on schema
        // actually, we can just select specific columns
        const { data, error: sError } = await supabase.from('payslips').select('id, notes, leaves, net_pay_words').limit(1);
        if (sError) {
            console.error('Error selecting columns:', sError);
            console.log('Hint: If error says "column does not exist", that is the issue.');
        } else {
            console.log('PASS: Columns (notes, leaves, net_pay_words) seem to exist (select worked).');
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
})();
