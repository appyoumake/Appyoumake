/* Pointer to main element in DOM. Just for convenience. */
this.domRoot = null;

/* Flag indicating if component is initialized or not. */
this.initialized = false;

/* Question types available. Order matches user's input value. */
this.questionTypes = [
    {"type": "checkbox", "name": "Checkboxes (multi choice)", "order": 1},
    {"type": "radio", "name": "Radio buttons (single choice)", "order": 2},
    {"type": "select", "name": "Pulldown menu (single choice)", "order": 3},
    {"type": "multiselect", "name": "List (multi choice)", "order": 4},
    {"type": "text", "name": "Text/number", "order": 5},
];

var cont = " Press enter or tab to continue.";

this.editPrompts = {
    "pageTitle": "Please enter the title of the page." + cont,
    "questionType": "Select the type of question: <br/>1: Checkboxes (multi choice), 2: Radio button (single choice), 3: drop down list (single choice), 4: list (multi choice), 5: text (freeform)<br/>." + cont,
    "question": "Enter the question." + cont,
    "explanatory": "You can enter some explanatory text here, or leave blank if not needed." + cont,
    "alternatives": "Enter the possible answers for this question."  + cont + " Leave it blank to continue to next step.",
    "correctResponse": "Enter the number(s) of the correct response(s) with a space or comma between each correct response. The correct responses will be highlighted. If you make a mistake you can redo the selection, or leave blank when done" + cont,
    "mandatory": "Response required? Enter y or Y for yes. " + cont
};

this.tabTemplate = "<li><a href='{href}'>{label}</a></li>";
this.tabContentTemplate = '<div id="{id}" data-mlab-cp-quiz-role="page" >{content}</div>';
this.questionTemplate = '<div id="{id}" data-mlab-cp-quiz-role="question" class="mlab_current_component_child">{content}</div>';
this.questionExplanatoryTemplate = '<p class="mc_text mc_display mc_medium" data-mlab-cp-quiz-subrole="explanatory">{content}</p>';
this.questionQuestionTemplate = '<p class="mc_text mc_display mc_medium" data-mlab-cp-quiz-subrole="question">{content}</p>';
this.alternativesTemplate = '<div data-mlab-cp-quiz-subrole="alternatives"></div>';
this.tabIdPrefix = 'mlab_dt_quiz_preview_tabs_';

//---------- STANDARD COMPONENT FUNCTIONS 

/* Hook called when component is created.
 * @param {jQuery} el Main element for component. 
 */
this.onCreate = function (el) {
    this.onLoad(el);
    this.custom_add_page(el);
};

/* Hook called when component is loaded into app.
 * We store only the quiz content, each page as a separate div. For the 
 * @param {jQuery} el Main element for component. 
 */
this.onLoad = function (el) {

    var that = this;
    this.generateId(el);
    if (!this.domRoot.length) return;
    if (this.initialized) return;

//copy content of component, see onSave for how we store it, thsi will be one page per div
    
    var pages = $($(el).html());
    $(el).html("");
    
//initialise the tabs of the quiz (1 tab = 1 page)
    this.initTabs(el);
    
//reload the pages into the tabs vie this.addQuizPage
    $(pages).each( function () {
        if (this.nodeName.toLowerCase() == "div") {
            $(this).find("input[data-mlab-cp-quiz-alternative='correct']").parent().addClass("mc_correct");
            $(this).find("option[data-mlab-cp-quiz-alternative='correct']").addClass("mc_correct");
            var new_div = that.addQuizPage($(this).find("h2").text(), $(this).html());
            
//code to prepare elements for DT interaction
            $(new_div).find("p").attr('contenteditable','true').on("click", function(e){ that.selectItem(e); });
            $(new_div).find("label").attr('contenteditable','true').on("click", function(e){ e.preventDefault(); that.selectItem(e); });
            $(new_div).find("input").on("click", function(e){ e.preventDefault(); that.selectItem(e); });
            $(new_div).find("select option").on("click", function(e){ that.selectItem(e); });
        } else if (this.nodeName.toLowerCase() == "script") {
            $(el).append(this);
        }
    });
    
    
// Adding role="none", to prevent jQuery mobile from turning my inputs and buttons into jQuery UI elements
    this.domRoot.find(":input").attr("data-role", "none");
    
    this.api.clearDirty();
};

