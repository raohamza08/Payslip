export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        alert('No data to export');
        return;
    }

    // Get all unique keys from all objects (in case some objects have missing keys)
    const allKeys = new Set();
    data.forEach(obj => Object.keys(obj).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);

    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            let val = row[fieldName];
            if (val === null || val === undefined) val = '';
            // If value is object/array, stringify it
            if (typeof val === 'object') val = JSON.stringify(val);
            val = val.toString().replace(/"/g, '""'); // Escape quotes
            if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`; // Quote field if needed
            return val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
