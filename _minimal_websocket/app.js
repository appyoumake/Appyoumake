/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * Very basic Websocket server for messages between Mlab editor backend and frontend
 * Used when data comes back from either the compiler or the app market services
 */

//first get config details
var config = require('./config');

var WebSocketServer = require('ws').Server;
var mlabServicesCallbackServer = new WebSocketServer({port: config.port});
mlabEditorClients = new Object();

console.logCopy = console.log.bind(console);
console.log = function (data){
    var timestamp = '[' + Date.now() + '] ';
    this.logCopy(timestamp, data);
}


console.log("Listening on localhost:" + config.port);

//listen to incoming connections
mlabServicesCallbackServer.on('connection', function(ws) {
    ws.isAlive = true;
//    console.log(ws.upgradeReq);
    url_info = ws.upgradeReq.url.match(/[^/]+/g);
    
//we get two types of connections, a long term one from the browser which lasts until the app compilation is done, 
//and temporary (i.e. one off) connections from PHP server with updates for the browser
//    if (url_info[1] != 0) {
//        console.log("Connection established from " + ws.upgradeReq.connection.remoteAddress + " (unique windows ID = " +  url_info[1] + ")");
//        mlabEditorClients[url_info[1]] = ws;
//        ws.send('{"data": {"status": "connected"}}', function(error){console.log(error);});
//    } else {
//        console.log("Temporary connection from " + ws.upgradeReq.connection.remoteAddress);
//        ws.send('{"data": {"status": "SUCCESS"}}', function(error) { console.log(error); } );
//    }
//    ws.send('{"data": {"status": "SUCCESS"}}', function(error) { console.log(error); } );
    
//all communication use the /message namespace
    ws.on('message', function(data, flags) {
        console.log("Message received: " + data);
        
        try {
            var objData = JSON.parse(data);
        } catch (error) {
            console.log('Unable to parse JSON data ' + error);
            return
        }
         
        if (typeof actions[objData.data._type] != "undefined") {
            actions[objData.data._type](objData, ws);
        } else if (objData.data._feedId) {
            actions.toFeed(objData.data._feedId, objData, ws);
        } else {
            console.error('Unknown data type received: ' + objData.data._type);
        }

        return;
        
        
//we use JSON to communicate, so we need to try to parse it.
        if (typeof data == "string") {
            try {
                var objData = JSON.parse(data);
            } catch (error) {
                console.log('Unable to parse JSON data ' + error);
            }
            
        } else if (typeof data == "undefined") {
            ws.send('{"data": {"status": "ERROR", "error": "received empty string"}}', function(error){console.log(error);});
            console.log('ERR: received empty string');
            return;
            
        } else {
            var objData = data;
        }
        
        if (typeof objData.destination_id != "undefined" && typeof objData.data != "undefined" && typeof mlabEditorClients[objData.destination_id] != "undefined") {
            console.log('DATA: ' + JSON.stringify(objData.data));

            try {
                mlabEditorClients[objData.destination_id].send(JSON.stringify(objData.data));
            } catch (error) {
                console.log('Trying to relay message to disconnected client' + error);
            }

            ws.send('{"data": {"status": "SUCCESS"}}', function(error){console.log(error);});
            console.log('SENT TO: ' + objData.destination_id);
            
        } else {
            if (typeof objData.destination_id == "undefined") {
                console.log('No destination present, nothing sent');
                ws.send('{"data": {"status": "ERROR", "error": "No destination present, nothing sent"}}', function(error){console.log(error);});
            }
            if (typeof objData.data == "undefined") {
                console.log('No data payload present, nothing sent');
                ws.send('{"data": {"status": "ERROR", "error": "No data payload present, nothing sent"}}', function(error){console.log(error);});
            }
            if (typeof mlabEditorClients[objData.destination_id] == "undefined") {
                console.log('Mlab client ' + objData.destination_id + ' not connected');
                ws.send('{"data": {"status": "ERROR", "error": "Mlab client ' + objData.destination_id + ' not connected"}}', function(error){console.log(error);});
            }
            
        }
    });

    ws.on('close', function(a,b,c,d) {
        ws.isAlive = false;
        console.log('Client disconnected');
    });

    ws.on('error', function() {
        console.log('ERROR');
    });

});

//open websocket when first start
mlabServicesCallbackServer.on('open', function open() {
  console.log("opening");
});

var subscriptions = [];

var actions = {
    subscribe: function(data, ws) {
        var feed = data.data.feed;
        var subscriber = data.data.subscriber;
//        !(feed in subscriptions) && (subscriptions[feedId] = [])
        subscriptions.push({subscriber, feed, ws});
    }, 
    
    toFeed: function(feedId, data, ws) {
        subscriptions
            .filter(function(subscription){
                return subscription.feed == feedId
            })
            .map(function(subscription){
                try {
                    subscription.ws.send(JSON.stringify(data), function(error){console.log(error);})
                } catch (error) {
                    console.log('Trying to relay message to disconnected client' + error);
                }
                
            });
    }, 
    
    app_build_update: function(data, ws) {
        this.toFeed(data._feedId, data, ws);
        ws.send('{"data": {"status": "SUCCESS"}}', function(error){console.log(error);});
    }, 
    
    ping: function(data, ws) {
        var ret = {
            data: {
                pong: true,
                request: data,
            }
        };
        
        ws.send(JSON.stringify(ret), function(error){console.log(error);});
    }, 
//    
//    app_pages_updated: function(data, ws) {
//        var subscriptionId = 'app_' + data.data.app_uid;
//        var message = {
//            data: {
//                _status: 'SUCCESS',
//                _type: 'app_pages_update',
//                pages: data.data.pages
//            }
//        };
//        
//        [...subscriptions[subscriptionId]].forEach(function(connection) {
//            connection.send(JSON.stringify(message), function(error){console.log(error);})
//        });
//
//    }, 
}

const interval = setInterval(function ping() {
    subscriptions.forEach((subscription, index, object) => {
        if (subscription.ws.isAlive === false) {
            object.splice(index, 1);
        }
    });
}, 10000);