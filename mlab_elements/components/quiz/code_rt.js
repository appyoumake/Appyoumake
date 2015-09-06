/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.domRoot = $(el);

    $(el).append("<button data-mlab-ct-quiz-role='move_previous' style='display: none;'>Previous</button><button data-mlab-ct-quiz-role='move_next'>Next</button>");
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_next']", function() { self.move(1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_previous']", function() { self.move(-1); });
    //self.addLastPage();
    $(el).find("div").first().show().addClass("mlab_ct_quiz_currentpage");

    self.api.db.setupStoragePlugin(el);
    self.user = self.api.getDeviceId(); // TODO: Request user name and store it
    self.variables = self.api.getAllVariables(this.domRoot);
    
/*    self.domRoot.on("change", ":input", function() { return self.storeAnswers($(this)); });
    self.domRoot.on("change", "." + self.classes.questionLocked + " :input", function() { return false; });
    self.domRoot.on("click", "." + this.classes.checkAnswers, function() { self.checkAnswers(); }); 

    
    self.populateStoredAnswers();*/
};

//navigates from page to page and stores replies every time change page
//checks if required fields are filled in, then saves everything, if check per page is allowed, runs check
this.move = function(direction) {
    
    this.submitResults(this.domRoot.find(".mlab_ct_quiz_currentpage"));
            
    if (direction == 1) {
        var next = this.domRoot.find(".mlab_ct_quiz_currentpage").next().length;
        if (next > 0) {
            this.domRoot.find(".mlab_ct_quiz_currentpage").removeClass("mlab_ct_quiz_currentpage").hide().next().show().addClass("mlab_ct_quiz_currentpage");
            this.domRoot.find("[data-mlab-ct-quiz-role='move_previous']").show();
        } else {
            return;
        }
        if (next == 1) {
            this.domRoot.find("[data-mlab-ct-quiz-role='move_next']").hide();
        }
    } else if (direction == -1) {
        var next = this.domRoot.find(".mlab_ct_quiz_currentpage").prev().length;
        if (next > 0) {
            this.domRoot.find(".mlab_ct_quiz_currentpage").removeClass("mlab_ct_quiz_currentpage").hide().prev().show().addClass("mlab_ct_quiz_currentpage");
            this.domRoot.find("[data-mlab-ct-quiz-role='move_next']").show();
        } else {
            return;
        }
        if (next == 1) {
            this.domRoot.find("[data-mlab-ct-quiz-role='move_previous']").hide();
        }
    }
}

//
this.checkAnswers = function(page) {
    if (typeof page == "undefined") {
        var start = this.domRoot;
    } else {
        var start = page;
    }
};

this.submitResults = function(page) {
    
}
