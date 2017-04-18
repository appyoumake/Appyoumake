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
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract API functions for use by components at design time (i.e. in the MLAB editor).
 * @abstract Used to obtain info such as paths, to display user input requests or to store data, etc.
 * @returns {Mlab_dt_api}
 * @constructor
 */
function Mlab_dt_api () {
    this.storage = new Object();
    this.version = 0.9;
    this.properties_tooltip = false;
};

/**
 * Initialise the different functions.
 * @type type
 */
Mlab_dt_api.prototype = {

/*
 * Symfony allows us to redfine URLs at any time using the route functionality, so we should avoid fixed URLs.
 * They are therefor always stored in variables picked up from the server, using an AJAX call to the load_variable URL.
 * Below are wrapper functions to obtain them from the internal variables.
 */

/**
 * Requests for the absolute URL to where apps are stored, we work wth the /wwwork directory inside here.
 * Used to load pages in an app, and related CSS/JS/media files.
 * @returns {String.origin|Location.origin|Mlab_dt_api.parent.config.urls.app}
 */
    getUrlAppAbsolute : function () {
        return window.location.origin + this.parent.config.urls.app;
    },

/**
 * Requests for the relative URL to where apps are stored, we work wth the /wwwork directory inside here
 * Used to load pages in an app, and related CSS/JS/media files
 * @returns {Mlab_dt_api.parent.config.urls.app}
 */
    getUrlAppRelative : function () {
        return this.parent.config.urls.app;
    },

/**
 * Requests for the absolute URL to where components are stored.
 * Used to load components when designing an app (components consist of configuration file and JS code)
 * and related CSS/JS/media files.
 * @returns {Mlab_dt_api.parent.config.urls.component|String.origin|Location.origin}
 */
    getUrlComponentAbsolute : function () {
        return window.location.origin + this.parent.config.urls.component;
    },

/**
 * Requests for the relative URL to where components are stored.
 * Used to load components when designing an app (components consist of configuration file and JS code).
 * and related CSS/JS/media files.
 * @returns {Mlab_dt_api.parent.config.urls.component}
 */
    getUrlComponentRelative : function () {
        return this.parent.config.urls.component;
    },

/**
 * Requests for the absolute URL to where templates are stored.
 * Not really used much by the MLAB editor front end, the files are usually copied on the server.
 * However we have it here for completeness.
 * @returns {String.origin|Location.origin|Mlab_dt_api.parent.config.urls.template}
 */
    getUrlTemplateAbsolute : function () {
        return window.location.origin + this.parent.config.urls.template;
    },

/**
 * Requests for the relative URL to where templates are stored.
 * Not really used much by the MLAB editor front end, the files are usually copied on the server.
 * However we have it here for completeness.
 * @returns {Mlab_dt_api.parent.config.urls.template}
 */
    getUrlTemplateRelative : function () {
        return this.parent.config.urls.template;
    },

/**
 * Requests for the absolute URL used to upload files, used by components that let users use own files, 
 * such a image component, video player, etc.
 * @param {string} comp_id is the unique ID of the component, for instance img or video
 * @returns {Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace|String.origin|Location.origin}
 */
    getUrlUploadAbsolute : function (comp_id) {
        return window.location.origin + this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_COMPID_", comp_id);
    },

/**
 * Requests for the absolute URL used to upload files, used by components that let users use own files, 
 * such a image component, video player, etc.
 * @param {string} comp_id is the unique ID of the component, for instance img or video
 * @returns {Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace}
 */
    getUrlUploadRelative : function (comp_id) {
        return this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", comp_id);
    },
    
/**
 * This will return a list in HTML format of all the available storage plugins
 * Each plugin will have an onclick event
 * @param {component} jquery element, the current selected component
 */
    getStoragePluginList: function (component) {
        var storage_plugin_list = $("<ul></ul>");
        var sel_class = "";
        var selected_plugin;
        var that = this;

//find out if the component has a currently selected storage plugin
        var existing_storage_plugin = mlab.dt.api.getVariable(component, "storage_plugin");
        if (existing_storage_plugin && existing_storage_plugin.name) {
            selected_plugin = existing_storage_plugin.name;
        }
    //component.conf.storage_plugins 
    //Hvis true så skal alle pluggins lastes - ellers skal de som er listet lastes
        for (type in this.parent.storage_plugins) {
            if (type == selected_plugin) {
                sel_class = " class='mlab_item_applied' data-mlab-selected-storage='true' "; 
            } else {
                sel_class = "";
            }
            storage_plugin_list.append("<li data-mlab-storage-plugin-type='" + type + "' " + sel_class + " title='" + $('<div/>').text(this.parent.storage_plugins[type]).html() + "'>" 
                                  //bare vise om pluginen trenger credentials...
                                        + "<img data-mlab-comp-tool='credentials' class='mlab_tools mlab_tools_space' src='/img/tools/credentials.png' title='qqq'>" 
                                        + "<span>" + type.charAt(0).toUpperCase() + type.slice(1)   + "</span>"                  
                                        + "</li>");
        }
        
        storage_plugin_list.find("img").on("click", function () { 
                var this_storage_plugin_id = $(this).parent().data("mlab-storage-plugin-type");
                var el = $("[data-mlab-get-info='storage_plugins'] [data-mlab-storage-plugin-type='" + this_storage_plugin_id + "']");
                that.getCredentials(el, this_storage_plugin_id, that.parent.components[this_storage_plugin_id].conf.credentials, that.parent.design.storage_plugin_store_credentials, true, { storage_plugin_id: this_storage_plugin_id, component: component });
        });
        
        storage_plugin_list.find("span").on("click", function () { 
                mlab.dt.design.storage_plugin_setup( $(this), $(this).parent().data("mlab-storage-plugin-type"),  mlab.dt.api.getSelectedComponent() ); 
        });
        
        return storage_plugin_list;
        
    },
/**
 * Wrapper function which calls the back end to load component help, 
 * the backend checks for language selected and sees if there are language specific help file available, if not use generic one
 * @param {type} component: component object
 * @param {type} title: title of dlg box, string
 * @param {type} owner: HTML element that will own this Qtip
 * @returns {undefined}
 */

    displayExternalHelpfile: function (component_id, title, owner_element, qTipClass) {
        var qTipClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        var url = this.parent.urls.component_helpfile.replace("_COMPID_", component_id);
        
        if (typeof qTipClass !== "undefined") { 
            qTipClasses = qTipClasses + " " + qTipClass;
        }
        $.getJSON(url, function(data) {
            if (data.result === "SUCCESS") {
                 $(owner_element).qtip({
                     solo: false,
                     content:    {
                                 text: data.html,
                                 title: title,
                                 button: true
                                 },
                     position:   { my: 'topRight', at: 'bottomMiddle', viewport: $(window), effect: false },
                     show:       { ready: true, modal: { on: false } },
                     hide:       false,
                     style:      { classes: qTipClasses, tip: true },
                     events:     {   hide: function(event, api) { api.destroy(); } }
                 });
            } else {
                alert(data.message);
            }

        })
        .fail(function() {
            alert( _tr["mlab.dt.design.js.alert.help.notfound"] );
        });
    },

/**
 * Returns a list of files already uploaded, non-async so we can return data to the calling function who may do any number of things with it.
 * @param {String} extensions
 * @returns {Array} list of options for select element
 */
    getMedia : function (extensions) {
        var data = $.ajax({
            type: "GET",
            url: this.parent.urls.uploaded_files.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", extensions),
            async: false,
        }).responseText;

        data = eval("(" + data + ")");
        if (data.result == "success") {
            return data.files;
        } else {
            return "<option>" + _tr["mlab.dt.api.js.getMedia.fail"] + "</option>";
        }
    },
    
/**
 * Returns a CSS style class name which utilises standard Mlab styles
 * properties = array of nouns describing what style they want
 */
     getStyle: function (properties) {
         var style = "";
         for (i in properties) {
             switch (properties[i]) {
                 case "text": 
                     style = style + "mc_text ";
                     break;
                     
                 case "imgtxt": 
                     style = style + "mc_picture_and_text";
                     break;
             }
         }
     },
     
     indicateWait : function (state) {
         if (state) {
            $("#mlab_editor").addClass("mlab_loading_info");
         } else {
             $("#mlab_editor").removeClass("mlab_loading_info");
         }
     },
/**
 * 
 * @param {type} el: DIV surrounding the component HTML
 * @param {type} cb: Callback function when file is uploaded successfully OR a file is selected
 * @returns {undefined}
 */
    uploadMedia : function (el, component_config, file_extensions, cb, event) {
        this.indicateWait(true);
        content = $('<form />', {"id": "mlab_dt_form_upload" } );
        content.append( $('<p />', { text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.1"], "class": "mlab_dt_text_info" }) );
        content.append( $('<select id="mlab_cp_img_select_image" class="mlab_dt_select"><option>' + _tr["mlab.dt.api.js.uploadMedia.qtip.content.2"] + '</option></select>') );
        content.append( $('<div />', { "id": "mlab_cp_image_uploadfiles", "class": "mlab_dt_button_upload_files mlab_dt_left", name: "mlab_cp_image_uploadfiles", text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.3"], data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<div />', { "class": "mlab_dt_large_new_line" }) );
        content.append( $('<div />', { text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.4"], "id": "mlab_cp_image_button_cancel", "class": "pure-button pure-button-xsmall mlab_dt_button_cancel mlab_dt_left" }) );
       // content.append( $('<div />', { class: "mlab_dt_button_new_line" }) );
        content.append( $('<div />', { text:  _tr["mlab.dt.api.js.uploadMedia.qtip.content.5"], "id": "mlab_cp_image_button_ok", "class": "pure-button pure-button-xsmall right mlab_dt_button_ok mlab_dt_left" }) );

        var that = this;
        
        if (typeof event != "undefined") {
            var owner_element = event.currentTarget;
        } else {
            var owner_element = el;
        }
        this.properties_tooltip = $(owner_element).qtip({
            solo: false,
            content: {text: content, title: _tr["mlab.dt.api.js.uploadMedia.qtip.title"] },
            position: { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window) },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-light mlab_zindex_top_tooltip', tip: true },
            events: { render: function(event, api) {
                            that.indicateWait(true);
                            this.dt_component = el;
                            this.dt_component_id = component_config.name;
                            this.dt_config = component_config;
                            this.dt_cb = cb;
//load existing files
                            var existing_files = that.getMedia(file_extensions);
                            $("#mlab_cp_img_select_image").html(existing_files)
                                                          .on("change", function() {
                                that_qtip.dt_cb(that_qtip.dt_component, $("#mlab_cp_img_select_image").val()); 
                                that.setDirty();
                                
                                that.closeAllPropertyDialogs();
                            }); 


//upload files 
                            if ($("#mlab_cp_image_button_ok").length > 0) {
                                var that_qtip = this;
                                var uploadObj = $("#mlab_cp_image_uploadfiles").uploadFile({
                                    url: that.getUrlUploadAbsolute(that_qtip.dt_config.name),
                                    formData: { comp_id: that_qtip.dt_component_id, app_path: that.parent.app.path },
                                    multiple: false,
                                    showCancel: false,
                                    showAbort: false,
                                    showDone: false,
                                    autoSubmit: true,
                                    fileName: "mlab_files",
                                    showStatusAfterSuccess: true,
                                    allowedTypes: file_extensions,
                                    onSuccess: function(files, data, xhr) {
                                                that_qtip.dt_cb(that_qtip.dt_component, data.url);
                                                that.setDirty();
                                                api.hide(); 
                                        }.bind(that_qtip.dt_component),
                                    onError: function(files, status, errMsg) { 
                                        alert(errMsg); 
                                    }
                                });

                                $("#mlab_cp_image_uploadfiles_start").click(function() {
                                    uploadObj.startUpload();
                                });
                            }
                            
                            $('#mlab_cp_image_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                        if (typeof (document["mlab_code_" + component_id]) !== "undefined") {
                                            document["mlab_code_" + component_id].setProperties( $("#mlab_dt_form_upload").serializeArray(), this );
                                        }
                                    }.bind(that_qtip.dt_component));
                            $('#mlab_cp_image_button_cancel', api.elements.content).click(function(e) { api.hide(e); });
                            
                            //Adding mlab style 
                            //$('#mlab_property_button_ok').addClass('mlab_dt_button_ok mlab_dt_left'); 
                            //$('#mlab_property_button_cancel').addClass('mlab_dt_button_cancel  mlab_dt_left');
                            //$('#mlab_property_uploadfiles').addClass('mlab_dt_button_upload_files  mlab_dt_left');
                            $('.new_but_line').addClass('mlab_dt_button_new_line');
                            $('.new_big_line').addClass('mlab_dt_large_new_line');
                            $('.new_small_line').addClass('mlab_dt_small_new_line');
                            $('.info').addClass('mlab_dt_text_info');
                            $('.ajax-file-upload-filename').addClass('mlab_dt_text_filename');
                            $('.ajax-file-upload-statusbar').addClass('mlab_dt_progress_bar');
                            that.indicateWait(false);
                        },
                        show: function(event, api) { api.focus(event); },
                        hide: function(event, api) { api.destroy(); that.properties_tooltip = false; }
            }
        });
        this.indicateWait(false);
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
 * Goes through a newly loaded page and checks if any of the components on the page requires a library (CSS/JS) to be loaded
 * calls getLibraries for the actual hard lifting, this is just a wrapper
 * @returns {Number}
 */
    getAllLibraries : function () {
        var processed_component = [];
        var comp_id;
        var that = this;
        $( "#" + this.getEditorElement()).children("[data-mlab-type]").each( function() {
            comp_id = $(this).data("mlab-type") ;
            if (processed_component.indexOf(comp_id) < 0) {
                that.getLibraries(comp_id);
                processed_component.push(comp_id)
            }
        });
    },

//if = true we call component_add_html to complete the adding of the components
    getScriptFiles : function (scripts, process_adding_code, comp_id) {
        var next_script = scripts.shift();
        var that = this;
        $.ajaxSetup({ cache: true });
        $.getScript(next_script).done(function( script, textStatus ) {
            if (scripts.length > 0) {
                return that.getScriptFiles(scripts, process_adding_code, comp_id);
            }
            $.ajaxSetup({ cache: false });
            if (process_adding_code === true) {
                mlab.dt.design.component_add_html(comp_id);
            }
            return true;
        }).fail(function( jqxhr, settings, exception ) {
            alert( "Unable to load script: " +  next_script + ". Component not added, please check network connection");
            $.ajaxSetup({ cache: false });
            return false;
        });
    },

/**
 * Loads all js/css files required by a component at design time.
 * Files loaded are specified in the conf.yml parameter required_libs.
 * @param {string} comp_id, the unique ID for the component that needs to load the files
 * @returns {undefined}
 */
    getLibraries : function (comp_id, process_adding_code) {
        var js_stack = [];
        if ("required_libs" in this.parent.components[comp_id].conf) {
            if ("designtime" in this.parent.components[comp_id].conf.required_libs) {
                var comp_url = window.location.origin + this.parent.urls.components_root_url;
                var comp_path = this.parent.components[comp_id].conf.name;

                for (i in this.parent.components[comp_id].conf.required_libs.designtime) {
                    var file = this.parent.components[comp_id].conf.required_libs.designtime[i];
                    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
                    
//has full URL including protocol, i.e. it is remote
                    if (regexp.test(file)) {
                        if (file.substr(-3) == ".js") {
                            if ($("script[src*='" + file + "']").length < 1) {
                                js_stack.push(file);
                            }
                        } else {
                            if ($("link[href*='" + file + "']").length < 1) {
                                $("head").append($("<link rel='stylesheet' type='text/css' href='" + file +"' >"));
                            }
                        }
                        
//"local", i.e. file that is part of Mlab a component 
                    } else if (file.substr(-3) == ".js") {
                        js_stack.push(comp_url + comp_path + "/js/" + file);
                    } else if (file.substr(-4) == ".css") {
                        if ($("link[href*='" + file + "']").length < 1) {
                            $("head").append($("<link rel='stylesheet' type='text/css' href='" + comp_url + comp_path + "/css/" + file +"' >"));
                        }
                    }
                }
                
                if (js_stack.length > 0 ) {
                    this.getScriptFiles(js_stack, process_adding_code, comp_id);
                    return;
                }
            }
        }
        if (process_adding_code === true) {
            mlab.dt.design.component_add_html(comp_id);
        }        
    },

/**
 * Get api version for designtime API, different from runtime API version (which is anyway a different file/object).
 * @returns {Number}
 */
    getVersion : function () {
        return this.version;
    },

/**
 * Get currently selected component (the DIV, not the internal HTML code).
 * @returns {jQuery object that represents the DIV surrounding the component}
 */
    getSelectedComponent : function () {
        return $('.mlab_current_component');
    },

/**
 * Set the global dirty flag, this tells the page_save function that the page needs to be updated on the server.
 * @returns {undefined}
 */
    setDirty : function () {
        this.parent.flag_dirty = true;
    },

/**
 * Clear the global dirty flag
 * @returns {undefined}
 */
    clearDirty : function () {
        this.parent.flag_dirty = false;
    },

/**
 * Get the ID of the DIV that is the container for the editable area. 
 * The string name is specified in the parameter.yml file and can be changed, but there really is no reason to do this.
 * @returns {String: Mlab_dt_api.parent.config.content_id}
 */
    getEditorElement : function () {
        return this.parent.config.app.content_id;
    },

/**
 * Simple wrapper function which will ensure that the jQuery plugin qtip2 is closed.
 * @returns {undefined}
 */
    closeAllPropertyDialogs : function () {
        if (this.properties_tooltip) {
            $(this.properties_tooltip).qtip('hide');
        }
    },
    
    executeCallback : function (func, el, event, api) {
        if (typeof func == "undefined" || func == null) {
            return;
        }
        func(el, event, api);
    },

/**
 * Displays the property input dialog for the specified component. 
 * This uses the jQuery plugin qtip2 for the actual dialog, and fills it with the specified content.
 * The component is reponsible for adding buttons such as Cancel and OK with callback to relevant functions in the component.
 * @param {jQuery DOM element} el, the component that the dialdisplayPropertyDialogog should be attached to
 * @param {string} title
 * @param {HTML string} content, valid HTML5
 * @param {function object} func_render, callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.
 * @param {function object} func_visible, callback function when the property dialog is visible
 * @param {function object} func_hide currently unused
 * @returns {undefined}
 */
    displayPropertyDialog : function (el, title, content, func_render, func_visible, func_hide, focus_selector, wide, event) {
        this.indicateWait(true);
        this.closeAllPropertyDialogs();
        that = this;
        var c = 'mlab_property_dlg qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        if (wide == true) { 
            c = c + ' mlab_dt_wide_qtip_box ';
        };
            
        if (typeof event != "undefined") {
            var owner_element = event.currentTarget;
        } else {
            var owner_element = el;
        }
        
        var curr_comp = $(".mlab_current_component");
        //set the qTips posistion after where it is placed in the window 
        var myPosQtip = 'leftMiddle';
        //var eTop = curr_comp.top; //get the offset top of the element
        var eTop = curr_comp.offset().top; //get the offset top of the element
        //eTop = eTop - $(window).scrollTop();
        if( eTop <= 145 ){
            myPosQtip = 'leftTop';
        }
        
        that.properties_tooltip = $(owner_element).qtip({
            solo: false,
            content:    {text: content, title: title, button: true },
            position:   { my: myPosQtip, at: 'rightMiddle', viewport: $(window) },
            show:       { ready: true, modal: { on: true, blur: false }, autofocus: focus_selector },
            hide:       false,
            style:      { classes: c, tip: true },
            events:     {   render: function(event, api) { if (func_render) { that.executeCallback (func_render, el, event, api) } },
                            show: function(event, api) { $('.qtip-title').append('<img class="mlab_dt_button_help" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiZCAAWNk5BICUAxAboEld+P3zxwYGcgHIYCBuAOL3QPwfB74PxAn4zGHE4+r9WFyNCywA+iYRmwQzFQwHAQNmFhaFf3//bESXYMKieD6JhsNAAtBxDsRY4IDDgAegoADiA3gsyScmch2wROx8NDUGuCKflBS0H6ppPw41+8m2AM03AljEDXAk2/cMlACgAQqg4MKTL+YTlQ9wGG4ATb4COJR8AGJDYH54QCgVkWu4I7rhRFsABP14DF8AdfkFoosKLD7AlToSgQYvILksItKCA0DDHQnpJTaIsHl/IsMoQI4DLLiBGL1MtHbcqAUEAQuR6hqxZTRiNAIEGADaemUuXgZoWQAAAABJRU5ErkJggg==">'); },            
                            hide: function(event, api) { if (func_hide) { that.executeCallback (func_hide, el, event, api) }; api.destroy(); that.properties_tooltip = false; },
                            visible: function(event, api) { if (func_visible) { that.executeCallback (func_visible, el, event, api) } } 
                        }
        });
        this.indicateWait(false);
    },
    
/**
 * Displays the help text, loaded via AJAX from 
 * @param {string} title
 * @param {HTML string} content, valid HTML5
 * @param {function object} func_render, callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.
 * @param {function object} func_visible, callback function when the property dialog is visible
 * @param {function object} func_hide currently unused
 * @returns {undefined}
 */
    displayHtmlPageInDialog : function (el, title, htmlpage, qTipClass) {
        var styleClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        if (typeof qTipClass != "undefined") { 
            var styleClasses = styleClasses + " " + qTipClass;
        }
         
        $(el).qtip({
            solo: false,
            content:    {
                        text: htmlpage,
                        title: title,
                        button: true
                        },
            position:   { my: 'topRight', at: 'bottomMiddle', viewport: $(window), effect: false },
            show:       { ready: true, modal: { on: false} },
            hide:       false,
            style:      { classes: styleClasses, tip: true },
            events:     { hide: function(event, api) { api.destroy(); }, render: function() { $(".mlab_help_icon").qtip().elements.tooltip.draggable(); } }
        });
    },

/**
 * Makes currently the socified component editable, using the HTML5 contenteditable attribute.
 * Only works on text elements, such as heading or paragraph
 * @param {jQuery DOM element} el
 * @returns {undefined}
 */
    editContent : function (el) {
        $(el).attr('contenteditable', 'true').focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents($(el)[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    },
    
/**
 * Returns the locale (for instance nb_NO) as specified in the backend Symfony environment.
 * Loaded as a temporary variable on initial MLAB editor page load as it has to be passed from the backend.
 * @returns {Mlab_dt_api.parent.parent.locale}
 */
    getLocale: function() {
        return this.parent.parent.locale;
    },

/**
 * Returns the string from a component as specified by the msg_key and msg_subkey 
 * This is a string that is entered into the conf.yml, it can be a tooltip or generic messages
 * If the key points to a string we just return the string, if it is an object, and it has an object named the same as the current locale,
 * then it returns this locale string, otherwise looks for one called default. If neither found, return empty
 * @param {type} comp_id
 * @param {string array} keys
 * @returns {string}
 */
    getLocaleComponentMessage: function(comp_id, keys) {
        var loc = this.getLocale();
        var obj = this.parent.components[comp_id].conf;
        var found_at_all = false;
        
        for (i in keys) {
            if (keys[i] in obj) {
                found_at_all = true;
                obj = obj[keys[i]];
            } else {
                found_at_all = false;
                break;
            }
        }
        
//does key exist at all?
        if (!found_at_all) {
            return "";
            
//key was found, now ned to see if it is a string or array of strings, and if our locale is present in object
        } else {
            if (typeof obj != "object") {
                return obj;
            } else if (loc in obj) {
                return obj[loc];
            } else if ("default" in obj) {
                return obj["default"];
            } else {
                return "";
            }            
        }
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
 * 
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
    
    getTempVariable: function (comp, key) {
        if (typeof document.mlab_dt_storage == "undefined") {
            return;
        }
        if (typeof document.mlab_dt_storage[comp] == "undefined") {
            return;
        }
        if (typeof document.mlab_dt_storage[comp][key] == "undefined") {
            return;
        }
        
        return document.mlab_dt_storage[comp][key];
    },

//writes the javascript value and stores it for the specified element
/**
 * Stores a Javascript value for the specified element.
 * This only works on top level vars, but the value can be an object which in effect gives lower level storage posibilities.
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element passed to this function.
 * @param {jQuery DOM element} el
 * @param {string} key, the key name in the object
 * @param {anything} value
 * @returns {Boolean}
 */
    setVariable: function (el, key, value) {
        var scrpt = $(el).find("script.mlab_storage");
        if (scrpt.length < 1) {
            $(el).append("<script type='application/json' class='mlab_storage' />");
            var vars = new Object();
            
        } else {
            var json = scrpt.html();
            if (json != "") {
                try {
                    var vars = JSON.parse(json);
                } catch(e) {
                    console.log(e);
                    var vars = new Object();
                }
            } else {
                var vars = new Object();
            }
            
        }
        
        vars[key] = value;
        $(el).find("script.mlab_storage").html(JSON.stringify(vars));
        this.setDirty();
        return true;
    },
    
/**
 * Overwrites all variables for the specified element, complementary to the setVariable function
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element passed to this function.
 * @param {jQuery DOM element} el
 * @param {anything} values to be stores
 * @returns {Boolean}
 */
    setAllVariables: function (el, values) {
        
        var scrpt = $(el).find("script.mlab_storage");
        if (scrpt.length < 1) {
            $(el).append("<script type='application/json' class='mlab_storage' />");
        }         

        $(el).find("script.mlab_storage").html(JSON.stringify(values));
        this.setDirty();
        return true;
    },
    
/**
 * This function stores things for the current session (i.e. the lifetime of this webpage) 
 * @param {object} comp, the name of the component
 * @param {object} key, key to index, the component must itself ensure that this is unique, for instance by using "xxxx" + my_unique_id
 * @param {object} value
 * @returns {undefined}
 */
    setTempVariable: function (comp, key, value) {
        if (typeof document.mlab_dt_storage == "undefined") {
            document.mlab_dt_storage = {};
        }
        if (typeof document.mlab_dt_storage[comp] == "undefined") {
            document.mlab_dt_storage[comp] = {};
        }
        if (typeof document.mlab_dt_storage[comp][key] == "undefined") {
            document.mlab_dt_storage[comp][key] = {};
        }

        document.mlab_dt_storage[comp][key] = value;
    },
    
/**
 * This updates the script for a control, this is write only as it should always be generated from user input and variables!
 * It therefore also always replaces existing content in the script element
 * @param {jQuery DOM element} el
 * @param {text} code, any Javascript compatible statements
 * @returns {Boolean}
 */
    setScript: function (el, code) {
        var scrpt = $(el).find("script.mlab_code");
        if (scrpt.length > 0) {
            scrpt.remove();
        } 
        
        scrpt = document.createElement("script");
        scrpt.type = "text/javascript";
        scrpt.className = "mlab_code";
        scrpt.text = code;
        $(el).append(scrpt);
        
        return true;
    },
    
/***
 * Utility function to get the A element parent of a selection area
 * @returns {String|Boolean}
 */
    getSelTextParentLinkElement: function () {
        var el, sel, node;
        sel = window.getSelection();
        if (sel.rangeCount) {
            el = sel.getRangeAt(0).commonAncestorContainer;
            node = el.nodeName.toLowerCase();
            while (node != 'a' && node != "body") {
                el = el.parentNode;
                node = el.nodeName.toLowerCase();
            }
        }
        
        if (node == 'a') {
            return el;
        } else {
            return false;
        }
    },

/***
 * Utility function to check that the current selection is inside the current mlab component
 * @returns {String|Boolean}
 */
    checkSelTextValid: function () {
        var el, sel, node;
        sel = window.getSelection();
        if (sel.toString() != "") {
            el = sel.getRangeAt(0).commonAncestorContainer;
            if ($(el).parents("div.mlab_current_component").length > 0) {
                return true;
            }
        }
        
        return false;
    },

/**
 * 
 * Links to pages must use the api call navigation.pageDisplay, links to external pages must use _new as the target value.
 * @param {type} link
 * @returns {Boolean}
 */
    updateLink: function (link) {
        var link_type = $("input:radio[name=mlab_dt_getlink_choice]:checked").val();
        var link = "";
        var page_name;

        if (link_type == "page") {
            link = $("#mlab_dt_link_app_pages").val();
            var num = parseInt(link);
            if (parseInt(link) >= 0 && num < 1000) {
                page_name = " onclick='mlab.api.navigation.pageDisplay(-1, " + num + "); return false;' ";
            } else {
                alert(_tr["mlab.dt.api.js.getLink.alert_no_page"]);
                return false;
            }
            
        } else if (link_type == "url") {
            link = $("#mlab_dt_link_app_url").val();
            if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                page_name = link.trim();
            } else {
                alert(_tr["mlab.dt.api.js.getLink.alert_url_wrong"]);
                return false;
            }
            
        } else {
            alert(_tr["mlab.dt.api.js.getLink.alert_choose_type"]);
            return false;
            
        }
        
        $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").attr("href", page_name);
        return true;
    },
        
/**
 * Asks a user for a link either to a external page or to a page in the current app.
 * The actual link is created in updateLink above
 * @returns {Boolean|String}
 */
    setLink: function (el, event) {
//we must first of all check that som text is chosen inside the current component
        if (!this.checkSelTextValid()) {
            alert(_tr["mlab.dt.api.js.getLink.no_selection"]);
            return;
        }

//we need to create a temporary link straight away so that we can refer to it later, otherwise the selection wil disappear.
        document.execCommand('createlink', false, "MLAB_DT_LINK_TEMP");
        //.mc_link.mc_text
        $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").addClass('mc_link mc_text').click(function(e) { e.preventDefault(); });

//we need to request the URL *OR* which page to link to
        var opt = "<option value='-1'></option>";
        for (page in mlab.dt.app.page_names) {
            opt = opt + "<option value='" + page + "'>" + mlab.dt.app.page_names[page] + "</option>";
        }
        var that = this;
        var content = $('<div id="mlab_dt_link_dialog">' + 
            '<br><label class="mlab_dt_label"><input type="radio" name="mlab_dt_getlink_choice" value="page" class="mlab_dt_input">' + _tr["mlab.dt.api.js.getLink.app_page"] + '</label><br>' + 
            '<select id="mlab_dt_link_app_pages" class="mlab_dt_select">' + opt + '</select><br>' + 
            '<label class="mlab_dt_label"><input type="radio" name="mlab_dt_getlink_choice" value="url" class="mlab_dt_input">' + _tr["mlab.dt.api.js.getLink.url"] + '</label><br>' + 
            '<input type="text" id="mlab_dt_link_app_url" class="mlab_dt_input">' + '<br>' + 
          '</div>');
  
        content.append( '<button class="mlab_dt_button_ok mlab_dt_right" onclick=" if (that.updateLink()) {mlab.dt.api.closeAllPropertyDialogs();}">' + _tr["mlab.dt.api.js.getLink.ok"] + '</button>');
        content.append( '<button class="mlab_dt_button_cancel mlab_dt_right" onclick=" that.cancelLink();">' + _tr["mlab.dt.api.js.getLink.cancel"] + '</button>');

        var title = _tr["mlab.dt.api.js.getLink.heading"];
        
        this.displayPropertyDialog(el, title, content, function() {$(".qtip-close").on("click", that.cancelLink);}, null, null, null, false, event);
        
    },
    
        
    cancelLink: function () {
         //debugger;
         $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").replaceWith( $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").contents() ); 
         mlab.dt.api.closeAllPropertyDialogs();
    },
 
    removeLink: function () {
        //could use //document.execCommand("unlink", false, false);, but avoiding as does only remove links on selected area
        var link = this.getSelTextParentLinkElement();
        if (link) {
            if ($(link).parents("#mlab_editable_area").length > 0) {
                $(link).replaceWith( $(link).contents() );
            }
        }
    },
    

/**
  * Requests credentials such as login name and password (for instance, can also be URL to use, database name, etc)
  * These are all just treated as strings and returned as an array of strings. 
  * @param {type} el
  * @param {String} component_id
  * @param {type} credentials_required
  * @param {type} cb_function
  * @param {Boolean} edit - if true shows the credential dialogue
  * @param {type} params: this is a js object with key:value pairs, it will ALWAYS contain a paameter called component which is the Mlab component being worked on
  * @returns {Boolean|Array of strings}
 */
    getCredentials: function (el, component_id, credentials_required, cb_function, edit, params) {
        var default_cred_values = mlab.dt.components[component_id].conf.credential_values;
        var needinfo = false;
        var saved_cred_values = this.getVariable(params.component, "storage_plugin") ; //params.component is always set to the active Mlab component
        if (saved_cred_values) {
            saved_cred_values = saved_cred_values["credentials"];
        }
        
//if the values are already saved, either because the default was stored when adding storage plugin, 
//or because they since been edited or they are missing altogether then we need to request them
        if (saved_cred_values) {
            var cred_values = saved_cred_values;
            
//nothing saved, and default values exist, so we just save it
        } else if (default_cred_values) {
            for (credential in credentials_required) {
                if (!default_cred_values[credentials_required[credential]]) {
                    needinfo = true;
                }
            }
            var cred_values = default_cred_values;
                    
//have no data at all, need to request
        } else {
            needinfo = true;
            var cred_values = new Array();
            
        }
        if (needinfo || edit) {
            var dlg = $('<div />', {'id': "mlab_dt_dialog_credentials", title: _tr["mlab.dt.api.js.getCredentials.dlg.title"] } );
            dlg.append( $('<p />', {     text: _tr["mlab.dt.api.js.getCredentials.dlg.text"] , 
                                          'class': 'mlab_dt_text_info' } ) );
                                      
            for (credential in credentials_required) {   
                var credential_id = credentials_required[credential];
                
                dlg.append( $('<label />', { text: credential_id.charAt(0).toUpperCase() + credential_id.slice(1) , 
                                            'for': 'mlab_dt_dialog_credentials_' + credential_id , 
                                          'class': 'mlab_dt_short_label' } ) );
                dlg.append( $('<input />', { name: 'mlab_dt_dialog_credentials_' + credential_id , 
                                             'id': 'mlab_dt_dialog_credentials_' + credential_id , 
                                          'class': 'mlab_dt_input',
                                          'value': ( (typeof cred_values[credential_id] === 'undefined') ? "" : cred_values[credential_id] ) }) );       
            }

            dlg.append( $('<div class="mlab_dt_button_small_new_line">&nbsp;</div>') );
            dlg.append( $('<button class="mlab_dt_button mlab_dt_right">' + _tr["mlab.dt.api.js.getCredentials.dlg.save"] + '</button>') );
            dlg.find("button").on("click", function() {
                //TODO verify input here
                var credentials = {};
                for (credential in credentials_required) {
                    credentials[credentials_required[credential]] = $( "#mlab_dt_dialog_credentials_" + credentials_required[credential] ).val() ;
                }

                el.qtip('hide');
                cb_function(credentials, params);
            
            })
            this.displayPropertyDialog(el, _tr["mlab.dt.api.js.getCredentials.dlg.title"], dlg);
        } else {
            cb_function(cred_values, params);
        }
           
    }, // end getCredentials
    
/**
 * object with display functionality, primarily used for resizing and highlighting components
 * @type object
 */
    display: {
        
        setEditableFocus: function (el) {
            var sel = window.getSelection();
            var range = document.createRange();
            var html_el = el[0];
            if (el.text() != "") {
                range.setStart(html_el, 0);
                range.setEnd(html_el, 0);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                html_el.innerHTML = '\u00a0';
                range.selectNodeContents(html_el);
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand('delete', false, null);
            }
        },
        
/**
 * Updates the aspect ratio setting for a component by updating the data-mlab-ratio setting
 * @param {type} el
 * @param {type} size
 * @returns {undefined}
 */
        setAspectRatio: function (el, aspect) {
            if (["4:3", "16:9", "1:1"].indexOf(aspect) > -1) {
                var wrapper = $(el).children(":first");
                if (typeof wrapper.data("mlab-sizer") == "undefined") {
                    $(el).children().wrapAll("<div data-mlab-sizer='1' data-mlab-size='medium'></div>");
                    wrapper = $(el).children(":first");
                }

                wrapper.attr("data-mlab-aspectratio", aspect);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(wrapper);
            }
        },
        
/**
 * Updates the size setting for a component by updating the data-mlab-size setting
 * Initially this is small, medium, large and fullpage
 * @param {type} el
 * @param {type} size
 * @returns {undefined}
 */
        setSize: function (el, size) {
            if (["small", "medium", "large", "fullscreen"].indexOf(size) > -1) {
                var wrapper = $(el).children(":first");
                if (typeof wrapper.data("mlab-sizer") == "undefined") {
                    $(el).children().wrapAll("<div data-mlab-sizer='1' data-mlab-aspectratio='4:3'></div>");
                    wrapper = $(el).children(":first");
                }

                $(wrapper).attr("data-mlab-size", size);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(wrapper);
            }
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * The DIV that is updated is an automatically inserted DIV with data-mlab-sizer='1'
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {undefined}
 */
        updateDisplay: function (el) {                      //was '[data-mlab-size][data-mlab-aspectratio]'
            var components = (typeof el == "undefined") ? $('[data-mlab-sizer]') : $(el);
            var that = this;
            components.each( function() {  
                var device_width = ($('[data-mlab-sizer="1"]').parent().width());
                var aspect_ratio = $(this).attr("data-mlab-aspectratio").split(":");
                var size = $(this).attr("data-mlab-size");
                var times = (size == "small") ? 0.33 : ((size == "medium") ? 0.67 : 1);
                var comp_id = $(this).parent().data("mlab-type");
     
                var w = (device_width * times);
                var h = (w / aspect_ratio[0]) * aspect_ratio[1];
                $(this).css( {"width": w + "px", "height": h + "px"} );
                
                if (typeof that.parent.parent.components[comp_id] != "undefined" && typeof that.parent.parent.components[comp_id].code != "undefined" && typeof that.parent.parent.components[comp_id].code.onResize != "undefined") {
                    that.parent.parent.components[comp_id].code.onResize(this);
                };
            });
        },
    
/**
 * This function takes a rgb color as a prameter and use it to return the inverted color
 *
 * @param String rgb
 * @returns String rgb
*/
        invertColor: function(rgbString) {
            if (typeof rgbString == "undefined") {
                return "rgb(255, 255, 255);";
            }
            var parts = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/),
                i;

            parts.splice(0, 1);
            for (i = 1; i < 3; ++i) {
                parts[i] = parseInt(parts[i], 10);
            }
            var rgb = 'rgb(';
            $.each(parts, function(i, item) {
                rgb += (255 - item) + ',';
            });
            rgb = rgb.slice(0, -1);
            rgb += ')';
            return rgb;
        },
    
/**
 * This function gets the background-color or inherited background-color of an element using jQuery 
 *
 * @param jqueryElement
 * @returns String rgb
*/
        getBackground: function(jqueryElement) {
            // Is current element's background color set?
            var color = jqueryElement.css("background-color");

            if (color !== 'rgba(0, 0, 0, 0)') {
                // if so then return that color
                return color;
            }

            // if not: are you at the body element?
            if (jqueryElement.is("body")) {
                // return known 'false' value
                return false;
            } else {
                // call getBackground with parent item
                return this.getBackground(jqueryElement.parent());
            }
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {true if selected different component, false otherwise}
 */   
        componentHighlightSelected : function (el) {
            var curComp = $( "#" + this.parent.getEditorElement() + "> div.mlab_current_component" );

            if (el[0] === curComp[0]) {
                return false;
            }          
            
            if (el[0] !== curComp[0]) {
//Delete the outlines and tools for the last current component
                curComp.qtip('hide');
                curComp.removeClass("mlab_current_component");
                curComp.find("mlab_current_component").css("outline-color", "").removeClass("mlab_current_component");
                curComp.find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
                window.getSelection().removeAllRanges();
                curComp.find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");
                
//Set the new current component
                var pageBgColor = $("[data-role=page]").css( "background-color" );
//inverts the background color
                var pageBgColorInvert = this.invertColor(pageBgColor);
//set the invert color of the background as the border-color for the current selected component
                $( el ).css("outline-color", pageBgColorInvert);
                $( el ).addClass("mlab_current_component");
                return true;
            }

            return false;
        },
        
/**
 * Highlights controls that have child contols inside them
 * @param {type} sub_el: The element to display. If not specified, then update all components
 * @param {type} editable: Optional, the element to display. If not specified, then update all components
 */   
        componentHighlightSelectedChildren : function (sub_el, editable, override) {
            sub_el = $( sub_el );
            
            if (!$(".mlab_current_component").find(".mlab_current_component_child").is(sub_el) || override) {
                $(".mlab_current_component").find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");

//gets the childs background color
                var bgColorC = this.getBackground(sub_el);
//inverts the background color
                var bgColorCInvert = this.invertColor(bgColorC);
//set the invert color of the background as the outline-color for the current selected component
                sub_el.css("outline-color", bgColorCInvert);
//set the class to style the selected highlighted child             
                sub_el.addClass("mlab_current_component_child");   
            }
                
            if (typeof editable != "undefined") {
                editable = $( editable );
//if they have not re-clicked the current ditable element then we deselect old one and select new one
                if (!$(".mlab_current_component").find(".mlab_current_component_editable").is(editable)) {
                    $(".mlab_current_component").find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
                    if (typeof editable != "undefined" && editable.length > 0 && $(editable).prop("tagName").toLowerCase() != "input") {   
//gets the grandchilds background color
                        var bgColorGC = this.getBackground(editable);
//inverts the background color
                        var bgColorGCInvert = this.invertColor(bgColorGC);
//set the invert color of the background as the outline-color for the current selected component
                        editable.css("outline-color", bgColorGCInvert);

                        editable.addClass("mlab_current_component_editable").attr("contenteditable", true);
                    }
                }                
            }
        },      
    },

}


/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract App level functions 
 */

function Mlab_dt_management () {
    this.parent = null;
}

Mlab_dt_management.prototype = {


/*
 * This function will first open the index.html file in an app, this has all the css/js/formatting etc in it.
 * Then it will open the page specified (if it is not == index | 0 )
 * @param {type} app_id
 * @param {type} page_num
 */
    app_open : function (app_id, page_num) {

        var local_page_num = page_num;
        var url = this.parent.urls.app_open.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", 'index');
        url = url.replace("_UID_", this.parent.uid);
        url = url.replace("_OPEN_MODE_", "true");
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.opening.app"], true);
        var that = this;
        var local_app_id = app_id;
        
        
        $.get(url, function( data ) {
            if (data.result == "success") {
                that.index_page_process ( data.html, "index", ( local_page_num == "0" || local_page_num == "index" || that.parent.app.page_names.length == 1 ) );
                
                
//set the compiler qTip to show QR code and link when hower over compile icon
//Burde endre ikonet til grønt eller noe....
//TODO use api.elements.tooltip
//any existing compiled files for this app
                mlab.dt.app.compiled_files = data.compiled_files;
                
                $.each(mlab.dt.config.compiler_service.supported_platforms, function(index, platform) {
                    if (typeof mlab.dt.app.compiled_files[platform] != "undefined") {
//TODO skille ut de 3 neste linjene som egen funksjon - dette skal brukes flere steder....
                        var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + mlab.dt.app.compiled_files[platform];
                        $('#mlab_download_qr_link_' + platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                        $('#mlab_download_link_' + platform).html("<b>URL</b>:</br>" + text);

/*                        $('#mlab_download_'+ platform + '_icon').qtip({
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            content: {text: function(){ return $("[data-mlab-download-link-info='" + platform + "']").html()},
                                     title: { text: "Download to " + platform } },
                            style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                        });*/
                    }
                });
                
                
                $("#mlab_statusbar_permanent").html(mlab.dt.app.name);
//update the list of features we have added to this app
                $("#mlab_features_list li").removeClass("mlab_item_applied");
                $(that.parent.app.curr_indexpage_html)
                    .find("#mlab_features_content [data-mlab-type]>")
                    .each(function() {
                        $("#mlab_features_list [data-mlab-feature-type='" + $(this).parent().data("mlab-type") + "']").addClass("mlab_item_applied");
                     });

//if they are opening the app with a blank page and no components on the index page, let's assume they are opening a new app, and we'll ask for the title of the page
                if (data.only_index && $("#" + that.parent.config["app"]["content_id"]).children().length == 0) {
                    var title = prompt(_tr["mlab.dt.management.js.prompt.title.front.page"], that.parent.app.curr_pagetitle);
                    if (title != null) {
                        that.parent.app.curr_pagetitle = title;
                        $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle); 
                        that.parent.flag_dirty = true;
                    }
                }

//if they are not opening the index page we need to call backend again to load the page they want to open
                if (local_page_num != "0" && local_page_num != "index" && !data.only_index) {
                    that.page_open_process(data.app_id, local_page_num);
                } else {
                    if (data.lock_status == "locked") {
                        that.parent.app.locked = true;
                        $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',.6);
                        $("div.container").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:110px;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-image: url(/img/page_locked.png); background-repeat: no-repeat; background-position: 95% 2%;"></div>');
                    } else {
                        that.parent.app.locked = false;
                        $("#mlab_editor_disabled").remove();
                        $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',1);
                    }

                    
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.ready"], false);
                    $("#mlab_overlay").slideUp();
                    that.parent.app.locked = (data.lock_status == "locked");
                    that.parent.utils.timer_start();
                }
            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }
            
//set the trap for the paste function so we force plain text
            $("#" + mlab.dt.config["app"]["content_id"]).on("paste", function(e) {
// stop original paste from happening
                e.preventDefault();
                
//if they are not allowed to paste into this component we quit
                var comp_id = $(".mlab_current_component").data("mlab-type");
                if (typeof mlab.dt.components[comp_id].conf.paste_allowed == "undefined" || mlab.dt.components[comp_id].conf.paste_allowed === false) {
                    return;
                } 


//obtain plain text
                var text = e.originalEvent.clipboardData.getData("text/plain");

//insert via built in exec commands
                document.execCommand("insertHTML", false, text);
                
                mlab.dt.flag_dirty = true;
            });
            

        });
    },


/*
 * Calls a function on the backend that returns a URL to the file to download.
 * If it is not compiled we will compile it first.
 * @returns void
 */
    app_download  : function () {
        that = this;
        this.page_save( function() { that.app_download_process(); } );
    },

    app_download_process  : function () {
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.retrieving.app"], true);
        var url = this.parent.urls.app_download.replace("_ID_", this.parent.app.id);
        var that = this;
        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                full_url = window.location.origin + data.url;
                $("#mlab_download_qr2").empty().qrcode({text: full_url, render : "table"}).show()
                        .append("<br>")
                        .append("<a href='" + full_url + "'>" + _tr["mlab.dt.management.js.app_download_process.1"] + ": " + full_url +"</a>")
                        .append("<br>")
                        .append("<a href='mailto:" + that.parent.user_email + "?subject=Link&body=" + _tr["mlab.dt.management.js.app_download_process.2"] + ": " + encodeURI(full_url) + "'>" + _tr["mlab.dt.management.js.app_download_process.3"] + "</a>");

            } else {
                $("#mlab_download_qr2").empty().append("<p>" + _tr["mlab.dt.management.js.app_download_process.4"] + ": " + data.msg + "</p>").show();

            }
     /*       $("#mlab_download_qr_field").qtip({
                content: {text: $("#mlab_download_qr2").html() },
                position: { my: 'top right', at: 'bottom right', target: $("#mlab_download_qr_field") },
                show: { ready: true, modal: { on: false, blur: false } },
                hide: 'unfocus',
                style: { classes: 'qtip-tipped', tip: true }});
        */
        });

        that.parent.utils.timer_start();
    },

    app_submit_to_market  : function () {
        alert(_tr["mlab.dt.management.js.app_submit_to_market"]);
    },

//remove locks, just a backup if something goes wrong
    app_remove_locks : function () {
        this.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unlocking.pages"], true);
        $.get( this.parent.urls.app_unlock );
        $("#" + this.parent.config["app"]["content_id"]).fadeTo('slow',1);
        $("#mlab_editor_disabled").remove();
        this.parent.app.locked = false;
    },

/**
 * Function to update content of GUI elements with the current app's metadata
 */
    app_update_gui_metadata : function () {

//List of all pages
//#mlab_existing_pages is a <div> which is populated with a <ol> with a <li> element for each page
        var list = $('<ol></ol>')
        var currpage = this.parent.app.curr_page_num;
        var span = "";
        if (currpage == "index") {
            currpage = 0;
        }
        
        for (i in this.parent.app.page_names) {
            if (i > 0) {
                span = "<span class='mlab_copy_file' title='" + _tr["mlab.dt.management.js.app_update_gui_metadata.copy.pages"] + " " + i + "' onclick='mlab.dt.management.page_copy(\"" + i + "\");' >&nbsp;</span>";
            }

            if (i == 0){ //index
                span = "<span class='mlab_not_copy_file'>&nbsp;</span>";
            }

            if (i == currpage) {
                list.append("<li data-mlab-page-open='" + i + "'>" + span + this.parent.app.page_names[i] + "</li>");
            } else {
                list.append("<li>" + span + "<a data-mlab-page-open='" + i + "' href='javascript:mlab.dt.management.page_open(" + this.parent.app.id + ", \"" + i + "\");'>" + this.parent.app.page_names[i] + "</a></li>");
            }
        }
        $("#mlab_existing_pages").html(list);
        
//make page list sortable to reset pages
        $("#mlab_existing_pages ol").sortable({
                update: function(event, ui) {
                   mlab.dt.management.page_reorder(event, ui);
                }
            }).disableSelection();

//Various app meta data
        $("#mlab_edit_app_title").text(this.parent.app.name);
        $("#mlab_edit_app_description").text(this.parent.app.description);
        $("#mlab_edit_app_keywords").text(this.parent.app.keywords);
        $("#mlab_edit_app_category1").text(this.parent.app.categoryOne);
        $("#mlab_edit_app_category2").text(this.parent.app.categoryTwo);
        $("#mlab_edit_app_category3").text(this.parent.app.categoryThree);
    },


/*********************************************************************************************
 *********** Functions to parse HTML for a page and insert it into the editor area ***********
 *********************************************************************************************/


/* this function processes the index page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the editing div (mlab_editor_chrome)
    Remove old stylesheets from previously edited page from *this page*
    Add new stylesheets from page that is opened for editing to *this page*
    Extract BODY and insert content into mlab_editor_chrome
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    index_page_process  : function (page, page_num, is_final_destination) {
        var comp_id, temp_comp, temp_link;
        var temp_stylesheets = "";
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.active_version + "/";

//parse doc into a variable
        var doc = (new DOMParser()).parseFromString(page,"text/html");

//check if it has editable area, if not we cannot continue
        if (doc.getElementById(this.parent.config["app"]["content_id"]) == null) {
            alert(_tr["mlab.dt.management.js.index_page_process.alert.1"] + " " + this.parent.config["app"]["content_id"] + ", " + _tr["mlab.dt.management.js.index_page_process.alert.2"]);
            return;
        }

//set the base href to the folder of the app
        document.getElementsByTagName("base")[0].href = start_dir;

//remove old stuff
        $("#mlab_editor_chrome").empty();
        $("link[rel=stylesheet][href^='css']").remove();

//store different parts of doc for easy access/manipulation
        var head = doc.getElementsByTagName("head")[0];
        var divs = doc.getElementById(this.parent.config["app"]["content_id"]).cloneNode(true).childNodes;

//assign vars to current app var, we remove all elements that are editable so we have clean HTML to add our edited content to
//this HTML chunk will include HTML header + all body content outside the editable area, plus the empty div for the editable area
        var content = doc.getElementById(this.parent.config["app"]["content_id"]);
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);

        var stylesheets = head.getElementsByTagName("link");

//insert stylesheets, but not when preview it, hence we look for the presence of the RT stylesheet
//TODO use variable instead
        for ( var i = 0; i < stylesheets.length; i++) {
            temp_link = stylesheets[i].getAttribute("href");
            if(temp_link.indexOf("style_rt.css") < 0){
                temp_stylesheets = temp_stylesheets + "<link rel='stylesheet' href='" + temp_link + "' type='text/css'>" + "\n";
            }
        }
        $("head link[rel='stylesheet']").last().after(temp_stylesheets);

//here we insert the body MINUS the editable area (which was just removed) which is stored in the divs variable, into the editor_chrome
        $("#mlab_editor_chrome").append(body.innerHTML);

//now we need to make the internal code editable, but only if they actually want to edit this page
        if (is_final_destination) {
            $("#" + this.parent.config["app"]["content_id"]).html(divs);
            this.parent.api.getAllLibraries();
            this.parent.design.prepare_editable_area();
        }

        this.parent.app.curr_indexpage_html = doc;
        
//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.app_update_gui_metadata();

//finally we need to initialise the jQuery mobile stuff on the page we loaded, otherwise it will not display correctly
        try {
            $.mobile.initializePage();
        }
        catch(err) {
            console.log(err.message);
        }
        
        mlab.dt.api.display.updateDisplay();

//JS to fix the toolbars in a jQuery mobile page
        var border_width = (parseInt($("#mlab_editor_chrome").css("margin-bottom")) * 2) + parseInt($("#mlab_editor_chrome").css("border-bottom-width"));
        $("[data-role=header]").css( {"position": "absolute", "z-index": 0} );
        $("[data-role=footer]").css( { "position": "absolute", "bottom": ($("[data-role=footer]").height() + border_width) + "px" } );
        $("[data-role=page]").css( {"width": "100%", "height": "100%", "min-height": "", "position": "absolute", "margin": "0", "padding": "0", "padding-top": $("[data-role=header]").height() + "px", "padding-bottom": $("[data-role=footer]").height() + "px" } );

//TODO: hack de luxe, refreshes images that for some reason can't be seen
        $("#panel_left").css("background-image", $("#panel_left").css("background-image"));
        $("#panel_right").css("background-image", $("#panel_right").css("background-image"));

    },


/* this function processes a regular page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the internal editing div (this.parent.config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into this.parent.config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    regular_page_process  : function (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.active_version + "/";

//remove old stuff
        $("#" + this.parent.config["app"]["content_id"]).html("");

//a page may have failed to save, in this case we create an empty page here, then everything works
        if (page == "") {
            page = this.parent.config["app"]["html_header"].replace("%TITLE%", "Title") + this.parent.config["app"]["html_footer"];
            page = page.replace(/\\n/g, "\n");
        }
//
//parse doc into variables
        var doc = (new DOMParser()).parseFromString(page,"text/html");
        var head = doc.getElementsByTagName("head")[0];
        var body = doc.getElementsByClassName("mlab_main_body_content")[0].cloneNode(true);

//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.app_update_gui_metadata();

//add body content
        $("#" + this.parent.config["app"]["content_id"]).html(body.innerHTML);
        this.parent.api.getAllLibraries();
        this.parent.design.prepare_editable_area();
        
        try {
            $.mobile.initializePage();
        }
        catch(err) {
            console.log(err.message);
        }
        mlab.dt.api.display.updateDisplay()
    },


/***********************************************************
 ************** Functions to manipulate pages **************
************************************************************/

/*
 * Open previous or next page depending on direction. If on first or last page does nothing
 * @param {type} direction
 * @returns {undefined}
 */
    page_move_to : function (direction) {
        var curr_num = 0;
        (this.parent.app.curr_page_num == "index") ? curr_num = 0 : curr_num = parseInt(this.parent.app.curr_page_num);
        if ( direction < 0 && curr_num > 0 ) {
            curr_num--;
        } else if ( direction > 0 ) {
            curr_num++;
        } else {
            return;
        }
        this.page_open(this.parent.app.id, curr_num);

    },

/*
 * Move the selected page to a new position int he app, this is done on backend by renaming the actual file
 * So if you want to move page 2 to 10, 3 - 9  will be minus one, 2 will be 10
 * @param {type} event jquery event info
 * @param {type} ui jquery ui info
 * @returns {undefined}
 */
    page_reorder : function (event, ui) {
        console.log(event);
        console.log(ui);
    },


/**
 * Retrieve content of a page from server and insert it into the editor area
 * First line is a pattern from Symfony routing so we can get the updated version from symfony when we change it is YML file
 */
    page_open : function (app_id, page_num) {
        that = this;
        this.page_save( function() { that.page_open_process(app_id, page_num); } );
    },

    page_open_process : function (app_id, page_num) {

        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.opening.page"], true);

        var url = this.parent.urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        
//here we hide the tools for components until they select a control
        if (typeof this.parent.qtip_tools != "undefined") {
            $(this.parent.qtip_tools).qtip('hide');
            this.parent.qtip_tools = undefined
            if (typeof this.parent.api.properties_tooltip != "undefined") {
                $(this.parent.api.properties_tooltip).qtip('hide');
                this.parent.api.properties_tooltip = undefined;
            }
        }

        
        var that = this;

        $.get( url, function( data ) {
            if (data.result == "success") {
                that.parent.utils.update_status("completed");
                that.parent.utils.update_status("permanent", that.parent.app.name);
                $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle);
                if (data.page_num_sent == 0 || data.page_num_sent == "index" ) {
                    that.index_page_process ( data.html, "index", true );
                    $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").click(function(e) { e.preventDefault(); });
                } else if (data.page_num_sent == "last" && data.page_num_real == 0) {
                    that.parent.utils.timer_start();
                    if ( $("#mlab_overlay").is(':visible') ) {
                        $("#mlab_overlay").slideUp();
                    }
                    return;
                } else {
                    that.regular_page_process ( data.html, data.page_num_real );
                    var path = window.location.pathname.split("/");
                    path[path.length - 3] = data.app_id;
                    path[path.length - 2] = data.page_num_real;
                    history.pushState({id: data.app_id, page: data.page_num_real }, that.parent.app.curr_pagetitle, path.join("/"));
                }

                if (data.lock_status == "locked") {
                    that.parent.app.locked = true;
                    $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',.6);
                    $("div.container").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:110px;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-image: url(/img/page_locked.png); background-repeat: no-repeat; background-position: 95% 2%;"></div>');
                } else {
                    that.parent.app.locked = false;
                    $("#mlab_editor_disabled").remove();
                    $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',1);                  
                }

                if ( $("#mlab_overlay").is(':visible') ) {
                    $("#mlab_overlay").slideUp();
                }
                
//turn off clikability of links
                $("#mlab_editable_area").find("a").click(function(e) { e.preventDefault(); });

                that.parent.utils.timer_start();

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);

            }

        } );

    },

/**
 * This will update the title of the currently open page and also update relevant items other places
 */
    page_update_title : function () {
        if (this.parent.app.locked) {
            alert(_tr["mlab.dt.management.js.page_update_title.alert.page.locked"]);
            return;
        }

        if (this.parent.app.curr_page_num == "index") {
            var pagenum = 0;
        } else {
            var pagenum = this.parent.app.curr_page_num;
        }
        this.parent.flag_dirty = true;
        this.parent.app.curr_pagetitle = $("#mlab_page_control_title").text();
        this.parent.app.page_names[this.parent.app.curr_page_num] = this.parent.app.curr_pagetitle;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);
        $("#mlab_existing_pages [data-mlab-page-open='" + pagenum + "']").html("<span class='mlab_copy_file' onclick='this.page_copy(\"" + pagenum + "\");' >&nbsp;</span>" + this.parent.app.curr_pagetitle);

    },


/**
 * This is the save function, it is called in three possible ways:
 * 1: When a user clicks the save button
 * 2: When the save timer (this.parent.utils.timer_save) kicks in
 * 3: When a function that has to save the page first is executed.
 *
 * In case 3 th fnc argument is specified and when the save is completed and the AJAX callback function is called this function will be executed.
 * This way we are sure that page related variables are not outdated if the save function takes a long time to complete on the server.
 *
 * to save a page we need to reassemble it,
 * first clone current body from the editor (and give it a new ID!)
 * clean it up using the onSave function for each component
 * then pick up doc variable which has empty body, then insert the cleaned elements
 * finally convert to text to send back
 * @param {type} fnc
 * @returns {undefined}
 */
    page_save : function (fnc, override) {
        this.parent.utils.timer_stop();
        var require_save = true;
        var res = false;
        this.parent.counter_saving_page++;

//cannot save if locked
        if ($("#mlab_editor_disabled").length > 0) {
            console.log('Page locked, did not save');
            require_save = false;
        }

//this is called from a timer, so we also need to check if an app has been created, etc
//also if any changes have occurred
        if (typeof this.parent.app.curr_page_num == "undefined" || typeof this.parent.app.id == "undefined") {
            require_save = false;
        }

        if (!this.parent.flag_dirty && typeof override == "undefined") {
            require_save = false;
        }

        if ((!require_save) && (typeof fnc != 'undefined')) {
            return fnc();
        } else if (!require_save) {
            this.parent.utils.timer_start();
            return false;
        }

//prepare various variables
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.storing.page"], true);
        var curr_el = $("#" + this.parent.config["app"]["content_id"] + " .mlab_current_component");
        curr_el.removeClass("mlab_current_component");
        var app_id = this.parent.app.id;
        var page_num = this.parent.app.curr_page_num;
        var page_content = "";
        var component_categories = new Object();
        var template_best_practice_msg = new Array();
        var url = this.parent.urls.page_save.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_CHECKSUM_", this.parent.app.app_checksum);

//this loop is a: picking up the cleaned HTML for each component,
//(this is done by calling the onSave unction which strips away anything we are not interested in)
// and b: checking if the component transgresses any of the rules for the template
        var that = this;
        $("#" + that.parent.config["app"]["content_id"]).children("div").each(function() {
            var comp_id = $(this).data("mlab-type");
            if (typeof that.parent.components[comp_id].code !== "undefined" && typeof that.parent.components[comp_id].code.onSave !== "undefined") {
                page_content = page_content + that.parent.components[comp_id].code.onSave(this);
            } else {
                page_content = page_content + $(this)[0].outerHTML + "\n";
            }

//run the template checks
            that.parent.bestpractice.component_check_content(this, comp_id, component_categories, template_best_practice_msg);
        });

        this.parent.bestpractice.page_check_content(component_categories, template_best_practice_msg);

//if this is the index page we add the full HTML page, if not we only require a very simple header/footer
        if (page_num == 0 || page_num == "index" ) {
            var final_doc = this.parent.app.curr_indexpage_html;
            final_doc.getElementById(this.parent.config["app"]["content_id"]).innerHTML = page_content;
            final_doc.title = this.parent.app.curr_pagetitle;
            var html = (new XMLSerializer()).serializeToString(final_doc);
        } else {
            var html = page_content;
        }

        curr_el.addClass("mlab_current_component");

//finally we submit the data to the server, the callback function will further execute the function specified in the fnc argument, if any
        var that = this;
        $.post( url, {title: this.parent.app.curr_pagetitle, html: html}, function( data ) {

//if this counter = 0 then noone else have called it in the meantime and it is OK to restart timer
            that.parent.counter_saving_page--;

            if (data.result == "success") {
                that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.saved.page"], false);
                that.parent.flag_dirty = false;

//if a function was specified we now execute it, inisde this function the this.parent.utils.timer_save timer will be restarted
//if no function was specified AND no-one else has initiated the save function, then OK to restart timer
                if (typeof fnc != 'undefined') {
                    res = fnc();
                }

//process metadata information that has come back
                if (typeof data.app_info != "undefined") {
//we may have a result saying nochange
                    if (data.app_info.result === "file_changes") {
//load in metadata and (possibly new) checksum of app into variables, then upate display
                        console.log("App files were changed");
                        that.parent.app.app_checksum = data.app_info.mlab_app_checksum;
                        that.parent.app.page_names = data.app_info.mlab_app.page_names;

                    } else if (data.app_info.result === "no_file_changes") {
                        console.log("No changes to app files");

                    } else {
                        if (that.parent.counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                            that.parent.utils.timer_start();
                        }
                        return;
                    }

                    that.parent.app.name = data.app_info.mlab_app.name;
                    that.parent.app.description = data.app_info.mlab_app.description;
                    that.parent.app.keywords = data.app_info.mlab_app.keywords;
                    that.parent.app.categoryOne = data.app_info.mlab_app.categoryOne;
                    that.parent.app.categoryTwo = data.app_info.mlab_app.categoryTwo;
                    that.parent.app.categoryThree = data.app_info.mlab_app.categoryThree;
                    that.app_update_gui_metadata();

                };

            } else { //failed
                that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unable.save.page"] + ": " + data.msg, false);
                if (typeof fnc != 'undefined') {
//if this save attempt was a part of another operation we will ask if they want to try again, cancel or continue without saving
//(the change may have been minimal and they want to start a new app let's say)
                    $( "#mlab_dialog_confirm" ).dialog({
                        resizable: false,
                        height:140,
                        modal: true,
                        buttons: {
                            "Retry": function() {
                                $( this ).dialog( "close" );
                                that.page_save(fnc);
                                return;
                            },
                            "Continue": function() {
                                $( this ).dialog( "close" );
                                res = fnc();
                            },
                            "Cancel": function() {
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                    return res;
                }
            }

//if this was not called from a function AND the save function has not been called by others, then we restart the save timer.
            if (that.parent.counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                that.parent.utils.timer_start();
            }

        });

//above we have counted the number of issues relating to the template "best practices" configuration, time to display the error message, if any
        if (template_best_practice_msg.length > 0) {
            
           
            $("#mlab_statusbar_permanent").qtip( {
                content: {text: "<ul><li>" + template_best_practice_msg.join("</li><li>") + "</li></ul>" },
                position: { my: 'topMiddle', at: 'bottomMiddle', viewport: $(window) },
                show: { ready: true },
                hide: { event: 'unfocus' },
                style: { "background-color": "white", color: "blue", classes: "mlab_qtip_info", tip: true } } ) ;
            
                //hides the qTip after 5 seconds
                window.setTimeout(function () { $(".mlab_qtip_info").remove();}, 5000);
           
        } else {
             $(".mlab_qtip_info").remove();
        }

        return res;
    },

/**
* Creates a new file on the server and opens it
*/
    page_new : function () {
        var title = prompt(_tr["mlab.dt.management.js.page_new.prompt.title.new.page"]);
        if (title != null) {
            that = this;
            this.page_save( function() { that.page_new_process( title ); } );
        }
    },

    page_new_process : function (title) {
        $("body").css("cursor", "wait");
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.storing.page"], true);
        var url = this.parent.urls.page_new.replace("_ID_", this.parent.app.id);
        url = url.replace("_UID_", this.parent.uid);

//here we hide the tools for components until they select a control
        if (typeof this.parent.qtip_tools != "undefined") {
            $(this.parent.qtip_tools).qtip('hide');
            this.parent.qtip_tools = undefined
            if (typeof this.parent.api.properties_tooltip != "undefined") {
                $(this.parent.api.properties_tooltip).qtip('hide');
                this.parent.api.properties_tooltip = undefined;
            }
        }

        var that = this;
        $.post( url, {}, function( data ) {
            if (data.result == "success") {
                that.parent.utils.update_status("completed");
                $("#" + that.parent.config["app"]["content_id"]).empty();
                that.parent.app.curr_pagetitle = title;
                that.parent.app.curr_page_num = data.page_num_real;
                $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle);
                that.parent.app.page_names[that.parent.app.curr_page_num] = title;
                that.app_update_gui_metadata();

                that.parent.flag_dirty = true;
                $("body").css("cursor", "default");

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
                $("body").css("cursor", "default");
            }

            that.parent.utils.timer_start();

        });
     },

/**
 * Creates a new file on the server and opens it
 */
    page_copy : function (page_num) {
        if (page_num == "0" || page_num == "index") {
            alert(_tr["mlab.dt.management.js.page_copy.alert.not.copy.index.page"]);
            return;
        }
        that = this;
        this.page_save( function() { that.page_copy_process(page_num); } );
    },

    page_copy_process : function (page_num) {

        var url = this.parent.urls.page_copy.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.copying.page"], true);
        var that = this;

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                that.parent.app.curr_pagetitle = data.page_title;
                $("#mlab_page_control_title").text(data.page_title);
                that.parent.app.page_names[data.page_num_real] = data.page_title;
                that.regular_page_process ( data.html, data.page_num_real );
            } else {
                alert(data.msg);
            }
            that.parent.utils.timer_start();
        });
    },

    page_delete  : function () {
        if (this.parent.app.curr_page_num == "0" || this.parent.app.curr_page_num == "index") {
            alert(_tr["mlab.dt.management.js.page_copy.alert.not.delete.index.page"]);
            return;
        }

        if (!confirm(_tr["mlab.dt.management.js.page_copy.alert.sure.delete"])) {
            return;
        }

        this.parent.utils.timer_stop();
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.deleting.page"], true);

        var url = this.parent.urls.page_delete.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", this.parent.app.curr_page_num);
        url = url.replace("_UID_", this.parent.uid);
        var that = this;

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").remove();
                that.parent.app.page_names.splice(that.parent.app.curr_page_num, 1);
                that.regular_page_process ( data.html, data.page_num_real );

                if (that.parent.app.curr_page_num == "index") {
                    $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").html(that.parent.app.curr_pagetitle);
                } else {
                    $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").html("<span class='mlab_copy_file' onclick='mlab.dt.management.page_copy(\"" + that.parent.app.curr_page_num + "\");' >&nbsp;</span>" + that.parent.app.curr_pagetitle);
                }

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }

            that.parent.utils.timer_start();
        });
    },

    /**
     * Simple function to open a new window with current page in it
     * Given that we use an jquery mobile framework with an index file and loading pages into the index file,
     * we need to pass the relevant file name and have matching code in the mlab.js file to deal with this
     * @param {type} index
     * @returns {undefined}
     */
    page_preview : function () {
        that = this;
        this.page_save( function() { 
            that.page_preview_process(); 
        } );
    },

    page_preview_process : function () {
        var url = this.parent.urls.app_preview.replace("_APPID_", this.parent.app.id);
        var w = $(window).width() * 0.25;
        var h = $(window).height() * 0.75;
        var res = window.open(url,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',left=' + w);
        if (res == undefined) {
            alert(_tr["mlab.dt.management.js.page_preview_process.alert.cannot.open.new.window"]);
        }
        
    },
    
    socket: {
        
        connection: null,

        setup: function (callback, param) {
//first close any existing connections
            if (mlab.dt.management.socket.connection) {
                mlab.dt.management.socket.connection.close();            
            }
            
// connect to the websocket server, this returns data from server callback functions used when connectng to market or compiler services
            var host = window.document.location.host.replace(/:.*/, '');
            mlab.dt.management.socket.connection = new WebSocket(mlab.dt.config.ws_socket.url_client + mlab.dt.config.ws_socket.path_client + '/' + mlab.dt.uid);

            mlab.dt.management.socket.connection.onerror = function(evt){
                console.log("The following error occurred: " + evt.data);
                mlab.dt.management.socket.connection = null;
                alert(_tr["mlab.dt.management.js.websocket.error.connect"]);
            }
            
            mlab.dt.management.socket.connection.onopen = function() {
                callback(param);
            }
            
            mlab.dt.management.socket.connection.onmessage = function (event) {
                data = JSON.parse(event.data);
                switch (data.status) {

//1: When click on menu, then it should indicate that the app is requested ( mlab.dt.management.js  -  compiler: {  get_app :)
//2: When the request has been processed by the PHP backend it should indicate one stage has passed (? -  case "connected"?)
//3: Then it should indicate that precompilation has taken place (may not be required, so a numeric is not good) (case "precompilation")
//4: createApp is called, this creates the empty app (case "creating"....case "created"?)
//5: Then files are uploaded (lengthy) (case "uploading"? (hoppe vider på case "verifying" og  case "verification_ok"- tar tid----)
//6: App upload finished, compilation starts (case "compiling"...case "compilation_ok")
//7: App is being (case "receiving":)
//8: App is ready (case "ready")

//Sette en grå versjon av iconet om siste versjon er kopilert?
// kan Andoid og iOS kopileres på samme tid?
// hva om man lagrer en ny versjon mens kompiler

                    case "connected":
                        $("#mlab_progressbar").val(5);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.connected"]);
                        break;

                    case "creating":
                        $("#mlab_progressbar").val(10);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.creating"]);
                        //createApp is called, this creates the empty app
                        break;

                    case "created":
                        $("#mlab_progressbar").val(15);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.created"]);
                        break;

                    case "precompilation":
                        $("#mlab_progressbar").val(20);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.precompilation"]);
                        break;

                    case "uploading":
                        $("#mlab_progressbar").val(25);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.uploading"]);
                        break;

                    case "verifying":
                        $("#mlab_progressbar").val(30);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verifying"]);
                        break;

                    case "verification_ok":
                        $("#mlab_progressbar").val(35);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verification_ok"]);
                        break;

                    case "compiling":
                        $("#mlab_progressbar").val(40);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compiling"]);
                        break;

                    case "compilation_ok":
                        $("#mlab_progressbar").val(80);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compilation_ok"]);
                        break;

                    case "failed":
                    case "precompilation_failed":
                    case "compilation_failed":
                    case "verification_failed":
                    case "create_failed":
                        $("#mlab_statusbar_compiler").text("");
                        $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                        $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                        $("#mlab_progressbar").hide();
                        mlab.dt.utils.update_status("temporary", data.fail_text, false);
                        mlab.dt.management.socket.connection.close();
                        mlab.dt.management.socket.connection = null;
                        break;

                    case "receiving":
                        $("#mlab_progressbar").val(90);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.receiving"]);
                        break;

                    case "ready":
                        $("#mlab_progressbar").val(100);
                        $("#mlab_statusbar_compiler").text("");
                        $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                        $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                        $("#mlab_progressbar").hide();

//inserting the QR code and url to the compiled app in the menu
                        if (typeof data.filename != "undefined" && data.filename != null && data.filename != "") {
                            mlab.dt.app.compiled_files[data.platform] = data.filename;
                            var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + data.filename;
                            $("#mlab_download_qr_link_" + data.platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                            $("#mlab_download_link_" + data.platform).html("<b>URL</b>:</br>" + text);
                            mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.ready"], false);
                        } else {
                            mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.failed"], false);
                        }
                        mlab.dt.management.socket.connection.close();
                        mlab.dt.management.socket.connection = null;
                        break;

                }

            };
        }, //end function setup
    }, //end socket object
    
    market: {

        login : function () {
        
        },
        
        submit_app_details : function () {
        
        },
        
        upload_app_file : function () {
        
        },
        
        publish_app : function () {
        
        },
        
        unpublish_app : function () {
        
        },
        
    },
    
//these are the compiler functions we call. At the front end we only use two functions, info about current app and get_app
//in the background (i.e. on the PHP server) get_app calls lots of different functions to actually prepare app, upload files, compile and retrieve app
    compiler: {

        get_app_status : function () {
            var url = mlab.dt.urls.cmp_get_app_status.replace("_WINDOW_UID_", mlab.dt.uid);
            var i = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.db.id"]);
            url = url.replace("/_ID_", ((i != null && i != "") ? "/" + i : ""));
            var v = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.version"]);
            url = url.replace("/_VERSION_", ((v != null && v != "") ? "/" + v : ""));
            var p = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.platform"]);
            url = url.replace("/_PLATFORM_", ((p != null && p != "") ? "/" + p : ""));

            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        console.log("Status returned: ");
                        console.log(json.app_status);
                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },
        
        /**
         * downloads a complte copy of prepared (i.e. finished precompile process) source code, so Mlab ise just used as an editor
         * @returns {undefined}
         */
        get_app_source : function () {
            var url = mlab.dt.urls.cmp_get_app_source.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);


            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        var iframe = $("<iframe/>").attr({
                            src: json.url,
                            style: "visibility:hidden;display:none"
                        }).appendTo("body");

                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },
        
        /**
         * 
         * @returns {undefined}
         */
        upload_website : function () {
            var url = mlab.dt.urls.cmp_upload_website.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);

            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        console.log("Status returned: ");
                        console.log(json.app_status);
                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },        
    
        get_app : function (platform) {
            mlab.dt.management.socket.setup(mlab.dt.management.compiler.get_app_callback, platform);
        },
        
        get_app_callback: function (platform) {
            var url = mlab.dt.urls.cmp_get_app_process.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);
            url = url.replace("_PLATFORM_", platform);
            var caption_finished = _tr["mlab.dt.management.js.compiler.get_app.status.creating.app"];
            $("#mlab_statusbar_compiler").text(caption_finished);
            $("#mlab_download_" + platform + "_icon").find('img').show();
            $("#mlab_download_" + platform + "_icon").addClass("mlab_download_" + platform + "_icon_grey");
            $("#mlab_progressbar").show();
            $("#mlab_progressbar").val(2);
            $.getJSON(url, function( json ) {
                if (json.result != "success") {
                    $("#mlab_statusbar_compiler").text("");
                    $("#mlab_progressbar").hide();
                    mlab.dt.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unable.contact.server"], false);
                    $("#mlab_download_" + platform + "_icon").find('img').hide();
                    $("#mlab_download_" + platform + "_icon").removeClass("mlab_download_" + platform + "_icon_grey");
                    
                    
                }
            });
            
        }
    }

}// end management.prototype
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Functionality that deals with the template defined best practices
 *
 */

