var express = require('express');
var app = express();
var json = { status: '' };
app.locals.data = [];

// rules for defining the response and light color
app.use('/:id/:temp', function (req, res, next) {
  if (req.params.temp < 20 ) {
    json.status = 'GREEN';
  } else if (req.params.temp < 23) {
    json.status = 'YELLOW';
  } else if (req.params.temp >= 23) {
    json.status = 'RED';
  }
  next();
});

// cache the income data
app.use('/:id/:temp', function (req, res, next) {
  // do some action if income temperature is diffrence from previous one
  if (req.params.temp != app.locals.data[req.params.id]) {
      app.locals.data[req.params.id] = req.params.temp;
      console.log('updated locals data');
  }
  next();
});

// logger for temperature by device id
app.use('/:id/:temp', function (req, res, next) {
  console.log('-> device id: ' + req.params.id + ' temperature: ' + req.params.temp);
  next();
});

// The handler function (middleware system).
// The function handles GET requests to the /user/:id path.
app.get('/:id/:temp', function (req, res) {
  res.type('json');               // => 'application/json'
  res.json(json);
});

app.listen(3000);
