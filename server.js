console.log("Starting RelayPi on " + process.platform + " with node version " + process.version);

require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
var SolarCalc = require('solar-calc');
var CronJob = require('cron').CronJob;
var mysql = require('mysql');

console.log("External Dependencies Found");

var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.dbhost,
    user: process.env.dbuser,
    //password: 'password',
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

var solar = new SolarCalc(new Date(), 45.5, -122.8);
console.log("Sunrise Today: ", solar.sunrise.toString());
console.log("Sunset Today: ", solar.sunset.toString());

new CronJob('* * * * * *', function() {
    console.log('You will see this message every second');
  }, null, true);

module.exports = app;
console.log("Created RelayPi server")