/* Hook called when app is saved. Returns the HTML that is saved for this component, and must contain enough information to continue 
 * editing when user opens the app in MLAB the next time, and to run the component in rumtime.
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
this.onSave = function (el) {
    var html = $('<div data-mlab-type="quiz" style="display: block;" id="' + $(el).attr("id") + '"></div>');
    $(el).find(".ui-tabs").find("[role='tabpanel']").each( function() { 
        var page = $("<div style='display: none' data-mlab-cp-quiz-role='page' >" + $(this).html() +  "</div>");
        page.find("[contenteditable]").removeAttr("contenteditable");
        page.find(".mc_correct").removeClass("mc_correct");
        html.append( page );
    } );
    $(el).children("script").each( function() { 
        html.append( $(this)[0].outerHTML ) ;
    });
    return html[0].outerHTML;
};

/* Indicator of how much of a quiz is actually set up. Returns number of questions in quiz.
 * @return {int} Number of questions in quiz.
 */
this.getContentSize = function() {
    return this.domRoot.find('[data-mlab-cp-quiz-role="question"]').length;
};


//---------- MAIN FUNCTION THAT DEAL WITH USER ACTIONS DURING QUIZ CREATION

/**
 * Here we process the user input from the tabbed wizard dialog box
 * @param {type} e
 * @returns {undefined}
 */
this.handleUserInput = function(input, e) {
    var enterKey = 13, tabKey = 9;
    // Only proceed if we have hit enter
    if (e.which != enterKey && e.which != tabKey) return;
    e.preventDefault();
    var editStage = input.data("mlab-dt-quiz-input");
    var value = input.val();
    var page = this.getCurrentPage();
    var question = this.getCurrentQuestion(page);
    var questionType = question.data("mlab-cp-quiz-questiontype");
    
    switch (editStage) {
        case "pageTitle":
            if (value) {
                page.find("h2").text(value);
                $('#' + this.getCurrentTabId() + ' ul:first li:eq(' + this.getCurrentTab() + ') a').text(value);
                input.val("");
                this.setPropertiesDialogTab();
                $("[data-mlab-dt-quiz-input='explanatory']").focus();
            }
            break;
            
//these both add some text to a P tag
        case "explanatory": 
            if (value) {
                input.addClass("mc_blurred");
                if (question.length > 0) {
                    var existing_text = question.find("[data-mlab-cp-quiz-subrole='explanatory']");
                    if (existing_text.length > 0) {
                        existing_text.text(value);
                    } else {
                        var div = this.questionExplanatoryTemplate.replace("{content}", value);
                        question.prepend(div);
                    }
                } else {
                    this.addQuestion(value, editStage);
                }
            } 
            $("[data-mlab-dt-quiz-input='question']").focus();
            break;
        
        case "question":
            if (value) {
                input.addClass("mc_blurred");
                if (question.length > 0) {
                    var existing_text = question.find("[data-mlab-cp-quiz-subrole='question']");
                    if (existing_text.length > 0) {
                        existing_text.text(value);
                    } else {
                        var div = this.questionQuestionTemplate.replace("{content}", value);
                        question.append(div);
                    }
                } else {
                    this.addQuestion(value, editStage);
                }
                this.setPropertiesDialogTab();
                $("[data-mlab-dt-quiz-input='questionType']").focus();
            } else {
                this.api.closeAllPropertyDialogs();
            }
            break;

        case "questionType":
            value = parseInt(value);
            var minValue = 1;
            var maxValue = this.questionTypes.length;
            if (!value || value < minValue || value > maxValue) {
                input.val('');
                helpText.text("Valid selections from: " + minValue + " - " + maxValue);
            } else {
                input.addClass("mc_blurred");
                question.attr("data-mlab-cp-quiz-questiontype", this.questionTypes[value - 1].type);
                this.setMandatory(question, value);
                $("[data-mlab-dt-quiz-input='mandatory']").focus();
            }
            break;
            
        case "mandatory":
            input.addClass("mc_blurred");
            if (value.toLowerCase() == "y") {
                value = true;
            } else {
                input.val('n');
                value = false;
            }
            this.setMandatory(question, value);
            this.setPropertiesDialogTab();
            $("[data-mlab-dt-quiz-input='alternatives']").focus();
            break;
            c
        case "alternatives":
            if (value != "") {
                input.val('');
                this.addQuestionAlternative(question, value, questionType);
                if (questionType == "text") {
                    input.val('');
                    $("div.qtip input:text").val("").removeClass("mc_blurred");
                    $("div.qtip textarea").val("").removeClass("mc_blurred");
                    this.prepareQuestion(page, question);
                    this.setPropertiesDialogTab(1);
                    $("[data-mlab-dt-quiz-input='explanatory']").focus();
                }
            } else { //the user does not want to add more alternatives, move to select correct response BUT NOT IF TEXTBOX, that only has a single answer
                input.addClass("mc_blurred");
                this.setPropertiesDialogTab();
                $("[data-mlab-dt-quiz-input='correctResponse']").focus();
            }
            break;
            
        case "correctResponse":
            input.val('');
            this.markAlternativesAsCorrect(question, value, questionType);
            var correct_response_id = "mlab_dt_quiz_select_response_" + this.domRoot.attr("id");
            $("#"  + correct_response_id).html("");
            $("div.qtip input:text").val("").removeClass("mc_blurred");
            $("div.qtip textarea").val("").removeClass("mc_blurred");
            this.prepareQuestion(page, question);
            this.setPropertiesDialogTab(1);
            $("[data-mlab-dt-quiz-input='explanatory']").focus();
            break;
            
        default:
            console.log("Error in selection");
    }
};

