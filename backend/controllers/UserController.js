const validator = require('validator');
const passwordValidator = require('password-validator');
const User = require('../models/UserModel');
const generateToken = require('../config/jwt');

const passwordSchema = new passwordValidator();

passwordSchema
  .is().min(8)
  .is().max(100)
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().not().spaces();

class UserController {

  async signup(req, res) {
    const { name, email, password } = req.body;

    try {
      if (!name || !email || !password) {
        throw { statusCode: 400, message: 'Please fill in all the required fields' };
      }

      if (!validator.isEmail(email)) {
        throw { statusCode: 400, message: 'Please provide a valid email' };
      }

      if (!passwordSchema.validate(password)) {
        throw { statusCode: 400, message: 'Password should be at least 8 characters long and contain uppercase, lowercase, and numeric characters with no whitespace' };
      }

      const emailExisted = await User.findOne({ email });
      if (emailExisted) {
        throw { statusCode: 400, message: 'Email already exists' };
      }

      const user = await User.create({ name, email, password, });

      if (!user) {
        throw { statusCode: 500, message: 'Failed to create new user' };
      }

      console.log('Created new user!');

      res.status(200).json({
        message: 'User registered successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        }
      });

    } catch (err) {
      console.error(err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.status(statusCode).json({ error: message });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw { statusCode: 200, message: "You have entered wrong email or password!" };
      }

      const passwordMatched = await user.matchPassword(password)

      if (!passwordMatched) {
        throw { statusCode: 200, message: "You have entered wrong password!" };

      }

      console.log(`User: ${user._id} logged in.`)
      res.status(200).json({
        message: 'User login successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        }
      });
    } catch (err) {
      console.error(err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.status(statusCode).json({ message });
    }
  }

  async findUser(req, res) {
    try {
      const user = await User.findById(req.params.id).select('-password')

      if (!user) {
        throw { statusCode: 400, message: 'Something went wrong, please try again later!' }
      }
      return res.json(user)

    } catch (err) {
      console.error(err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.status(statusCode).json({ message });
    }
  }

}

module.exports = new UserController();
