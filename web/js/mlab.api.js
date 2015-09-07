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
    
    this.db.parent = this;
    this.db.internal.parent = this.db;

/* Object to hold components loaded */
    this.components = {};
    
    
/*--- database ---*/

/* Object to hold the plugins loaded */
    this.db.plugins = {};
    
/* Object to hold all states. They are stored using localStorage, but kept locally in this object
for ease of use and performance */
    this.db.states = {};
    this.db.internal.fetchStates();

    this.db.results = {};
    this.db.internal.fetchResults();

    /* Object to hold all configs. They are stored using localStorage, but kept locally in this object
    for ease of use and performance */
    this.db.configs = {};
    // Populate the configs object
    this.db.internal.fetchConfigs();
    
//add storage for the app specific variables (generated in the pre-compile processing function)
// to the object here
    this.variables = new Object();
    
/* Online/offline state. We assume we are starting online, and handle any change. */
    this.online = true;
    
    documentOb.on("online", function() { self.online = true; });
    documentOb.on("offline", function() { self.online = false; });
    
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
                        var name = component.replace("_code_rt.js", "").replace("/js/", "");
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
    version: 0.1,
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
            return "demo"; //TODO, replace with function that looks in local storage to see if uuid is set, if so, rturn it, if not generate
        }
    },

    getAppUid:  function() {
        return $('head > [name="mlab:app_uid"]').attr("content");
    },
        
