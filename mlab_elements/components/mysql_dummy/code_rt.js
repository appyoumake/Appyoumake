/****
 * 3. February 2015: This must be rewritten to support mysql, currently just copied placehoilders from mlab_api.js
 */
    this.setState = function(user, key, value) {
        var pluginSetState = this.internal.dispatchToPlugin("setState", user, key, value);
        // Regardless of whether the plugin has stored the state successfully, we store it locally, since we can go offline at any time.
        if (!(user in this.states)) this.states[user] = {};
        this.states[user][key] = value;
        this.internal.storeStates();
    };
    
    
    this.getState = function(user, key) {
        var value = this.internal.dispatchToPlugin("getState", user, key);
        
        // If value is undefined, getState is not implemented in plugin, and we should use the local storage.
        if (typeof value=="undefined") {
            if (user in this.states && key in this.states[user]) value = this.states[user][key];
        }
        return value
    };

    this.getAllStates = function(user) {
        var allStates = this.internal.dispatchToPlugin("getAllStates", user);
        if (typeof allStates=="undefined") {
            if (user) {
                if (user in this.states) allStates = this.states[user];
            }
            else allStates = this.states;
        }
        return allStates;
    };
    
    this.setConfig = function(user, key, value) {
        var pluginSetConfig =this.internal.dispatchToPlugin("setConfig", user, key, value);
        if (!(user in this.configs)) this.configs[user] = {};
        this.configs[user][key] = value;
        this.internal.storeConfigs();
    };
    
    
    this.getConfig = function(user, key) {
        var value = this.internal.dispatchToPlugin("getConfig", user, key);
        if (typeof value=="undefined") {
            if (user in this.configs && key in this.configs[user]) value = this.configs[user][key];
        }
        return value;
    };
    
    this.getAllConfig = function(user) {
        var allConfigs = this.internal.dispatchToPlugin("getAllConfig", user);
        if (typeof allConfigs=="undefined") {
            if (user) {
                if (user in this.configs) allConfigs = this.configs[user];
            }
            else allConfigs = this.configs;
        }
        return allConfigs;
    };
    
    
    this.setResult = function(user, name, key, value) {
        var pluginSetResult=this.internal.dispatchToPlugin("setResult", user, name, key, value);
        if (!(user in this.results)) this.results[user] = {};
        if (!(name in this.results[user])) this.results[user][name] = {};
        this.results[user][name][key] = value;
        this.internal.storeResults();
    };
    
    this.getResult = function(user, name, key) {
        var value = this.internal.dispatchToPlugin("getResult", user, name, key);
        if (typeof value=="undefined") {
            if (user in this.results && name in this.results[user] && key in this.results[user][name]) value = this.results[user][name][key];
        }
        return value;
    };
    
    this.loginRemotely = function(service, username, password) {
        var token = this.loginToken(service)
        if (token) return token;
    
        var pluginLogin = this.internal.dispatchToPlugin("loginRemotely", service, username, password);
        if (!pluginLogin) log("No plugins have defined a login method, or no connection to perform log in");
        return pluginLogin;
    };
    
    this.logoffRemotely = function(service) {
        return this.internal.dispatchToPlugin("logoffRemotely", service);
    };
    
    this.loginToken = function(service, token) {
        if (typeof service=="undefined") return false;
        var loginTokens = this.internal.fetchTokens();
        if (typeof token!="undefined") {
            loginTokens[service] = token;
            this.internal.saveTokens(loginTokens);
        }
        if (service in loginTokens) return loginTokens[service];
        return false;
    };
    
