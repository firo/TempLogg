var express   =     require("express");
var app       =     express();
var http 	    = 	require('http').Server(app);
var io 		    = 	require('socket.io')(http);
var jsforce = require('jsforce');

app.locals.data = [];
app.locals.case_id = [];
app.locals.refdelta = 3;

var conn = new jsforce.Connection();
var env = process.env.NODE_ENV || 'development';
var debug = process.env.DEBUG || false;
var SFStatus = process.env.SFDC_STATUS || false;
var json = { status: '' };
var username = process.env.SFDC_UID;
var password = process.env.PWD + process.env.SFDC_TOKEN;

app.use('/js',    express.static( __dirname + '/client/js'));
app.use('/style', express.static( __dirname + '/client/css'));

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

// logger for temperature and emit temperature to all sockets connected
app.use('/t/:temp', function (req, res, next) {
  if (debug) console.log('routing /temp logger');
  if (debug) console.log('--> temperature: ' + req.params.temp);
  var date = new Date().getTime();
  io.sockets.emit('temperatureUpdate', date, req.params.temp); // dashboard web
  next();
});

// logger for temperature by device id and emit temperature to all sockets connected
app.use('/t/:device/:temp', function (req, res, next) {
  //console.log('-> temperature: ' + req.params.temp);
  var date = new Date().getTime();
  var channel = 'tempUpd-' + req.params.device;
  io.sockets.emit(channel, date, req.params.temp); // dashboard web
  json.status = 'ok';
  res.type('json');               // => 'application/json'
  res.json(json);
});

// compute the data analytics and call SFDC
app.use('/t/:temp', function (req, res, next) {
  app.locals.data.push(req.params.temp);
  if (process.env.SFDC = true)
    if (app.locals.data.length > 10){
      // console.log('enought data');
      var max = Math.max.apply(null, app.locals.data);
      var min = Math.min.apply(null, app.locals.data);
      delta = max - min;
      io.sockets.emit('messageUpdate', 'Current delta is '+ delta + ' ('+ min + '-'+ max + ')');
      // console.log('max: ' + max + ' min: '+ min);
      if ( delta > 3 ) {
        //console.log('OPEN CASE');
        if (SFStatus) {
          conn.login(username, password, function(err, userInfo) {
            if (err) { return console.error(err); }
            var records = [];
            // Single record creation
            conn.sobject("Case").create({ Subject : 'Temperature too high',
                                          Description : 'the device Frigo17B has reached a too high temperature with a greater increase in the average of all similar devices. '+
                                          'Current temperature is ' + req.params.temp + 'C with the increase of ' + delta + ' C.',
                                          ContactId : '0035800000FqZqgAAF',
                                          Origin : 'IoT',
                                          Priority : 'Medium',
                                          Status :  'New',
                                          SuppliedName : 'Frigo17B' }, function(err, ret) {
              if (err || !ret.success) { return console.error(err, ret); }
              //console.log("Created record id : " + ret.id);
              io.sockets.emit('messageUpdate', 'Case created id: '+ ret.id);
            });

            conn.logout(function(err) {
              if (err) { return console.error(err); }
              // now the session has been expired.
            });

          });
        } // end if SFStatus
      }
    } else {
      if (SFStatus) {
        io.sockets.emit('messageUpdate', 'not enough data...');
      } else {
        io.sockets.emit('messageUpdate', 'SFDC interaction off');
      }

  }
  next();
});

// The handler function (middleware system).
// The function handles GET requests to the /:temp path.
app.get('/t/:temp', function (req, res) {
  res.type('json');               // => 'application/json'
  res.json(json);                 // => send json back to client
});

// change delta degree
app.get('/delta/:var', function (req, res) {
  app.locals.refdelta = req.params.var;
  res.type('json');               // => 'application/json'
  res.json(app.locals.refdelta);  // => send json back to client
});

// routing for homepage
app.get('/', function(req, res){
  if (debug) console.log('routing home');
	//res.send('id: ' + req.query.id);
  res.sendFile(__dirname + '/client/index.html');
});

// routing for homepage by device
app.get('/d/:device', function(req, res){
  res.sendFile(__dirname + '/client/index_by_device.html');
});

// Express
var port = process.env.PORT || 3000; // Use the port that Heroku provides or default to 5000
http.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
  //console.log(app._router.stack);
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
