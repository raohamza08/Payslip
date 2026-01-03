const Datastore = require('nedb-promises');
const path = require('path');
const os = require('os');
const fs = require('fs');

// DATA PATH SELECTION
// In standard Node environment, we don't have 'app.getPath'.
// We'll use a local 'data' folder for portability, or fallback to User Home.

const IS_ELECTRON = process.versions.electron !== undefined;

let userDataPath;

if (IS_ELECTRON) {
    const { app } = require('electron');
    userDataPath = app.getPath('userData');
} else {
    // Web Server Mode
    // Use a folder named 'payslip-data' in the user's home directory
    // OR just a local 'data' folder in the project for simplicity
    userDataPath = path.join(process.cwd(), 'data');
}

// Ensure dir exists
if (!fs.existsSync(userDataPath)) {
    try {
        fs.mkdirSync(userDataPath, { recursive: true });
    } catch {
        // Fallback to tmp if write permission fails
        userDataPath = os.tmpdir();
    }
}

console.log(`Database storage path: ${userDataPath}`);

const db = {
    config: Datastore.create({ filename: path.join(userDataPath, 'config.db'), autoload: true }),
    employees: Datastore.create({ filename: path.join(userDataPath, 'employees.db'), autoload: true }),
    payslips: Datastore.create({ filename: path.join(userDataPath, 'payslips.db'), autoload: true }),
    attendance: Datastore.create({ filename: path.join(userDataPath, 'attendance.db'), autoload: true })
};

module.exports = db;