function Mlab_dt_bestpractice () {
    this.parent = null;
}

Mlab_dt_bestpractice.prototype = {

//get the object with rules, such as max charavcters, max length, etc
//return rules for current template, could be used to track when user has typed in too much text (for instance)
//to do preemptive checks (we do post-save check)
    get_template_rules : function () {
        return this.parent.app.template_config.components;
    },


// final template "best practices", we see if there are too many or too few of certain categories of components on a page
    page_check_content : function (component_categories, template_best_practice_msg) {

        var rules = this.parent.app.template_config.components;
        for (var category in rules) {
            if (rules[category].hasOwnProperty("max")) {
                if (component_categories[category] > rules[category].max.count) {
                    if ($.inArray(rules[category].max.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].max.message);
                    }
                }
            }
            if (rules[category].hasOwnProperty("min")) {
                if (component_categories[category] < rules[category].min.count) {
                    if ($.inArray(rules[category].min.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].min.message);
                    }
                }
            }
        }
    },

/**
 * Runs the "best practices" check for a single component, can check if video is too long, if there is too much text, etc, etc
 * @param {type} comp
 * @param {type} comp_id
 * @param {type} component_categories
 * @param {type} template_best_practice_msg
 * @returns {undefined}
 */
    component_check_content : function (comp, comp_id, component_categories, template_best_practice_msg) {
        var rules = this.parent.app.template_config.components;
        if (this.parent.components[comp_id].hasOwnProperty("conf") && this.parent.components[comp_id].conf.hasOwnProperty("category")) {
            var comp_category = this.parent.components[comp_id].conf.category;

            if (!component_categories.hasOwnProperty(comp_category)) {
                component_categories[comp_category] = 1;
            } else {
                component_categories[comp_category]++;
            }

//can only do this if component supprts the getContentSize function
            if (typeof this.parent.components[comp_id].code != "undefined") {
                if (typeof this.parent.components[comp_id].code.getContentSize != "undefined") {
                    var size = this.parent.components[comp_id].code.getContentSize(comp);
                    if (rules.hasOwnProperty(comp_category)) {
                        if (rules[comp_category].hasOwnProperty("max")) {
                            if (size > rules[comp_category].max.size) {
                                if ($.inArray(rules[comp_category].max.message, template_best_practice_msg) < 0) {
                                    template_best_practice_msg.push(rules[comp_category].max.message);
                                }
                            }
                        }
                        if (rules[comp_category].hasOwnProperty("min")) {
                            if (size < rules[comp_category].min.size) {
                                if ($.inArray(rules[comp_category].min.message, template_best_practice_msg) < 0) {
                                    template_best_practice_msg.push(rules[comp_category].min.message);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

} // end prototype


/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Functions to parse HTML for a page and insert it into the editor area 
 */

/***********************************************************
 ******************* Utility functions *********************
************************************************************/

/**
 * Standard initialisation of Mlab object which is referred to in several JS files,
 * as these files can come down in different order, we must make sure we can use it here.
 */

function Mlab_dt_design () {
    this.parent = null;
}

Mlab_dt_design.prototype = {
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 *! @source https://gist.github.com/1129031
 * global document, DOMParser
 */

    domParserWrapper : function() {
        "use strict";

        var DOMParser_proto = DOMParser.prototype;
        var real_parseFromString = DOMParser_proto.parseFromString;

        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if ((new DOMParser).parseFromString("", "text/html")) {
                // text/html parsing is natively supported
                return;
            }
        } catch (ex) {}

        DOMParser_proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                var doc = document.implementation.createHTMLDocument("") ;
                if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                    doc.documentElement.innerHTML = markup;
                }
                else {
                    doc.body.innerHTML = markup;
                }
                return doc;
            } else {
                return real_parseFromString.apply(this, arguments);
            }
        };
    },

/***********************************************************
 *********** Functions to manipulate components ***********
************************************************************/
    component_add : function (id) {
        if (this.parent.app.locked) {
            return;
        }

//if this control has to be unique we check here to see if one was already added
        if (this.parent.components[id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + id + "']").length > 0) {
            alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);
            return;
        }
        
//first we load the relevant CSS/JS files, when that is done we will call component_add_html from the getScriptFiles function.
//this is because script files come down at different speeds, and we need them all down before we can add HTML etc to the page
        this.parent.api.getLibraries(id, true);

        
    },
    
    component_add_html : function (id) {
        
        this.parent.flag_dirty = true;
        var data_resize = (typeof this.parent.components[id].conf.resizeable != "undefined" && this.parent.components[id].conf.resizeable == true) ? "data-mlab-aspectratio='4:3' data-mlab-size='medium'" : "";
        var data_display_dependent = (typeof this.parent.components[id].conf.display_dependent != "undefined" && this.parent.components[id].conf.display_dependent == true) ? "data-mlab-displaydependent='true'" : "";

//add a DIV wrapper around all components, makes it easier to move it up/down later
//for resizable components we add a second div which is used for settin size of content. Doing this on the outer div messs things up at design time
        if (data_resize != "") {
            var new_comp = $("<div data-mlab-type='" + id + "' " + data_display_dependent + " style='display: block;'><div data-mlab-sizer='1' "+ data_resize + " >" + this.parent.components[id].html + "</div></div>");
        } else {
            var new_comp = $("<div data-mlab-type='" + id + "' " + data_display_dependent + " style='display: block;'>" + this.parent.components[id].html + "</div>");
        }

        $("#" + this.parent.config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } } )
        new_comp.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[id].conf.process_keypress != "undefined" && this.parent.components[id].conf.process_keypress) {
            $(new_comp).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }

        $('.mlab_current_component').qtip('hide'); 

        if (this.parent.api.display.componentHighlightSelected(new_comp)) {
            this.component_menu_prepare();
        }
        
//scroll down where the component is added
        window.scrollTo(0, document.body.scrollHeight);

//finally we add dependencies, i.e. components that this component depends on
        if (this.parent.components[id].hasOwnProperty("conf") && this.parent.components[id].conf.hasOwnProperty("dependencies")) {
            for (component in this.parent.components[id].conf.dependencies) {
                this.feature_add(this.parent.components[id].conf.dependencies[0], true);
            }
        }

//execute backend code which performs tasks like adding the permissions required to the manifest file, copying include files and so on
        var url = this.parent.urls.component_added.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", id);
        var that = this;
        var comp_id = id;

        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

//was where XXXX is now:
        this.parent.drag_origin = 'sortable';
//if this is a resizable component we do the initial resizing here
        if (data_resize != "") {
            this.parent.api.display.updateDisplay($(new_comp).children('[data-mlab-sizer]'));
        }
//if this component requires any credentials we request them here
        var local_comp = new_comp;
        var local_comp_id = comp_id;
        var cred_el = $("[data-mlab-comp-tool='credentials']");
        if (Object.prototype.toString.call( this.parent.components[comp_id].conf.credentials ) === "[object Array]") {
            this.parent.api.getCredentials(cred_el, comp_id, this.parent.components[comp_id].conf.credentials, function (credentials, params) { mlab.dt.design.component_store_credentials(credentials, params); that.component_run_code(local_comp, local_comp_id, true); }, false, { component: new_comp });
        } else {
            this.component_run_code(local_comp, local_comp_id, true);
        }
//end XXXX

        request.done(function( result ) {
            if (result.result == "success") {
//XXXX                
            } else {
                alert(result.msg + "'\n\n" + _tr["mlab.dt.design.js.alert.add.comp"]);
                $(new_comp).remove();
            }
        });

        request.fail(function( jqXHR, textStatus ) {
            alert(_tr["mlab.dt.design.js.alert.error.occurred"] + ": '" + jqXHR.responseText + "'\n\n" + _tr["mlab.dt.design.js.alert.add.comp"]);
            $(new_comp).remove();
            this.parent.flag_dirty = false;
        });
        
    },    

