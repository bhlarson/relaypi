console.log("Starting RelayPi on " + process.platform + " with node version " + process.version);

require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
var SunCalc = require('suncalc2');
var schedule = require('node-schedule');
var mysql = require('mysql');
var cronparser = require('cron-parser');
const Gpio = require('onoff').Gpio;

const rly1 = new Gpio(26, 'out');
const rly2 = new Gpio(20, 'out');
const rly3 = new Gpio(21, 'out');

rly1.writeSync(1);
console.log('rly1=1');

var schedule = [
  { timer: 'time', config: { timestamp: 1577099015 }, conditions: [], action: () => { rly1.writeSync(1) } },
  { timer: 'chron', config: { expression: '*45 5 * * 1-5' }, conditions: [{ type: 'weather', condition: (forcast) => { return forcast.toLowerCase().indexOf("overcast") === -1 } }], action: () => { rly1.writeSync(1) } },
  { timer: 'chron', config: { expression: '* * 7 * * 0,6' }, conditions: [], action: () => { rly1.writeSync(1) } },
  { timer: 'celestial', config: { when: 'sunrise', offset: 50 }, conditions: [], action: () => { rly1.writeSync(0) } },
  { timer: 'celestial', config: { when: 'sunset', offset: -30 }, conditions: [], action: () => { rly1.writeSync(1) } },
  { timer: 'chron', config: { expression: '* 30 22 * * 1-5' }, conditions: [], action: () => { rly1.writeSync(0) } },
  { timer: 'chron', config: { expression: '* * 23 * * 0,6' }, conditions: [], action: () => { rly1.writeSync(0) } },
];

function NextEvent(timestamp, schedule){
  var dT = [];
  schedule.forEach(element => {
    var scheduledTime = 0;
    switch(element.timer){
      case 'time':
        if(element.config.timestamp){
          scheduledTime = element.config.timestamp;
        }
        break;
      case 'chron':
          var options = {
            currentDate: new Date(timestamp),
            iterator: true
          };
        var interval = parser.parseExpression(element.config.expression, options);
        scheduledTime = interval.NextEvent();
        break;
      case 'celestial':
        break;
    }
    dT.push(scheduledTime-time);
  });
}

//NextEvent(time.time(), schedule);

console.log("External Dependencies Found");

//const rly1 = new Gpio(26, 'out');
//const rly2 = new Gpio(20, 'out');
//const rly3 = new Gpio(21, 'out');
//rly1.writeSync(0);
//rly2.writeSync(0);
//rly3.writeSync(0);

var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.dbhost,
    user: process.env.dbuser,
    password: process.env.dbpass,
    database: process.env.dbname
});


console.log("mysql.createPool exists=" + (typeof pool !== 'undefined'));

var port = process.env.PORT || 1337;
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile('index.html')
});


http.listen(port, function () {
    console.log("Listening on port "+ port);
});


var solar = SunCalc.getTimes(new Date(), process.env.latitude, process.env.longitude);
var lunar = SunCalc.getMoonTimes(new Date(), process.env.latitude, process.env.longitude);
console.log("Sunrise Today: ", solar.sunrise.toString());
console.log("Sunset Today: ", solar.sunset.toString());

//var j = schedule.scheduleJob('*/5 * * * * *', function(){
//    console.log(new Date() + ' Repeat');

    //rly1.read()
    //    .then(value => rly1.write(value ^ 1))
    //    .catch(err => console.log(err));   
//  }
//);

//var k = schedule.scheduleJob('*/10 * * * * *', function(){
//    console.log(new Date() + ' Repeat');

    //rly2.read()
    //    .then(value => rly2.write(value ^ 1))
    //    .catch(err => console.log(err));   
//  }
//);

//var l = schedule.scheduleJob('*/20 * * * * *', function(){
//    console.log(new Date() + ' Repeat');

    //rly3.read()
    //    .then(value => rly3.write(value ^ 1))
    //    .catch(err => console.log(err));   
//  }
//);

module.exports = app;
console.log("Created RelayPi server")