this.selectItem = function (event) {
    debugger;
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_grandchild").removeClass("mlab_current_component_grandchild");
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");
    $(event.currentTarget).addClass("mlab_current_component_grandchild");
    $(event.currentTarget).parents("[data-mlab-cp-quiz-role='question']").addClass("mlab_current_component_child");
};

this.prepareQuestion = function (page, question) {
    var that = this;
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");
    $(question).find("p, label").attr('contenteditable','true').on("click", function(e){ that.selectItem(e); });
    $(question).find("label").on("click", function(e){ e.preventDefault(); that.selectItem(e); });
    $(question).find("input").on("click", function(e){ e.preventDefault(); that.selectItem(e); });
};

//---------- SETUP FUNCTIONS, BOTH FOR COMPONENT AND QUIZ CONTENT, AS WELL AS SUPPORTING FUNCTIONS

/* Helper function that sets up basic stuff.
 * @param {jQuery} el Main element for component.
 */
this.generateId = function(el) {
    this.domRoot = el;
    var id = this.domRoot.attr("id");
    if (!id) {
        id = this.api.getGUID();
        this.domRoot.attr("id", id);
    }
};

/**
 * Initiates a tab system for component using jQuery UI's tabs but need to reset hrefs due to our manipulation of the base href
 * @returns {undefined}
 */
this.initTabs = function(el) {
    var tab_id = this.getCurrentTabId();
    var html = $('<div id="' + tab_id + '">' + 
                '    <ul class="mlab_dt_tab_list">' + 
                '    </ul>' + 
                '</div>');

    $(el).append($(html).tabs());    

};

//---------- HELPER FUNCTIONS EXECUTING USER ACTIONS DURING QUIZ CREATION

/**
 * cancels current question, removes HTML and closes the qtip input dialog
 * @returns {undefined}
 */
this.cancelCurrentQuestion = function() {
    var page = this.getCurrentPage();
    var question = this.getCurrentQuestion(page);
    $(question).remove();
    this.api.closeAllPropertyDialogs();
};

/**
 * This button is only on the last page, means they are done
 * @param {type} page
 * @returns {Boolean}
 */
this.finishAddingQuestions = function(page) {
    this.api.closeAllPropertyDialogs();
};

/**
 * Adds a new page to the quiz.
 * @returns {undefined}
 */
this.addQuizPage = function(title, content) {
    
//turn off any current questions on current page
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");
    
// tabs require the use of IDs
    var tab_id = this.getCurrentTabId();
    var tabs = $( "#" + tab_id );
    var num_tabs = $( "#" + tab_id + " >ul >li").size();
    var new_tab_id = tab_id + '_' + num_tabs; 
    if (typeof title != "undefined") {
        var label = title;
    } else {
        var label = "Page " + num_tabs;
    }
    if (typeof content == "undefined") {
        content = '<h2 class="mc_text mc_display mc_heading mc_medium">{title}</h2>';
    }
    var li = $( this.tabTemplate.replace( /\{href\}/g, location.href.toString() + "#" + new_tab_id ).replace( /\{label\}/g, label ) );
    var div = this.tabContentTemplate.replace( /\{id\}/g, new_tab_id ).replace( /\{content\}/g, content ).replace( /\{title\}/g, label );
    
    tabs.find( ".ui-tabs-nav" ).append( li );
    var new_div = $(div).appendTo( tabs );
    tabs.tabs( "refresh" );
    tabs.tabs( "option", "active", num_tabs );
    this.api.setDirty();
    return new_div;
};

/**
 * Add a single question to the page
 * @param {type} page
 * @param {type} type
 * @param {type} questionText
 * @param {type} uuid
 * @returns {addQuestion.question|makeQuestion.question}
 */
this.addQuestion = function(text, editMode) {
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");
    if (editMode == "explanatory") {
        var div = this.questionTemplate.replace("{id}", this.api.getGUID()).replace("{content}", this.questionExplanatoryTemplate.replace("{content}", text));
    } else if (editMode == "question") {
        var div = this.questionTemplate.replace("{id}", this.api.getGUID()).replace("{content}", this.questionQuestionTemplate.replace("{content}", text));
    } else {
        var div = "";
    }
    question = page.append(div);
    this.api.setDirty();
    return question;
};

