console.log("Starting RelayPi on " + process.platform + " with node version " + process.version);

require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
const util = require('util');

var SunCalc = require('suncalc2');
var cronparser = require('cron-parser');
const Gpio = require('onoff').Gpio;

const rly1 = new Gpio(26, 'out');
const rly2 = new Gpio(20, 'out');
const rly3 = new Gpio(21, 'out');

var schedule = [
  { timer: 'chron', config: { expression: '20 5 * * 1-5' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(1)");rly2.writeSync(1) } },
  { timer: 'chron', config: { expression: '* 7 * * 0,6' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(1)");rly2.writeSync(1) } },
  { timer: 'celestial', config: { when: 'sunrise', offset: 50 * 60 }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(0)");rly2.writeSync(0) } },
  { timer: 'celestial', config: { when: 'sunset', offset: -30 * 60 }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(1)");rly2.writeSync(1) } },
  { timer: 'chron', config: { expression: '03 23 * * 1-5' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(0)");rly2.writeSync(0) } },
  { timer: 'chron', config: { expression: '30 23 * * 0,6' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(0)");rly2.writeSync(0) } },
  //{ timer: 'chron', config: { expression: '0,10,20,30,40,50 * * * * *' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(1)");rly2.writeSync(1) } },
  //{ timer: 'chron', config: { expression: '5,15,25,35,45,55 * * * * *' }, condition: ()=>{return true;}, action: () => { console.log("rly2.writeSync(0)");rly2.writeSync(0) } },
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
      events.push({ts:scheduledTime, when:new Date(scheduledTime), event:element});
    }
  });
  events.sort((a, b)=>(a.ts > b.ts) ? 1 : -1); // Sort ascending
    
  return events
}

async function ProcessEvents(schedule) {
  let promise = ms => new Promise(resolve => setTimeout(resolve, ms));

  var ts = Date.now();
  var events = NextEvent(ts, schedule);

  while(true){
    // Preform events that have occurred
    // Fire any timed-out events and remove them from the list
    var now;
    var fireEvents = true
    while (fireEvents) {
      now = Date.now();
      if (now >= events[0].ts) {
        if (events[0].event.condition())
          events[0].event.action();
        events.shift() // Remove completed event from list
      }
      else {
        fireEvents = false;
      }
    }
    ts = now;  // move timestamp up to last processed event
    events = NextEvent(ts, schedule);
    console.log(JSON.stringify(events,null, 4));
    console.log(events[0].ts-ts + ' ' + ts );
    await promise(events[0].ts-ts); 
  }
}

<<<<<<< HEAD
var pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpass,
  database: process.env.dbname
});


console.log("mysql.createPool exists=" + (typeof pool !== 'undefined'));

var port = process.env.nodeport || 1337;
=======
var port = process.env.PORT || 1337;
>>>>>>> 22ece89b7539019052d285c414a5d19f7c7ea85f
app.use(express.static('public'));

app.put('/on', function (req, res) {
  console.log('/off')
  rly2.writeSync(1)
});

app.put('/off', function (req, res) {
  console.log('/off')
  rly2.writeSync(0)
});


http.listen(port, function () {
  console.log("Listening on port " + port);
});

module.exports = app;
console.log("RelayPi running schedule events");

ProcessEvents(schedule);
