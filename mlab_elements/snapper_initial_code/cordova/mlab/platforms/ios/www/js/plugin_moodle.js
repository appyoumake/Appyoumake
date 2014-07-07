/*
 * Plugin object for Moodle integration.
 *
 * All plugins must be an object, and have the following properties:
 * * name - the name of the plugin. Must be the same as the variable name.
 * * version - version number
 *
 * And the following functions:
 * * init(callback) - initializes the plugin. Fires the "pluginloaded" event when finished.
 */
var moodle = {
    name: "moodle",
    version: 0.1,
    moodleURL: "https://moodle.snapper.no", // Base URL to Moodle (must be made configurable)
    moodleTinCanEndpoint: "/local/tcapi/endpoint.php/",

    tinCan: null,
    tinCanVerbs: {},
    tinCanActivities: {},
    
    loginInProgress: false,
    loginServices: [],
    
    /**************************************
     * Functions to initialize the plugin *
     **************************************/
    
    /*
     * Initialization function.
     * @param {Mlab} mlab Main Mlab object
     */
    init: function(callback) {
        var self = this;
        // General event handler to close popups
        $("body").on("click", ".popup .close-popup", function() {
            $(this).parents(".popup").remove();
            return false;
        });
        $.getScript("./js/tincan.js", function() {
            self.setupTinCan();
            if (callback) callback();
        });
        
        // CSS for various things added dynamically to the app
        $("head").append('<style type="text/css">'
        +'.popup { position: absolute; top: 30%; left: 5%; right: 5%; height: 25%; min-height: 150px; background-color: white; border: 1px solid black; padding: 5%; }'
        +'.popup, .popup * { box-sizing: border-box; }'
        +'.popup .form-line { float: left; clear: both; width: 100%; margin-bottom: 10px; }'
        +'.popup label { float: left; width: 45%; padding-right: 5%; padding-top: 0.5em; }'
        +'.popup input { float: left; width: 50%; }'
        +'</style>');
    },

    /*
     * Sets up instance of the Tin Can library, with an LRS instance. Also predefines the Actor and a number 
     * of Verbs and Activities.
     */
    setupTinCan: function() {
        var self = this;
        self.tinCan = new TinCan();
        //TinCan.enableDebug();
        self.tinCan.recordStores[0] = new TinCan.LRS({
            endpoint: self.moodleURL + self.moodleTinCanEndpoint, 
            version: "0.9", // I think we are using v.0.95
            auth: mlab.loginToken("local_tcapi")
        });
        self.tinCan.actor = new TinCan.Agent({
            name : "Mlab App", // Should include app name here
            mbox : "mailto:dummy@example.com"
        });
        self.createVerbs();
        self.createActivities()
    },

    /*
     * Sets up a set of Tin Can Verbs to be used later. See http://activitystrea.ms/specs/json/schema/activity-schema.html
     * to find more verb definitions to add here. You may also define your own verbs.
     *
     * NOTE: The TCAPI Moodle plugin only supports the verbs defined in the 0.9 version of  Tin Can.
     */
    createVerbs: function() {
        this.tinCanVerbs["read"] = new TinCan.Verb({
            id : "http://activitystrea.ms/specs/json/schema/activity-schema.html#read",
            display : {
                "en-US":"read", 
                "nb-NO":"leste"
            }
        });
        this.tinCanVerbs["favorite"] = new TinCan.Verb({
            id : "http://activitystrea.ms/specs/json/schema/activity-schema.html#favorite",
            display : {
                "en-US":"favorite", 
                "nb-NO":"favorittmarkerte"
            }
        });
        this.tinCanVerbs["unfavorite"] = new TinCan.Verb({
            id : "http://activitystrea.ms/specs/json/schema/activity-schema.html#unfavorite",
            display : {
                "en-US":"unfavorite", 
                "nb-NO":"fjernet favorittmarkering"
            }
        });
        this.tinCanVerbs["answered"] = new TinCan.Varb({
            id : "http://activitystrea.ms/specs/json/schema/activity-schema.html#answered",
            display : {
                "en-US":"answered", 
                "nb-NO":"besvarte"
            }
        });
    },

    /* 
     * These activities are just templates. The definition needs to be filled in before use 
     */
    createActivities: function() {
        this.tinCanActivities["page"] = new TinCan.Activity({
            id : "http://activitystrea.ms/specs/json/schema/activity-schema.html#page",
            definition : {}
        });
        this.tinCanActivities["question"] = new TinCan.Activity({
            id : "http://adlnet.gov/expapi/activities/question",
            definition : {}
        });
    },
    
    /*********************************************************************
     * Functions that are implementations of functions in the mlab class *
     *********************************************************************/

    /*
     * Log in to Moodle. Logging in is an asynchronous operation, inevitably. When log in request is
     * finished, we trigger either the event "moodleloginsuccess" or "moodleloginerror" (on the document object), 
     * depending on the outcome. Apps that use this functionality should therefore listen for these events 
     * (at least the "success" event, since we have to wait for this to continue interacting with Moodle).
     *
     * The event "moodleloginsuccess" passes the service and username as an extra parameter. The event 
     * "moodleloginerror" passes the service, username and error message as parameters.
     *
     * @param {String} username User name
     * @param {String} password Password
     * @return {boolean} True if we have requested login token, false if not.
     */
    loginRemotely: function(service, username, password) {
        var self = this;
        if (mlab.online) {
            if (!service) {
                service = "moodle";
            }
            // If we are missing either username or password, prompt user
            if (!username || !password) {
                self.displayLoginForm(service, username);
                return false;
            }
            
            var loginUrl = self.moodleURL + "/login/token.php";
            var params = {username: username, password: password, service: service};
            $.postJSON(loginUrl, params, function(data) {
                if ("token" in data) {
                    mlab.loginToken(service, data["token"]);
                    self.tinCan.actor = new TinCan.Agent({
                        name : username,
                        mbox : username
                    });
                    $(document).trigger("moodleloginsuccess", [service, username]);
                }
                else if ("error" in data) {
                    $(document).trigger("moodleloginerror", [service, username, data["error"]]);
                }
                else {
                    $(document).trigger("moodleloginerror", [service, username, "Unexpected error when logging in to Moodle"]);
                }
            });
            $(document).on("moodleloginerror", function(e, service, username, errorMessage) {
                // If something went wrong, present the login dialog
                log(errorMessage);
                self.displayLoginForm(service, username);
            });
            return true;
        }
        else {
            log("No internet connection. Can't log in");
            // Should display an error message
            self.displayMessage("No internet connection. Try again later.")
            return false;
        }
    },
    
    /*
     * Log off Moodle.
     * @return {boolean} Always true, since this is essentially a local operation.
     */
    logoffRemotely: function(service) {
        // Haven't found a way to end the Moodle session remotely. However, simply deleting the token
        // will effectively log the user off.
        var self = this;
/*
        var logoutUrl = this.moodleURL + "/login/logout.php?wstoken=" + mlab.loginToken(service);
        var params = {}; //wstoken: mlab.loginToken(service)};
        log(logoutUrl);
        log(params);
        $.postJSON(logoutUrl, params, function() {
            log("Logged out");
            $(document).trigger("moodlelogoutsuccess");
        });
*/
        mlab.loginToken(service, false);
        return true;
    },
    
    /*
     * Store state in Moodle.
     * @param {String} user User name
     * @param {String} key Key for the state
     * @param {any} value The value to store. Must be JSON serializable.
     */
    setState: function(user, key, value, activity) {
        if (!mlab.online) return;
        var self = this;
        if (!activity) activity = "page";
        var param = {};
        var activity = clone(self.tinCanActivities[activity], true);
        param["agent"] = new TinCan.Agent({
            name : user,
            mbox : user
        });
        param["activity"] = activity;
        param["callback"] = function(error, xhr) {
            if (error) log("Error setting state remotely");
        };
        // We must prefix the key with the app name, to ensure uniqueness in Moodle's database
        key = mlab.appName + "-" + key;
        self.tinCan.recordStores[0].auth = mlab.loginToken("local_tcapi");
        self.tinCan.setState(key, value, param);
        self.tinCan.recordStores[0].auth = "";
    },
    
    /* 
     * Get state from Moodle.
     * @param {String} user User name
     * @param {String} key Key of the state to fetch
     * @return {any} Value of state
     */
    getState: function(user, key, activity) {
        if (!mlab.online) return;
        var self = this;
        if (!activity) activity = "page";
        var param = {};
        var activity = clone(self.tinCanActivities[activity], true);
        param["agent"] = new TinCan.Agent({
            name : user,
            mbox : user
        });
        param["activity"] = activity;
        // We must prefix the key with the app name, to ensure uniqueness in Moodle's database
        key = mlab.appName + "-" + key;
        self.tinCan.recordStores[0].auth = mlab.loginToken("local_tcapi");
        var result = self.tinCan.getState(key, param);
        self.tinCan.recordStores[0].auth = "";
        var contents;
        try {
            log("Parsing contents");
            contents = result.state.contents;
            log(contents);
            contents = JSON.parse(contents);
        } 
        catch(e) {
            log("Error parsing value.contents in getState() for " + key + ": " + contents);
        }
        return contents;
    },
    
    /*
     * Store result in Moodle.
     * @param {String} user User name
     * @param {String} name Unique quiz name
     * @param {String} key Key for the question
     * @param {any} value The value to store. Must be JSON serializable.
     */
    setResult: function(user, name, key, value) {
        return this.setState(user, name + "&" + key, value, "question");
    },
    
    /* 
     * Get result from Moodle.
     * @param {String} user User name
     * @param {String} name Unique quiz name
     * @param {String} key Key of the question to fetch
     * @return {any} Value of state
     */
    getResult: function(user, name, key) {
        return this.getState(user, name + "&" + key, "question");
    },
    
    /************************************
     * Plugin specific helper functions *
     ************************************/
    
    /*
     * Displays login form popup, and handles submit of the login form. In Moodle, you have separate log in tokens
     * for every service. So we have to make separate calls for every service you want to log in to. However, if the 
     * login form is already displayed when another call to this function is made, we simply append the new service to the
     * list of services we log in to. In that way, the user only sees one login form, even if he is being logged into a
     * series of services.
     * @param {String} service The name of the service to log in to
     * @param {username} Optional. Username can be pre-filled from previous log in attempt.
     */
    displayLoginForm: function(service, username) {
        var self = this;
        if (self.loginInProgress) {
            self.loginServices.push(service);
            return;
        }
        self.loginServices = [service];
        self.loginInProgress = true;
        if (!username) username = "";
        var popUp = $('<div id="moodle-login-popup" class="popup"></div>');
        popUp.append(
            '<form id="moodle-login-form" action="" method="">'
            +'    <div class="form-line">'
            +'        <label for="moodle-username">Moodle user name</label>'
            +'        <input id="moodle-username" type="text" name="username"/>'
            +'    </div>'
            +'    <div class="form-line">'
            +'        <label for="moodle-password">Password</label>'
            +'        <input id="moodle-password" type="password" name="password"/>'
            +'    </div>'
            +'    <div class="form-line buttons">'
            +'        <input type="submit" name="login" value="Log in"/>'
            +'    </div>'
            +'</form>'
        );
        $("body").append(popUp);
        $("input#moodle-username").val(username);
        $("form#moodle-login-form").on("submit", function() {
            var form = $(this);
            var username = form.find("input#moodle-username").val();
            var password = form.find("input#moodle-password").val();
            form.parent("div#moodle-login-popup").remove();
            for (var i=0, ii=self.loginServices.length; i<ii; i++) self.loginRemotely(self.loginServices[i], username, password);
            self.loginInProgress = false;
            return false;
        });
    },
    
    /*
     * Displays a message pop up in the app.
     * @param {String} message Message to display
     */
    displayMessage: function(message) {
        var popUp = $('<div id="message" class="popup"></div>');
        popUp.push('<div class="message-text"></div><button type="button" class="close-popup">OK, close this</button>');
        popUp.find(".message-test").text(message);
        $("body").append(popUp);
    },
    
    buildStatement(verb, activity, )
    
    /*
     * Wrapper that sends statement to Moodle.
     * @param {TinCan.Statement} statement The statement object, built with the TinCan library classes.
     * @param {Function} callback Callback function, to be called then the statement has been sent.
     */
    sendStatement: function(statement, callback) {
        var self = this;
        self.tinCan.recordStores[0].auth = mlab.loginToken("local_tcapi");
        self.tinCan.sendStatement(statement, callback);
        self.tinCan.recordStores[0].auth = "";
    },
    
    testTCAPI: function() {
        var self = this;
        var activity = clone(self.tinCanActivities["page"], true);
        activity.definition = new TinCan.ActivityDefinition({
            name : {
                "en-US": "A page",
                "nb-NO": "En side"
            },
            description : {
                "en-US": "A page",
                "nb-NO": "En side"
            }
        });
        var statement = new TinCan.Statement({
            actor : self.tinCan.actor,
            verb : self.tinCanVerbs["read"],
            target : activity
        },false);
        //log(statement.originalJSON);
        self.sendStatement(statement, function() { log("Statement sent"); });

    }
    

};