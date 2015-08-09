/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//first get config details
var config = require('./config');

var WebSocketServer = require('ws').Server;
var mlabServicesCallbackServer = new WebSocketServer({port: config.port});
mlabEditorClients = new Object();

console.log("Listening on localhost:" + config.port);

mlabServicesCallbackServer.on('connection', function(ws) {
    console.log(ws.upgradeReq.url);
    url_info = ws.upgradeReq.url.match(/[^/]+/g);
    if (url_info[1] != 0) {
        console.log("Connection established from " + ws.upgradeReq.connection.remoteAddress + " (unique windows ID = " +  url_info[1] + ")");
        mlabEditorClients[url_info[1]] = ws;
        ws.send('{"data": {"status": "connected"}}');
    } else {
        console.log("Temporary connection from " + ws.upgradeReq.connection.remoteAddress);
        ws.send('{"data": {"status": "SUCCESS"}}');
    }
    
    ws.on('message', function(data, flags) {
        console.log("Message received: " + data);
        if (typeof data == "string") {
            var objData = JSON.parse(data);
        } else if (typeof data == "undefined") {
            ws.send('{"data": {"status": "ERROR", "error": "received empty string"}}');
            console.log('ERR: received empty string');
            return;
        } else {
            var objData = data;
        }
        
        if (typeof objData.destination_id != "undefined" && typeof objData.data != "undefined" && typeof mlabEditorClients[objData.destination_id] != "undefined") {
            console.log('DATA: ' + JSON.stringify(objData.data));
            mlabEditorClients[objData.destination_id].send(JSON.stringify(objData.data));
            ws.send('{"data": {"status": "SUCCESS"}}');
            console.log('SENT TO: ' + objData.destination_id);
        } else {
            if (typeof objData.destination_id == "undefined") {
                console.log('No destination present, nothing sent');
                ws.send('{"data": {"status": "ERROR", "error": "No destination present, nothing sent"}}');
            }
            if (typeof objData.data == "undefined") {
                console.log('No data payload present, nothing sent');
                ws.send('{"data": {"status": "ERROR", "error": "No data payload present, nothing sent"}}');
            }
            if (typeof mlabEditorClients[objData.destination_id] == "undefined") {
                console.log('Mlab client ' + objData.destination_id + ' not connected');
                ws.send('{"data": {"status": "ERROR", "error": "Mlab client ' + objData.destination_id + ' not connected"}}');
            }
        }
    });

});

mlabServicesCallbackServer.on('open', function open() {
  console.log("opening");
});