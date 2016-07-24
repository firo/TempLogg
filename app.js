var express = require('express');
var app = express();
var json = { status: '' };


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
