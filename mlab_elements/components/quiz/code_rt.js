/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.domRoot = $(el);
    self.user = self.api.getDeviceId(); // TODO: Request user name and store it
    self.settings = self.api.getVariable(this.domRoot, "settings");
    if (typeof self.settings == "undefined") {
        self.settings = {"allow_check":true,"allow_check_on_page":true,"display_correct":true,"lock_checked":true,"submit":false};
    }
    
    $(el).append("<button data-mlab-ct-quiz-role='move_previous' style='display: none;'>Previous</button><button data-mlab-ct-quiz-role='move_next'>Next</button>");

    var disp = (self.settings.allow_check_on_page ? "" : "style='display: none'");
    $(el).append("<div data-mlab-ct-quiz-role='check_and_submit' style='display: none;'><h1>You can now check and submit your answers</div>");
    $(el).append("<button data-mlab-ct-quiz-role='check' " + disp + ">Check answers</button>");

    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_next']", function() { self.move(1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_previous']", function() { self.move(-1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='check']", function() { self.checkAnswers(self.domRoot.find(".mlab_ct_quiz_currentpage")); });
    
    $(el).find("div").first().show().addClass("mlab_ct_quiz_currentpage");

    self.api.db.prepareDataObjects([self.api.getAppUid(), self.user, this.domRoot.attr("id")]);
    
//we only set up the storage plugin if they want to "submit" the answers
    if (self.settings.submit) {
        self.api.db.setupStoragePlugin(el);
    }
    
    self.loadAnswers();
    //TODO 
    $(".ui-btn.ui-icon-carat-d.ui-btn-icon-right.ui-corner-all.ui-shadow.ui-li-has-count").removeClass("ui-btn")
/*    self.domRoot.on("change", ":input", function() { return self.storeAnswers($(this)); });
    self.domRoot.on("change", "." + self.classes.questionLocked + " :input", function() { return false; });
    self.domRoot.on("click", "." + this.classes.checkAnswers, function() { self.checkAnswers(); }); 

    */
    
};

//navigates from page to page and stores replies every time change page
//checks if required fields are filled in, then saves everything, if check per page is allowed, runs check
this.move = function(direction) {
    
    this.saveAnswers(this.domRoot.find(".mlab_ct_quiz_currentpage"));
            
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
    this.api.db.getAllResults(this.user, this.domRoot.attr("id"), this.processAnswers);
};

//this function is used for callbacks from the API database functions, it will contain a list of data which is {id_of_question: selected_answers}
//selected_answers can be a string (for text boxes), or an array of values for select, radio or check boxes.
this.processAnswers = function (data) {
    debugger;
    var q, q_type;
    for (id in data) {
        q = $("#" + id);
        q_type = q.data("mlab-dt-quiz-questiontype");
        
        switch (q_type) {
            case "checkbox": 
                q.find('input').prop("checked", false);
                q.find('input').filter('[value=' + data[id].join('], [value=') + ']').prop("checked", true);
                break;

            case "radio": 
                q.find('input').prop("checked", false);
                console.log( typeof data );
                q.find('input[value="' + data[id] + '"]').prop("checked", true);
                break;

            case "select": 
            case "multiselect": 
                var i = 1;
                q.find('select > option').prop("selected", false);
                q.find('select > option').filter('[value=' + data[id].join('], [value=') + ']').prop("selected", true);
                break;

            case "text": 
                q.find('input').val(data[id])
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
    $(start).find("input[type='radio'], input[type='checkbox']").parent().css("background-color", "");
    $(start).find("option").css("background-color", "");
    $(start).find("input[type='text']").css("background-color", "");


    $(start).find("input[data-mlab-cp-quiz-alternative='correct']").filter(":checked").parent().css("background-color", "orange");
    $(start).find("option[data-mlab-cp-quiz-alternative='correct']").filter(":selected").css("background-color", "orange");
    $(start).find(":text").each( function () {
        if ($(this).attr("data-mlab-cp-quiz-textvalue").toLowerCase().trim() == $(this).val().toLowerCase().trim()) {
            $(this).css("background-color", "orange");
        }
    });
    
};

/**
 * To save the answers we need to get app_id. user_id, comp_id and for key we use id of question.
 * So we loop through each div with data-mlab-dt-quiz-role=question, get the type and the retrieve the value
 * @param {type} page
 * @returns {undefined}
 */
this.saveAnswers = function(page) {
    var user_id = this.user;
    var comp_id = this.domRoot.attr("id");
    var response;
    var self = this;
    
    $(page).children("[data-mlab-dt-quiz-role='question']").each(function() {
        q_type = $(this).data("mlab-dt-quiz-questiontype");
        q_id = $(this).attr("id");
        
        switch (q_type) {
            case "checkbox": 
                response = [];
                $(this).find("input:checked").each(function() {
                    response.push($(this).val());
                });
                break;
                
            case "radio": 
                response = $(this).find("input[name='" + q_id + "']:checked").val();
                break;

            case "multiselect": 
                response = [];
                $(this).find('select > option:selected').each(function() {
                    response.push($(this).val());
                });
                break;
                
            case "select": 
                response = $(this).find("select").val();
                break;

            case "text": 
                response = $(this).find('input').val()
                break;
        }; //end switch question type
        
        if (typeof response == "undefined") {
            response = "";
        }
        self.api.db.setResult(user_id, comp_id, q_id, response);
    }); //end quiz on pages loop
};

this.resultRetrieved = function(data) {
    console.log("cb");
    console.log(data);
};