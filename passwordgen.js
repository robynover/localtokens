"use strict";
var express = require('express');
var app = express();
app.set('models',require('./models'))
var User = app.get('models').user;

var password = "Fill in your chosen password here";

console.log(User.encryptPassword(password));