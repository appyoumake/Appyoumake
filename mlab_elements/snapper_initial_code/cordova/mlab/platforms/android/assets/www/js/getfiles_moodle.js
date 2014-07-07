/* 
 * All component code should live entirely within its own object, to avoid
 * various components/plugins defining the same global variables, and to keep memory usage
 * to a minimum.
 */
 
/*
 * Component that fetches a list of files from Moodle. Exactly which files to get is not clear from
 * the specification.
 */
var getfiles_moodle = {
    version: 0.1,
    /* Init state, to avoid component being initialized more than once */
    initialized: false,
    /* Stores the runtime/design mode, for convenience */
    mode: null,
    /* Path to the webservice */
    moodleRestEndpoint: "/webservice/rest/server.php",
    /* Context IDs, as defined by Moodle */
    file_context_ids: {
        system: 1,
        frontpage: 2,
        misc: 3,
    },

    /*
     * Initialization function for the component. Decides whether we are in runtime/design mode and
     * acts accordingly.
     */
    init: function() {
        log("init");
        if (this.initialized) return;
        this.showHide();
        this.mode = mlab.getName();
        if (this.mode=="runtime") {
            this.run();
        }
    },
    
    /*
     * Kicks off the runtime functionality. Loads any plugins needed and logs in to Moodle.
     */
    run: function() {
        var self = this;
        mlab.loadPlugin("moodle");
        $(document).on("pluginloaded", function(e, pluginName) {
            if (self.initialized) return;
            if (pluginName=="moodle") {
                mlab.loginRemotely("core_files"); // plugin_moodle will ask for username/password if needed
                self.initialized = true;
            }
        });
    },
    
    /*
     * Component init function when page is opened. Waits for login and starts loading files.
     */
    pageInit: function() {
        log("files pageInit");
        var self = this;
        self.showHide();
        // We don't know if login is successful yet.
        if (mlab.loginToken("core_files")) self.getFiles();
        else {
            $(document).on("moodleloginsuccess", function(e, service, username) {
                if (service=="core_files") self.getFiles();
            });
        }
    },
    
    /*
     * Fetches a list of files from Moodle. Traverses the resulting XML and inserts them into the list.
     */
    getFiles: function() {
        var self = this;
        $("ul.file-list.runtimemode li.placeholder").text("Fetching files...");
        
        var url = mlab.plugins["moodle"].moodleURL + self.moodleRestEndpoint;
        var params = {
            "wstoken": mlab.loginToken(),
            "wsfunction": "core_files_get_files",
            "contextid": 24, //self.file_context_ids["frontpage"], //?
            "component": "user",
            "filearea": "private", //?
            "itemid": 0, //?
            "filepath": "", //?
            "filename": "" //?
        };
        $.get(url, params, function(data, result){
            var filesRoot = $(data.documentElement).find("> SINGLE > KEY[name='files']");
            filesRoot.find("> MULTIPLE > SINGLE").each(function() {
                self.addFile(self.fileXMLToOb($(this)));
            });
        }).error(function(data) {
            log(data);
        });;
    },
    
    /*
     * Converts a file XML node, as received from Moodle, to a javascript object.
     * @param {jQuery} file XML node representing the file, consists of KEY items with a "name"
     * attribute, and a VALUE subelement.
     * @return {object}
     */
    fileXMLToOb: function(file) {
        var fileOb = {};
        file.find("KEY").each(function() {
            var key = $(this);
            var name = key.attr("name");
            var value = key.find("VALUE");
            var val;
            if (value.attr("null")=="null") val = null;
            else val = value.text();
            fileOb[name] = val;
        });
        return fileOb;
    },
    
    /*
     * Adds file to the list.
     * @param {object} file Object representing the file received from Moodle
     */
    addFile: function(file) {
        var fileList = $("ul.file-list.runtimemode");
        fileList.find(".placeholder").hide();
        var fileOb = $('<li class="file"><a href=""></a></li>');
        fileOb.find("a").attr("href", file.url).text(file.filename);
        fileList.append(fileOb);
    },

    /*
     * Show/hide HTML elements in page, according to the app's current mode.
     */
    showHide: function() {
        if (this.mode=="runtime") {
            $(".getfiles-moodle .runtimemode").show();
            $(".getfiles-moodle .designmode").hide();
        }
        else {
            $(".getfiles-moodle .designmode").show();
            $(".getfiles-moodle .runtimemode").hide();
        }
    },
};

/* Register the component's init functions to be run when Mlab/page is ready */
initialiseApp.push(
    function() {
        getfiles_moodle.init();
    }
);
initialiseComponent.push(
    function() {
        getfiles_moodle.pageInit();
    }
);