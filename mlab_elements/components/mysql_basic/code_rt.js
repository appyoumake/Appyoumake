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
    
    this.setState = function(user, key, value, callback) {
        
        return true;
    };
    
    this.getState = function(user, key, callback) {
        
        return true;
    };

    this.getAllStates = function(user, callback) {
        
        return true;
    };
    
    this.setConfig = function(user, key, value, callback) {
        
        return true;
    };
    
    this.getConfig = function(user, key, callback) {
       
       return true;
    };
    
    this.getAllConfig = function(user, callback) {
        
        return true;
    };
    
    this.setResult = function(user, name, key, value, callback) {
        $.post(this.serverUrl, {action: 'set', type: 'result', usr: user, key: key, value: value})
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
    
    this.getResult = function(user, name, key, callback) {
        $.post(this.serverUrl, {action: 'get', type: 'result', usr: user, key: key})
                .done(function( data ) {
                    data = JSON.parse(data);
                    if (data.status == "SUCCESS") {
                        console.log( "Saved OK" );
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

    this.getAllResults = function(user, callback) {
        
        return true;
    };
    