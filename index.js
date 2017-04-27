var mqtt = require('mqtt');
var express = require('express');
var app = express();
var iotf = require("ibmiotf");

var deviceConfig = {
    "org" : "pm85g2",
    "id" : "euro001",
    "domain": "internetofthings.ibmcloud.com",
    "type" : "rasp2monitor",
    "auth-method" : "token",
    "auth-token" : "b8ewW@2KxFvfe3_FNh"
};

var gatewayConfig = {
    "org" : "pm85g2",
    "id" : "euro001",
    "domain": "internetofthings.ibmcloud.com",
    "type" : "rasp2monitor",
    "auth-method" : "token",
    "auth-token" : "b8ewW@2KxFvfe3_FNh",
    "use-client-certs": "false"
};
 
var deviceClient = new iotf.IotfDevice(deviceConfig);
var gatewayClient = new iotf.IotfGateway(gatewayConfig);

var ledStat;
var toggleLed = function() {

var wpi = require('wiring-pi');

// GPIO7 pin of Pi3
var configPin = 7;

//GPIO4 of Pi3
var statusPin = 4;

// Blinking interval in ms
var configTimeout = 1000;

wpi.setup('wpi');

//configure GPIO4 as output
wpi.pinMode(configPin, wpi.OUTPUT);

wpi.pinMode(statusPin, wpi.INPUT);

var isLedOn;

var cmdPayload;

        //toggle led state
        ledStat = wpi.digitalRead(statusPin);

        if (ledStat == 1)
          isLedOn = 0;
        else
          isLedOn = 1;

        //write 0 or 1 to GPIO4
        wpi.digitalWrite(configPin, isLedOn );

        ledStat = wpi.digitalRead(statusPin);

        console.log('LED status = ' + ledStat + ' LED control = ' + isLedOn);

};

//connect device to gateway
deviceClient.connect();

//publish device status
deviceClient.on('connect', function () {
 console.log('deviceClient is connected'); 
//   var myData = {'ledStatus' : ledStat?"ON":"OFF"};
//   var myQoSLevel = 0;
//   deviceClient.publish("status", "json", myData, myQoSLevel);
});

//handle commands from app
deviceClient.on('command', function (commandName,format,payload,topic) {
     console.log(' device received command with commandName= ' + commandName + ' format= ' + format + ' payload= ' + payload + ' topic= ' + topic);
     if(commandName === "ON") {
        console.log('device received ' + commandName + ' command from app');
        toggleLed();
        var myData = {'ledStatus' : ledStat?"ON":"OFF"};
        var myQoSLevel = 0;
        deviceClient.publish("status", "json", myData, myQoSLevel);
    } else if(commandName === "STATUS") {
        console.log('device received ' + commandName + ' command from app');
        var myData = {'ledStatus' : ledStat?"ON":"OFF"};
        var myQoSLevel = 0;
        deviceClient.publish("status", "json", myData, myQoSLevel);
    } else {
        console.log('Command not supported.. ' + commandName);
    }
});

//publish device event using gateway client
/*
gatewayClient.on('connect', function(){
    //publishing device events with deviceType 'Raspi' and deviceId 'pi01' using the default quality of service
   console.log('gatewayClient is connected');
    var myData = {'ledStatus' : ledStat?"ON":"OFF"};
    gatewayClient.publishDeviceEvent("rasp2monitor","euro001", "status","json", myData);
});
*/ 
