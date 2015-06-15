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

mlabServicesCallbackServer.on('connection', function(ws) {
    console.log(ws.upgradeReq.url);
    url_info = ws.upgradeReq.url.match(/[^/]+/g);
    console.log(url_info);
    mlabEditorClients[url_info[1]] = ws;
    ws.send('you are now attached to Mlab socket server');
    
    ws.on('message', function(data, flags) {
        console.log(data);
        console.log(typeof data);
        if (typeof data == "string") {
            var objData = JSON.parse(data);
        } else if (typeof data == "undefined") {
            console.log('ERR: received empty string');
            return;
        } else {
            var objData = data;
        }
        
        console.log('INFO: '); console.log(JSON.stringify(objData));
        
        if (typeof mlabEditorClients[objData.destination_id] != "undefined") {
            mlabEditorClients[objData.destination_id].send(objData.data);
            console.log('SENT: ' + objData.destination_id);
        }
    });

});