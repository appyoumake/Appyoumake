/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.domRoot = $(el);
    self.deviceId = self.api.getDeviceId(); 
    self.settings = self.api.getVariable(this.domRoot, "settings");
    if (typeof self.settings == "undefined") {
        self.settings = {"allow_check":true,"allow_check_on_page":true,"display_correct":true,"lock_checked":true,"submit":false};
    }
    
    var disp = (self.settings.allow_check_on_page ? "" : "style='display: none'");
    $(el).append("<div data-mlab-cp-quiz-role='check_and_submit' style='display: none;'><div data-mlab-cp-quiz-subrole='display_results'><h1 class='mc_text mc_display mc_heading mc_medium'>You can now check and submit your answers</h1></div><button data-mlab-cp-quiz-role='check_all' >Check answers</button></div>");
    $(el).append("<button data-mlab-cp-quiz-role='move_previous' style='display: none;'>Previous</button><button data-mlab-cp-quiz-role='move_next'>Next</button>");
    $(el).append("<button data-mlab-cp-quiz-role='check' " + disp + ">Check answers</button>");

    self.domRoot.on("click", "[data-mlab-cp-quiz-role='move_next']", function() { self.move(1); });
    self.domRoot.on("click", "[data-mlab-cp-quiz-role='move_previous']", function() { self.move(-1); });
    self.domRoot.on("click", "[data-mlab-cp-quiz-role='check']", function() { self.checkPageAnswers(self.domRoot.find(".mlab_cp_quiz_currentpage")); });
    self.domRoot.on("click", "[data-mlab-cp-quiz-role='check_all']", function() { self.checkAllAnswers(); });
    
    $(el).find("div").first().show().addClass("mlab_cp_quiz_currentpage");

//we only set up the storage plugin if they want to "submit" the answers
    if (self.settings.submit) {
        self.api.db.setupStoragePlugin(el, self.loadAnswers);
    }
    
    
    //TODO 
    $(".ui-btn.ui-icon-carat-d.ui-btn-icon-right.ui-corner-all.ui-shadow.ui-li-has-count").removeClass("ui-btn")
/*    self.domRoot.on("change", ":input", function() { return self.storeAnswers($(this)); });
    self.domRoot.on("change", "." + self.classes.questionLocked + " :input", function() { return false; });

    */
    
};

//navigates from page to page and stores replies every time change page
//checks if required fields are filled in, then saves everything, if check per page is allowed, runs check
this.move = function(direction) {
    var q_div_curr = $(this.domRoot.find(".mlab_cp_quiz_currentpage"));
    var missing_fields = "";
    var self = this;
    var direction_text = {"-1": "previous", "1": "next"};
    
    if (direction == 1) {
//check if any questions are mandatory and if so, are they filled in
        q_div_curr.children("[data-mlab-cp-quiz-role='question']").each(function() {
            if ($(this).data("mlab-cp-quiz-mandatory") == true) {
                response = self.getResponse($(this));
                if ( (typeof response == "undefined") || (response.length == 0) ) {
                    missing_fields = missing_fields + $(this).find("[data-mlab-cp-quiz-subrole='question']").text() + "\n";
                }
            } 

        }); //end quiz on pages loop
    
//if there is one ore more fields that are not filled in then we need to alert user and bail
        if (missing_fields !== "") {
            alert("Required field(s) not filled in:\n" + missing_fields);
            return;
        }

        var moveto_pages = q_div_curr.nextAll('div');
        
    } else if (direction == -1) {
        var moveto_pages = q_div_curr.prevAll('div');
        
    }
    
    this.saveAnswers(q_div_curr);

    if (moveto_pages.length > 0) {
        q_div_curr.removeClass("mlab_cp_quiz_currentpage").hide();
        $(moveto_pages[0]).show().addClass("mlab_cp_quiz_currentpage");
        this.domRoot.find("[data-mlab-cp-quiz-role='move_" + direction_text[(direction * -1).toString()] + "']").show();
        if (moveto_pages.length == 1) {
            this.domRoot.find("[data-mlab-cp-quiz-role='move_" + direction_text[direction.toString()] + "']").hide();
        }
    } else {
        return;
    }

    
    if (direction == 1 && moveto_pages.length == 1 && this.settings.allow_check && !this.settings.allow_check_on_page) {
        this.domRoot.find("[data-mlab-cp-quiz-role='check_all']").show();
    } else {
        this.domRoot.find("[data-mlab-cp-quiz-role='check_all']").hide();
    }
 
};

