const mysql = require('mysql');

const conn = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '123456',
  database: 'mri'
}); 
 
conn.connect(function(err) {
  if (err) throw err;
  console.log('数据库连接成功');
});

module.exports = conn;
