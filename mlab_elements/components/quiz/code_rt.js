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
    
    var disp = (self.settings.allow_check_on_page ? "" : "style='display: none'");
    $(el).append("<div data-mlab-ct-quiz-role='check_and_submit' style='display: none;'><h1>You can now check and submit your answers</h1><div data-mlab-ct-quiz-role='display_results'></div><button data-mlab-ct-quiz-role='check_all' >Check answers</button></div>");
    $(el).append("<button data-mlab-ct-quiz-role='move_previous' style='display: none;'>Previous</button><button data-mlab-ct-quiz-role='move_next'>Next</button>");
    $(el).append("<button data-mlab-ct-quiz-role='check' " + disp + ">Check answers</button>");

    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_next']", function() { self.move(1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='move_previous']", function() { self.move(-1); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='check']", function() { self.checkPageAnswers(self.domRoot.find(".mlab_ct_quiz_currentpage")); });
    self.domRoot.on("click", "[data-mlab-ct-quiz-role='check_all']", function() { self.checkAllAnswers(); });
    
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

    */
    
};

//navigates from page to page and stores replies every time change page
//checks if required fields are filled in, then saves everything, if check per page is allowed, runs check
this.move = function(direction) {
    var q_div_curr = $(this.domRoot.find(".mlab_ct_quiz_currentpage"));
    var missing_fields = "";
    var self = this;
    var direction_text = {"-1": "prev", "1": "next"};
    debugger;
    
    if (direction == 1) {
//check if any questions are mandatory and if so, are they filled in
        q_div_curr.children("[data-mlab-dt-quiz-role='question']").each(function() {
            if ($(this).data("mlab-dt-quiz-mandatory") == true) {
                response = self.getResponse($(this));
                if ( (typeof response == "undefined") || (response.length == 0) ) {
                    missing_fields = missing_fields + $(this).find("[data-mlab-dt-quiz-subrole='question']").text() + "\n";
                }
            } 

        }); //end quiz on pages loop
    
//if there is one ore more fields that are not filled in then we need to alert user and bail
        if (missing_fields !== "") {
            alert("Required field(s) not filled in:\n" + missing_fields);
            return;
        }

        var direction_text = 'next';
        var moveto_pages = q_div_curr.nextAll('div');
        
    } else if (direction == -1) {
        var direction_text = 'previous';
        var moveto_pages = q_div_curr.prevAll('div');
        
    }
    
    this.saveAnswers(q_div_curr);
    
    if (moveto_pages.length > 0) {
        q_div_curr.removeClass("mlab_ct_quiz_currentpage").hide();
        $(moveto_pages[0]).show().addClass("mlab_ct_quiz_currentpage");
        this.domRoot.find("[data-mlab-ct-quiz-role='move_" + direction_text[(direction * -1).toString()] + "']").show();
        if (moveto_pages.length == 1) {
            this.domRoot.find("[data-mlab-ct-quiz-role='move_" + direction_text[direction.toString()] + "']").hide();
        }
    } else {
        return;
    }

    
    if (direction == 1 && moveto_pages.length == 1 && mlab.api.components['quiz'].settings.allow_check && !mlab.api.components['quiz'].settings.allow_check_on_page) {
        this.domRoot.find("[data-mlab-ct-quiz-role='check_all']").show();
    } else {
        this.domRoot.find("[data-mlab-ct-quiz-role='check_all']").hide();
    }
 
};

