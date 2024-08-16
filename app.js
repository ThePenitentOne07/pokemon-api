require("dotenv").config();
const cors = require("cors");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);

// Catch when a request matches no route
app.use((req, res, next) => {
    const exception = new Error(`Path not found`);
    exception.statusCode = 404;
    next(exception);
});

// Customize express error handling middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).send(err.message || "Internal Server Error");
});

module.exports = app;