/**
 * Adds a response alternative for a question
 * @param {type} question
 * @param {type} value
 * @param {type} questionType
 * @returns {Boolean} true if question was added
 */
this.addQuestionAlternative = function(question, value, questionType) {
    value = this.escape(value);
    var set_selected = false;
    var alternatives_container = question.find('[data-mlab-cp-quiz-subrole="alternatives"]');
    if (alternatives_container.length == 0) {
        question.append(this.alternativesTemplate);
        alternatives_container = question.find('[data-mlab-cp-quiz-subrole="alternatives"]');
    }

    switch (questionType) {
        case "checkbox": 
            var html = "<label class='mc_text mc_entry mc_info'><input value='" + value + "' class='mc_text mc_entry mc_input' type='checkbox'>" + value + "</label>";
            break;

        case "radio": 
            var name = question.attr("id");
            var html = "<label class='mc_text mc_entry mc_info'><input value='" + value + "' class='mc_text mc_entry mc_input' type='radio' name='" + name + "'>" + value + "</label>";
            break;

        case "text": 
            var html = "<input class='mc_text mc_entry mc_input' type='text' data-mlab-cp-quiz-textvalue='" + value + "' >";
            break;

        case "select": 
            var current_select_box = question.find("select");
            if (current_select_box.length == 0) {
                var html = "<select class='mc_text mc_entry mc_input' ><option class='mc_text mc_entry mc_input' ></option><option class='mc_text mc_entry mc_input' value='" + value + "' >" + value + "</option></select>";
            } else {
                alternatives_container = current_select_box;
                var html = "<option class='mc_text mc_entry mc_input' value='" + value + "' >" + value + "</option>";
            }
            set_selected = true;
            break;

        case "multiselect": 
            var current_select_box = question.find("select");
            if (current_select_box.length == 0) {
                var html = "<select class='mc_text mc_entry mc_input' multiple size='7'><option class='mc_text mc_entry mc_input' value='" + value + "' >" + value + "</option></select>";
            } else {
                alternatives_container = current_select_box;
                var html = "<option class='mc_text mc_entry mc_input' value='" + value + "' >" + value + "</option>";
            }
            break;
    }
    alternatives_container.append(html);
    var correct_response_id = "mlab_dt_quiz_select_response_" + this.domRoot.attr("id");
    var num = $("#" + correct_response_id).find("span").length + 1;

    if (set_selected) {
        question.find("select :nth-child(" + (num + 1).toString() +  ")").prop('selected', true); 
    }
    
    $("#"  + correct_response_id).append("<span data-mlab-cp-quiz-correct-response='" + num + "'>" + num + " - " + value + "<br></span>");
    this.api.setDirty();
    return true;
};

/**
 * This function will read a list of numbers and highlight the matching answers in the controls that have been created
 * For checkbox and radio button we add a class to the surrounding label, for select boxes we add it to the options
 * @param {type} question
 * @param {type} value
 * @param {type} questionType
 * @returns {undefined}
 */
this.markAlternativesAsCorrect = function(question, value, questionType) {
    var correctResponses = value.trim().split(/[\s,]+/);

    switch (questionType) {
        case "checkbox": 
        case "radio": 
            var i = 1;
            $(question).find('input[type=' + questionType + ']').each(function() {
                    if (correctResponses.indexOf(i.toString()) >= 0) {
                        $(this).attr("data-mlab-cp-quiz-alternative", "correct").parent().addClass("mc_correct");
                    } else {
                        $(this).removeAttr("data-mlab-cp-quiz-alternative").parent().removeClass("mc_correct");
                    }
                    i++;
                });
            break;
            
        case "select": 
        case "multiselect": 
            var i = 1;
            $(question).find('select > option').each(function() {
                    if (correctResponses.indexOf(i.toString()) >= 0) {
                        $(this).addClass("mc_correct").attr("data-mlab-cp-quiz-alternative", "correct");
                    } else {
                        $(this).removeClass("mc_correct").removeAttr("data-mlab-cp-quiz-alternative");
                    }
                    i++;
                });
            break;
            
        case "text": 
            break;
    }
    
};

this.setMandatory = function(question, value) {
    question.attr("data-mlab-cp-quiz-mandatory", value);
    if (value) question.addClass("mc_required");
    else question.removeClass("mc_required");
};

/**
 * After user has added a question they may want to change this to another type, that is done here.
 * @param {type} page
 * @param {type} question
 * @param {type} type
 * @returns {undefined}
 */
