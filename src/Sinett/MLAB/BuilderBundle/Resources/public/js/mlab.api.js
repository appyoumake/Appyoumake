/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Morten Krane (Snapper) - first version 
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

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
    
    this.data_divider = "/";
    
    this.db.parent = this;
    this.db.internal.parent = this.db;
    this.mode = this.getMode();

/* 
 * Object to hold components loaded, this includes regular components, features and storage plugins
*/
    this.components = {};
    
    
/*--- database ---*/

/* Object to hold the plugins loaded */
    this.db.plugins = {};
    
//add storage for the app specific variables (generated in the pre-compile processing function)
// to the object here
    this.variables = new Object();
    
// added by arild
// this will load the text file js/include_comp.txt and load all the component runtime code that are listed there
// these are name COMPONENTNAME_code_rt.js, for instance googlemap_code_rt.js
// THE REASON FOR THIS IS THAT JQUERY WILL NOT CONFIRM RECEIVED FILE IF A .JS FILE DOES NOT CONTAIN VALID JS FIL
// AT THE SAME TIME WE NEED TO CONTROL THE LOADING OF THESE FILES AS THEY ARE USED TO INITIALISE COMPONENTS

/* MK: Slightly different handling of path. Adding it to empty string, to make sure we get a copy.
    Also splitting in index_html, because we do not know what parameters there are.
 */
    var mlab_ready_triggered = false;
    var path = '' + window.location.href.split('index.html')[0];
/* MK: When jQuery loads a file ending with .js (and no content-type response header is set) it assumes a JS file. When this 
    file proves not to be a JS file, the success handler is never fired. Suggest renaming to .txt.
*/
    $.ajaxSetup({ cache: false });
    $.get(path + "js/include_comp.txt")
            .done(function(data) {
                    var components = data.split("\n");
                    var componentsLength = components.length;
                    var componentsAdded = 0;

// MK: Converted for() to $.each(), because "name" variable was overwritten before XHR was finished. $.each provides closure to the variables.
                    $.each(components, function(i, component) {
// MK: js/ was already part of the component name
                        var name = component.replace("_code_rt.js", "").replace("js/", "");
                        $.get(path + component, function(componentCode) {
//we need to attach the code_rt.js content to an object so we can use it as JS code
                            eval("mlab.api.components['" + name + "'] = new function() {" + componentCode + "}();");
                            
//here we create the api objects inside the newly created object
                            mlab.api.components[name].api = mlab.api;
                            componentsAdded += 1;
                            
/* MK: Because ajax is asynchronous, we do not know the order in which the components will be added
    Only when these numbers add up do we know that everything is OK 
*/
                            if (componentsAdded == componentsLength) {
            // MK: Not sure if this is the way it should be, but "pagecontainerload" was never triggered.
                                $(document).trigger("mlabready");
                            } 
                        });
                    });
                })
            .fail(function() {
                  $(document).trigger("mlabready");
                });
    return this;
}

/**
 * Initialise the different functions.
 * @type Mlab_api
 */