/**
 * This executes (using eval()) any code for a component that is added to the app
 * @param {type} el = html element we're working on
 * @param {type} comp_id
 * @param {type} created
 * @returns {undefined}
 */
    component_run_code : function (el, comp_id, created) {
        if (typeof this.parent.components[comp_id] == "undefined" || typeof this.parent.components[comp_id].code == "undefined") {
            return;
        }

/*        if (!mlab.dt.qtip_tools) {
            var that = this;
            window.setTimeout(function() { that.component_run_code(el, comp_id, created) }, 500 );
            return;
        }
*/
        
        if (created) {
            if (typeof this.parent.components[comp_id].code.onCreate != "undefined") {
                this.parent.components[comp_id].code.onCreate(el);
            }
            //if the component has an autorun function efined we call it here, with the componet as the parameter
            if (typeof this.parent.components[comp_id].conf.autorun_on_create == "string") {
                var func = this.parent.components[comp_id].conf.autorun_on_create;
                eval("this.parent.components[comp_id].code." + func + "(el, {currentTarget: mlab.dt.qtip_tools.qtip().tooltip.find('[data-mlab-comp-tool-id=\"" + func + "\"]')[0]});")
            }
        } else if (typeof this.parent.components[comp_id].code.onLoad != "undefined") {
            this.parent.components[comp_id].code.onLoad(el);
        }
    },

    component_moveup : function (el) {
        if (typeof el == "undefined") {
            var el = $(".mlab_current_component");
        }
        if (el.length == 0) {
            return;
        }
        el.fadeOut(500, function(){
            el.insertBefore(el.prev());
            var local_el = el;
            el.fadeIn(500, function(){
                local_el.qtip("api").reposition(null, false);
                if (mlab.dt.api.properties_tooltip) {
                    $(mlab.dt.api.properties_tooltip).qtip("api").reposition(null, false);
                }
            });
        });
        this.parent.flag_dirty = true;
    },

    component_movedown : function () {
        if (typeof el == "undefined") {
            var el = $(".mlab_current_component");
        }
        if (el.length == 0) {
            return;
        }
        el.fadeOut(500, function(){
            el.insertAfter(el.next());
            var local_el = el;
            el.fadeIn(500, function(){
                local_el.qtip("api").reposition(null, false);
                if (mlab.dt.api.properties_tooltip) {
                    $(mlab.dt.api.properties_tooltip).qtip("api").reposition(null, false);
                }
            });
        });
        this.parent.flag_dirty = true;
    },

    invert_color : function (rgb) {
     rgb = [].slice.call(arguments).join(",").replace(/rgb\(|\)|rgba\(|\)|\s/gi, '').split(',');
            for (var i = 0; i < rgb.length; i++) rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
            return rgb.join(", ");
    },
    
    component_delete : function (cut) {
        var that = this;
        if (cut){
            if (el.length == 0) {
                return;
            }
            var comp_id = el.data("mlab-type");
            if (typeof this.parent.components[comp_id].code.onDelete != "undefined") {
                this.parent.components[comp_id].code.onDelete(el);
            }
            mlab.dt.api.closeAllPropertyDialogs();
            var sel_comp = $(".mlab_current_component").prev();
            if (sel_comp.length == 0) {
                sel_comp = $(".mlab_current_component").next();
            }
            $(".mlab_current_component").qtip('hide'); 
            $(".mlab_current_component").remove();
            if (sel_comp.length > 0) {
                if (this.parent.api.display.componentHighlightSelected(sel_comp)) {
                    this.component_menu_prepare();
                }
            } 
            this.parent.flag_dirty = true;
            return true; 
        }
        
        $("#mlab_dialog_delete").dialog({
            title: _tr["build_app.dialog.delete.title"],
            dialogClass: "no-close",
            modal: true,
            buttons: [ {    text: _tr["mlab.dt.api.js.getLink.ok"],     
                            click:function () { 
                                $(this).dialog('destroy'); 
//Deletes
                                var el = $(".mlab_current_component");
                                if (el.length == 0) {
                                    return;
                                }
                                mlab.dt.api.closeAllPropertyDialogs();
                                var sel_comp = el.prev();
                                if (sel_comp.length == 0) {
                                    sel_comp = el.next();
                                }
                                el.qtip('hide'); 
                                
//call ondelete in component if it exists
                                var comp_id = el.data("mlab-type");
                                if (typeof that.parent.components[comp_id].code.onDelete != "undefined") {
                                    that.parent.components[comp_id].code.onDelete(el);
                                }

                                el.remove();
                                if (sel_comp.length > 0) {
                                    if (that.parent.api.display.componentHighlightSelected(sel_comp)) {
                                        that.component_menu_prepare();
                                    }
                                } 
                                that.parent.flag_dirty = true;
                            } 
                        },
                        {   text: _tr["mlab.dt.api.js.getLink.cancel"], 
                            click: function () { 
                                            $(this).dialog('destroy'); 
                                            return false;  
                            }
                        }
                    ],
        });
                        
        
    },
    
