var express   =     require("express");
var app       =     express();
var http 	    = 	require('http').Server(app);
var io 		    = 	require('socket.io')(http);

app.locals.data = [];

var env = process.env.NODE_ENV || 'development';
var json = { status: '' };

app.use('/js',express.static( __dirname + '/client/js'));
app.use('/style',express.static( __dirname + '/client/css'));

// --> Express Middleware
// rules for defining the response and light color
app.use('/:temp', function (req, res, next) {
  if (req.params.temp < 20 ) {
    json.status = 'GREEN';
  } else if (req.params.temp < 23) {
    json.status = 'YELLOW';
  } else if (req.params.temp >= 23) {
    json.status = 'RED';
  }
  next();
});

// logger for temperature by device id and emit temperature to all sockets connected
app.use('/:temp', function (req, res, next) {
  console.log('-> temperature: ' + req.params.temp);
  var date = new Date().getTime();
  io.sockets.emit('temperatureUpdate', date, req.params.temp); // dashboard web
  next();
});

// compute the data analytics
app.use('/:temp', function (req, res, next) {
  app.locals.data.push(req.params.temp);
  if (app.locals.data.length > 5){
    console.log('enought data');
    var max = Math.max.apply(null, app.locals.data);
    var min = Math.min.apply(null, app.locals.data);
    console.log('max: ' + max + ' min: '+ min);
    if ( (max - min) > 2 ) console.log('OPEN CASE');
  } else {
    console.log('need more data');
  }

  next();
});



// The handler function (middleware system).
// The function handles GET requests to the /:id/:temp path.
app.get('/:temp', function (req, res) {
  res.type('json');               // => 'application/json'
  res.json(json);                 // => send json back to client
});

// Manage the income outbout messages
app.post('/closedcase',function(req,res) {
  //req.setEncoding('utf8');
  console.log('soap post in call');
  console.log("request: %j", req.body);
  res.end("ok");
});

// routing for homepage
app.get('/', function(req, res){
	//res.send('id: ' + req.query.id);
  res.sendFile(__dirname + '/client/index.html');
});

// Express
var port = process.env.PORT || 3000; // Use the port that Heroku provides or default to 5000
http.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});

// rules for chaching data
/*app.use('/:id/:temp', function (req, res, next) {
  // do some action if income temperature is diffrence from previous one
  if (req.params.temp != app.locals.data[req.params.id]) {
    app.locals.data[req.params.id] = req.params.temp;
    //console.log('updated locals data');
    json.data = 'updated';
  } else {
    json.data = 'cached';
  }
  next();
});
*/
