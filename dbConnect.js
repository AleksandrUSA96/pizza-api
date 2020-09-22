const mysql = require('mysql');

const conn = mysql.createConnection({
    host: `nodepizza.czrwnvxdvk8z.us-east-2.rds.amazonaws.com`,
    user: 'root',
    database: 'nodepizza',
    password: '318320USAsasha'
});

conn.connect(err => {
    if (err) {
        console.log(err);
        return err;
    } else {
        console.log('Database ----> ok? ...ok.');
    }
});

module.exports = conn;