//gets a html page to show as help for making the component at dt
    component_help : function () {
        var comp_id = $(".mlab_current_component").data("mlab-type");
        var extended_name = this.parent.api.getLocaleComponentMessage(comp_id, ["extended_name"]);
        var owner_element = $(".mlab_help_icon");
        var qTipClass = 'mlab_comp_help_qTip';
        var title = _tr["mlab.dt.design.js.qtip.help.title"] + " - " + extended_name;
        this.parent.api.displayExternalHelpfile(comp_id, title, owner_element, qTipClass);           
    },
    
    
//cut and copy simply takes the complete outerHTML and puts it into a local variable, mlab.dt.clipboard
    component_cut : function () {
        var cut = true;
        mlab.dt.clipboard = $(".mlab_current_component").clone();
        this.component_delete(cut);
    },

    component_copy : function () {
        mlab.dt.clipboard = $(".mlab_current_component").clone();
    },

//when they past we need to go through similar checks as we do when adding a component, like is it unique, etc.
//also need to attach event handlers, etc, they are lost as 
    component_paste : function() {
        var comp_id = mlab.dt.clipboard.data("mlab-type")
        if (this.parent.components[comp_id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + comp_id + "']").length > 0) {
            alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);
            return;
        }
        $(".mlab_current_component").qtip('hide');
        $(".mlab_current_component").removeClass("mlab_current_component");
        $("#" + this.parent.config["app"]["content_id"]).append(mlab.dt.clipboard);
        if (this.parent.api.display.componentHighlightSelected(mlab.dt.clipboard)) {
            this.component_menu_prepare();
        } else {
            //TODO - the check does not work.....
            this.component_menu_prepare();
        }

        window.scrollTo(0,document.body.scrollHeight);
        mlab.dt.clipboard.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } } )
        mlab.dt.clipboard.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[comp_id].conf.process_keypress != "undefined" && this.parent.components[comp_id].conf.process_keypress) {
            $(mlab.dt.clipboard).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }
        
        this.parent.flag_dirty = true;
    },
    
    component_edit_credentials : function () {
        var curr_comp = $(".mlab_current_component");
        var cred_el = $("[data-mlab-comp-tool='credentials']");
        var comp_id = curr_comp.data("mlab-type");
        if (Object.prototype.toString.call( this.parent.components[comp_id].conf.credentials ) === "[object Array]") {
            this.parent.api.getCredentials(cred_el, comp_id, this.parent.components[comp_id].conf.credentials, this.component_store_credentials, true, { component: curr_comp });
        }        
    },