this.loadAnswers = function() {
    
    mlab.api.db.getAllResult(mlab.api.components.quiz.deviceId, mlab.api.components.quiz.domRoot.attr("id"), mlab.api.components.quiz.processAnswers);
};

//this function is used for callbacks from the API database functions, it will contain a list of data which is {id_of_question: selected_answers}
//selected_answers can be a string (for text boxes), or an array of values for select, radio or check boxes.
this.processAnswers = function (data) {
    
    var q, q_type;
    var answers = data.data;
    for (id in answers) {
        q = $("#" + id);
        q_type = q.data("mlab-cp-quiz-questiontype");
        
        switch (q_type) {
            case "checkbox": 
                q.find('input').prop("checked", false);
                q.find('input').filter('[value=' + answers[id].join('], [value=') + ']').prop("checked", true);
                break;

            case "radio": 
                q.find('input').prop("checked", false);
                console.log( typeof answers );
                q.find('input[value="' + answers[id] + '"]').prop("checked", true);
                break;

            case "select": 
            case "multiselect": 
                q.find('select > option').prop("selected", false);
                if (typeof answers[id] == "string") {
                    q.find('select > option').filter('[value="' + answers[id] + '"]').prop("selected", true);
                } else {
                    q.find('select > option').filter('[value="' + answers[id].join('"], [value="') + '"]').prop("selected", true);
                }
                break;

            case "text": 
                q.find('input').val(answers[id])
                break;
        }
    }
}

//the answer check utilises the "data-mlab-cp-quiz-correct-response=true" we use for checkboxes, radio boxes and options to 
this.checkPageAnswers = function(page) {
    if (typeof page == "undefined") {
        return;
    }

//first erase all previous markings
    $(page).find("input[type='radio'], input[type='checkbox']").parent().css("background-color", "");
    $(page).find("option").css("background-color", "");
    $(page).find("input[type='text']").css("background-color", "");


    $(page).find("input[data-mlab-cp-quiz-correct-response='true']").filter(":checked").parent().css("background-color", "orange");
    $(page).find("option[data-mlab-cp-quiz-correct-response='true']").filter(":selected").css("background-color", "orange");
    $(page).find(":text").each( function () {
        if ($(this).attr("data-mlab-cp-quiz-correct-response").toLowerCase().trim() == $(this).val().toLowerCase().trim()) {
            $(this).css("background-color", "orange");
        }
    });
    
};

