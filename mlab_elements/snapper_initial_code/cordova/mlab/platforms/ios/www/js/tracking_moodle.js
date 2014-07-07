/*
 * Object holding all the functionality specific to the tracking component.
 */
var tracking_moodle = {
    version: 0.1,
    /* Init state, to avoid component being initialized more than once */
    initialized: false,
    /* Stores the runtime/design mode, for convenience */
    mode: null,
    /* Current user's username */
    username: null,
    
    /*
     * Initialization function for the component. Decides whether we are in runtime/design mode and
     * acts accordingly.
     */
    init: function() {
        if (this.initialized) return;
        this.showHide();
        this.mode = mlab.getName();
        if (this.mode=="runtime") {
            this.run();
        }
    },
    
    /*
     * Starts the runtime functionality. Loads any plugins needed and logs in to Moodle.
     */
    run: function() {
        var self = this;
        self.showHide();
        mlab.loadPlugin("moodle");
        $(document).on("pluginloaded", function(e, pluginName) {
            if (self.initialized) return;
            if (pluginName=="moodle") {
                var token = mlab.loginRemotely("local_tcapi"); // plugin_moodle will ask for username/password if needed
                if (token) self.runPage();
                self.initialized = true;
            }
            
        });
        // Listen for change in hash, as this represents new "page" in multipage components
        $(window).on("hashchange", function() {
            self.pageInit();
        });
    },
    
    /*
     * Sets up functionality to be run on every page. Basically sets up various event listeners.
     */
    pageInit: function() {
        var self = this;
        self.showHide();
        // We don't know if login is successful yet.
        if (mlab.loginToken("local_tcapi")) {
            self.username = window.sessionStorage.getItem("username");
        }
        else {
            $(document).on("moodleloginsuccess", function(e, service, username) {
                if (service=="local_tcapi") {
                    self.username = username;
                    window.sessionStorage.setItem("username", username);
                    self.runPage();
                }
            });
        }
        $("#tracking-bookmarked").on("click", function() { self.unBookmarkPage(); });
        $("#tracking-not-bookmarked").on("click", function() { self.bookmarkPage(); });
    },
    
    /*
     * Runs on every page load, after plugin is loaded and we now we are correctly logged in.
     */
    runPage: function() {
        var self = this;
        // Get path for page
        var thisPageID = self.getPageID();
        // Check if we should redirect
        var relocating = self.handleCurrentPage(thisPageID);
        if (relocating) return;
        // Store this page as the current one
        mlab.setState(self.username, "current-page", thisPageID);

        // Get array of read pages and check if this page is already read
        var readPages = mlab.getState(self.username, "read-pages");
        self.handleReadPages(thisPageID, readPages);
        
        // Get bookmarks and check if this page is bookmarked
        var bookmarks = mlab.getState(self.username, "bookmarks");
        self.handleBookmarks(thisPageID, bookmarks);

    },

    /*
     * Redirects to the previously stored current page. Only does this on first page load in app.
     * @param {String} thisPageID ID/path of the page we are currently viewing
     * @return {boolean} True if we have started a redirect, false otherwise
     */
    handleCurrentPage: function(thisPageID) {
        var self = this;
        var relocateState = false;
        var currentPage = mlab.getState(self.username, "current-page");
        var currentPageLoaded = window.sessionStorage.getItem("current-page-loaded");
        if (currentPageLoaded) return relocateState;
        if (!currentPageLoaded && currentPage && thisPageID!=currentPage) {
            try {
                document.location = currentPage;
                relocateState = true;
            }
            catch (e) {
                log("Failed to redirect, probably due to change in app's file structure. Never mind.");
            }
        }
        // Only do this once per session
        window.sessionStorage.setItem("current-page-loaded", true);
        return relocateState;
    },

    /*
     * Hides/shows the marker for having previously read this page, according to the values stored.
     * @param {String} thisPageID ID/path of current page.
     * @param {Array} readPages List of pages we have already read.
     */
    handleReadPages: function(thisPageID, readPages) {
        var self = this;
        readPages = readPages || [];
        var read = ($.inArray(thisPageID, readPages)>-1) ? true : false;
        // Add this page to array of read pages and store
        if (!read) readPages.push(thisPageID);
        mlab.setState(self.username, "read-pages", readPages);
        if (read) $("#tracking-pageread").show();
    },

    /*
     * Hides/shows the bookmark buttons, based on whether or not this page has been bookmarked or not.
     * @param {String} thisPageID ID/path of current page
     * @param {Array} bookmarks List of bookmarks
     */
    handleBookmarks: function(thisPageID, bookmarks) {
        bookmarks = bookmarks || [];
        var bookmarked = false;
        if ($.inArray(thisPageID, bookmarks)>-1) bookmarked = true;
        
        // Show hide bookmark buttons according to state of page
        if (bookmarked) {
            $("#tracking-bookmarked").show();
            $("#tracking-not-bookmarked").hide();
        }
        else {
            $("#tracking-bookmarked").hide();
            $("#tracking-not-bookmarked").show();
        }
    },

    /*
     * Adds the current page to the list of bookmarks, and stores the list.
     */
    bookmarkPage: function() {
        var self = this;
        var thisPageID = self.getPageID();
        var bookmarks = mlab.getState(self.username, "bookmarks") || [];
        if ($.inArray(thisPageID, bookmarks)==-1) {
            bookmarks.push(thisPageID);
            mlab.setState(self.username, "bookmarks", bookmarks);
            self.handleBookmarks(thisPageID, bookmarks);
        }
    },

    /*
     * Removes the current page from the list of bookmarks, and stores the list.
     */
    unBookmarkPage: function() {
        var self = this;
        var thisPageID = self.getPageID();
        var bookmarks = mlab.getState(self.username, "bookmarks") || [];
        var bookmarkIndex = $.inArray(thisPageID, bookmarks);
        if (bookmarkIndex>-1) {
            bookmarks.splice(bookmarkIndex, 1);
            mlab.setState(self.username, "bookmarks", bookmarks);
            self.handleBookmarks(thisPageID, bookmarks);
        }
    },

    /*
     * Shows/hides elements in the component, based on whether we are in runtime or design mode.
     */
    showHide: function() {
        if (this.mode=="runtime") {
            $(".tracking-moodle .runtimemode").show();
            $(".tracking-moodle .designmode").hide();
        }
        else {
            $(".tracking-moodle .designmode").show();
            $(".tracking-moodle .runtimemode").hide();
        }
    },
    
    /*
     * Returns the path of the html file we are currently viewing. Must be used with the (unique)
     * app name when stored remotely, to avoid collisions.
     * @return {string} The path of the current page
     */
    getPageID: function() {
        var path = ''+window.location;
        var cutoff = "/www/";
        path = path.substring(path.indexOf(cutoff) + cutoff.length);
        return path;
    }
};

/* Register the component's init functions to be run when Mlab/page is ready */
initialiseApp.push(
    function() {
        tracking_moodle.init();
    }
);
initialiseComponent.push(
    function() {
        tracking_moodle.pageInit();
    }
);