/**
 * features are simply components that are not displayed with a GUI
 * they are added to a hidden div on the index page, if we are NOT working on the index page we call a backend function to add this code
 *
 * @returns {undefined}
 */

    feature_add : function (comp_id, silent) {
        if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content").length == 0) {
            $(this.parent.app.curr_indexpage_html).find("body").append("<div id='mlab_features_content' style='display: none;'></div>");
        } else {
//make sure not duplicate it
            if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']").length > 0) {
                if (!silent) {
                    this.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.feature.already.added"], false);
                }
                return;
            }
        }
        var c = this.parent.components[comp_id].conf;
        var data_resize = (typeof c.resizeable != "undefined" && c.resizeable == true) ? "data-mlab-aspectratio='1:1' data-mlab-size='medium'" : "";
        var data_display_dependent = ((typeof c.display_dependent != "undefined" && c.display_dependent == true) || (typeof c.resizeable != "undefined" && c.resizeable == true)) ? "data-mlab-displaydependent='true'" : "";

        $(this.parent.app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='" + comp_id + "' " + data_resize + " " + data_display_dependent + " >" + this.parent.components[comp_id].html + "</div>");

        var new_feature = $(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']");
        if (new_feature.length > 0) {
            this.parent.components[comp_id].code.onCreate(new_feature[0]);
        }

//if we are not working on the index page we need to tell the back end to update the index.html file
//otherwise this will be lost
        if (this.parent.app.curr_page_num != "0" && this.parent.app.curr_page_num != "index") {
            var url = this.parent.urls.feature_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                this.parent.utils.update_status("callback", _tr["mlab.dt.design.js.update_status.adding.feature"], true);
            }

            var that = this;
            $.get( url, function( data ) {
                if (data.result == "success") {
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.feature.added"], false);
                    $("#mlab_features_list [data-mlab-feature-type='" + data.component_id + "']").addClass("mlab_item_applied");
                    

                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });
        }
    },
    
/**
 * Function to add or remove storageplugin for a component. 
 * Add plugin:
 * storage_plugins are similar to features, except they are linked to individual components and not app as whole
 * They do nothing at design time so here we just call the back end to copy and add the code_rt.js file to the app
 * If credentials = true, we request credentials and store them for the component that this plugin was added to
 * 
 * Remove plugin:
 * Just need to set the storage_plugin variable that is stored with the omponent to ""
 * 
 * @param {type} el: list item showing name of storage plugin = currently clicked HTML element
 * @param {type} storage_plugin_id: unique ID of the storage plugin
 * @param {type} component: the component that wants to use this storage plugin
 */
    storage_plugin_setup: function(el, storage_plugin_id, component) {
        if (el.parent().attr("data-mlab-selected-storage")) {
            mlab.dt.api.setVariable(component, "storage_plugin", "");
            el.parent().removeClass("mlab_item_applied").removeAttr("data-mlab-selected-storage");      
        } else {
            var url = this.parent.urls.storage_plugin_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_STORAGE_PLUGIN_ID_", storage_plugin_id);
            this.parent.utils.update_status("callback", _tr["mlab.dt.design.js.update_status.adding.storage.plugin"], true);
            var that = this;
            $.get( url, function( data ) {
                var el = $("[data-mlab-get-info='storage_plugins'] [data-mlab-storage-plugin-type='" + data.storage_plugin_id + "']");
                if (data.result == "success") {
                    
//first remove data and classes from currently selected plugin, if any
                    el.parent().siblings().removeClass("mlab_item_applied").removeAttr("data-mlab-selected-storage");
                    
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.storage.plugin.added"], false);
                    el.addClass("mlab_item_applied").attr("data-mlab-selected-storage", "true");

                    if (Object.prototype.toString.call( that.parent.components[storage_plugin_id].conf.credentials ) === "[object Array]") {
                        that.parent.api.getCredentials(el, storage_plugin_id, that.parent.components[storage_plugin_id].conf.credentials, that.storage_plugin_store_credentials, false, { storage_plugin_id: storage_plugin_id, component: component });
                    } else {
                        mlab.dt.api.setVariable(component, "storage_plugin", {name: storage_plugin_id});
                        $(mlab.dt.qtip_tools).qtip().elements.content.find("[data-mlab-storage-plugin-type='storage_plugins']").slideUp();
                    }

                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });   
        }
    },
    
/**
 * Callback function which stores the storage_plugin name and the credentials entered
 * @param {type} credentials: 
 * @param {type} params
 * 
 */
    component_store_credentials: function (credentials, params) {
        
        mlab.dt.api.setVariable( params.component, "credentials", credentials );

    },

/**
 * Callback function which stores the storage_plugin name and the credentials entered
 * @param {type} credentials: 
 * @param {type} params
 * 
 */
    storage_plugin_store_credentials: function (credentials, params) {
        mlab.dt.api.setVariable( params.component, "storage_plugin", { name: params.storage_plugin_id, credentials: credentials } );

    },


/*
 *
 * @param divs (html/DOM) all divs to edit
 */
    prepare_editable_area : function () {
//need to loop through all divs in the editable box after they have been added
//and set the styles for dragging/dropping so it works OK
        var that = this;
        $( "#" + that.parent.config["app"]["content_id"] + "> div" ).each(function( index ) {
            $( this ).droppable(that.parent.droppable_options)
                     .sortable(that.parent.sortable_options)
                     .on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } })
                     .on("input", function(){mlab.dt.flag_dirty = true;});

            comp_id = $( this ).data("mlab-type");
            that.component_run_code($( this ), comp_id);
            
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
            if (typeof that.parent.components[comp_id].conf.process_keypress != "undefined" && that.parent.components[comp_id].conf.process_keypress) {
                $( this ).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
            }
        });

