/* 
 * API funksjoner som er tilgjengelige for runtime
 * 
 */


/**
Core functionality for the component API, all features here are local
Remote functionality is provided by any plugins (see end of file for plugin code)

Key issue here is that for data storage we need to use a proper namespace, this is as follows.

Level 1: Type (state/config/result/etc)
Level 2: User name
Level 3: Item name
Level 4 (optional rarely required) sub item name

Storage is already app-specific, so no need to include that into the namespace.
*/

/**
 * Standard initialisation of Mlab object which is referred to in several JS files, 
 * as these files can come down in different order, we must make sure we can use it here.
 * @returns {Mlab_dt_api}
 * @constructor
 */
function Mlab_api () {
    var self = this;
    var documentOb = $(document);
    this.internal.self = this;
    
    /* Name of the app. Should be unique, and configurable from Mlab.*/
    this.appName = "mlabtest";
    
    /* Object to hold the plugins loaded */
    this.plugins = {};
    /* Object to hold all states. They are stored using localStorage, but kept locally in this object
    for ease of use and performance */
    this.states = {};
    this.internal.fetchStates();

    this.results = {};
    this.internal.fetchResults();

    /* Object to hold all configs. They are stored using localStorage, but kept locally in this object
    for ease of use and performance */
    this.configs = {};
    // Populate the configs object
    this.internal.fetchConfigs();
    
    /* Online/offline state. We assume we are starting online, and handle any change. */
    this.online = true;
    documentOb.on("online", function() { self.online = true; });
    documentOb.on("offline", function() { self.online = false; });
    documentOb.trigger("mlabready");
}

/**
 * Initialise the different functions.
 * @type Mlab_api
 */
