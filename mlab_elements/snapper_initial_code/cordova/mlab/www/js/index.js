var app = {
    output: null,
    mlab: null,
    appName: "TestApp",
    
    initialize: function() {
        $(document).on("deviceready", function() { app.setup(); });
        $(document).on("ready", function() { 
            log("dom ready"); 
            if (!window.device) {
                log("launch");
                app.setup();
            }
        });

    },

    setup: function() {
        this.output = $("#output");
        this.output.text("");
        this.out("Initializing Mlab.js");
        //this.mlab = new mlab();
        this.out("Initialized");
        this.out("Setting state");
        //this.mlab.setState(this.appName, "user", "teststate", "ento");
        this.out("Getting state");
        //var state = this.mlab.getState(this.appName, "user", "teststate");
        //this.out(state);
        this.out("Test done");
        
    },
    
    out: function(s, nobr) {
        this.output.append(s);
        if (!nobr) this.output.append("<br/>");
    }
};
