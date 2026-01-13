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
    increments: dbFactory('increments.db'),
    employees: dbFactory('employees.db'),
    attendance: dbFactory('attendance.db'),
    leaveRequests: dbFactory('leave_requests.db'),
    performanceReviews: dbFactory('performance_reviews.db'),
    assets: dbFactory('assets.db'),
    warnings: dbFactory('warnings.db')
};