//set draggable/sortable options for the editable area
        $( "#" + that.parent.config["app"]["content_id"] ).droppable(that.parent.droppable_options).sortable(that.parent.sortable_options);

    },

    /***********************************************************
 *********** Function to manipulate adaptive menus (those defined by component itself ********
************************************************************/

/* adds component specific menu (images) when a component is added/selected */
    component_menu_prepare: function () {
        var curr_comp = $(".mlab_current_component");
        if (curr_comp.length < 1) {
            return;
        }
        var conf = this.parent.components[curr_comp.data("mlab-type")].conf;
        var comp_name = curr_comp.data("mlab-type");
        var items = new Object();
        var title = "";
        var menu = $("#mlab_toolbar_for_components .mlab_component_context_menu");
        var temp_menu = [];
        var loc = mlab.dt.api.getLocale();
        
        $("#mlab_toolbar_for_components .mlab_component_toolbar_heading").text(this.parent.api.getLocaleComponentMessage(comp_name, ["extended_name"]));
        menu.html("");
        

        if (typeof conf.custom != "undefined") {
            for(var index in this.parent.components[comp_name].code) {
                if (index.substr(0, 7) == "custom_") {
                    title = index.slice(7);
                    if (typeof conf.custom[title] != "undefined") {
                        var icon = ( typeof conf.custom[title]["icon"] != "undefined" ) ? "src='" + conf.custom[title]["icon"] + "'" : "class='missing_icon'";
                        var tt = this.parent.api.getLocaleComponentMessage(comp_name, ["custom", title, "tooltip"]);
                        var order = ( typeof conf.custom[title]["order"] != "undefined" ) ? conf.custom[title]["order"] : 0;

                        if (typeof conf.custom[title]["newline"] != "undefined" && conf.custom[title]["newline"] === true) {
                            var cl = "mlab_newline";
                        } else {
                            var cl = "";
                        }

                        temp_menu[order] = "<img onclick='(function(e){ mlab.dt.components." + comp_name + ".code." + index + "($(\".mlab_current_component\"), e);})(event)' " + 
                                         "title='" + tt + "' " + 
                                         "class='" + cl + "' " + 
                                         "data-mlab-comp-tool-id='" + index + "' " + 
                                         icon + " >";
                    }
                }
            }
            menu.append(temp_menu.join(""));
            menu.append("<div class='clear'>&nbsp;</div>");
            
        }
        
        
//display credentials selection button, if this supports credentials
        if (typeof conf.credentials != "undefined" && Object.prototype.toString.call( conf.credentials ) === "[object Array]") {
            $("[data-mlab-comp-tool='credentials']").removeClass("mlab_hidden");
        } else {
            $("[data-mlab-comp-tool='credentials']").addClass("mlab_hidden");
        }

//display storage selection list button, if this supports storage
        if (typeof conf.storage_plugin != "undefined" && conf.storage_plugin == true) {
            $("[data-mlab-comp-tool='storage_plugin']").removeClass("mlab_hidden");
        } else {
            $("[data-mlab-comp-tool='storage_plugin']").addClass("mlab_hidden");
        }
        
//display size and aspect ratio selection list buttons, if this supports resizing
        if (typeof conf.resizeable != "undefined" && conf.resizeable == true) {
            $("[data-mlab-comp-tool='comp_size']").removeClass("mlab_hidden");
            $("[data-mlab-comp-tool='comp_aspect']").removeClass("mlab_hidden");
            $("#mlab_component_size_list li").removeClass("mlab_item_applied");
            $("#mlab_component_aspect_list li").removeClass("mlab_item_applied");
//update the menus with the existing selection, if any
            $("#mlab_component_size_list [data-data-mlab-comp-size='" + curr_comp.data("mlab-comp-size") + "']").addClass("mlab_item_applied");
            $("#mlab_component_aspect_list [data-data-mlab-comp-aspect='" + curr_comp.data("mlab-comp-aspect") + "']").addClass("mlab_item_applied");
        } else {
            $("[data-mlab-comp-tool='comp_size']").addClass("mlab_hidden");
            $("[data-mlab-comp-tool='comp_aspect']").addClass("mlab_hidden");
        }
       
//set the qTips posistion after where it is placed in the window 
        var myPosQtip = 'leftTop';
        var eTop = curr_comp.offset().top; //get the offset top of the element
        eTop = eTop - $(window).scrollTop();
        
        if( eTop > 450 ){
            myPosQtip = 'leftBottom';
        }
              
        this.parent.qtip_tools = $(curr_comp).qtip({
            solo: false,
            content:    { text: function() { return $('#mlab_toolbar_for_components').clone(true); } },
            position:   { my: myPosQtip, at: 'rightTop', viewport: $(window) },
            show: {ready: true, modal: { on: false, blur: false }},
            hide: false,
            events: {
                hide: function(event, api) { $(mlab.dt.api.properties_tooltip).qtip('hide'); api.destroy(); },
                visible: function(event, api) { $(mlab.dt.qtip_tools).qtip().elements.content.find("*").removeAttr("id"); },
            },
            style: { classes: 'qtip-light mlab_zindex_regular_tooltip', tip: true },
    
/*            show:       { ready: true, modal: { on: false, blur: false } },
            hide:       false, */
        });
        
        $(curr_comp).qtip("show");
    },
    
