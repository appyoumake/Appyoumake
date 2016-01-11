/**
 * called when this plugin is loaded by a component
 * @param {type} pwner
 * @returns {undefined}
 */
    this.onPluginLoaded = function(el, callback) {
        this.loginRemotely($(el).attr("id"), callback);
    }
    
    this.loginRemotely = function(component_uuid, callback) {
        var that = this;
        var creds = that._data[component_uuid].settings.credentials;
        
        $.post(creds.url, {action: 'login', username: creds.username, password: creds.password})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        alert( "Logged in remotely: " + data );
                        that.api.db.loginToken(component_uuid, data.token);
                        callback();
                    }
                  })
                .fail(function() {
                    alert( "Error loggin in remotely" );
                  });
                  
        return true;
    };
    
    this.logoffRemotely = function(token, callback) {
        
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
    
    this.setResult = function(func_fail, callback, app_id, device_id, comp_id, key, value) {
        var that = this;
        var creds = that._data[comp_id].settings.credentials;
        var save_data = {token: this.api.db.loginToken(comp_id), action: 'set', type: 'result', app: app_id, dev: device_id, comp: comp_id, key: key, value: JSON.stringify(value)};
        
        func_fail("result", app_id, device_id, comp_id, key);
        return -2;
        $.post(creds.url, save_data)
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
                        if (callback) {
                            callback(save_data);
                        }
                    }
                  })
                .fail(function() {
                    func_fail("result", app_id, device_id, comp_id, key);
                  });
        return true;
    };
    
    this.getResult = function(func_fail, callback, app_id, device_id, comp_id, key) {
        var that = this;
        var creds = that._data[comp_id].settings.credentials;
        return -2;
        $.post(creds.url, {token: this.api.db.loginToken(comp_id), action: 'get', type: 'result', app: app_id, dev: device_id, comp: comp_id, key: key})
                .done(function( data ) {
                    data = JSON.parse(data);

                    if (data.status == "SUCCESS") {
                        console.log( "Retrieved OK" );
                        data.data = JSON.parse(data.data[i]);
                        data.state = "fresh";
                        callback(data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                        callback();
                    }
                  })
                .fail(function() {
                    alert("Unable to get data from server");
                    callback();
                  });
        return true;
    };

    this.getAllResult = function(func_fail, callback, app_id, device_id, comp_id) {
        var that = this;
        var creds = that._data[comp_id].settings.credentials;
        return -2;
        $.post(creds.url, {token: this.api.db.loginToken(comp_id), action: 'get', type: 'result', app: app_id, dev: device_id, comp: comp_id})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Retrieved OK" );
                        for (i in data.data) {
                            data.data[i] = JSON.parse(data.data[i]);
                        }
                        data.state = "fresh";
                        callback(data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                        callback();
                    }
                  })
                .fail(function() {
                    alert("Unable to get data from server");
                    callback();
                  });
        return true;
    };
    