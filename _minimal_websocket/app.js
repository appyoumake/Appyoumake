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

    ws.on('message', function(data, flags) {
        console.log("Message received: " + data);
        
        try {
            var objData = JSON.parse(data);
        } catch (error) {
            console.log('Unable to parse JSON data ' + error);
            ws.send(JSON.stringify({data: {_type: 'error', message: error.message}}), function(error){console.log(error);})
            return
        }
         
        if (typeof actions[objData.data._type] != "undefined") {
            actions[objData.data._type](objData, ws);
        } else if (objData.data._feedId) {
            actions.toFeed(objData.data._feedId, objData, ws);
        } else {
            console.error('Unknown data type received: ' + objData.data._type);
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
        this.toFeed(data.data._feedId, data, ws);
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

// clean up connections that are not Alive
const interval = setInterval(function ping() {
    subscriptions.forEach((subscription, index, object) => {
        if (subscription.ws.isAlive === false) {
            object.splice(index, 1);
        }
    });
}, 10000);