Mlab_api.prototype = {
    version: 0.1,
    /**
     * Get the mode the app is in: "runtime" if in app mode, "design" if in editor mode.
     * @return {String}
     */
    getMode: function() {
        return "runtime";
    },
    
    /**
     * Added by Arild to get current locale
     * @returns string
     */
    
    getLocale: function() {
        return this.parent.locale;
    },
    
    /**
     * Runs when mlab object has been set up. Loops through the globally defined arrays "mlab_initialiseApp" and 
     * "mlab_initialiseComponent", and calls the functions registered in these.
     *
     * In the spec, mlab_initialiseApp and mlab_initialiseComponent are defined as single functions. However,
     * most apps and pages have more than one component. If they all implement functions of the same 
     * name in the global namespace, only the latest added will be run.
     
     * So instead, we store the component's init methods in two global arrays, and loop through these,
     * to make sure everything gets set up properly.
     */
    onMlabReady: function() {
        // Clear out localStorage, for debugging
        //window.localStorage.clear();
        for (var i=0, ii=mlab_initialiseApp.length; i<ii; i++) mlab_initialiseApp[i]();
        for (var i=0, ii=mlab_initialiseComponent.length; i<ii; i++) mlab_initialiseComponent[i]();

// added by arild
// this will load the text file js/include_comp.js and load all the component runtime code that are listed there
// these are name COMPONENTNAME_code_rt.js, for instance googlemap_code_rt.js
        var path = window.location.href.replace('index.html', '');
        $.get(path + "js/include_comp.js", function(data) {
            var components = data.split("\n");
            for (i in components) {
                var name = components[i].replace("_code_rt.js", "");
                $.get(path + "js/" + components[i], function(component) {

//we need to attach the code_rt.js content to an object so we can use it as JS code
                    eval("mlab.components['" + name + "'] = new function() { " + component + "};");
//here we create the api objects inside the newly created object
                    mlab.components[name].api = mlab.api;
                });
            }
        });
        
        inititaliseMlabApp()
    },
    
    /**
     * Loads an external JS file, containing a plugin. Stores the plugin in the this.plugins object. When
     * plugin is loaded, triggers an event "pluginloaded".
     * @param {String} name The name of the plugin. The JS file that is loaded must be named "plugin_<name>.js" 
     * and must be places in the js directory. Also, the plugin itself must be stored in an object <name>.
     */
    loadPlugin: function(name) {
        var self = this;
        // If plugin is already loaded, trigger the event and return
        if (name in self.plugins) {
            $(document).trigger("pluginloaded", [name]);
            return true;
        }
        // Plugin is already defined globally, but not loaded into main object, do so. Mostly for debugging/development, 
        // when same origin browser restrictions stop us
        if (name in window) {
            self.plugins[name] = eval(name);
            $(document).trigger("pluginloaded", [name]);
            return true;
        }
        
        $.getScript("js/plugin_" + name + ".js", function() {
            // Not too happy about the use of eval() here, but don't see how it can be misused
            self.plugins[name] = eval(name);
            self.plugins[name].init(function() {
                $(document).trigger("pluginloaded", [name]);
            });
            
        });
    },
    
    
    /* ---- functions that are run locally if no plugin is loaded ---- */
    
    /* Sets state for user, also makes sure it is saved for later use.
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} key Key name for the state to be stored. Required.
     * @param {any} value The state value to be stored. Required. Can be anything that is compatible with JSON.stringify. All basic Javascript types should be OK.
     */ 
    setState: function(user, key, value) {
        var pluginSetState = this.internal.dispatchToPlugin("setState", user, key, value);
        // Regardless of whether the plugin has stored the state successfully, we store it locally, since we can go offline at any time.
        if (!(user in this.states)) this.states[user] = {};
        this.states[user][key] = value;
        this.internal.storeStates();
    },
    
    
    /**
     * Gets state for given user an key.
     *
     * getState() implemented in a plugin has to return an array with 1) boolean (success/failure to get state), and 2)
     * value. 
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} key Key name for the state to be stored. Required.
     * @return {Any} Value of state
     */
    getState: function(user, key) {
        var value = this.internal.dispatchToPlugin("getState", user, key);
        
        // If value is undefined, getState is not implemented in plugin, and we should use the local storage.
        if (typeof value=="undefined") {
            if (user in this.states && key in this.states[user]) value = this.states[user][key];
        }
        return value
    },

    /**
     * Gets all stored states, or all stored states for user (if given).
     * @param {String} user User ID for the currently logged in user. Optional.
     * @return {Object} Object containing the states
     */
    getAllStates: function(user) {
        var allStates = this.internal.dispatchToPlugin("getAllStates", user);
        if (typeof allStates=="undefined") {
            if (user) {
                if (user in this.states) allStates = this.states[user];
            }
            else allStates = this.states;
        }
        return allStates;
    },
    
    /**
     * Sets config for user, also makes sure it is saved for later use.
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} key Key name for the config to be stored. Required.
     * @param {any} value The config value to be stored. Required. Anything that is compatible with JSON.stringify. All basic Javascript types should be OK.
     */ 
    setConfig: function(user, key, value) {
        var pluginSetConfig =this.internal.dispatchToPlugin("setConfig", user, key, value);
        if (!(user in this.configs)) this.configs[user] = {};
        this.configs[user][key] = value;
        this.internal.storeConfigs();
    },
    
    
    /**
     * Gets config for given user an key.
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} key Key name for the config to be stored. Required.
     * @return {any} The config value (any type), or null
     */
    getConfig: function(user, key) {
        var value = this.internal.dispatchToPlugin("getConfig", user, key);
        if (typeof value=="undefined") {
            if (user in this.configs && key in this.configs[user]) value = this.configs[user][key];
        }
        return value;
    },
    
    /**
     * Gets all stored configs, or all stored configs for user (if given).
     * @param {String} user: User ID for the currently logged in user. Optional.
     * @return {Object} Object containing the configs
     */
    getAllConfig: function(user) {
        var allConfigs = this.internal.dispatchToPlugin("getAllConfig", user);
        if (typeof allConfigs=="undefined") {
            if (user) {
                if (user in this.configs) allConfigs = this.configs[user];
            }
            else allConfigs = this.configs;
        }
        return allConfigs;
    },
    
    
    /**
     * Saves result for a question.
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} name The name of the quiz. Must be unique within the app. Required.
     * @param {String} key The name of the question. Must be unique within the quiz. Required.
     * @param {any} value The value to be stored.
     */
    setResult: function(user, name, key, value) {
        var pluginSetResult=this.internal.dispatchToPlugin("setResult", user, name, key, value);
        if (!(user in this.results)) this.results[user] = {};
        if (!(name in this.results[user])) this.results[user][name] = {};
        this.results[user][name][key] = value;
        this.internal.storeResults();
    },
    
    /**
     * Get saved result for specific question
     * @param {String} user User ID for the currently logged in user. Required.
     * @param {String} name The name of the quiz. Must be unique within the app. Required.
     * @param {String} key The name of the question. Must be unique within the quiz. Required.
     * @return {any} The value that was saved. Normally an object, but any JSON-stringifiable value is allowed.
     */
    getResult: function(user, name, key) {
        var value = this.internal.dispatchToPlugin("getResult", user, name, key);
        if (typeof value=="undefined") {
            if (user in this.results && name in this.results[user] && key in this.results[user][name]) value = this.results[user][name][key];
        }
        return value;
    },

/**
 * Reads in the Javascript values stored for the specified element, and returns it as a single JS object
 * Copy of design time code doing the same thing
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.
 * @param {jQuery DOM element} el
 * @returns {Mlab_dt_api.prototype.getAllVariables.vars|Array|Object}
 */
    getAllVariables: function (el) {
        var json = $(el).find("script.mlab_storage").html();
        if (typeof json == "undefined"  || json == "") {
            return ;
        }
        try {
            var vars = JSON.parse(json);
        } catch(e) {
            console.log(e);
            return ;
        }
        
        return vars;
    },    
    
    /* Network-functions */
    /**
     * Login on remote service, through loaded plugin. If we have a loginToken stored, we assume this is valid, 
     * and simply return the token.
     * @param {String} service The short_name of the service
     * @param {String} username User name
     * @param {String} password: Password
     * @return {boolean} or {String}. True if we have sent a login request, false if we haven't. Login token string
     * if it exists.
     */
    loginRemotely: function(service, username, password) {
        var token = this.loginToken(service)
        if (token) return token;
    
        var pluginLogin = this.internal.dispatchToPlugin("loginRemotely", service, username, password);
        if (!pluginLogin) log("No plugins have defined a login method, or no connection to perform log in");
        return pluginLogin;
    },
    
    /**
     * Log off the remote service, through plugin.
     * @param {String} service The short_name of the service
     * @return {boolean} True if plugin has logged off, false if not.
     */
    logoffRemotely: function(service) {
        return this.internal.dispatchToPlugin("logoffRemotely", service);
    },
    /**
     * Getter/setter for the login token string.
     * @param {String} service The short_name of the service
     * @param {String} token. Token to be set. Optional.
     * @return {String} or {false}. The currently set token, or false if not set.
     */
    loginToken: function(service, token) {
        if (typeof service=="undefined") return false;
        var loginTokens = this.internal.fetchTokens();
        if (typeof token!="undefined") {
            loginTokens[service] = token;
            this.internal.saveTokens(loginTokens);
        }
        if (service in loginTokens) return loginTokens[service];
        return false;
    },
    
    /**
     * Object used for navigation functionality at runtime
     * (added by arild)
     */
    
    navigation: {
        current_page: 0,
        max_pages: 0,
        self: this,
/**
 * current = page that is currently displayed
 * move_to can be index, first, last, next, previous or a number
 * @param {type} page
 * @returns {undefined}
 */
        pageDisplay: function (current, move_to) {
            var filename, selector = "";
            var new_location = 0;
            switch (move_to) {
                case "index":
                    filename = "index.html";
                    new_location = 0;
                    break;

                case "first" :
                    filename = "001.html";
                    new_location = 1;
                    break;

                case "last" :
                    filename = ("000" + this.max_pages).slice(-3) + ".html";
                    new_location = this.max_pages;
                    break;

                case "next" :
                    if (current == this.max_pages) {
                        return current;
                    }
                    current++;
                    filename = ("000" + current).slice(-3) + ".html";
                    new_location = current;
                    break;

                case "previous" :
                    if (current == "index") {
                        return current;
                    }
                    if (current == 1) {
                        filename = "index.html";
                        new_location = 0;
                    } else {
                        current--;
                        filename = ("000" + current).slice(-3) + ".html";
                        new_location = current;
                    }
                    break;

        //pages are always saved as nnn.html, i.e. 001.html, and so on, so need to format the number
                default:
                    var pg = parseInt(move_to);
                    if (isNaN(pg)) {
                        return current;
                    }
                    if (move_to < 0 || move_to > this.max_pages) {
                        return current;
                    }
                    if (move_to == 0) {
                        filename = "index.html";
                    } else {
                        filename = ("000" + move_to).slice(-3) + ".html";
                    }
                    new_location = move_to;
                    break;
            }

        //have calculated the file name, now we need to try to load it
        //must load only content from the index.html to avoid duplicates inside each other
            if (filename == "index.html") {
                selector = " #content";
            }
            
            $.mobile.pageContainer.pagecontainer("change", filename, { transition: "flip" });
            //$.mobile.pageContainer.pagecontainer("load", "/Palestinian/epg47/show");

            return new_location;
        },
        
        prepareComponents: function (e, ui) {
            /* timestamp & ui object */
            console.log(e.type + " " + Date(e.timeStamp));
            console.log(ui);
            
            $("#content > div" ).each( function( ) {
                comp_id = $( this ).data("mlab-type");
                if (typeof mlab.components[comp_id] != "undefined" && typeof mlab.components[comp_id].onPageLoad != "undefined") {
                    mlab.components[comp_id].onPageLoad($(this));
                }
            });    
        },
        
    },
    
    /**
     * Object that keeps the functions that are not part of the main API of mlab.
     */
    internal: {
        /* Pointer to main mlab object */
        self: null,
        /**
         * Internal helper function that is a generic way of dispatching a call to plugin. In addition to
         * the named parameter "name", it is possible to pass any number of parameters, which are passed
         * on to the plugin function.
         * @param {String} name The name of the functino to call
         * @return {boolean} True if plugin has successfully performed the operation, false if not
         */
        dispatchToPlugin: function(name) {
            // Looks like webkit doesn't support the nifty, new REST arguments in ECMAScript ("...args"), so 
            // we have to slice the arguments manually.
            var args = Array.prototype.slice.call(arguments).slice(1);
            var opDone;
            // There are possibly (?) more than one plugin loaded, so loop through them all.
            for (var pluginName in this.self.plugins) {
                var plugin = this.self.plugins[pluginName];
                if (name in plugin && typeof plugin[name]=="function") {
                    opDone = plugin[name].apply(plugin, args);
                    // We only support ONE plugin implementing any specific function at the time, so break off here.
                    if (typeof opDone!="undefined") break;
                }
            }
            return opDone;
        },
        
        /**
         * Gets the login tokens from session storage
         * @return {Object} The login tokens for the various services
         */
        fetchTokens: function() {
            var loginTokens = window.sessionStorage.getItem("loginTokens");
            if (loginTokens) loginTokens = JSON.parse(loginTokens);
            else loginTokens = {};
            return loginTokens;
        },
        
        /**
         * Saves the login tokens in session storage, under the key "loginTokens"
         * @param {Object} loginTokens
         */
        saveTokens: function(loginTokens) {
            window.sessionStorage.setItem("loginTokens", JSON.stringify(loginTokens));
        },
    
        /* 
         * Internal function that stores the states using localStorage 
         */
        storeStates: function() {
            for (user in this.self.states) {
                window.localStorage.setItem("state-" + user, JSON.stringify(this.self.states[user]));
            }
        },
        
        /* 
         * Internal function that fetches the states from localStorage and puts them into the object this.states 
         */
        fetchStates: function() {
            var states = {};
            for (key in window.localStorage) {
                if (key.indexOf("state-")==0) {
                    states[key.substr(6)] = JSON.parse(window.localStorage.getItem(key));
                }
            }
            this.self.states = states;
        },
    
        /* 
         * Internal function that stores the results using localStorage 
         */
        storeResults: function() {
            for (user in this.self.results) {
                for (name in this.self.results[user]) {
                    // Using the & character to combine quiz name and user name, as we assume that it is not allowed in either
                    window.localStorage.setItem("result-" + user + "&" + name, JSON.stringify(this.self.results[user][name]));
                }
            }
        },
        
        /* 
         * Internal function that fetches the results from localStorage and puts them into the object this.results 
         */
        fetchResults: function() {
            var results = {};
            for (key in window.localStorage) {
                if (key.indexOf("result-")==0) {
                    var userAndName = key.substr(7).split("&");
                    if (!(userAndName[0] in results)) results[userAndName[0]] = {};
                    var value = window.localStorage.getItem(key);
                    if (value) results[userAndName[0]][userAndName[1]] = JSON.parse(value);
                }
            }
            this.self.results = results;
        },
        
        /* 
         * Internal function that stores the configs using localStorage 
         */
        storeConfigs: function() {
            for (user in this.self.configs) {
                window.localStorage.setItem("config-" + user, JSON.stringify(this.self.configs[user]));
            }
        },
        
        /* 
         * Internal function that fetches the configs from localStorage and puts them into the object this.states 
         */
        fetchConfigs: function() {
            var configs = {};
            for (key in window.localStorage) {
                if (key.indexOf("config-")==0) {
                    configs[key.substr(7)] = JSON.parse(window.localStorage.getItem(key));
                }
            }
            this.self.configs = configs;
        },
        
        /**
         * Delete everything in localstorage. For testing/debugging purposes.
         */
        clearLocalStorage: function() {
            window.localStorage.clear();
        },
        /**
         * Delete everything in sessionstorage. For testing/debugging purposes.
         */
        clearSessionStorage: function() {
            window.sessionStorage.clear();
        }
    
    }
}; // end prototype for Mlab.api


