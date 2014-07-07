var app = {
    output: null,
    appName: "TestApp",
    user: "iamauser",
    initialize: function() {
/*         $(document).on("deviceready", function() { log("deviceready"); app.setup(); }); */
/*
        $(document).on("ready", function() { 
            log("dom ready"); 
            if (!window.device) {
                log("launch");
                app.setup();
            }
        });
*/

    },

    setup: function() {
        //window.localStorage.clear();
        this.output = $("#output");
        this.output.text("");
        this.out("Initializing Mlab.js");
        mlab = new mlab();
        this.out("Initialized");
    },
    
    test: function() {
        var self = this;
        this.output = $("#output");
        this.output.text("");
        this.out("Initialized");
        this.out("Loading Moodle plugin");
        mlab.loadPlugin("moodle");
        this.out("Setting state");
        mlab.setState(this.user, "teststate3", "ento");
        this.out("Getting state");
        var state = mlab.getState(this.user, "teststate3");
        this.out('"' + state + '"');
        this.out("Getting all states");
        var states = mlab.getAllStates(this.user);
        for (key in states) this.out(key + ": " + states[key]);
        
        this.out("Setting config")
        mlab.setConfig(this.user, "config2", "en");
        this.out("Getting config");
        var state = mlab.getConfig(this.user, "config1");
        this.out('"' + state + '"');
        this.out("Getting all configs");
        var configs = mlab.getAllConfig(this.user);
        for (key in configs) this.out(key + ": " + configs[key]);
        $(document).on("pluginloaded", function(name) {
            log(self.name);
            self.out("Logging in user");
            mlab.loginRemotely("local_tcapi", "testuser", "1Godtpa$$0rd");
        });
        $(document).on("moodleloginsuccess", function() {
            self.out("Logged in successfully");
            log(mlab.plugins["moodle"].moodleURL);
            mlab.plugins["moodle"]["testTCAPI"]();
            //self.out("Logging out");
            //mlab.logoffRemotely();
        });
        $(document).on("moodlelogoutsuccess", function() {
            self.out("Logged out");
        });
        //this.out("Test done");
    },
    
    out: function(s, nobr) {
        this.output.append(s);
        if (!nobr) this.output.append("<br/>");
    }
};

//function initialiseApp() { app.test(); }