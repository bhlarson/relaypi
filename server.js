console.log("Starting RelayPi on " + process.platform + " with node version " + process.version);

require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
const util = require('util');

var SunCalc = require('suncalc2');
var mysql = require('mysql');
var cronparser = require('cron-parser');wee


/*
const rly1 = new Gpio(26, 'out');
const rly2 = new Gpio(20, 'out');
const rly3 = new Gpio(21, 'out');

rly1.writeSync(1);
console.log('rly1=1');
*/

var schedule = [
  { timer: 'date', config: { date: 'December 14, 2019 6:00:00' }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(1)") } },
  { timer: 'date', config: { date: 'December 15, 2019 16:00:00' }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(1)") } },
  { timer: 'chron', config: { expression: '45 5 * * 1-5' }, condition: [{ type: 'weather', condition: (forcast) => { return forcast.toLowerCase().indexOf("overcast") === -1 } }], action: () => { rly1.writeSync(1) } },
  { timer: 'chron', config: { expression: '* 7 * * 0,6' }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(1)") } },
  { timer: 'celestial', config: { when: 'sunrise', offset: 50 * 60 }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(0)") } },
  { timer: 'celestial', config: { when: 'sunset', offset: -30 * 60 }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(1)") } },
  { timer: 'chron', config: { expression: '30 22 * * 1-5' }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(0)") } },
  { timer: 'chron', config: { expression: '* 23 * * 0,6' }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(0)") } },
  { timer: 'celestial', config: { when: 'moonrise', offset: 2*60*60 }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(1)") } },
  { timer: 'celestial', config: { when: 'moonset', offset: 0 }, condition: ()=>{return True;}, action: () => { console.log("rly1.writeSync(0)") } },
];

function NextEvent(timestamp, schedule) {
  var events = [];

  var date = new Date(timestamp);
  var tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);

  var solarToday = SunCalc.getTimes(date, process.env.latitude, process.env.longitude);
  var solarTomorrow = SunCalc.getTimes(tomorrow, process.env.latitude, process.env.longitude);

  var lunarToday = SunCalc.getMoonTimes(date, process.env.latitude, process.env.longitude);
  var lunarTomorrow = SunCalc.getMoonTimes(tomorrow, process.env.latitude, process.env.longitude);

  schedule.forEach(element => {
    var scheduledTime = 0;
    switch (element.timer) {
      case 'date':
        if (element.config.date) {
          scheduledTime = new Date(element.config.date).getTime();
        }
        break;
      case 'timestamp':
        if (element.config.timestamp) {
          scheduledTime = element.config.timestamp;
        }
        break;
      case 'chron':
        var options = {
          currentDate: new Date(timestamp),
          iterator: true
        };
        console.log(element.config.expression)
        var interval = cronparser.parseExpression(element.config.expression, options);
        scheduledTime = interval.next().value.getTime();
        break;
      case 'celestial':
        if (element.config.when) {

          var offset = 0;
          if (element.config.offset) {
            offset = element.config.offset;
          }

          switch (element.config.when) {
            case 'sunrise':
              scheduledTime = solarToday.sunrise.getTime() + offset;
              if (scheduledTime < timestamp) {
                scheduledTime = solarTomorrow.sunrise.getTime() + offset;
              }
              break;
            case 'sunset':
              scheduledTime = solarToday.sunset.getTime() + offset;
              if (scheduledTime < timestamp) {
                scheduledTime = solarTomorrow.sunset.getTime() + offset;
              }
              break;
            // Moon events conditioned on nighttime, moon phase, and weather
            case 'moonrise':
                scheduledTime = lunarToday.rise.getTime() + offset;
                if (scheduledTime < timestamp) {
                  scheduledTime = lunarTomorrow.rise.getTime() + offset;
                }
              break;
            case 'moonset':
              scheduledTime = lunarToday.set.getTime() + offset;
              if (scheduledTime < timestamp) {
                scheduledTime = lunarTomorrow.set.getTime() + offset;
              }
              break;
          }
        }

        break;
    }
    var howLong = scheduledTime - timestamp;
    if(howLong >= 0){
      events.push({dt:scheduledTime - timestamp, event:element});
    }
  });
  events.sort((a, b)=>(a.dt > b.dt) ? 1 : -1);
    
  // Fire any timed-out events and remove them from the list
  var fireEvents = True
  while (fireEvents) {
    var now = new Date().getDate() - timestamp;
    if (now >= events.dt) {
      if (events[i].element().condition())
        events[i].element().action();
      events.shift()
    }
    else {
      fireEvents = False;
    }
  }
  return events
}

async function ProcessEvents(schedule) {
  let promise = ms => new Promise(resolve => setTimeout(resolve, ms));

  while(True){
    var tsNow = Date.now()
    var events = NextEvent(tsNow, schedule);

    // Remove time needed to process events
    // This can skip cyclic events like sunrise/sunset.  Modify so events are not skipped.
    var dEvent = Date.now()-tsNow;
    await promise(events[0].dt-dEvent); 

  }

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
  console.log("Listening on port " + port);
});


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