/**
 * Get current locale
 * @returns string
 */
    getLocale: function() {
        return this.parent.locale;
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

    
    db: {

/* Pointer to main mlab object */
        parent: null,

        setupStoragePlugin: function(el) {
            var variables = this.parent.getAllVariables(el);
            var plugin,component;
            if (variables && "storage_plugin" in variables) { 
                plugin = variables["storage_plugin"];
            }
            if (!plugin) {
                return false;
            }
            if ("name" in plugin && plugin["name"] in this.parent.components) {
                component = this.parent.components[plugin["name"]];
            }
            if (!component) {
                return false;
            }
            // onpluginloaded isn't required for plugins
            if ("onPluginLoaded" in component) {
                component.onPluginLoaded(el);
            }
            this.plugins[plugin["name"]] = component;
            return true;
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
        getState: function(user, key, callback) {
            var res = this.internal.dispatchToPlugin("getState", user, key, callback);
            
// If false, getState is not implemented in plugin, and we should use the local storage.
            if (!res) {
                if (user in this.states && key in this.states[user]) {
                    callback(this.states[user][key]);
                } else {
                    callback();
                }
            }
            return true;
        },

/**
 * Gets all stored states, or all stored states for user (if given).
 * @param {String} user User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the states
 */
        getAllStates: function(user, callback) {
            var res = this.internal.dispatchToPlugin("getAllStates", user, callback);
            if (!res) {
                var allStates ;
                if (user) {
                    if (user in this.states) {
                        allStates = this.states[user];
                    }
                } else {
                    allStates = this.states;
                }
                callback(allStates);
            }
            return true;
        },
    
/**
 * Sets config for user, also makes sure it is saved for later use.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} key Key name for the config to be stored. Required.
 * @param {any} value The config value to be stored. Required. Anything that is compatible with JSON.stringify. All basic Javascript types should be OK.
 */ 
        setConfig: function(user, key, value) {
            var pluginSetConfig = this.internal.dispatchToPlugin("setConfig", user, key, value);
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
        getConfig: function(user, key, callback) {
            var res = this.internal.dispatchToPlugin("getConfig", user, key, callback);

// If false, getConfig is not implemented in plugin, and we should use the local storage.
            if (!res) {
                if (user in this.configs && key in this.configs[user]) {
                    callback(this.configs[user][key]);
                } else {
                    callback();
                }
            }
            return true;
        },

/**
 * Gets all stored configs, or all stored configs for user (if given).
 * @param {String} user: User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the configs
 */
        getAllConfig: function(user) {
            var res = this.internal.dispatchToPlugin("getAllConfig", user);
            if (!res) {
                var allConfigs;
                if (user) {
                    if (user in this.configs) {
                        allConfigs = this.configs[user];
                    }
                } else {
                    allConfigs = this.configs;
                }
                callback(allConfigs);
            }
            return true;
        },
    
    
/**
 * Saves result for a question.
 * @param {String} user User ID for the currently logged in user. Required.
 * @param {String} name The name of the quiz. Must be unique within the app. Required.
 * @param {String} key The name of the question. Must be unique within the quiz. Required.
 * @param {any} value The value to be stored.
 */
        setResult: function(user, name, key, value) {
            var pluginSetResult = this.internal.dispatchToPlugin("setResult", user, name, key, value);
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
        getResult: function(user, name, key, callback) {
            var res = this.internal.dispatchToPlugin("getResult", user, name, key, callback);
            
//If false, getResult is not implemented in plugin, and we should use the local storage.
            if (!res) {
                if (user in this.results && name in this.results[user] && key in this.results[user][name]) {
                    callback(this.results[user][name][key]);
                } else {
                    callback();
                }
            }
            return true;
        },
        
/**
 * Gets all stored results, or all stored reults for user (if given).
 * @param {String} user User ID for the currently logged in user. Optional.
 * @return {Object} Object containing the states
 */
        getAllResults: function(user, callback) {
            var res = this.internal.dispatchToPlugin("getAllResults", user, callback);
            if (!res) {
                var allResults ;
                if (user) {
                    if (user in this.results) {
                        allResults = this.results[user];
                    }
                } else {
                    allResults = this.results;
                }
                callback(allResults);
            }
            return true;
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
            if (!pluginLogin) console.log("No plugins have defined a login method, or no connection to perform log in");
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
        loginToken: function(service, token) {l
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
 * Object that keeps the functions that are not part of the outward facing API of mlab.
 */
        internal: {
    /* Pointer to main mlab object */
            parent: null,

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
                for (var pluginName in this.parent.plugins) {
                    var plugin = this.parent.plugins[pluginName];
                    if (name in plugin && typeof plugin[name] == "function") {
                        opDone = plugin[name].apply(plugin, args);
//TODO: support more than one... 
//We only support ONE plugin implementing any specific function at the time, so break off here.
                        if (typeof opDone != "undefined") return opDone;
                    }
                }
                return false;
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
                for (user in this.parent.states) {
                    window.localStorage.setItem("state-" + user, JSON.stringify(this.parent.states[user]));
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
                this.parent.states = states;
            },

/* 
 * Internal function that stores the results using localStorage 
 */
            storeResults: function() {
                for (user in this.parent.results) {
                    for (name in this.parent.results[user]) {
                        // Using the & character to combine quiz name and user name, as we assume that it is not allowed in either
                        window.localStorage.setItem("result-" + user + "&" + name, JSON.stringify(this.parent.results[user][name]));
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
                this.parent.results = results;
            },

/* 
 * Internal function that stores the configs using localStorage 
 */
            storeConfigs: function() {
                for (user in this.parent.configs) {
                    window.localStorage.setItem("config-" + user, JSON.stringify(this.parent.configs[user]));
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
                this.parent.configs = configs;
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
        },

        
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
        
        initialise: function (app_current_page, app_max_pages) {
            self.current_page = app_current_page;
            self.max_pages = app_max_pages;
        },
/**
 * current = page that is currently displayed
 * move_to can be index, first, last, next, previous or a number
 * @param {type} page
 * @returns {undefined}
 */
        pageDisplay: function (current, move_to) {
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
                    filename = ("000" + self.max_pages).slice(-3) + ".html";
                    new_location = self.max_pages;
                    break;

                case "next" :
                    if (current >= self.max_pages) {
                        return current;
                    }
                    current++;
                    filename = ("000" + current).slice(-3) + ".html";
                    new_location = current;
                    break;

                case "previous" :
                    if (current == 0 || current == "index") {
                        return current;
                    }
                    if (current == 1) {
                        filename = "000.html";
                        new_location = 0;
                    } else {
                        current--;
                        if (current < 0) {
                            current = 0;
                        }
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
                    if (move_to < 0 || move_to > self.max_pages) {
                        return current;
                    }
                    if (move_to == 0) {
                        filename = "000.html";
                    } else {
                        filename = ("000" + move_to).slice(-3) + ".html";
                    }
                    new_location = move_to;
                    break;
            }

//have calculated the file name, now we need to try to load it
            $.mobile.pageContainer.pagecontainer("change", filename, { transition: "flip" });
            //$.mobile.pageContainer.pagecontainer("load", "/Palestinian/epg47/show");

            return new_location;
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
            if ($("." + elementClass).hasClass('mlab_large_text')) {
                $("." + elementClass).removeClass('mlab_large_text');
            } else {
                $("." + elementClass).addClass('mlab_large_text'); 
            }
        },
        
        /**
        * This function toggles the text and background color of an html element
         * @param {string} elementId The id of the HTML element where the color of the background and the text will be toggled
         * @param {string} defaultBackgroundColor The default background color of the HTML element
         * @param {string} defaultTextColor The default text color of the HTML element
         * @param {string} toggleBackgroundColor The background color used to toggle with
         * @param {string} toggleTextColor The text color used to toggle with
        */
        pageColorToggle: function (elementIdBackgroundColor, classIdTextColor) {
            //TODO Set the attributes on classes instead of setting css directly
            if ($("#" + elementIdBackgroundColor).hasClass('mlab_color_toggle')) {
                $("#" + elementIdBackgroundColor).removeClass('mlab_color_toggle');
                $("." + classIdTextColor).removeClass('mlab_color_toggle');
            } else {
                $("#" + elementIdBackgroundColor).addClass('mlab_color_toggle'); 
                $("." + classIdTextColor).addClass('mlab_color_toggle');
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