this.changeQuestionType = function(page, question, type) {
    var self = this;
    var typeOb = this.questionTypes[type-1];
    var typeType = typeOb["type"];
    var oldQuestionType = question.data("questiontype");
    if (typeType==oldQuestionType) return;
    var questionText = question.find("." + self.classes.questionText).html();
    var alternatives = question.find("." + self.classes.questionAlternatives + " li");
    var correctResponse = self.getCorrectResponse(question);
    if (oldQuestionType=="checkbox" || oldQuestionType=="text" || typeType=="text") correctResponse = "";
    var mandatory = question.data("mandatory");
    
//TODO     var newQuestion = self.makeQuestion(page, type, questionText);
    question.replaceWith(newQuestion);
    if (typeType!="text") {
        alternatives.each(function() {
            var alternative = $(this);
            self.addQuestionAlternative(newQuestion, alternative.text(), typeType);
        });
    }
    this.addCorrectResponse(newQuestion, correctResponse, typeType);
    this.setMandatory(newQuestion, mandatory);
};

/**
 * Updates what is the correct repsponse(s) based on user input
 * @param {type} question
 * @returns {getCorrectResponse.correctResponse|String|Array}
 */
this.getCorrectResponse = function(question) {
    var questionType = question.data("questiontype");
    var correctResponse = question.data("correctResponse");
    if (questionType=="checkbox") {
        correctResponseRaw = correctResponse.split(" ");
        correctResponse = [];
        for (var i=0, ii=correctResponseRaw.length; i<ii; i++) {
            var response = parseInt(correctResponseRaw[i]);
            if (response) correctResponse.push(response);
        }
    }
    else if (questionType=="radio" || questionType=="select") {
        correctResponse = parseInt(correctResponse);
        if (!correctResponse) correctResponse = "";
    }
    return correctResponse;
};

//---------- USER INTERACTION FUNCTIONS, RESPONDS TO CLICKS ON EXISTING QUIZ

this.questionClicked = function(question) {
    this.api.closeAllPropertyDialogs();
    this.markQuestionAsCurrent(question);
    var type = question.data("questiontype");
    var html = [];
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="delete">Slett spørsmål</a>');
    html.push('</div>');
    if (question.prev("." + this.classes.question).length) {
        html.push('<div>');
        html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="moveup">Flytt opp</a>');
        html.push('</div>');
    }
    if (question.next("." + this.classes.question).length) {
        html.push('<div>');
        html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="movedown">Flytt ned</a>');
        html.push('</div>');
    }
    if (type=="radio" || type=="select" || type=="checkbox") {
        html.push('<div>');
        html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="addalternative">Legg til svaralternativ</a>');
        html.push('</div>');
    }
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="changetype">Endre spørsmåltype</a>');
    html.push('</div>');
    var toggleMandatoryText = "Gjør spørsmålet obligatorisk";
    if (question.data("mandatory")) toggleMandatoryText = "Gjør spørsmålet <i>ikke</i>-obligatorisk"
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="togglemandatory">' + toggleMandatoryText + '</a>');
    html.push('</div>');
    this.api.displayPropertyDialog(question, "Endre spørsmål", html);
};

this.alternativeClicked = function(alternative) {
    this.api.closeAllPropertyDialogs();
    this.markAlternative(alternative);
    var changeCorrectResponseText = "";
    if (this.alternativeIsCorrect(alternative)) changeCorrectResponseText = "Sett alternativet som <i>ikke</i> korrekt";
    else changeCorrectResponseText = "Sett alternativet som korrekt";
    var html = [];
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="editalternative">Endre teksten</a>');
    html.push('</div>');
    if (alternative.prev("." + this.classes.questionAlternatives + " li").length) {
        html.push('<div>');
        html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="alternativemoveup">Flytt opp</a>');
        html.push('</div>');
    }
    if (alternative.next("." + this.classes.questionAlternatives + " li").length) {
        html.push('<div>');
        html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="alternativemovedown">Flytt ned</a>');
        html.push('</div>');
    }
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="changecorrectresponse">' + changeCorrectResponseText + '</a>');
    html.push('</div>');
    html.push('<div>');
    html.push('<a href="#" class="' + this.classes.dialogLink + '" data-function="deletealternative">Slett svaralternativ</a>');
    html.push('</div>');
    this.api.displayPropertyDialog(alternative, "Redigér svaralternativ", html, null, null, null, null, true);
};

this.alternativeIsCorrect = function(alternative) {
    var question = alternative.closest("." + this.classes.question);
    var questionType = question.data("questiontype");
    var correctResponse = this.getCorrectResponse(question);
    var alternativeNumber = alternative.index() + 1;
    return (questionType=="checkbox" && correctResponse.indexOf(alternativeNumber)!=-1) || correctResponse==alternativeNumber
};

