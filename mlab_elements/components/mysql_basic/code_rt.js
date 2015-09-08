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
                        alert( "Data Loaded: " + data );
                    }
                  })
                .fail(function() {
                    alert( "error" );
                  });
        return true;
    };
    
    this.logoffRemotely = function() {
        
        return true;
    };
    
    this.loginToken = function(token) {
        
        return true;
    };
    
    this.setState = function(data_type, user_id, comp_id, key, value, callback) {
        
        return true;
    };
    
    this.getState = function(user, key, callback) {
        
        return true;
    };

    this.getAllStates = function(user, callback) {
        
        return true;
    };
    
    this.setConfig = function(data_type, user_id, comp_id, key, value, callback) {
        
        return true;
    };
    
    this.getConfig = function(user, key, callback) {
       
       return true;
    };
    
    this.getAllConfig = function(user, callback) {
        
        return true;
    };
    
    this.setResult = function(app_id, user_id, comp_id, key, value, callback) {
        $.post(this.serverUrl, {action: 'set', type: 'result', app: app_id, usr: user_id, comp: comp_id, key: key, value: value})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
                    }
                  })
                .fail(function() {
                    alert( "error" );
                  });
        return true;
    };
    
    this.getResult = function(app_id, user_id, comp_id, key, callback) {
        $.post(this.serverUrl, {action: 'get', type: 'result', app: app_id, usr: user_id, comp: comp_id, key: key})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
debugger;                        
                        for (i in data.data) {
                            data.data[i].value = JSON.parse(data.data[i].value);
                        }
                        callback(data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                    }
                  })
                .fail(function() {
                    alert( "error" );
                  });
        return true;
    };

    this.getAllResults = function(app_id, user_id, comp_id, callback) {
        $.post(this.serverUrl, {action: 'get', type: 'result', app: app_id, usr: user_id, comp: comp_id})
                .done(function( data ) {
debugger;
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
                        callback(data.data);
                    } else {
                        console.log( "ERROR: " + data.msg );
                    }
                  })
                .fail(function() {
                    alert( "error" );
                  });
        return true;
    };
    