/*  
 * Components add their app init functions to this array
 */
var mlab_initialiseApp = [];

/**
 * Components add their page init functions to this array
 */
var mlab_initialiseComponent = [];

/* 
 * Mlab object is stored in a global variable "mlab", and is initialized automatically when device is ready.
 */
var mlab;
/**
$(document).on("deviceready", function() {
    mlab = new Mlab();
});
*/
$(document).on("deviceready", function() {
//    setTimeout(function() {
    mlab = new Mlab();
//    }, 5000);
});
/**
$(document).on("ready", function() {
});
*/

/**
$(document).on("mlabready", function() {
    mlab.onMlabReady();
});
*/


/******

Functions defined below are helper functions

*******/

/* jQuery only has getJSON, so we define our own postJSON to go with it */
$.postJSON = function(url, data, callback) { $.post(url, data, callback, "json");}
/* Cloning an object */
function clone(ob,deep) {
    var objectClone = {}; 
    for (var property in ob) {
        if (!deep) objectClone[property] = ob[property];
        else if (typeof ob[property] == 'object' && ob[property]) objectClone[property] = clone(ob[property], deep);
        else objectClone[property] = ob[property];
    }
    return objectClone;
}

/* Simple/safe logging to console */
function log(s) {
    try {
        console.log(s);
    }
    catch(e) {;}
}