this.markAlternative = function(alternative) {
    this.domRoot.find("li." + this.classes.markedAlternative).removeClass(this.classes.markedAlternative);
    alternative.addClass(this.classes.markedAlternative);
};

this.markQuestionAsCurrent = function(question) {
    question.siblings(".mlab_current_component_child").removeClass("mlab_current_component_child");
    question.addClass("mlab_current_component_child");
};

/**
 * Reponds to user clicks on menus in dialog
 * TODO: MOVE THIS TO CUSTOM FUNCTIONS
 * @param {type} link
 * @returns {undefined}
 */
this.dialogLinkClick = function(link) {
    var linkFunction = link.data("function");
    this.api.closeAllPropertyDialogs();
    var question = this.getCurrentQuestion();
    var page = question.closest("." + this.classes.page);
    var alternative = this.domRoot.find("li." + this.classes.markedAlternative);
    if (linkFunction=="delete") this.removeQuestion(question);
    else if (linkFunction=="moveup") this.custom_move_question_up(question);
    else if (linkFunction=="movedown") this.custom_move_question_down(question);
    else if (linkFunction=="addalternative") this.enterEditMode(page, "alternatives", question, true);
    else if (linkFunction=="changetype") this.enterEditMode(page, "questionType", question, true);
    else if (linkFunction=="togglemandatory") this.toggleMandatory(question);
    else if (linkFunction=="editalternative") this.editAlternativeText(alternative);
    else if (linkFunction=="changecorrectresponse") this.toggleAlternativeCorrectness(alternative);
    else if (linkFunction=="deletealternative") this.removeAlternative(alternative);
    else if (linkFunction=="alternativemoveup") this.moveAlternativeUp(alternative);
    else if (linkFunction=="alternativemovedown") this.moveAlternativeDown(alternative);
};

this.editAlternativeText = function(alternative) {
    var self = this;
    self.api.editContent(alternative);
    alternative.focus();
    alternative.on("blur", function() {
        var alternative = $(this);
        self.saveQuestions();
        alternative.removeAttr("contenteditable");
    });
    alternative.on("keydown", function(e) {
        if (e.which==13) { // enter
            $(this).blur();
            return false;
        }
    });

};

this.toggleAlternativeCorrectness = function(alternative) {
    var question = alternative.closest("." + this.classes.question);
    var questionType = question.data("questiontype");
    var alternativeNumber = alternative.index() + 1;
    var alternativeValue = "";
    if (this.alternativeIsCorrect(alternative)) {
        if (questionType=="checkbox") {
            var correctResponse = this.getCorrectResponse(question);
            var responseIndex = correctResponse.indexOf(alternativeNumber);
            correctResponse.splice(responseIndex, 1);
            alternativeValue = correctResponse.join(" ");
        }
    }
    else {
        if (questionType=="checkbox") {
            var correctResponse = this.getCorrectResponse(question);
            correctResponse.push(alternativeNumber);
            alternativeValue = correctResponse.join(" ");
        }
        else {
            alternativeValue = alternativeNumber;
        }
    }
    this.addCorrectResponse(question, alternativeValue, questionType);
    this.saveQuestions();
};

this.toggleMandatory = function(question) {
    this.setMandatory(question, !question.data("mandatory"));
};

/**
 * Removes a response alternative
 * @param {type} alternative
 * @returns {undefined}
 */
this.removeAlternative = function(alternative) {
    if (this.alternativeIsCorrect(alternative)) this.toggleAlternativeCorrectness(alternative);
    alternative.remove();
    this.saveQuestions();
};

/**
 * Updates title of currently selected tab
 * @param {type} el
 * @returns {undefined}
 */
this.updateTab = function(el) {
    var title = el.text();
    var pageId = el.closest("." + this.classes.page).attr("id");
    this.domRoot.find("." + this.classes.nav + " a[href='#" + pageId + "']").text(title);
};


//---------- CUSTOM FUNCTIONS AVAILABLE FROM THE COMPONENTS TOOLBAR

/**
 * added by Arild, we want to use the tooltip for input from user, here we generate a tabbed interface with 4 tabs:
 * 1: Title of page (if blank *AND* at least one question with answers on this page we exit editing)
 * 2: Subtitle or Question (? at end determines, if blank *AND* at least one question with answers on this page we skip to 1)
 * 3: Question type (if previous item was question)
 * 4: Answer (repeat until blank, then go to 2
 * 
 * @param {type} el
 * @returns {undefined}
 */
this.custom_add_page = function(el) {
    this.addQuizPage();
    var content = this.prepareDialogBox();
    if (typeof el == "undefined") { 
        el = $(".mlab_current_component");
    }
    this.api.displayPropertyDialog(el, "Add quiz page & questions", content, null, null, null, "[data-mlab-dt-quiz-input='pageTitle']", true);
    
};

