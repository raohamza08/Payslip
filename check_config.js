const supabase = require('./server/supabase');

(async () => {
    try {
        console.log('--- Checking app_config ---');
        // Check if table exists and get a row
        const { data, error } = await supabase.from('app_config').select('*');
        if (error) {
            console.error('Error selecting app_config:', error);
        } else {
            console.log('app_config exists. Rows:', data.length);
            if (data.length > 0) {
                console.log('Keys present:', data.map(d => d.key));
                const defaults = data.find(d => d.key === 'payroll_defaults');
                if (defaults) {
                    console.log('Found payroll_defaults.');
                    console.log('Type of value:', typeof defaults.value);
                    if (typeof defaults.value === 'string') console.log('Value is string (might need parsing?)');
                    else console.log('Value is object (JSONB confirmed)');

                    // Show a snippet
                    console.log('Snippet:', JSON.stringify(defaults.value).substring(0, 100));
                } else {
                    console.log('payroll_defaults key OPT missing.');
                }
            }
        }
    } catch (e) {
        console.error('Unexpected:', e);
    }
})();