this.loadAnswers = function() {
    this.api.db.getAllResults(this.user, this.domRoot.attr("id"), this.processAnswers);
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
this.checkPageAnswers = function(page) {
    if (typeof page == "undefined") {
        return;
    }

//first erase all previous markings
    $(page).find("input[type='radio'], input[type='checkbox']").parent().css("background-color", "");
    $(page).find("option").css("background-color", "");
    $(page).find("input[type='text']").css("background-color", "");


    $(page).find("input[data-mlab-cp-quiz-alternative='correct']").filter(":checked").parent().css("background-color", "orange");
    $(page).find("option[data-mlab-cp-quiz-alternative='correct']").filter(":selected").css("background-color", "orange");
    $(page).find(":text").each( function () {
        if ($(this).attr("data-mlab-cp-quiz-textvalue").toLowerCase().trim() == $(this).val().toLowerCase().trim()) {
            $(this).css("background-color", "orange");
        }
    });
    
};

//here we check all answers for the end of the quiz, so we need to list page name, title of question and which answers are right or not
this.checkAllAnswers = function() {
    if (typeof page == "undefined") {
        return;
    }

    var pages = this.domRoot.find("div[data-mlab-dt-quiz-role='page']");
    var result_page = $(this.domRoot.find("div[data-mlab-dt-quiz-role='display_results']")[0]);
    result_page.empty();
    
    for (i in pages) {
        result_page.append($(pages[i]).find("h2").clone());
        
        $(pages[i]).children("[data-mlab-dt-quiz-role='question']").each(function() {
            result_page.append($(this).find("[data-mlab-dt-quiz-subrole='question']").clone());
            var q_type = $(this).data("mlab-dt-quiz-questiontype");
            switch (q_type) {
                case "checkbox": 
                    $(this).find("input").each( function() { 
                        if ( $(this).data("mlab-cp-quiz-alternative") == "correct" ) {
                            if ( $(this).prop("checked") ) {
                                result_page.append("<p class='mlab_ct_quiz_correct'>Corr " + $(this).find("[data-mlab-dt-quiz-subrole='question']").text() + "</p>");
                            } else {
                                result_page.append("<p class='mlab_ct_quiz_incorrect'>Should have " + $(this).find("[data-mlab-dt-quiz-subrole='question']").text() + "</p>");
                            }
                        } else if ( $(this).prop("checked") ) {
                            result_page.append("<p class='mlab_ct_quiz_incorrect'>Incorr " + $(this).find("[data-mlab-dt-quiz-subrole='question']").text() + "</p>");
                        }
                    });
                        
                    break;

                case "radio": 
                    response = q_el.find("input[name='" + q_id + "']:checked").val();
                    break;

                case "multiselect": 
                    response = [];
                    q_el.find('select > option:selected').each(function() {
                        response.push($(this).val());
                    });
                    break;

                case "select": 
                    response = q_el.find("select").val();
                    break;

                case "text": 
                    if ($(this).attr("data-mlab-cp-quiz-textvalue").toLowerCase().trim() == $(this).val().toLowerCase().trim()) {
                        result_page.append("<p class='mlab_ct_quiz_correct'>Corr " + $(this).val() + "</p>");
                    } else {
                        
                    }
                    
                    break;
            }; //end switch question type
            
            response = self.getResponse($(this));
            self.api.db.setResult(user_id, comp_id, q_id, response);
            
        }); //end quiz on pages loop

        
//        $(start).find("option[data-mlab-cp-quiz-alternative='correct']").filter(":selected").css("background-color", "orange");
    }
    
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
        q_id = $(this).attr("id");
        response = self.getResponse($(this));
        self.api.db.setResult(user_id, comp_id, q_id, response);
    }); //end quiz on pages loop
};

this.getResponse = function(q_el) {
    var response;
    var q_type = q_el.data("mlab-dt-quiz-questiontype");
    switch (q_type) {
        case "checkbox": 
            response = [];
            q_el.find("input:checked").each(function() {
                response.push($(this).val());
            });
            break;

        case "radio": 
            response = q_el.find("input[name='" + q_id + "']:checked").val();
            break;

        case "multiselect": 
            response = [];
            q_el.find('select > option:selected').each(function() {
                response.push($(this).val());
            });
            break;

        case "select": 
            response = q_el.find("select").val();
            break;

        case "text": 
            response = q_el.find('input').val()
            break;
    }; //end switch question type

    if (typeof response == "undefined") {
        response = "";
    }
    
    return response;
}

this.resultRetrieved = function(data) {
    console.log("cb");
    console.log(data);
};