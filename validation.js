const { check } = require('express-validator');

exports.signupValidation = [
  check('name', '请输入用户名').not().isEmpty(),
  check('email', '请输入合法的邮箱').isEmail(),
  check('password', '密码至少是6位哦').isLength({ min: 6 })
]

exports.loginValidation = [
  check('email', '请输入合法的邮箱').isEmail(),
  check('password', '密码至少是6位哦').isLength({ min: 6 })
]