/*
 * Turn the help in the footer and the footer on and off
 */
    toggle_footer : function () {

    var footer = $(".mlab_editor_footer");
    var footer_text = $(".mlab_editor_footer_help");
        if (footer.hasClass("mlab_transparent")) {
            footer.removeClass("mlab_transparent");
            footer_text.removeClass("mlab_hidden");
            //TODO toggle title as well
        } else {
            footer.addClass("mlab_transparent");
            footer_text.addClass("mlab_hidden");
        }
    },
    
} // end design.prototype



/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Utility functions for design time
 */

function Mlab_dt_utils () {
    this.parent = null;
    this.timer_save = null;
};

Mlab_dt_utils.prototype = {
/**
 * This function is used to display status information, this can be permanent, temporary, or until callback is called, and may have a progress bar
 * If state is completed we get rid of temporary info and any gauges
 *
 * @param {type} state
 * @param {type} content
 * @returns {undefined}
*/
    update_status : function (state, content, display_progress) {
        
        if (state == "permanent") {
            $("#mlab_statusbar_permanent").text(content);
            return;
        } else if (state == "temporary") {
            $("#mlab_statusbar_temporary").text(content);
            window.setTimeout(this.clear_status.bind(this), 3000);
        } else if (state == "callback") {
            $("#mlab_statusbar_temporary").text(content);
        } else if (state == "completed") {
            $("#mlab_statusbar_temporary").text('');
            $('#mlab_statusbar_progress_spin').spin(false);
            $("#mlab_statusbar_progress_spin").hide();
            return;
        }

        if (typeof display_progress != "undefined" && display_progress == true) {
            $("#mlab_statusbar_progress_spin").show();
            $("#mlab_statusbar_progress_spin").spin('small', '#fff');
        } else if (typeof display_progress != "undefined" && display_progress == false) {
            $('#mlab_statusbar_progress_spin').spin(false);
            $("#mlab_statusbar_progress_spin").hide();
        }
    },

/**
 * Simple wrapper function to clear a temporary status
 * @returns {undefined} */
    clear_status : function () {
        this.update_status("completed");
    },



/**
 * Create a timer to save the current page and stores it in a global variable
 * we call window.clearTimeout(this.timer_save) to stop it should it be required
 *
 * @returns {undefined}
 */
    timer_start : function () {
        var tm = parseInt(this.parent.config["save_interval"]);
        if (tm < 60) { tm = 60; }

//Need to provide context for timer event, otherwise the "this" inside page_save will point to Window object
        this.timer_save = window.setTimeout(this.parent.management.page_save.bind(this.parent.management), tm * 1000);
    },

    timer_stop : function () {
        window.clearTimeout(this.timer_save);
    },

//utility to merge two objects, but only ADD non-existing properties to the to_obj
    merge_objects : function (from_obj, to_obj) {
        for (var p in from_obj) {
// Property in destination object set; update its value.
            if ( typeof from_obj[p] == "object") {
                if (typeof to_obj[p] == "undefined") {
                    to_obj[p] = new Object();
                }
                to_obj[p] = this.merge_objects(from_obj[p], to_obj[p]);
            } else if (typeof to_obj[p] == "undefined") {
                to_obj[p] = from_obj[p];
            }
        }
        return to_obj;        
    },
    
    process_inheritance_helper : function (components, index) {
//does this component inherit from another component?
            if (typeof components[index].conf["inherit"] != "undefined") {
                var from = components[index].conf.inherit;
                
//does the component to inherit from exist?
                if (typeof components[from] != "undefined") {
                    

//need to check that the object to inherit is either top level, or already inherited, if not we recursively process those inheriances first first
                    if (!components[from].inheritance_processed && components[from].conf["inherit"] != "undefined") {
                        this.process_inheritance_helper(components, from);
                    }
//we copy top level objects and objects within the code and and code.config objects
                    components[index] = this.merge_objects(components[from], components[index]); 
                    components[index].inheritance_processed = true;

                } else {
                    console.log("Parent object for " + index + " does not exist:" + from);
                }
            }        
    },

//this function takes care of the simple inheritance facility that compoennts offer
//Have a property called inheritance_processed, if true we've added properties from parents for that component. Set this to true for components that do not inherit from anyone else
//When loop through components and it inherits from a component that had not loaded parents yet, then process that first, then inherit from grandparent to parent first.
//If grandparent also inherits, then same for that, and so on.
//Need to have a call stack to avoid circular inheritance
    process_inheritance: function (components) {
        for (index in components) {
            this.process_inheritance_helper(components, index);
        }
        
    },
    
//gets a cookie by name/key                        
    getCookie: function (cname) {
         var name = cname + "=";
         var ca = document.cookie.split(';');
         for(var i=0; i<ca.length; i++) {
             var c = ca[i];
             while (c.charAt(0)==' ') c = c.substring(1);
             if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
         }
         return 1;
     }

}
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */
//TODO: NEED TO NOT USE slf (window.slf = JS builtin variable)


/* general variables used globally by different functions
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */

//turn off automatic initialisation of mobile pages
$.mobile.autoInitializePage = false;


