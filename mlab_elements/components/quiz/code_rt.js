/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.domRoot = $(el);

    self.addLastPage("div");
    $(el).append("<button data-mlab-ct-quiz-role='check' style='display: none;'>Check answers</button>");
    $(el).append("<button data-mlab-ct-quiz-role='move_previous' style='display: none;'>Previous</button><button data-mlab-ct-quiz-role='move_next'>Next</button>");

    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_next']", function() { self.move(1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_previous']", function() { self.move(-1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='check']", function() { self.checkAnswers(self.domRoot.find(".mlab_ct_quiz_currentpage")); });
    
    $(el).find("div").first().show().addClass("mlab_ct_quiz_currentpage");

    self.user = self.api.getDeviceId(); // TODO: Request user name and store it
    self.settings = self.api.getAllVariables(this.domRoot);

    self.api.db.prepareDataObjects([self.api.getAppUid(), this.domRoot.attr("id"), self.user]);
    
//we only set up the storage plugin if they want to "submit" the answers
    if (self.settings.submit) {
        self.api.db.setupStoragePlugin(el);
    }
    
    self.loadAnswers();
    
/*    self.domRoot.on("change", ":input", function() { return self.storeAnswers($(this)); });
    self.domRoot.on("change", "." + self.classes.questionLocked + " :input", function() { return false; });
    self.domRoot.on("click", "." + this.classes.checkAnswers, function() { self.checkAnswers(); }); 

    */
    
};

//navigates from page to page and stores replies every time change page
//checks if required fields are filled in, then saves everything, if check per page is allowed, runs check
this.move = function(direction) {
    
    this.updateAnswers(this.domRoot.find(".mlab_ct_quiz_currentpage"));
            
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
    
};

this.loadAnswers = function() {
    this.api.db.getAllResults(this.user, self.domRoot.attr("id"), this.processAnswers);
};

//this function is used for callbacks from the API database functions, it will contain a list of data which is {id_of_question: selected_answers}
//selected_answers can be a string (for text boxes), or an array of values for select, radio or check boxes.
this.processAnswers = function (data) {
    var q, q_type;
    for (id in data) {
        q = $("#" + id);
        q_type = q.data("mlab-dt-quiz-questiontype");
        
        switch (q_type) {
            case "checkbox": 
            case "radio": 
                $(q).find('input').prop("checked", false);
                $(q).find('input').filter('[value=' + data[id].join('], [value=') + ']').prop("checked", false);
                break;

            case "select": 
            case "multiselect": 
                var i = 1;
                $(q).find('select > option').prop("selected", false);
                $(q).find('select > option').filter('[value=' + data[id].join('], [value=') + ']').prop("selected", true);
                break;

            case "text": 
                $(q).find('input').val(data[id])
                break;
        }
    }
}

//the answer check utilises the "data-mlab-cp-quiz-alternative=correct" we use for checkboxes, radio boxes and options to 
this.checkAnswers = function(page) {
    if (typeof page == "undefined") {
        var start = this.domRoot;
    } else {
        var start = page;
    }

//first erase all previous markings
    $(start).find("input").css("background-color", "");
    $(start).find("option").css("background-color", "");


    $(start).find("input [data-mlab-cp-quiz-alternative='correct']").filter(":checked").css("background-color", "orange");
    $(start).find("option [data-mlab-cp-quiz-alternative='correct']").filter(":selected").css("background-color", "orange");
    $(start).find(":text").each( function () {
        if ($(this).attr("data-mlab-cp-quiz-textvalue") == $(this).val()) {
            $(this).css("background-color", "orange");
        }
    });
    
};

this.updateAnswers = function(page) {
    
};

this.resultRetrieved = function(data) {
    console.log("cb");
    console.log(data);
};