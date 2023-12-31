'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    
    token: {
      type: DataTypes.VIRTUAL,
      get() {
        return jwt.sign({ username: this.username });
      }
    }
  });

  User.beforeCreate(async (user) => {
    let hashedPass = bcrypt.hash(user.password, 10);
    user.password = hashedPass;
  });

  // Basic AUTH: Validating strings (username, password) 
  User.authenticateBasic = async function (username, password) {
    const user = await this.findOne({ username })
    if (user) {
      const valid = await bcrypt.compare(password, user.password)
    } if (valid) {
      return user;
    } else {
      throw new Error('Invalid User');
    }
  }

  // Bearer AUTH: Validating a token
  User.authenticateToken = async function (token) {
    try {
      const parsedToken = jwt.verify(token, process.env.SECRET);
      const user = this.findOne({ username: parsedToken.username })
      if (user) { return user; }
      throw new Error("User Not Found");
    } catch (e) {
      throw new Error(e.message)
    }
  }

  return User;
}

module.exports = userSchema;