Mlab_api.prototype = {
    version: 0.9,
    /**
     * Get the mode the app is in: "runtime" if in app mode, "design" if in editor mode, 
     * with additional device info, app for mobile device, desktop for browser (i.e. no cordova)
     * @return {object}
     */
    getMode: function() {
        var mode = {mode: "design", device: "desktop"};
        if (typeof mlab.dt == "undefined") {
            mode.mode = "runtime";
        }
        if (typeof window.cordova != "undefined") {
            mode.device = "mobile";
        }
        return mode;
    },
    
    getDeviceId: function() {
        var mode = this.getMode();
        if (mode.device == "mobile") {
            return device.uuid;
        } else {
            var global_data = window.localStorage.getItem("GLOBAL");
            if (!global_data) {
                global_data = {"device_uuid": this.getGUID()};
                window.localStorage.setItem("GLOBAL", JSON.stringify(global_data));
            } else {
                global_data = JSON.parse(global_data);
            }
            return global_data.device_uuid;
        }
    },

    getAppUid:  function() {
        return $('head > [name="mlab:app_uid"]').attr("content");
    },

    
/**
 * Creates a unique ID starting with the prefix mlab_, followed by a rfc4122 version 4 compliant GUID. 
 * This is typically used to create an ID for a component that must not clash with any other IDs.
 * @returns {String}
 */
    getGUID : function () {
        return 'mlab_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

        
/**
 * Get current locale
 * @returns string
 */
    getLocale: function() {
        return this.parent.locale;
    },
    
/**
 * Reads in the Javascript values stored for the specified element, extracts the value of the key specified.
 * This only works on top level vars, further processing must be done inside the JS code for the component.
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.
 * @param {jQuery DOM element} el
 * @param {string} key, the key name in the object
 * @returns {Mlab_dt_api.prototype.getVariable.vars|Array|Object}
 */
    getVariable: function (el, key) {
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
        
        return vars[key];
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
            return ;
        }
        
        return vars;
    },    
    
/**
 * This function stores variables for the current app in a global variable, this matches the function titled setTempVariable in the mlab.dt.api.js file
 * @param {object} comp, the name of the component
 * @param {object} key, key to index, the component must itself ensure that this is unique, for instance by using "xxxx" + my_unique_id
 * @param {object} value
 * @returns {undefined}
 */
    setAppVariable: function (comp, key, value) {
        if (typeof document.mlab_storage == "undefined") {
            document.mlab_storage = {};
        }
        if (typeof document.mlab_storage[comp] == "undefined") {
            document.mlab_storage[comp] = {};
        }
        if (typeof document.mlab_storage[comp][key] == "undefined") {
            document.mlab_storage[comp][key] = {};
        }

        document.mlab_storage[comp][key] = value;
    },
        
/**
    * This function retrieves variables for the current app from a global variable, this matches the function titled getTempVariable in the mlab.dt.api.js file
    * @param {object} comp, the name of the component
    * @param {object} key, key to index, the component must itself ensure that this is unique, for instance by using "xxxx" + my_unique_id
    * @returns {Javascript variable}
 */
    getAppVariable: function (comp, key) {
        if (typeof document.mlab_storage == "undefined") {
            return;
        }
        if (typeof document.mlab_storage[comp] == "undefined") {
            return;
        }
        if (typeof document.mlab_storage[comp][key] == "undefined") {
            return;
        }

        return document.mlab_storage[comp][key];
    },

    
/**
 * Object that deals with all database related activity. 
 * Internally it has code for storing data using HTML5 we storage, 
 * all functions check to see if a storage plugin is loaded, if so it will call the matching function in the plugin to store data remotely.
 * @type object
 */
    db: {

/* Pointer to main mlab object */
        parent: null,
        retry_save_queue_counter: 0,
        process_save_queue_counter: 0,
        processing_queue: false,
        process_save_queue_interval: 3000,
        process_save_queue_num_items: 3,
        PLUGIN_NOT_USED: -1,
        PLUGIN_OFFLINE: -2,
        PLUGIN_NO_FUNCTION: -3,
        PLUGIN_NO_DATA: -4,


//we read the storage plugin information directly from the variables stored with the component that initialises the storage plugin
//these are stored in a JSON format in a script inside the div, and the variable is always named storage_plugin
/**
 * 
 * @param {type} el: HTML element that = component that wants to open a connection
 * @param {type} callback: ptional callback to execute from the onPluginLoaded function
 * @returns {Boolean}
 */
        setupStoragePlugin: function(el, callback) {
            var plugin_component;
            var owner_id = $(el).attr("id");
            
//pick up the settings stored for a storage_plugin this is save autoamtically by the mlab editor environment
            var plugin_info = this.parent.getVariable(el, "storage_plugin");
            
            if (!plugin_info) { return false; }
            
            if ("name" in plugin_info && plugin_info["name"] in this.parent.components) {
                plugin_component = this.parent.components[plugin_info["name"]];
            }
            
            if (!plugin_component) { return false; }
            
//the plugins object holds a list of components (effectively pointers to components), this means all components share a single instance of the code
//we therefore need to add a variable that holds unique values for each "instance" of this plugin
            if (!("_data" in plugin_component)) {
                plugin_component._data = {};
            }
            plugin_component._data[owner_id] = {};
            plugin_component._data[owner_id].settings = plugin_info;
            plugin_component._data[owner_id].html_element = el;
            plugin_component._data[owner_id].owner_uuid = owner_id;

            this.plugins[owner_id] = plugin_component;
            
// onpluginloaded isn't required for plugins, 
            if ("onPluginLoaded" in plugin_component) {
                plugin_component.onPluginLoaded(el, callback);
            }
            
//last thing we do is to start a global timer which tries to save unsaved data (if this is not already done
            if (!this.processing_queue) {
                window.setInterval(mlab.api.db.internal.processFailedQueue(), this.process_save_queue_interval);
                this.processing_queue = true;
            }
            return true;
        },    
        
/* ---- functions that are run locally if no plugin is loaded ---- */

/* Sets state for user, also makes sure it is saved for later use.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} key Key name for the state to be stored. Required.
 * @param {any} value The state value to be stored. Required. Can be anything that is compatible with JSON.stringify. All basic Javascript types should be OK.
 */ 
        setState: function(device_uuid, component_uuid, key, value, callback) {
            return this.internal.setData("state", device_uuid, component_uuid, key, value, callback);
        },

/**
 * Gets state for given user an key.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} key Key name for the state to be stored. Required.
 * @return {Any} Value of state
 */
        getState: function(device_uuid, component_uuid, key, callback) {
            return this.internal.getData("state", device_uuid, component_uuid, key, callback);
        },

/**
 * Gets all stored states for user 
 * @param {String} user User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the states
 */
        getAllState: function(device_uuid, component_uuid, callback) {
            return this.internal.getAllData("state", device_uuid, component_uuid, callback);
        },
    
/**
 * Sets config for user, also makes sure it is saved for later use.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} key Key name for the config to be stored. Required.
 * @param {any} value The config value to be stored. Required. Anything that is compatible with JSON.stringify. All basic Javascript types should be OK.
 */ 
        setConfig: function(device_uuid, component_uuid, key, value, callback) {
            return this.internal.setData("config", device_uuid, component_uuid, key, value, callback);
        },
    
/**
 * Gets config for given user an key.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} key Key name for the config to be stored. Required.
 * @return {any} The config value (any type), or null
 */
        getConfig: function(device_uuid, component_uuid, key, callback) {
            return this.internal.getData("config", device_uuid, component_uuid, key, callback);
        },

/**
 * Gets all stored configs, or all stored configs for user (if given).
 * @param {String} user: User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the configs
 */
        getAllConfig: function(device_uuid, component_uuid, callback) {
            return this.internal.getAllData("config", device_uuid, component_uuid, callback);
        },
    
/**
 * Saves result for a question.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} name The name of the quiz. Must be unique within the app. Required.
 * @param {String} key The name of the question. Must be unique within the quiz. Required.
 * @param {any} value The value to be stored.
 */
        setResult: function(device_uuid, component_uuid, key, value, callback) {
            return this.internal.setData("result", device_uuid, component_uuid, key, value, callback);
        },
    
/**
 * Get saved result for specific question
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} name The name of the quiz. Must be unique within the app. Required.
 * @param {String} key The name of the question. Must be unique within the quiz. Required.
 * @return {any} The value that was saved. Normally an object, but any JSON-stringifiable value is allowed.
 */
        getResult: function(device_uuid, component_uuid, key, callback) {
            return this.internal.getData("result", device_uuid, component_uuid, key, callback);
        },
        
/**
 * Gets all stored results, or all stored reults for user (if given).
 * @param {String} user User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the states
 */
        getAllResult: function(device_uuid, component_uuid, callback) {
            return this.internal.getAllData("result", device_uuid, component_uuid, callback);
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
        loginRemotely: function(component_uuid, callback) {
            var token = this.loginToken(component_uuid);
            if (token) {
                return token;
            }

            if (component_uuid in this.parent.plugins && typeof this.parent.plugins[component_uuid]["loginRemotely"] == "function") {
                opDone = this.parent.plugins[component_uuid].loginRemotely(this.parent.plugins[component_uuid], callback);
                if (typeof opDone != "undefined") return opDone;
            }
            return ;
        },
    
/**
 * Log off the remote service, through plugin.
 * @param {String} service The short_name of the service
 * @return {boolean} True if plugin has logged off, false if not.
 */
        logoffRemotely: function(component_uuid) {
            var token = this.loginToken(component_uuid);
            if (!token) {
                return false;
            }

            if (component_uuid in this.parent.plugins && typeof this.parent.plugins[component_uuid]["logoffRemotely"] == "function") {
                opDone = this.parent.plugins[component_uuid].logoffRemotely(this.parent.plugins[component_uuid], token, callback);
                if (typeof opDone != "undefined") return opDone;
            }
            return false;

        },
    
/**
 * Getter/setter for the login token string.
 * @param {String} service The short_name of the service
 * @param {String} token. Token to be set. Optional.
 * @return {String} or {false}. The currently set token, or false if not set.
 */
        loginToken: function(component_uuid, token) {
            if (typeof component_uuid == "undefined") return false;
            
// Saves the login tokens in session storage, under the key "loginTokens"
            if (typeof token != "undefined") {
                window.sessionStorage.setItem("_LOGIN_TOKENS_" + component_uuid, token);
            }
            
//always return the saved token, will autoamtically be null if can't find anything
            return window.sessionStorage.getItem("_LOGIN_TOKENS_" + component_uuid);
        },
        
/**
 * Object that keeps the functions that are not part of the outward facing API of mlab.
 */
        internal: {
    /* Pointer to main mlab object */
            parent: null,

/**
 * Internal helper function that is a generic way of dispatching a call to plugin. In addition to
 * the named parameters "owner_id" and "name", it is possible to pass any number of parameters, which are passed
 * on to the plugin function.
 * 
 * @param {type} func
 * @param {type} data_type
 * @param {type} app_id
 * @param {type} device_uuid
 * @param {type} component_uuid
 * @param {type} key
 * @param {type} value (undefined if this is calling a getXXX function)
 * @param {type} callback
 * 
 * @return {boolean} Return value from plugin if it supports the function required, otherwise false.
 * Typically the function in the plugin will run the code asynchronously and always return true
 */
            dispatchToPlugin: function(callback, func, data_type, app_uuid, device_uuid, component_uuid, key, value) {
                var opDone;
                
//if no plugin is loaded for this then only save locally
                if (!component_uuid in this.parent.plugins) {
                    return this.parent.PLUGIN_NOT_USED;
                }

//if we're not online, call the failed callback function and then return false
                if (typeof navigator.connection == "undefined") {
                    var networkState = true;
                } else {
                    var networkState = (navigator.connection.type != Connection.NONE);
                }
                if (!networkState) {
                    this.cbPluginFailed(data_type, app_uuid, device_uuid, component_uuid, key);
                    return this.parent.PLUGIN_OFFLINE;
                }
/*
 * In setupStoragePlugin we should perhaps return a uuid, and then the componet can use that later to refer to it (or should it be uid of comp + comp name + plugin name? that way if already logged in, no need to do login again... when reload page would lose uuid)
 * Also, this should be a timer event that processes the queue... or perhaps queue just when fail, so first try here, and then
 * have two callback, for fail and success, (the original callback is used for success!), in fail we add things to the queue which is processed again only when offline
 */                
                var cbFail = this.cbPluginFailed;
                if (component_uuid in this.parent.plugins && typeof this.parent.plugins[component_uuid][func] == "function") {
                    opDone = this.parent.plugins[component_uuid][func](cbFail, callback, app_uuid, device_uuid, component_uuid, key, value);
                    if (typeof opDone != "undefined") {
                        return opDone;
                    } else {
                        return this.parent.PLUGIN_NO_DATA;
                    }
                } else {
                    return this.parent.PLUGIN_NO_FUNCTION;
                }

            },
            
/**
 * If the remote save fails (or we were offline already when try to save) we add a record to the queue we use to retry saves
 * @param {type} owner_id
 * @param {type} func
 * @returns {undefined}
 */
            cbPluginFailed: function(data_type, app_uuid, device_uuid, component_uuid, key) {
                var SEP = this.parent.parent.data_divider;
                var counter = this.parent.retry_save_queue_counter++; //TODO could get a race condition here...
                window.localStorage.setItem("_QUEUE_" + counter, data_type + SEP + app_uuid + SEP + device_uuid + SEP + component_uuid + SEP + key);
            },
            
/**
 * Simple first in, first out queue processing, reading entry by entry from the list of items that were not saved correctly
 * Here we retry the save function by calling setData directly with all the relevant 
 */
            processFailedQueue: function () {
// If we are still online we simply bail
                if (typeof navigator.connection == "undefined") {
                    var networkState = true;
                } else {
                    var networkState = (navigator.connection.type != Connection.NONE);
                }
  
//we store a pointer to the local storage of a value, this pointer = the key of the stored value
                var dummy_cb, res;
                var data = { data_type: null, app_uuid: null, device_uuid: null, component_uuid: null, key: null };
                var counter = this.parent.process_save_queue_counter;
                for (i = 0; i < this.parent.process_save_queue_num_items; i++) { 
                    console.log("processing q");
//if there's no data in the queue we quit
                    var key = window.localStorage.getItem("_QUEUE_" + counter);
                    if (!key) { console.log("nothing in q"); return; }
                    
//if we cannot obtain the value we quit, otherwise we move the pointer forward and process the retrieved data
                    var value = window.localStorage.getItem(key);
                    if (!value) { console.log("no value found for key: " + key); return; }
                    
                    var temp = key.split(mlab.api.data_divider);
                    data.data_type = temp[0];
                    data.app_uuid = temp[1];
                    data.device_uuid = temp[2];
                    data.component_uuid = temp[3];
                    data.key = temp[4];
                    mlab.api.db.process_save_queue_counter++ ;
                    
                    res = mlab.api.db.internal.dispatchToPlugin(dummy_cb, "set" + data.data_type.charAt(0).toUpperCase() + data.data_type.slice(1), data.data_type, data.app_uuid, data.device_uuid, data.component_uuid, data.key ,value);
                    if (!res) {
                        mlab.api.db.internal.cbPluginFailed(data_type, app_uuid, device_uuid, component_uuid, key);
                    }
                }
            },

//-----------------------------GENERIC FUNCTIONS THAT ARE USED BY WRAPPER FUNCTIONS ABOVE
            setData: function(data_type, device_uuid, component_uuid, key, value, callback, app_id) {
                if (typeof app_id == "undefined") {
                    var app_id = this.parent.parent.getAppUid();
                }
//always update locally
                var SEP = this.parent.parent.data_divider;
                window.localStorage.setItem(data_type + SEP + app_id + SEP + device_uuid + SEP + component_uuid + SEP + key, JSON.stringify(value));

                var res = this.dispatchToPlugin(callback, "set" + data_type.charAt(0).toUpperCase() + data_type.slice(1), data_type, app_id, device_uuid, component_uuid, key, value);
                
                
//if no plugin or plugin does not support function then this is saving locally only.
//we call the callback with local data, and mark it as fresh
                if (callback && (res == this.parent.PLUGIN_NOT_USED || res == this.parent.PLUGIN_NO_FUNCTION)) {
                    var state = fresh;
//otherwise data is marked as stale
                } else if (callback && (res == this.parent.PLUGIN_OFFLINE || res == this.parent.PLUGIN_NO_DATA)) {
                    var state = stale;
                }
                if (callback && res != true) {
                    var data = {data: {}, state: state};
                    data.data[key] = value;
                    callback(data);
                }
                return true;
            },
            
/**
 * Returns the value of a single, type specific, record. Returned as a json object
 * @param {type} data_type
 * @param {type} device_uuid
 * @param {type} comp_id
 * @param {type} key
 * @param {type} callback
 * @returns {Boolean}
 */
            getData: function(data_type, device_uuid, component_uuid, key, callback) {
                var app_id = this.parent.parent.getAppUid();
                var res = this.dispatchToPlugin(callback, "get" + data_type.charAt(0).toUpperCase() + data_type.slice(1), data_type, app_id, device_uuid, comp_id, key);

//If false, getResult is not implemented in plugin, and we should use the local storage.
                var SEP = this.parent.parent.data_divider;
                
//if no plugin or plugin does not support function then this is saving locally only.
//we call the callback with local data, and mark it as fresh
                if (callback && (res == this.parent.PLUGIN_NOT_USED || res == this.parent.PLUGIN_NO_FUNCTION)) {
                    var state = "fresh";
//otherwise data is marked as stale
                } else if (callback && (res == this.parent.PLUGIN_OFFLINE || res == this.parent.PLUGIN_NO_DATA)) {
                    var state = "stale";
                }
                
                if (callback && res != true) {
                    var data = {state: state, data: {}};
                    data.data[key] = JSON.parse(window.localStorage.getItem(data_type + SEP + app_id + SEP + device_uuid + SEP + component_uuid + SEP + key)) 
                    callback(data);
                }
                return true;
            },

/**
 * Returns all value of a single type for a specific app_id/device_uuid/component
 * @param {type} data_type
 * @param {type} device_uuid
 * @param {type} comp_id
 * @param {type} callback
 * @returns {Boolean}
 */
            getAllData: function(data_type, device_uuid, comp_id, callback) {
                var app_id = this.parent.parent.getAppUid();
                var res = this.dispatchToPlugin(callback, "getAll" + data_type.charAt(0).toUpperCase() + data_type.slice(1), data_type, app_id, device_uuid, comp_id);
                var len = 0;
                
                if (res === true) {
                    return true;
                }
//if no plugin or plugin does not support function then this is saving locally only.
//we call the callback with local data, and mark it as fresh
                if (callback && (res == this.parent.PLUGIN_NOT_USED || res == this.parent.PLUGIN_NO_FUNCTION)) {
                    var state = "fresh";
//otherwise data is marked as stale
                } else if (callback && (res == this.parent.PLUGIN_OFFLINE || res == this.parent.PLUGIN_NO_DATA)) {
                    var state = "stale";
                }
                
                if (callback && res != true) {
                    var i = 0;
                    var values = {};
                    var sKey;
                    var SEP = this.parent.parent.data_divider;
                    var key = data_type + SEP + app_id + SEP + device_uuid + SEP + comp_id + SEP;
                    for (; sKey = window.localStorage.key(i); i++) {
                        len = key.length;
                        if (sKey.substr(0, len) == key) {
                            values[sKey] = JSON.parse(window.localStorage.getItem(sKey));
                        }
                    }
                    callback({data: values, state: state});
                }
                
                return true;
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
            },
            
        }, //end internal

        
    }, //end db
    
//-------- OBJECT THAT CONTAIN SUB FUNCTIONS FOR DIFFERENT APP RELATED TASKS --------//
    
/**
 * Object used for navigation functionality at runtime
 * (added by arild)
 */
    navigation: {
        current_page: 0,
        max_pages: 0,
        self: this,
        
        initialise: function (app_start_page, app_max_pages) {
            this.max_pages = app_max_pages;
            this.pageDisplay(app_start_page);
        },
/**
 * current = page that is currently displayed
 * move_to can be index, first, last, next, previous or a number
 * @param {type} page
 * @param {Boolean} swipe
 * @returns {undefined}
 */
        pageDisplay: function (move_to, swipe) {
            var filename = "";
            var new_location = 0;
            switch (move_to) {
                case 0:
                case "index":
                    filename = "000.html";
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
                    if (this.current_page >= this.max_pages) {
                        return this.current_page;
                    }
                    this.current_page++;
                    filename = ("000" + this.current_page).slice(-3) + ".html";
                    new_location = this.current_page;
                    break;

                case "previous" :
                    if (this.current_page === 0 || this.current_page === "index") {
                        return this.current_page;
                    }
                    this.current_page--;
                    if (this.current_page < 0) {
                        this.current_page = 0;
                    }
                    filename = ("000" + this.current_page).slice(-3) + ".html";
                    new_location = this.current_page;
                    break;

//pages are always saved as nnn.html, i.e. 001.html, and so on, so need to format the number
                default:
                    var pg = parseInt(move_to);
                    if (isNaN(pg)) {
                        return this.current_page;
                    }
                    if (move_to < 0 || move_to > this.max_pages) {
                        return this.current_page;
                    }
                    filename = ("000" + move_to).slice(-3) + ".html";
                    new_location = move_to;
                    break;
            }

//Adds a differens between swipe and click
            if (swipe){
                    $.mobile.pageContainer.pagecontainer("change", filename, { transition: "slide" });    
            } else {
                    $.mobile.pageContainer.pagecontainer("change", filename, { transition: "flip" });                   
            }
            
//have calculated the file name, now we need to try to load it
            this.current_page = new_location;
            return this.current_page;
        },
        
    },
    

/**
 * object for display functionality, primarily for resizing components
 */
    display: {
        
/**
 * Goes through the components on a page and calls the onPageLoad function (if it exists)
 * This is for components that does not require the layout of the page to be done
 * It is called from jquery mobile's pagecreate
 * @param {type} e
 * @param {type} ui
 * @returns {undefined}
 */
        prepareRegularComponents: function (e) {
            /* timestamp & ui object */
            console.log(e.type + " " + Date(e.timeStamp));
            var components = $('[data-mlab-type]:not([data-mlab-displaydependent="true"])');
            
            components.each( function() {
                var comp_id = $( this ).data("mlab-type");
                if (typeof mlab.api.components[comp_id] != "undefined" && typeof mlab.api.components[comp_id].onPageLoad != "undefined") {
                    mlab.api.components[comp_id].onPageLoad($(this), mlab.api.getAllVariables($(this)));
                }
            });    
        },
        
/**
 * Goes through the components on a page and calls the onPageLoad function (if it exists)
 * This is for components that does not require the layout of the page to be done
 * It is called from jquery mobile's pagecreate
 * @param {type} e
 * @param {type} ui
 * @returns {undefined}
 */
        prepareDisplayDependentComponents: function (e, ui) {
            /* timestamp & ui object */
            console.log(e.type + " " + Date(e.timeStamp));
            console.log(ui);
            var components = $('[data-mlab-type][data-mlab-displaydependent="true"]');
            
            components.each( function() {
                var comp_id = $( this ).data("mlab-type");
                if (typeof mlab.api.components[comp_id] != "undefined" && typeof mlab.api.components[comp_id].onPageLoad != "undefined") {
                    mlab.api.components[comp_id].onPageLoad($(this), mlab.api.getAllVariables($(this)));
                }
            });    
        },

/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {undefined}
 */
        updateDisplay: function (el) {
            var components = (typeof el == "undefined") ? $('[data-mlab-size][data-mlab-aspectratio]') : $(el);
            
            components.each( function() {
                var device_width = $('[data-role="page"]').first().innerWidth();
                var aspect_ratio = $(this).attr("data-mlab-aspectratio").split(":");
                var size = $(this).attr("data-mlab-size");
                var times = (size == "small") ? 0.33 : ((size == "medium") ? 0.67 : 1);
                
                var w = (device_width * times);
                var h = (w / aspect_ratio[0]) * aspect_ratio[1];
                $(this).css( {"width": w + "px", "height": h + "px"} );

            });    
        },
        
    },
    

/**
 * Object used for changing settings at runtime
 */   
    settings: {

        /**
         * This function toggles the text size of an html element between 100% and 130%
         * @param {string} elementId The id of the HTML element where the text size will be toggled
         */
        pageTextSizeToggle: function (elementClass) {
            //TODO: Bytte til .toggle() og egentlig lage noen generiske toggleClassBasedOnID og toggleClassBasedOnClass
            if ($("." + elementClass).hasClass('mlab_large_text')) {
                $("." + elementClass).removeClass('mlab_large_text');
            } else {
                $("." + elementClass).addClass('mlab_large_text'); 
            }
        },
        
        /**
        * This function toggles the text and background color of an html element
         * @param {string} elementIdBackgroundColor The id of the HTML element where the color of the background will be toggled
         * @param {string} elementClassTextColor  The class of the HTML element/s where the color of the text will be toggled
        */
        pageColorToggle: function (elementIdBackgroundColor, elementClassTextColor) {
            
            //TODO: Bytte til .toggle() og egentlig lage noen generiske toggleClassBasedOnID og toggleClassBasedOnClass
            if ($("#" + elementIdBackgroundColor).hasClass('mlab_color_toggle')) {
                $("#" + elementIdBackgroundColor).removeClass('mlab_color_toggle');
                $("." + elementClassTextColor).removeClass('mlab_color');
            } else {
                $("#" + elementIdBackgroundColor).addClass('mlab_color_toggle'); 
                $("." + elementClassTextColor).addClass('mlab_color');
            }
        },
        
    },
}; // end prototype for Mlab.api

/* 
 * Mlab object is stored in a global variable "mlab", and is initialized automatically when device is ready.
 */
if (typeof mlab == "undefined") {
    mlab = {"api": null};
}


/**
 * Function called when document is ready, prepares the jQuery mobile callbacks, initialises diaplsy and database functions
 */  
$(document).ready(function() {
    
    console.log("EVENT: ready");
    
    if ($("body").attr("id") != "mlab_editor") {
        console.log("STATE: mobile mode, init own object");

        mlab.api = new Mlab_api();

//page create for main page (that will contain other pages) only for index page
        $( document ).on( "pagecreate", "#index", function ( event ) {
            console.log("EVENT: pagecreate-index");
        });

//general pagecreate, run component code for components that do not care about display
        $( document ).on( "pagecreate", function ( event ) {
            console.log("EVENT: pagecreate-general");
            mlab.api.display.prepareRegularComponents(event);
//Swipe
            $('div.ui-page')
                .on("swiperight", function () { mlab.api.navigation.pageDisplay("previous", true); console.log("right swipe"); })
                .on("swipeleft", function () { mlab.api.navigation.pageDisplay("next", true); console.log("left swipe");});
        });

//general pagecontainerbeforeshow, run component code for components that require size information, ie. display is done
        $( document ).on( "pagecontainershow", function ( event, ui ) {
            console.log("EVENT: pagecontainershow");
            mlab.api.display.prepareDisplayDependentComponents(event, ui);
            mlab.api.display.updateDisplay();
        });

//when the orientation changes we must redraw the komponents that require specific resizing
        $( window ).on( "orientationchange", function ( event ) {
            console.log("EVENT: orientationchange");
            mlab.api.display.updateDisplay();
        });

//used to call app specific initialisation routine
        $(document).on("mlabready", function() {
            console.log("mlabready");
            if (typeof mlabInitialiseApp != "undefined") {
                mlabInitialiseApp();
            }
        });
    }
});