/**
 * Start adding a new question to currently selected page
 * @param {type} el
 * @returns {undefined}
 */
this.custom_add_question = function(el) {
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");

    var content = this.prepareDialogBox();
    var el = $(".mlab_current_component");
    
    $(content).tabs("option", "active", 1);
    $(content).tabs("disable", 0);
    this.api.displayPropertyDialog(el, "Add questions", content, null, null, null, "[data-mlab-dt-quiz-input='explanatory']", true);
};

this.custom_delete_question = function(el) {
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_child").remove();
}

this.custom_delete_question_element = function(el) {
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_grandchild").remove();
}

/* Removes a page from the component. 
 * @param {jQuery} button The button that was clicked to remove the page.
 */
/*this.custom_removeQuizPage = function() {
    var tab_id = this.getCurrentTabId();
    var tabs = $( "#" + tab_id ).tabs();
    var activeTab = tabs.find( ".ui-tabs-active" ).remove().attr( "aria-controls" );
    $( "#" + activeTab).remove();
    tabs.tabs( "refresh" );
    this.api.setDirty();
};*/

/**
 * Removes an entire question
 * @param {type} question
 * @returns {undefined}
 */
/*this.custom_removeQuestion = function(question) {
    var page = this.getCurrentPage();
    var question = page.find(".mlab_current_component_child");
    question.remove();
    this.saveQuestions();
};*/

/**
 * Wrapper function to move currently selected question OR alternative down
 * @param {type} el
 * @returns {undefined}
 */
/*this.custom_move_down = function() {
    var q = this.getCurrentQuestion();
    var a = this.domRoot.find("li." + this.classes.markedAlternative);    
    if (q) {
        this.move_question_down(q);
    } else {
        this.move_alternative_down(a);
    }
};*/

/**
 * Wrapper function to move currently selected question OR alternative up
 * @param {type} el
 * @returns {undefined}
 */
/*this.custom_move_up = function(el) {
    var q = this.getCurrentQuestion();
    var a = this.domRoot.find("li." + this.classes.markedAlternative);    
    if (q) {
        this.move_question_up(q);
    } else {
        this.move_alternative_up(a);
    }
};*/

this.custom_set_options = function() {
    var content = this.getQuizPropertiesDialogHtml();
    var el = $(".mlab_current_component");
    var settings = mlab.dt.api.getVariable(el, "settings");
    for (name in settings) {
        $(content).find("[data-mlab-dt-quiz-property='" + name + "']").prop("checked", settings[name]);
    }
            
    $(content).on("click", "[data-mlab-dt-quiz-property]", function() {
        var settings = mlab.dt.api.getVariable(el, "settings");
        if (typeof settings == "undefined") {
            settings = {};
        }
        settings[$(this).attr("data-mlab-dt-quiz-property")] = $(this).prop("checked");
        mlab.dt.api.setVariable(el, "settings", settings);
    });
    
    this.api.displayPropertyDialog(el, "Set quiz options", content);
    
}
//---------- VARIOUS HELPER FUNCTIONS USED BY CODE ABOVE

this.prepareDialogBox = function() {
    var el = $(".mlab_current_component");
    var self = this;
    var id = this.domRoot.attr("id");
    
    content = this.getDialogHtml(id);
            
    $(content).on("keydown", "input, textarea", function(e) {
        mlab.dt.components.quiz.code.handleUserInput($(this), e);
    });

    $(content).find("ul li a").each(function() {
        $(this).attr("href", location.href.toString() + $(this).attr("href"));
    });
    $(content).tabs();
    return content;
};

/**
 * The properties dialog uses tabs, here we move forward (or to a specific tab) when an action has been performed
 * @param {type} tab_num
 * @returns {undefined}
 */
this.setPropertiesDialogTab = function(tab_num) {
    var id = "#mlab_dt_quiz_tabs_" + this.domRoot.attr("id");
    if (typeof tab_num == "undefined") {
        tab_num = $(id).tabs("option", "active") + 1;
    }
    $(id).tabs( "option", "active", tab_num);
};

/**
 * Returns HTML for the dialog box, used when add page or question
 * @param {type} el
 * @returns {unresolved}
 */
