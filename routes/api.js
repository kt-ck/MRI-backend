const express = require('express');
const router = express.Router();
const db = require('../dbConnect');
const { signupValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const process = require("process");
const spawn = require("child_process").spawn;
const JWT_SECRET = 'my-secret';

const getAllfile = function(dir, files, index){
  fileList = fs.readdirSync(dir)
  files = files || []
  index = index || 0
  fileList.forEach((file)=>{
    if(fs.statSync(dir + "/" + file).isDirectory()){
      obj = getAllfile(dir + "/" + file, files, index)
      files = obj["files"]
      index = obj["index"]
    }else{
      index = index + 1
      files.push({"id": index, "part": dir.split("/").pop(), "xpr_name": file})
    }
  })
  return {files,index}
}

router.post('/register', signupValidation, (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(email)});`,(err, result) => {
        if (result.length) {
          return res.status(409).send({
            msg: '邮箱已被注册'
          });
        } else {
          // 如果可以注册，
          bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
              return res.status(500).send({
                msg: err
              });
            } else {
              // 密码加密后，存入数据库
              db.query(`INSERT INTO users (name, email, password) VALUES ('${name}', ${db.escape(email)}, ${db.escape(hash)})`,
                (err, result) => {
                  if (err) {
                    return res.status(400).send({
                      msg: err
                    });
                  }
                  return res.status(201).send({
                    msg: '用户注册成功'
                  });
                }
              );
            }
          });
        }
      }
    );
  });
  
  router.post('/login', loginValidation, (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body)
    console.log(email, password)
    db.query(
      `SELECT * FROM users WHERE email = ${db.escape(email)};`,
      (err, result) => {
        // 用户不存在
        if (err) {
          // throw err;
          return res.status(400).send({
            msg: err
          });
        }
        if (!result.length) {
          return res.status(401).send({
            msg: '用户名或密码错误'
          });
        }
        // 检查密码是否正确
        bcrypt.compare(
          password,
          result[0]['password'],
          (bErr, bResult) => {
            // 密码错误
            if (bErr) {
              // throw bErr;
              return res.status(401).send({
                msg: '用户名或密码错误'
              });
            }
            if (bResult) {
              const token = jwt.sign({ id: result[0].id }, JWT_SECRET, { expiresIn: '1h' });
              db.query(
                `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
              );
              return res.status(200).send({
                msg: '登陆成功',
                token,
                user: result[0]
              });
            }
            return res.status(401).send({
              msg: '用户名或密码错误'
            });
          }
        );
      }
    );
  });
  
  router.post('/patients/get', signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const key = req.body.key;
    const value = req.body.value;
    let sql = `SELECT * FROM patients where userid=${userid} ${key !== undefined ? `AND ${key}=${value}`:""}`;
    if (key === "name" || key === "sex" || key === "age"){
       sql = `SELECT * FROM patients where userid=${userid} ${key !== undefined ? `AND ${key}='${value}'`:""}`
    }
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });

  router.post('/patients/add', signupValidation, (req, res, next) =>{
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const name = req.body.name;
    const sex = req.body.sex;
    const age = req.body.age;
    const height = req.body.height;
    const weight = req.body.weight;
    let userid = decoded.id;
    console.log(name, sex, age, height, weight, userid)
    console.log(`INSERT INTO paitents(name, sex, age, height, weight, userid) VALUES ('${name}', '${sex}', '${age}', ${height}, ${weight},${userid})`)
    db.query(`INSERT INTO patients(name, sex, age, height, weight, userid) VALUES ('${name}', '${sex}', '${age}', ${height}, ${weight},${userid})`,
    function(err, results){
      if (err) {
        return res.status(400).send({
          msg: err
        });
      }
      return res.send({
        msg: '用户插入成功'
      });
    })
  })

  router.post('/patients/delete', signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const patientid = req.body.id;
    let sql = `Delete FROM patients where userid=${userid} AND id=${patientid}`;
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });

  router.post('/patients/modify', signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const patientid = req.body.id;
    let sql = `UPDATE patients SET name='${req.body.name}', sex='${req.body.sex}', age='${req.body.age}', height=${req.body.height}, weight=${req.body.weight} Where id=${patientid} AND userid=${userid}`;
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });

  router.post("/recorder",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const patientid = req.body.id;

    let sql;
    if (patientid){
      sql = `SELECT id,DATE_FORMAT(time,'%Y-%m-%d %H:%i:%S') as time,path,patientid FROM recorders WHERE patientid=${patientid}`; 
    }else{
      sql = `SELECT id,DATE_FORMAT(time,'%Y-%m-%d %H:%i:%S') as time,path,patientid FROM recorders`;
    }
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });
  router.post("/recorder/deleteLog",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const recorderid = req.body.recorderid;

    let sql;
    if (recorderid){
      sql = `Delete FROM recorders where id=${recorderid}`; 
    }
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });

  router.post("/recorder/filterByDate",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const calendarValue = req.body.calendarValue;
    let sql;
    if(calendarValue){
      const beginDate = calendarValue[0].split('T')[0] + "T00:00:00.000Z";
      const endDate = calendarValue[1].split('T')[0] + "T00:00:00.000Z";
      sql = `SELECT id,DATE_FORMAT(time,'%Y-%m-%d %H:%i:%S') as time,path,patientid FROM recorders WHERE time BETWEEN date_add("${beginDate}",interval 1 day) AND date_add("${endDate}",interval 1 day);`; 
    }else{
      return
    }
    console.log(sql)
    db.query(sql, function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: '请求成功' });
    });
  });
  router.post("/mricontrol/readxpr",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    
    let base_dir = "./mri/xpr";
    let fileInfo = getAllfile(base_dir)
    
    return res.send({ data: fileInfo, message: '请求成功' });
    
  });
  router.post("/mricontrol/getXprInfo",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const rowdata = req.body.rowdata;
    // console.log(rowdata)

    return res.send({ data: {}, message: '请求成功' });
    
  });
  router.post("/imgProcess/getDcmImg",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;
    const person = "ck"
    const pythonProcess = spawn('python',["./pythonFile/DcmToPng.py", person]);
    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
      return res.send({ data: getAllfile('./mri/dcm/out/' + person)["files"], message: '请求成功' });
    });
  })

  router.get("/imgProcess/mri-img", (req, res) => {
    let person = req.query.person;
    let file = req.query.file
    fs.readFile(`./mri/dcm/out/${person}/${file}`, function(err,data){
            res.writeHead(200,{'Content-Type':'image/png'});
            res.end(data);
    });
  })

  router.post("/imgProcess/getDcmFile",signupValidation, (req, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('MRI') ||
      !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "缺少Token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, JWT_SECRET);
    const userid = decoded.id;

    let obj = getAllfile("./mri/dcm/Persons")
    return res.send({error: false, data: obj, message: '请求成功' });
  })

module.exports = router;
