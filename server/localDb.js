const Datastore = require('nedb-promises');
const path = require('path');

const dbFactory = (fileName) => Datastore.create({
    filename: path.join(__dirname, '../data', fileName),
    autoload: true,
    timestampData: true
});

module.exports = {
    expenses: dbFactory('expenses.db'),
    employeeExtensions: dbFactory('employee_extensions.db'),
    increments: dbFactory('increments.db')
};