/*********** Startup code ***********/
$(document).ready(function() {
        
//only support chrome and firefox to begin with
    if (bowser.gecko || bowser.chrome) {

    } else {
        alert(_tr["mlab_editor.init.js.alert.browser.support"]);
        $("body").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>');
    }
        
//initialise the Mlab object, then create an global instance of it
//the MLAB object contains several other objects loaded in different files
    Mlab = function () {
        var self = this;
        this.locale = document.mlab_temp_vars.locale;

//runtime api is at the top level
        this.api = new Mlab_api();
        this.api.parent = self;

        this.dt = {
//variables used for: general config, path info, app info, page details
            uid: 0,
            config: new Object(),
            paths: new Object(),
            app: new Object(),
            page: new Object(),

// individual variables used by all .dt sub functions
            flag_dirty: false,
            counter_saving_page: 0, // counter which tells us if inside the save function we should restart the timer for
            drag_origin: 'sortable',
            mlab_component_cur_tooltip: null,

// drag'n'drop definitions used by jQuery
            droppable_options: {
                drop: function( event, ui ) {
                    mlab.dt.flag_dirty = true;
                }
            },

            sortable_options: {
                placeholder: "mlab_component_placeholder",
                revert: false,
                helper: "clone",
                cancel: "[contenteditable]",
                stop: function(event, ui){
//make editable after dragging to sort
                    if (mlab.dt.drag_origin == 'sortable' && ui.item.data("contenteditable") == "true") {
                        ui.item.attr("contenteditable", "true");
                    };
                    mlab.dt.flag_dirty = true;
                }
            },

//other pre-defined objects wrapping up this .dt "class"
            api: new Mlab_dt_api(),
            bestpractice: new Mlab_dt_bestpractice(),
            design: new Mlab_dt_design(),
            management: new Mlab_dt_management(),
            utils: new Mlab_dt_utils(),

        },

        this.initialise_dt_parents = function () {
            self.dt.parent = self;
            self.dt.api.parent = self.dt;
            self.dt.api.display.parent = self.dt.api;
            self.dt.bestpractice.parent = self.dt;
            self.dt.design.parent = self.dt;
            self.dt.management.parent = self.dt;
            self.dt.utils.parent = self.dt;
        }

    };
    mlab = new Mlab();
    mlab.initialise_dt_parents();

//here we pick up variables from the backend, if successful we go on, if not we must exit
    $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/" + document.mlab_temp_vars.page_num + "/load_variables" , function( data ) {

        if (data.result === "success") {
//unique ID for this tab/window, used to lock pages
            mlab.dt.uid = data.mlab_uid;

//we use the email of the user to send them links to apps
            mlab.dt.user_email = data.mlab_current_user_email;

//current app/page information, this will be updated when they create a new app or edit properties
            mlab.dt.app = data.mlab_app;
            mlab.dt.app.curr_page_num = data.mlab_app_page_num;
//checksum of current file
            mlab.dt.app.app_checksum = data.mlab_app_checksum;

//any existing compiled files for this app
            mlab.dt.app.compiled_files = data.mlab_compiled_files;

//configuration stuff from parameter.yml
            mlab.dt.config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest from Symfony and don't have hardwired ones
            mlab.dt.urls = data.mlab_urls;


/**** Finished preparing variables, now we set up rest of environment ****/


//check if the doc is modified before closeing it, if so warn user, also unlock file and save component accordion expand collaps state
            window.onbeforeunload = function() {
                var url = mlab.dt.urls.editor_closed.replace("_UID_", mlab.dt.uid);
                $.ajax({ url: url, async: false });

                if (mlab.dt.flag_dirty) { return _tr["mlab_editor.init.js.alert.unsaved"] ; }
//Loop trough the Component categories/accordians to se if they are expand or collapsed. 
                var compcat = $("#mlab_toolbar_components h3");
                if (typeof compcat != "undefined"){
                    compcat.each(function(){
                        var cat = $(this).data("mlab-category");
                        if ($(this).hasClass("ui-state-active")){
//Set coockie to save expand state of the accordians of the componentgroup
                            document.cookie="mlabCompCat" + cat + "=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                        } else {
//Set coockie to save collapsed state of the accordians of the componentgroup
                            document.cookie="mlabCompCat" + cat + "=1; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                        }
                    })
                }
            };

//now we load components, the go into a mlab object called components,
//and for each component we need to turn the text of the
            $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/load_components" , function( data ) {
                if (data.result === "success") {

                    var loc = mlab.dt.api.getLocale();
                    mlab.dt.components = data.mlab_components;
                    mlab.dt.storage_plugins = {};
                    var components_html = {};
                    var category_translations = {};
                    var features_html = [];
                    var additional_html = "";
                    var comp_type;

                    for (type in mlab.dt.components) {
//we need to attach the code_dt.js content to an object so we can use it as JS code
                        if (mlab.dt.components[type].code !== false) {
                            eval("mlab.dt.components['" + type + "'].code = new function() { " + mlab.dt.components[type].code + "};");
                        }
                    }

//now loop through all components and for those that inherit another we transfer properties
                    mlab.dt.utils.process_inheritance(mlab.dt.components);

//second loop which is for displaying the tools loaded & prepared above in the editor page
                    for (type in mlab.dt.components) {
//here we create the conf object inside the newly created code object, this way we can access the configuration details inside the code
                        mlab.dt.components[type].code.config = mlab.dt.components[type].conf;
                        var c = mlab.dt.components[type];
                        if (c.accessible && !(c.is_storage_plugin)) {

//prepare the tooltips (regular/extended). Can be a string, in which use as is, or an key-value object, if key that equals mlab.dt.api.getLocale() is found use this, if not look for one called "default"
                            var tt = mlab.dt.api.getLocaleComponentMessage(type, ["tooltip"]);
                            var tte = mlab.dt.api.getLocaleComponentMessage(type, ["footer_tip"]);
                            var eName = mlab.dt.api.getLocaleComponentMessage(type, ["extended_name"]);

//the category setting in the conf.yml files
                            if (typeof components_html[c.conf.category] == "undefined") {
                                components_html[c.conf.category] = [];
                                category_translations[c.conf.category] = mlab.dt.api.getLocaleComponentMessage(type, ["category_name"]);
                            }                                

                            if (c.is_feature) {
                                comp_type = "feature";
                            } else {
                                comp_type = "component";
                            }
                            
                            components_html[c.conf.category][parseInt(c.order_by)] = "<div data-mlab-type='" + type + "' " +
                                        "onclick='mlab.dt.design." + comp_type + "_add(\"" + type + "\");' " +
                                        "title='" + tt + "' " +
                                        "class='mlab_button_components' " +
                                        "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                    "</div>" + 
                                    "<div class='mlab_component_footer_tip'>" +
                                            tte +
                                     "</div>";
                        } else if (c.accessible && c.is_storage_plugin) {
                            mlab.dt.storage_plugins[type] = eName;
                        }
                    }

//TODO now first category is hardcoded to be text...
//If the first category of components does not have a cookie it moste likely that none of the mlabCompCatxxx cookies are made (first time users or deleted cookies) - so set the first categroy to expand 
                    var cookieExists = mlab.dt.utils.getCookie("mlabCompCattext");
                    if (cookieExists === 1){
//Cookie for first category not found - set cookie so it will be expanded
                        document.cookie="mlabCompCattext=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                    }

//Puts all components under the same category and adds an accordion to the categroy collapsed or expanded depending on the coockie state 
                    for  (category in components_html) {
                        var activeCat = Number(mlab.dt.utils.getCookie("mlabCompCat" + category));
                        $("<div><h3 data-mlab-category='" + category + "'><div class='mlab_category_name'>" + category_translations[category] + "</div></h3><div>" + components_html[category].join("") + "</div></div>").appendTo("#mlab_toolbar_components").accordion({
                            heightStyle: "content",
                            active: activeCat,
                            collapsible: true
                        });
                    } 


//now loop through all components and for those that inherit another we transfer properties
                    mlab.dt.utils.process_inheritance(mlab.dt.components);

//finally we assign the API object to teh component, cannot do this earlier as it wolud otherwise create a loop to parents, etc 
//when trying to merge properties in the previous code block
                    for (index in mlab.dt.components) {
                        if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                            mlab.dt.components[index].code.api = mlab.dt.api;
                        }
                    }

//set the extended help text for the component in the footer
                     $(".mlab_button_components").mouseover(function(e){
                        $(".mlab_editor_footer_help").text(e.currentTarget.nextSibling.textContent);
                     });

                     $(".mlab_button_components").mouseout(function(e){
                        $(".mlab_editor_footer_help").text("");
                     });

//we always load pages using AJAX, this takes the parameters passed from the controller
                    mlab.dt.management.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );

//erase the temporary variable, this is used in inititalisation process only.
                    delete document.mlab_temp_vars;


//prepare the menu popup for the storage plugin selector
/*SPSP                        $("[data-mlab-comp-tool='storage_plugin']").click( function(event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("data-mlab-get-info='storage_plugins'").clone(), title: _tr["mlab_editor.init.js.qtip.comp.storage.plugin.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; } },
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true }
                        });
                    } );*/

//add spinner to the statusbar to show when needed                   
                    $("#mlab_statusbar_progress_spin").spin('small', '#fff');

//assign click functions to tools
                    $("[data-mlab-comp-tool='move_up']").on("click", function () { mlab.dt.design.component_moveup(); });
                    $("[data-mlab-comp-tool='move_down']").on("click", function () { mlab.dt.design.component_movedown(); });
                    $("[data-mlab-comp-tool='delete']").on("click", function () { mlab.dt.design.component_delete(); });
                    $("[data-mlab-comp-tool='help']").on("click", function () { mlab.dt.design.component_help(); });
                    $("[data-mlab-comp-tool='cut']").on("click", function () { mlab.dt.design.component_cut(); });
                    $("[data-mlab-comp-tool='copy']").on("click", function () { mlab.dt.design.component_copy(); });
                    $("[data-mlab-comp-tool='paste']").on("click", function () { mlab.dt.design.component_paste(); });

                    $("[data-mlab-comp-tool='redo']").on("click", function () { document.execCommand("redo"); });
                    $("[data-mlab-comp-tool='undo']").on("click", function () { document.execCommand("undo"); });
                    
                    $("#mlab_page_control_title").on("click", function () {
                        mlab.dt.api.editContent(this);
                        $('#mlab_page_control_title_actions').show();
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name.edit"]);
                    });

                    $("#mlab_page_control_save_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        mlab.dt.management.page_update_title();
                    });

                    $("#mlab_page_control_cancel_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        $('#mlab_page_control_title').text(mlab.dt.app.curr_pagetitle);
                    });
    
                    $("#mlab_page_control_new").on("click", function () { mlab.dt.management.page_new(); });
                    
                    $("#mlab_page_control_delete").on("click", function () { mlab.dt.management.page_delete(); });

                    $("#mlab_page_help").on("click", function () { page_help(event); });

//trun on and off footer help
                    $("#mlab_button_help").on("click", function () { mlab.dt.design.toggle_footer(); });


//Checkes if the editor menu icon is cliked
                    $("#mlab_editor_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open and needs to be closed 
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
//Toggles the Editor menu on and off
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checkes if the user menu icon is cliked
                    $("#mlab_user_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open and needs to be closed 
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
//Toggles the User menu on and off
                        $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                        $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checkes if the page menu icon is cliked
                    $("#mlab_page_control_pagelist").on("click",function(event) { 
//User menu is open and needs to be closed 
                        $('#mlab_page_management').toggleClass('mlab_show');
                        event.stopPropagation(); 
                    });

//Listens for any click
                    $(document).on('click', function (event) {
// Checks if editor menu is open
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open - close it
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
                        
// Checks if user menu is open
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open - close it
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
                        
// Checks if page menu is open
                        if ($('#mlab_page_management').hasClass('mlab_show')) {
//User menu is open and needs to be closed 
                            $('#mlab_page_management').toggleClass('mlab_show'); 
                        } 
                    });  

//save page button in the editor menu 
                    $("#mlab_page_save_all").on("click", function () { 
                        var temp; 
                        mlab.dt.management.page_save(temp, true); 
//Editor menu is open - close it
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        return false; 
                    });


                    $("[data-mlab-comp-tool='storage_plugin']").on("click", function () { 
                        var el = $(this).siblings("[data-mlab-get-info='storage_plugins']");
                        if( !el.is(":visible")) { 
                            el.html(mlab.dt.api.getStoragePluginList(mlab.dt.api.getSelectedComponent()));
                        }
                        el.slideToggle();
                    });
                    
                    $("[data-mlab-comp-tool='credentials']").on("click", function () { mlab.dt.design.component_edit_credentials(); });
                    
//prepare the menu popup for the component resizer
                    $("[data-mlab-comp-tool='comp_size']").on("click", function (event) { 
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_size_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.size.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window)},
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true },
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; },
                                          visible: function() {  
                                            $("[data-mlab-comp-size='small']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "small");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });

                                            $("[data-mlab-comp-size='medium']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "medium");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });

                                            $("[data-mlab-comp-size='large']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "large");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });
                                            
                                          }
                                        }
                        });
                    } );
                    
                   

//prepare the menu popup for the component aspect ratio selector
                    $("[data-mlab-comp-tool='comp_aspect']").on("click", function (event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_aspect_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.aspect.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window)},
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true },
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; }, 
                                          visible: function() {  
                                            $("[data-mlab-comp-aspect='4:3']").on("click", function () { 
                                                mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "4:3");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });

                                            $("[data-mlab-comp-aspect='16:9']").on("click", function () { 
                                               mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "16:9");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });

                                            $("[data-mlab-comp-aspect='1:1']").on("click", function () { 
                                                mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "1:1");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });
                                          }
                                        }
                        });
                    });
                    
//prepare qtip for the credit of the icon use
                    $('#mlab_credit_icons').qtip({
                        hide:{ delay:500, fixed:true },//give a small delay
                        position:   { my: 'left bottom', at: 'right center', adjust: { screen: true } },
                        content: {text: function(){ return $("<div>The icons on this page are made by <a href='http://www.freepik.com' target='_blank' title='Freepik'>Freepik</a>, <a href='http://www.flaticon.com/authors/simpleicon' target='_blank' title='SimpleIcon'>SimpleIcon</a>, <a href='http://www.flaticon.com/authors/dave-gandy' target='_blank' title='Dave Gandy'>Dave Gandy</a>, <a href='http://www.flaticon.com/authors/anton-saputro' target='_blank' title='Anton Saputro'>Anton Saputro</a> and <a href='http://www.flaticon.com/authors/yannick' target='_blank' title='Yannick'>Yannick</a> from <a href='http://www.flaticon.com' target='_blank' title='Flaticon'>www.flaticon.com</a> and are licensed by <a href='http://creativecommons.org/licenses/by/3.0/' target='_blank' title='Creative Commons BY 3.0'>CC BY 3.0</a> - and many are made by the Sinett project at FFI.no</div>").html()},
                        title: { text: "Credit for icons" } },
                        style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip" }
                    });

//prepare qtip for the credit of the icon use
                     $('#mlab_credit_icons').qtip({
                         hide:{ delay:500, fixed:true },//give a small delay
                         position:   { my: 'left bottom', at: 'right center', viewport: $(window) },
                         content: {text: function(){ return $("<div>The icons on this page are made by <a href='http://www.freepik.com' target='_blank' title='Freepik'>Freepik</a>, <a href='http://www.flaticon.com/authors/simpleicon' target='_blank' title='SimpleIcon'>SimpleIcon</a>, <a href='http://www.flaticon.com/authors/dave-gandy' target='_blank' title='Dave Gandy'>Dave Gandy</a>, <a href='http://www.flaticon.com/authors/anton-saputro' target='_blank' title='Anton Saputro'>Anton Saputro</a> and <a href='http://www.flaticon.com/authors/yannick' target='_blank' title='Yannick'>Yannick</a> from <a href='http://www.flaticon.com' target='_blank' title='Flaticon'>www.flaticon.com</a> and are licensed by <a href='http://creativecommons.org/licenses/by/3.0/' target='_blank' title='Creative Commons BY 3.0'>CC BY 3.0</a> - and many are made by the Sinett project at FFI.no</div>").html()},
                         title: { text: "Credit for icons" } },
                         style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                     });
 
//prepare qtip for the download of app buttons
                    $.each(mlab.dt.config.compiler_service.supported_platforms, function(index, platform) {
                        $('#mlab_download_'+ platform + '_icon').qtip({
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            content: {text: function(){ return $("[data-mlab-download-link-info='" + platform + "']").html()},
                            title: { text: _tr["mlab_editor.init.js.qtip.download.app.title"] + " " + platform } },
                            style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                        });
                    });

                } else {
                    alert(_tr["mlab_editor.init.js.compiling.failed.loading.comps"]);
                    //document.location.href = document.mlab_temp_vars.appbuilder_root_url;
                }
            });

        } else {
            alert(_tr["mlab_editor.init.js.compiling.failed.loading.var"]);
            //document.location.href = document.mlab_temp_vars.appbuilder_root_url;
        }
    });

});
    
    
