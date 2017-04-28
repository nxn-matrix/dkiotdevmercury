/*--------------------------------------------------------------------------------------------------------

Author        : Dinakar Kondru
File Name     : index.js
Language      : JavaScript/NodeJs
Usage command : sudo node index.js
Description   : When the usage command is run this code will do the following: 
                1. Creates a device client with configuration obtained from IBM Bluemix credentials at the time of device registration.
                2. Connects the device client to the Cloud and listens for commands from the App->Cloud.
                3. When ON/OFF command from the App->Cloud is received it will toggle LED and also sends the current LED status as a response to Cloud->App.
                4. When STATUS command from the App->Cloud is received it only send the current LED status as a response to Cloud->App.
                5. When commands other than ON/OFF or STATUS are recieved it will send an error message to the console.

-----------------------------------------------------------------------------------------------------------
History:

----Version--------Updated By----------Date-------Comments-------------------------------------------------
      0.0           Dinakar         04/20/2017    Created file and added all functionality of device client
      0.1           Dinakar         04/27/2017    Added comments and cleaned up code
-----------------------------------------------------------------------------------------------------------*/

//MQTT is the publish/subscribe protocol that this App will be using
var mqtt    = require('mqtt');

//Express is the NodeJs framework that is being used
var express = require('express');

// app is the instantiation of express and any APIs that express has can be used with app handle, for example app.init();
var app     = express();

//ibmiotf is a node library module that has publish/subscribe APIs which provide an abstraction to low-level MQTT APIs
//Install instructions and API documentaion is available at https://www.npmjs.com/package/ibmiotf
var iotf    = require("ibmiotf");

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////Device - LED interface code/////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

//indicates ON/OFF LED status
var ledStat;

//Function to togggle LED and read the status
var toggleLed = function() {

    //wiring-pi is node module where pin-mapping and APIs for configuring pins as input/output and writing to/reading from pins are defined
    var wpi = require('wiring-pi');

    //GPIO7 pin of Pi3
    var configPin = 7;

    //GPIO4 of Pi3
    var statusPin = 4;

    //indicates ON and OFF cmd to LED. 0 = OFF, 1 = ON
    var ledCmd;

    //setup wiring-pi with the above specified configuration
    wpi.setup('wpi');

    //configure GPIO7 as output
    wpi.pinMode(configPin, wpi.OUTPUT);

    //configure GPIO4 as input
    wpi.pinMode(statusPin, wpi.INPUT);

    //reads the current state of the LED
    ledStat = wpi.digitalRead(statusPin);

    //toggles the current state of the LED
    ledCmd = ledStat == 0? 1 : 0;

    //writes ledCmd value 0 or 1 to GPIO4
    wpi.digitalWrite(configPin, ledCmd );

    //reads the new status of the LED
    ledStat = wpi.digitalRead(statusPin);

    //notify on console the latest LED status and command. Both have to match at this point.
    console.log('LED status = ' + ledStat + ' LED command = ' + ledCmd);

};

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////Device - Cloud interface code///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

//device configuration information that user records during registration of Raspberry Pi device on IBM Bluemix
var deviceConfig = {
    "org" : "pm85g2",
    "id" : "euro001",
    "domain": "internetofthings.ibmcloud.com",
    "type" : "rasp2monitor",
    "auth-method" : "token",
    "auth-token" : "b8ewW@2KxFvfe3_FNh"
};

//Create a device client with the above device configuration
var deviceClient = new iotf.IotfDevice(deviceConfig);


//connect device to the Cloud
deviceClient.connect();

//notify on console when the device connecion is established
deviceClient.on('connect', function () {
   //Code that is intended to be executed as soon as the device connection to Cloud is establised goes here...
   console.log('deviceClient is connected'); 
});

//handles commands from app
//When ON/OFF command from the App->Cloud is received it will toggle LED and also sends the current LED status as a response to Cloud->App.
//When STATUS command from the App->Cloud is received it only send the current LED status as a response to Cloud->App.
//When commands other than ON/OFF or STATUS are recieved it will send an error message to the console.
deviceClient.on('command', function (commandName,format,payload,topic) {
    //Code that is intended to be executed when a specific command is received from App->Cloud goes here...
     console.log(' device received command with commandName= ' + commandName + ' format= ' + format + ' payload= ' + payload + ' topic= ' + topic);
     if(commandName === "ON" || commandName === "STATUS") {
        //toggles LED only for ON/OFF command. For STATUS command it just returns current LED state.
        if (commandName === "ON") toggleLed();
        var myData = {'ledStatus' : ledStat?"ON":"OFF"};
        var myQoSLevel = 0;
        console.log('device responds to ' + commandName + ' command from app with payload = ' + myData);
        deviceClient.publish("status", "json", myData, myQoSLevel);
    } else {
        console.log('Command not supported.. ' + commandName);
    }

});
