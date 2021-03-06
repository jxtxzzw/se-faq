const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');

const mongoose = require('mongoose');
const {Result} = require('./model')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/se-faq', process.env.MONGO_URI ? {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
} : {});

// mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@db:27017/admin`)
app.listen(require('./config.json').SERVER_PORT, function () {
    console.info('LISTENING ON PORT ' + require('./config.json').SERVER_PORT + '.');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.json(Result.error('', '404 Not found.'));
    // next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.json(Result.error('', err));
    // res.render('error');
});

module.exports = app;
