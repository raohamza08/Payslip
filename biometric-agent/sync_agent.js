const ZKLib = require('node-zklib');
const fetch = require('node-fetch');

// --- CONFIGURATION ---
const DEVICES = [
    { ip: '192.168.1.206', direction: 'IN', name: 'Main Entry' },
    { ip: '192.168.1.205', direction: 'OUT', name: 'Main Exit' }
];

const API_ENDPOINT = 'http://localhost:3000/api/biometric/sync'; // Update this to your deployed URL
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 Minutes
const ADMIN_EMAIL = 'admin@euroshub.com'; // Used for x-user-email header

async function syncDevice(device) {
    console.log(`[${new Date().toLocaleString()}] Connecting to ${device.name} (${device.ip})...`);

    let zk = new ZKLib(device.ip, 4370, 10000, 4000);
    try {
        await zk.createSocket();

        // Get logs
        const logs = await zk.getAttendance();
        console.log(`[${device.name}] Fetched ${logs.data.length} logs.`);

        if (logs.data.length > 0) {
            // Push to Server
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': ADMIN_EMAIL
                },
                body: JSON.stringify({
                    logs: logs.data,
                    direction: device.direction
                })
            });

            if (response.ok) {
                console.log(`[${device.name}] Successfully synced logs to server.`);
                // zk.clearAttendanceLog(); // Uncomment once you verify sync is 100% reliable
            } else {
                const error = await response.json();
                console.error(`[${device.name}] Server Error:`, error);
            }
        }
    } catch (e) {
        console.error(`[${device.name}] Connection failed:`, e.message);
    } finally {
        try { await zk.disconnect(); } catch (e) { }
    }
}

async function runInitialSync() {
    console.log("=== EurosHub Biometric Sync Agent Started ===");
    for (const device of DEVICES) {
        await syncDevice(device);
    }
}

// Initial Run
runInitialSync();

// Scheduled Run
setInterval(async () => {
    for (const device of DEVICES) {
        await syncDevice(device);
    }
}, SYNC_INTERVAL_MS);
