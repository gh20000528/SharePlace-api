const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator')
const HttpError = require('../models/http-error')

const DUMMY_USER = [
    {
        id: 'u1',
        name: 'han',
        email: 'text@gmail.com',
        password: '123123'
    }
]

const getUsers = (req, res ,next) => {
    res.json({users: DUMMY_USER})
}

const signup = (req, res ,next) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
      throw new HttpError('請檢查是否都有填寫', 422)
    }
    const { name, email, password } = req.body

    const hasUser = DUMMY_USER.find(u => u.email === email)
    if(hasUser){
        throw new HttpError('email已經被使用過了' , 422)
    }
    const createdUser = {
        id: uuidv4(),
        name,
        email,
        password
    }

    DUMMY_USER.push(createdUser)
    res.status(201).json({user: createdUser})
}

const login = (req, res ,next) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
      throw new HttpError('請檢查是否都有填寫', 422)
    }
    const {email, password} = req.body

    const identifiedUser = DUMMY_USER.find(u => u.email === email)
    if(! identifiedUser || identifiedUser.password !== password){
        throw new HttpError('輸入錯誤', 404)
    }

    res.status(201).json({message: "login"})
}

exports.getUsers = getUsers
exports.login = login
exports.signup = signup