//here we check all answers for the end of the quiz, so we need to list page name, title of question and which answers are right or not
this.checkAllAnswers = function() {

    var pages = this.domRoot.find("div[data-mlab-cp-quiz-role='page']");
    var result_page = $(this.domRoot.find("div[data-mlab-cp-quiz-subrole='display_results']")[0]);
    result_page.empty();
    
    pages.each( function() {
        result_page.append($(this).find("h2").clone());
        
        $(this).children("[data-mlab-cp-quiz-role='question']").each(function() {
            result_page.append($(this).find("[data-mlab-cp-quiz-subrole='question']").clone());
            var q_type = $(this).data("mlab-cp-quiz-questiontype");
            switch (q_type) {
                case "checkbox": 
                    $(this).find("input").each( function() {
                        if ( $(this).data("mlab-cp-quiz-correct-response") == true ) {
                            if ( $(this).prop("checked") ) {
                                result_page.append("<p class='mc_entry mc_info mc_correct'>" + $(this).parent().text() + "</p>");
                            } else if (mlab.api.components['quiz'].settings.display_correct) {
                                result_page.append("<p class='mc_entry mc_info mc_suggest'>[Correct answer was " + $(this).parent().text() + "]</p>");
                            }
                        } else if ( $(this).prop("checked") ) {
                            result_page.append("<p class='mc_entry mc_info mc_wrong'>" + $(this).parent().text() + "</p>");
                        }
                    });
                        
                    break;

                case "radio": 
                    var sel = $(this).find("input:checked");
                    var corr = $(this).find("input[data-mlab-cp-quiz-correct-response='true']");
                    if (sel.val() == corr.val()) {
                        result_page.append("<p class='mc_entry mc_info mc_correct'>" + sel.parent().text() + "</p>");
                    } else {
                        result_page.append("<p class='mc_entry mc_info mc_wrong'>" + sel.parent().text() + "</p>");
                        if (mlab.api.components['quiz'].settings.display_correct) {
                            result_page.append("<p class='mc_entry mc_info mc_suggest'>[Correct answer was " + corr.parent().text() + "]</p>");
                        }
                    }
                    break;

                case "multiselect": 
                    $(this).find("select option").each( function() {
                        if ( $(this).data("mlab-cp-quiz-correct-response") == true ) {
                            if ( $(this).prop("selected") ) {
                                result_page.append("<p class='mc_entry mc_info mc_correct'>" + $(this).text() + "</p>");
                            } else if (mlab.api.components['quiz'].settings.display_correct) {
                                result_page.append("<p class='mc_entry mc_info mc_suggest'>[Correct answer was " + $(this).text() + "]</p>");
                            }
                        } else if ( $(this).prop("selected") ) {
                            result_page.append("<p class='mc_entry mc_info mc_wrong'>" + $(this).text() + "</p>");
                        }
                    });
                    
                    break;

                case "select": 
                    var sel = $(this).find("select option:selected");
                    var corr = $(this).find("select option[data-mlab-cp-quiz-correct-response='true']");
                    if (sel.val() == corr.val()) {
                        result_page.append("<p class='mc_entry mc_info mc_correct'>" + sel.text() + "</p>");
                    } else {
                        result_page.append("<p class='mc_entry mc_info mc_wrong'>" + sel.text() + "</p>");
                        if (mlab.api.components['quiz'].settings.display_correct) {
                            result_page.append("<p class='mc_entry mc_info mc_suggest'>[Correct answer was " + corr.text() + "]</p>");
                        }
                    }
                    
                    break;

                case "text": 
                    if ($(this).find("input").attr("data-mlab-cp-quiz-correct-response").toLowerCase().trim() == $(this).find("input").val().toLowerCase().trim()) {
                        result_page.append("<p class='mc_entry mc_info mc_correct'>" + $(this).find("input").val() + "</p>");
                    } else {
                        result_page.append("<p class='mc_entry mc_info mc_wrong'>" + $(this).find("input").val() + "</p>");
                        if (mlab.api.components['quiz'].settings.display_correct) {
                            result_page.append("<p class='mc_entry mc_info mc_suggest'>[Correct answer was " + $(this).find("input").attr("data-mlab-cp-quiz-correct-response").trim() + "]</p>");
                        }
                    }
                    
                    break;
            }; //end switch question type
            
            
        }); //end quiz on pages loop

    });
    
};



/**
 * To save the answers we need to get app_id. user_id, comp_id and for key we use id of question.
 * So we loop through each div with data-mlab-cp-quiz-role=question, get the type and the retrieve the value
 * @param {type} page
 * @returns {undefined}
 */
this.saveAnswers = function(page) {
    var dev_id = this.deviceId;
    var comp_id = this.domRoot.attr("id");
    var response;
    var self = this;
    
    $(page).children("[data-mlab-cp-quiz-role='question']").each(function() {
        q_id = $(this).attr("id");
        response = self.getResponse($(this));
        self.api.db.setResult(dev_id, comp_id, q_id, response);
    }); //end quiz on pages loop
};

this.getResponse = function(q_el) {
    var response;
    var q_type = q_el.data("mlab-cp-quiz-questiontype");
    switch (q_type) {
        case "checkbox": 
            response = [];
            q_el.find("input:checked").each(function() {
                response.push($(this).val());
            });
            break;

        case "radio": 
            response = q_el.find("input:checked").val();
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