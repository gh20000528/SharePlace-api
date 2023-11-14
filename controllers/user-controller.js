const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator')
const User = require('../models/user')
const HttpError = require('../models/http-error')

const DUMMY_USER = [
    {
        id: 'u1',
        name: 'han',
        email: 'text@gmail.com',
        password: '123123'
    }
]

const getUsers = async (req, res ,next) => {
  let user
	try {
		user = await User.find({},'-password')
	} catch (error) {
		const err = new HttpError('Fetching users failed, please try again later', 500)
		return next(err)
	}

	res.json({ uesr: user.map(user => user.toObject({getters: true}))})
}

const signup = async (req, res ,next) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
      return next(new HttpError('請檢查是否都有填寫', 422))
    }
    const { name, email, password } = req.body

    let existingUser
    try {
      existingUser = await User.findOne({ email: email })
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        'Signing up failed, please try again later.',
        500
      );
      return next(error);
    }
    
    if (existingUser) {
			console.log(existingUser);
      const error = new HttpError(
        'User exists already, please login instead.',
        422
      );
      return next(error);
    }
    
    const createdUser = new User({
      name,
      email,
      image: 'https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg',
      password,
      places: []
    });
  
    try {
      await createdUser.save();
    } catch (err) {
			console.log(err);
      const error = new HttpError(
        'Signing up failed, please try again.',
        500
      );
      return next(error);
    }
  
    res.status(201).json({user: createdUser.toObject({ getters: true })});
}

const login = async (req, res ,next) => {
    const {email, password} = req.body

    let existingUser
    try {
      existingUser = await User.findOne({ email: email })
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        'Login in failed, please try again later.',
        500
      );
      return next(error);
    }

		if(!existingUser || existingUser.password !== password){
			const err = new HttpError('Invalid credentials, could not log you in')
		}

    res.status(201).json({message: "login"})
}

exports.getUsers = getUsers
exports.login = login
exports.signup = signup