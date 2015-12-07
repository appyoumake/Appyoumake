    this.serverUrl = null;
    this.serverUsername = null;
    this.serverPassword = null;
    this.ownerComponent = null;
/**
 * called when this plugin is loaded by a component
 * @param {type} pwner
 * @returns {undefined}
 */
    this.onPluginLoaded = function(owner) {
        this.ownerComponent = owner;
        var settings = this.api.getAllVariables(owner);
        this.serverUrl = settings.storage_plugin.credentials.url;
        this.serverUsername = settings.storage_plugin.credentials.username;
        this.serverPassword = settings.storage_plugin.credentials.password;
    }
    
    this.loginRemotely = function(username, password, callback) {
        $.post(this.serverUrl, {action: 'login', username: this.serverPassword, password: this.serverPassword})
                .done(function( data ) {
                    if (data.status == "SUCCESS") {
                        alert( "Logged in remotely: " + data );
                    }
                  })
                .fail(function() {
                    alert( "Error loggin in remotely" );
                  });
        return true;
    };
    
    this.logoffRemotely = function() {
        
        return true;
    };
    
    this.loginToken = function(token) {
        
        return true;
    };
    
    this.setState = function(func_fail, data_type, device_id, comp_id, key, value, callback) {
        
        return true;
    };
    
    this.getState = function(user, key, callback) {
        
        return true;
    };

    this.getAllStates = function(user, callback) {
        
        return true;
    };
    
    this.setConfig = function(func_fail, data_type, device_id, comp_id, key, value, callback) {
        
        return true;
    };
    
    this.getConfig = function(user, key, callback) {
       
       return true;
    };
    
    this.getAllConfig = function(user, callback) {
        
        return true;
    };
    
    this.setResult = function(func_fail, app_id, device_id, comp_id, key, value, callback) {
        var save_data = {action: 'set', type: 'result', app: app_id, dev: device_id, comp: comp_id, key: key, value: JSON.stringify(value)};
        $.post(this.serverUrl, save_data)
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
                        callback(save_data);
                    }
                  })
                .fail(function() {
                    func_fail({"type": "result", "app_id": app_id, "device_uuid": device_id, "component_uuid": comp_id, "key": key, value: JSON.stringify(value), "callback": callback.name});
                  });
        return true;
    };
    
    this.getResult = function(func_fail, app_id, device_id, comp_id, key, callback) {
        $.post(this.serverUrl, {action: 'get', type: 'result', app: app_id, dev: device_id, comp: comp_id, key: key})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Retrieved OK" );
                        data.data = JSON.parse(data.data[i]);
                        callback(data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                    }
                  })
                .fail(function() {
                    alert("Unabel to get data from server");
                  });
        return true;
    };

    this.getAllResults = function(func_fail, app_id, device_id, comp_id, callback) {
        $.post(this.serverUrl, {action: 'get', type: 'result', app: app_id, dev: device_id, comp: comp_id})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Retrieved OK" );
                        for (i in data.data) {
                            data.data[i] = JSON.parse(data.data[i]);
                        }
                        callback(data.data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                    }
                  })
                .fail(function() {
                    alert("Unabel to get data from server");
                  });
        return true;
    };
    