this.getDialogHtml = function(id) {
    return $('<div id="mlab_dt_quiz_tabs_' + id + '">' + 
                    '    <ul class="mlab_dt_tab_list">' + 
                    '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_1">Page</a></li>' + 
                    '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_2">Question</a></li>' + 
                    '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_3">Type</a></li>' + 
                    '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_4">Alternatives</a></li>' + 
                    '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_5">Correct response(s)</a></li>' + 
                    '    </ul>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_1">' + 
                    '        <label class="mlab_dt_text">' + this.editPrompts.pageTitle + '</label>' + 
                    '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="pageTitle">' + 
                    '        <div class="mlab_dt_large_new_line"></div>' + 
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_2">' + 
                    '        <label class="mlab_dt_text">' + this.editPrompts.explanatory + '</label>' + 
                    '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="explanatory"></textarea>' + 
                    '        <div class="mlab_dt_larger_new_line"></div>' +        
                    '        <label class="mlab_dt_text">' + this.editPrompts.question + '</label>' + 
                    '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="question"></textarea>' + 
                    '        <div class="mlab_dt_larger_new_line"></div>' +                     
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_3">' + 
                    '        <label class="mlab_dt_text">' + this.editPrompts.questionType + '</label>' + 
                    '        <img class="mlab_dt_picture" id="img_question_type" src="/img/quiz-type.png" style="display: inline-block;">' + 
                    '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="questionType">' + 
                    '        <div class="mlab_dt_largest_new_line"></div>' +   
                    '        <label class="mlab_dt_text">' + this.editPrompts.mandatory + '</label>' + 
                    '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="mandatory">' + 
                    '        <div class="mlab_dt_large_new_line"></div>' +
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_4">' + 
                    '        <label class="mlab_dt_text">' + this.editPrompts.alternatives + '</label>' + 
                    '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="alternatives"></textarea>' + 
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_5">' + 
                    '        <p id="mlab_dt_quiz_select_response_' + id + '"></p>' +
                    '        <label class="mlab_dt_text">' + this.editPrompts.correctResponse + '</label>' + 
                    '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="correctResponse">' + 
                    '        <div class="mlab_dt_large_new_line"></div>' +         
                    '    </div>' + 
                    '</div>' + 
                    '<input type="button" class="mlab_dt_button_cancel mlab_dt_right" data-mlab-dt-quiz-button="cancel" value="Cancel" onclick="mlab.dt.components.quiz.code.cancelCurrentQuestion();">' 
                    );
};

/**
 * Returns HTML for the quiz setup, i.e. how to check, where to send data, etc
 * @param {type} el
 * @returns {unresolved}
 */
this.getQuizPropertiesDialogHtml = function() {
    return $('<div>' + 
            '    <p class="mlab_dt_text">The correct answers to a quiz can be checked and/or saved to a database. Choose your options below.</p>' + 
            '    <label class="mlab_dt_label"><input type="checkbox" data-mlab-dt-quiz-property="allow_check">Allow check of answers on device?</label>' + 
            '    <label class="mlab_dt_label"><input type="checkbox" data-mlab-dt-quiz-property="allow_check_on_page">Allow check of answers on each page?</label>' + 
            '    <label class="mlab_dt_label"><input type="checkbox" data-mlab-dt-quiz-property="display_correct">Show correct answers when check</label>' + 
            '    <label class="mlab_dt_label"><input type="checkbox" data-mlab-dt-quiz-property="lock_checked">Lock checked questions for further editing</label>' + 
            '    <label class="mlab_dt_label"><input type="checkbox" data-mlab-dt-quiz-property="submit">Submit answers to remote database?</label>' + 
            '</div>' + 
            '<input type="button" class="mlab_dt_button_cancel mlab_dt_right" data-mlab-dt-quiz-button="cancel" value="OK"  onclick="mlab.dt.api.closeAllPropertyDialogs();">' 
            );
}

//---------- BASIC UTILITY FUNCTIONS
/**
 * returns index of currently selected tab
 * @returns {int}
 */
this.getCurrentTab = function() {
    return $('#' + this.getCurrentTabId()).tabs("option", "active")
};

this.getCurrentTabId = function() {
    var id = this.domRoot.attr("id");
    return this.tabIdPrefix + id;
};

/**
 * returns DIV for currently selected tab
 * @returns {DIV}
 */
this.getCurrentPage = function() {
    var tab_id = this.getCurrentTabId();
    return $( "#" + tab_id + " div.ui-tabs-panel[aria-hidden='false']");
};

/**
 * Returns currently selected questions from the mlab_current_component_child class
 * @param {type} page
 * @returns {getCurrentQuestion.question}
 */
this.getCurrentQuestion = function(page) {
    if (!page) page = this.getCurrentPage();
    var question = page.find(".mlab_current_component_child").first();
    return question; 
};

/**
 * Returns currently selected questions from the mlab_current_component_child class
 * @param {type} page
 * @returns {getCurrentQuestion.question}
 */
this.getLastQuestion = function(page) {
    var question = page.find("[data-mlab-cp-quiz-role='question']").last();
    return question;
};

this.escape = function(str) {
    return str.replace("'", "&apos;").replace('"', "&quot;")
}