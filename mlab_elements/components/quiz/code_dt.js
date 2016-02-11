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

this.TABS_ADD_PAGE = 0;
this.TABS_ADD_QUESTION = 1;
this.TABS_SELECT_TYPE = 2;
this.TABS_ADD_ALTERNATIVES = 3;
this.TABS_SELECT_CORRECT = 4;
this.TABS_SELECT_ACTION = 5;

var cont = " Press enter or tab to continue.";

this.editPrompts = {
    "pageTitle": "Please enter the title of the page.",
    "questionType": "Select the type of question: <br/>1: Checkboxes (multi choice), 2: Radio button (single choice), 3: drop down list (single choice), 4: list (multi choice), 5: text (freeform)<br/>.",
    "question": "Enter the question.",
    "explanatory": "You can enter some explanatory text here, or leave blank if not needed.",
    "alternatives": "Enter the possible answers for this question. Leave it blank to continue to next step.",
    "correctResponse": "Enter the number(s) of the correct response(s) with a space or comma between each correct response. The correct responses will be highlighted. If you make a mistake you can redo the selection, or leave blank when done.",
    "mandatory": "Response required? Enter y or Y for yes. ",
    "nextAction": "Do you want to add a new page <em>(type P below)</em> or a new question <em>(type Q below)</em> ?",
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

//here we convert the SELECT box back to the fake FIELDSET one
            $(this).find("select").each( function() { 
                var fieldset_html = $("<fieldset class='mlab_cp_quiz_select'><legend></legend><ul></ul></fieldset>");
                $(this).find("option").each(function() {
                    var value = $(this).text();
//need to carry across correct flag
                    if ($(this).data("mlab-cp-quiz-alternative") == "correct") {
                        fieldset_html.children("ul").append("<li data-mlab-cp-quiz-alternative='correct'>" + value + "</li>");
                    } else {
                        fieldset_html.children("ul").append("<li>" + value + "</li>");
                    }
                });
                this.outerHTML = fieldset_html[0].outerHTML;
            });
            
            $(this).find("input[data-mlab-cp-quiz-alternative='correct']").parent().addClass("mc_correct");
            $(this).find("li[data-mlab-cp-quiz-alternative='correct']").addClass("mc_correct");
            $(this).find("input[type=text]").each(function( index ) { $(this).attr("placeholder", $(this).attr("data-mlab-cp-quiz-textvalue")); } );

            var new_div = that.addQuizPage($(this).find("h2").text(), $(this).html());
            that.makeQuestionEditable(new_div);

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
 * 
 * A key change is that we convert a fake select box (which is a fieldset and a legend with a UL in it)
 * to a select box
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
this.onSave = function (el) {
    var html = $('<div data-mlab-type="quiz" style="display: block;" id="' + $(el).attr("id") + '"></div>');
    $(el).find(".ui-tabs").find("[role='tabpanel']").each( function() { 
        var page = $("<div style='display: none' data-mlab-cp-quiz-role='page' >" + $(this).html() +  "</div>");

//convert the fake select boxes (if any
        page.find("fieldset.mlab_cp_quiz_select").each(function() {
            var select_html = $("<select class='mc_text mc_entry mc_input' ><option class='mc_text mc_entry mc_input' ></option></select>");
            $(this).find("li").each(function() {
                var value = $(this).text();
//need to carry across correct flag
                if (value != "") {
                    if ($(this).hasClass("mc_correct")) {
                        select_html.append("<option class='mc_text mc_entry mc_input mc_correct' value='" + value + "' data-mlab-cp-quiz-alternative='correct' >" + value + "</option>");
                    } else {
                        select_html.append("<option class='mc_text mc_entry mc_input' value='" + value + "' >" + value + "</option>");
                    }
                }
            });
            this.outerHTML = select_html[0].outerHTML;
        });
        
        page.find("[contenteditable]").removeAttr("contenteditable");
        page.find(".mc_correct, .mlab_current_component_child, .mlab_current_component_editable").removeClass("mc_correct mlab_current_component_child mlab_current_component_editable");
        page.find("input[type=text]").removeAttr("placeholder");

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
    if (e.shiftKey) {
        return;
    }
    e.preventDefault();
    this.api.setDirty();
    
    var editStage = input.data("mlab-dt-quiz-input");
    var value = input.val();
    var page = this.getCurrentPage();
    var question = this.getCurrentQuestion(page);
    var questionType = question.data("mlab-cp-quiz-questiontype");
    
    switch (editStage) {
        case "pageTitle":
            if (value) {
                page.find("h2").text(value);
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
                alert("Valid selections from: " + minValue + " - " + maxValue);
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
            
//for text boxes we go directly to the "correct response" tab
            if (questionType == "text") {
                this.setPropertiesDialogTab(this.TABS_SELECT_CORRECT);
                $("[data-mlab-dt-quiz-input='correctResponse']").focus();
            } else {
                this.setPropertiesDialogTab();
                $("[data-mlab-dt-quiz-input='alternatives']").focus();
            }
            break;
            
        case "alternatives":
            if (value != "") {
                input.val('');
                this.addQuestionAlternative(question, value, questionType);
            } else { //the user does not want to add more alternatives, move to select correct response BUT NOT IF TEXTBOX, that only has a single answer
                input.addClass("mc_blurred");
                if (questionType == "select") {
                    question.find("legend").text("");
                }
                this.setPropertiesDialogTab();
                $("[data-mlab-dt-quiz-input='correctResponse']").focus();
            }
            break;
            
        case "correctResponse":
            input.val('');
            if (questionType == "text") { //we set the textbox here, different from other controls
                this.addQuestionAlternative(question, value, questionType);
            } else {
                this.markAlternativesAsCorrect(question, value, questionType);
                var correct_response_id = "mlab_dt_quiz_select_response_" + this.domRoot.attr("id");
                $("#"  + correct_response_id).html("");
            }
            this.makeQuestionEditable(question);
            this.setPropertiesDialogTab();
            $("[data-mlab-dt-quiz-input='nextAction']").focus();
            break;
            
        case "nextAction":
            input.val('');
            if (value.toLowerCase() == "p") {
                this.addQuizPage();
                $(content).tabs("enable", this.TABS_ADD_PAGE);
                this.setPropertiesDialogTab(this.TABS_ADD_PAGE);
                $("[data-mlab-dt-quiz-input='pageTitle']").focus();
            
            } else if (value.toLowerCase() == "q") {
                this.setPropertiesDialogTab(this.TABS_ADD_QUESTION);
                $("[data-mlab-dt-quiz-input='explanatory']").focus();
            } else {
                alert("Enter P or Q");
                return;
            }
            
            page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");
            $("div.qtip input:text").val("").removeClass("mc_blurred");
            $("div.qtip textarea").val("").removeClass("mc_blurred");

            break;
            
        default:
            console.log("Error in selection");
    }
};

/**
 * Function to make the different HTML elements that make up a question editable
 * 
 * @param {type} page = the page containing the question to modify
 * @param {type} question = the current question
 * @returns {undefined}
 */
this.makeQuestionEditable = function (container) {
    $(container).find("div[data-mlab-cp-quiz-role='question'] label").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
    $(container).find("div[data-mlab-cp-quiz-role='question']").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
    $(container).find("p, li").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
    $(container).find("label > span").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
    $(container).find("select, option").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
    $(container).find("input[type=text]").off(".start_edit").on("click.start_edit", function(e){ e.preventDefault(); mlab.dt.components.quiz.code.selectElement.call(mlab.dt.components.quiz.code, e); });
};

/**
 * Called when a question or an element inside a question is selected, will make the selected item current, 
 * same for parents up to .mlab_current_component level
 * If the selected element is not the current mlab component we exit to avoid starting editing when all they want to do is to select component
 * @param {type} event
 * @returns {undefined}
 */
this.selectElement = function (event) {
    var curComp = $( "#" + mlab.dt.api.getEditorElement() + "> div.mlab_current_component" );     
    var comp = $(event.currentTarget).parents("[data-mlab-type]");

//select element inside the component, as the component is already set to be current
    if (comp[0] === curComp[0]) {
        event.stopPropagation();
        
//first highlight the selected element and the parent
        var editable_element = $(event.currentTarget);
        var tag = editable_element.prop("tagName").toLowerCase();
        if (tag == "label") {
            var editable_element = $(event.currentTarget).find("span");
            tag = "span";
        }
        var question_element = $(event.currentTarget).parents("[data-mlab-cp-quiz-role='question']");

        if (tag == "div")  {
            this.api.display.componentHighlightSelectedChildren(question_element);
        } else {
            this.api.display.componentHighlightSelectedChildren(question_element, editable_element);
        }
        
//now prepare the editing facility
        switch(tag) {
            case "div": //used to just select current question
                
                break;

            case "li": //fake select box
                editable_element.parent().addClass("editing_mode");
                editable_element.off('.editResponse').on('blur.editResponse', function(e) {
                    var list_item = $(e.currentTarget);
                    list_item.parent().removeClass("editing_mode");
                    list_item.off('.editResponse');
                });

            case "span":
            case "h2":
            case "p":
                editable_element.focus();
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(editable_element[0]);
                sel.removeAllRanges();
                sel.addRange(range);
                
//SPANs are used inside labels for radio buttons / check boxes. When they are edited we must update the value of the matching input
                if (tag == "span") {
                    editable_element.off('.editResponse').on('keypress.editResponse blur.editResponse', function(e) {
                            var label = $(e.currentTarget);
                            var input = label.siblings("input");
                            input.attr("value", label.text());
                            mlab.dt.api.setDirty();
                            if (e.type == "blur") {
                                label.off('.editResponse');
                            }
                        });
                }
                break;
                
            case "input":
                if (editable_element.attr("type").toLowerCase() == "text") {
                    editable_element.focus();
                    editable_element.off('.editResponse').on('keypress.editResponse blur.editResponse', function(e) {
                        var text_element = $(e.currentTarget);
                        text_element.attr("placeholder", text_element.val()).attr("data-mlab-cp-quiz-textvalue", text_element.val());
                        mlab.dt.api.setDirty();
                        if (e.type == "blur") {
                            text_element.off('.editResponse');
                            text_element.val("");
                        }
                    });
              }
              break;
        }

    }
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
this.cancelCurrentQuestion = function(call_close) {
    var page = this.getCurrentPage();
    var question = this.getCurrentQuestion(page);
    var id = "#mlab_dt_quiz_tabs_" + this.domRoot.attr("id");
    var tab_num = $(id).tabs("option", "active");

    if (tab_num != this.TABS_SELECT_ACTION) {
        if ( typeof question != "undefined" && question.length > 0 ) {
            if (confirm("Are you sure you want to cancel the current question? The question will be deleted.")) {
                $(question).remove();
            } else {
                return;
            }
        }
        if (call_close) {
            this.api.closeAllPropertyDialogs();
        }
    } else {
        this.api.closeAllPropertyDialogs();
    }
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

    if (typeof content == "undefined") {
        content = '<h2 class="mc_text mc_display mc_heading mc_medium">{title}</h2>';
    }
    var li = $( this.tabTemplate.replace( /\{href\}/g, location.href.toString() + "#" + new_tab_id ).replace( /\{label\}/g, "Page " + (num_tabs + 1) ) );
    var div = this.tabContentTemplate.replace( /\{id\}/g, new_tab_id ).replace( /\{content\}/g, content ).replace( /\{title\}/g, title );
    
    tabs.find( ".ui-tabs-nav" ).append( li );
    var new_div = $(div).appendTo( tabs );
    $(new_div).find("h2").attr("contenteditable", true);
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
    var alternatives_container = question.find('[data-mlab-cp-quiz-subrole="alternatives"]');
    var display_value = false;
    if (alternatives_container.length == 0) {
        question.append(this.alternativesTemplate);
        alternatives_container = question.find('[data-mlab-cp-quiz-subrole="alternatives"]');
    }

    switch (questionType) {
        case "checkbox": 
            var html = "<label class='mc_text mc_entry mc_info'><input value='" + value + "' class='mc_text mc_entry mc_input' type='checkbox'><span>" + value + "</span></label>";
            break;

        case "radio": 
            var name = question.attr("id");
            var html = "<label class='mc_text mc_entry mc_info'><input value='" + value + "' class='mc_text mc_entry mc_input' type='radio' name='" + name + "'><span>" + value + "</span></label>";
            break;

        case "text":
            var html = "<input class='mc_text mc_entry mc_input' type='text' data-mlab-cp-quiz-textvalue='" + value + "' placeholder='" + value + "'>";
            break;

        case "select":
            var current_select_box = question.find("fieldset > ul"); //using a fieldset to create a fake list box for easier manipulation
            if (current_select_box.length == 0) {
                var html = "<fieldset class='mlab_cp_quiz_select'><legend></legend><ul><li>" + value + "</li></ul></fieldset>";
            } else {
                alternatives_container = current_select_box;
                var html = "<li>" + value + "</li>";
            }
            display_value = true;
            break;

        case "multiselect": 
            var current_select_box = question.find("fieldset > ul");
            if (current_select_box.length == 0) {
                var html = "<fieldset class='mlab_cp_quiz_select'><legend></legend><ul><li class='mc_text mc_entry mc_input' >" + value + "</li></ul></fieldset>";
            } else {
                alternatives_container = current_select_box;
                var html = "<li class='mc_text mc_entry mc_input' >" + value + "</li>";
            }
            break;
    }
    alternatives_container.append(html);
    var correct_response_id = "mlab_dt_quiz_select_response_" + this.domRoot.attr("id");
    var num = $("#" + correct_response_id).find("span").length + 1;
    $("#"  + correct_response_id).append("<span data-mlab-cp-quiz-correct-response='" + num + "'>" + num + " - " + value + "<br></span>");
    
//to ensure that the user sees that the new value is added for drop down boxes, 
// we display it in the LEGEND element of the fake dropdown list
    if (display_value) { 
        question.find("fieldset > legend").text(value);
    }
    
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
            $(question).find('fieldset li').each(function() {
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

//---------- USER INTERACTION FUNCTIONS, RESPONDS TO CLICKS ON EXISTING QUIZ


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
this.custom_add_page = function(el, event) {
    this.addQuizPage();
    var content = this.prepareDialogBox();
    if (typeof el == "undefined") { 
        el = $(".mlab_current_component");
    }
    this.api.displayPropertyDialog(el, "Add quiz page & questions", content, null, null, function () {mlab.dt.components.quiz.code.cancelCurrentQuestion.call(mlab.dt.components.quiz.code, false);}, "[data-mlab-dt-quiz-input='pageTitle']", true, event);
    
};

/**
 * Start adding a new question to currently selected page
 * @param {type} el
 * @returns {undefined}
 */
this.custom_add_question = function(el, event) {
    var page = this.getCurrentPage();
    page.find(".mlab_current_component_child").removeClass("mlab_current_component_child");

    var content = this.prepareDialogBox();
    var el = $(".mlab_current_component");
    
    $(content).tabs("option", "active", 1);
    $(content).tabs("disable", this.TABS_ADD_PAGE);
    this.api.displayPropertyDialog(el, "Add questions", content, null, null, function () {mlab.dt.components.quiz.code.cancelCurrentQuestion.call(mlab.dt.components.quiz.code, false);}, "[data-mlab-dt-quiz-input='explanatory']", true, event);
};

this.custom_delete_response = function(el) {
    var page = this.getCurrentPage();
    debugger;
    page.find(".mlab_current_component_editable").remove();
}

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
this.custom_delete_page = function() {
    var tab_id = this.getCurrentTabId();
    var tabs = $( "#" + tab_id ).tabs();
    var activeTab = tabs.find( ".ui-tabs-active" ).remove().attr( "aria-controls" );
    $( "#" + activeTab).remove();
    tabs.tabs( "refresh" );
    this.api.setDirty();
};

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
this.custom_move_down = function() {
    var q = this.getCurrentQuestion();
    if (q && q.next('[data-mlab-cp-quiz-role="question"]').length > 0) {
        q.fadeOut(500, function(){
            q.insertAfter(q.next('[data-mlab-cp-quiz-role="question"]'));
            q.fadeIn(500);
        });
        this.api.setDirty();
    }
};

/**
 * Wrapper function to move currently selected question OR alternative up
 * @param {type} el
 * @returns {undefined}
 */
this.custom_move_up = function(el) {
    var q = this.getCurrentQuestion();
    if (q && q.prev('[data-mlab-cp-quiz-role="question"]').length > 0) {
        q.fadeOut(500, function(){
            q.insertBefore(q.prev('[data-mlab-cp-quiz-role="question"]'));
            q.fadeIn(500);
        });
        this.api.setDirty();
    }
};

this.custom_set_options = function(el, event) {
    var content = this.getQuizPropertiesDialogHtml();
    //var el = $(".mlab_current_component");
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
    
    this.api.displayPropertyDialog(el, "Set quiz options", content, null, null, null, null, false, event);
    
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
            '        <li class="mlab_dt_tab"><a href="#mlab_dt_quiz_tabs_' + id + '_6">Next action</a></li>' + 
            '    </ul>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_1">' + 
            '        <label class="mlab_dt_text">' + this.editPrompts.pageTitle + '</label>' + 
            '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="pageTitle">' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_large_new_line"></div>' + 
            '    </div>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_2">' + 
            '        <label class="mlab_dt_text">' + this.editPrompts.explanatory + '</label>' + 
            '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="explanatory"></textarea>' + 
            '        <div class="mlab_dt_larger_new_line"></div>' +        
            '        <label class="mlab_dt_text">' + this.editPrompts.question + '</label>' + 
            '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="question"></textarea>' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_larger_new_line"></div>' +                     
            '    </div>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_3">' + 
            '        <label class="mlab_dt_text">' + this.editPrompts.questionType + '</label>' + 
            '        <img class="mlab_dt_picture" id="img_question_type" src="/img/quiz-type.png" style="display: inline-block;">' + 
            '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="questionType">' + 
            '        <div class="mlab_dt_largest_new_line"></div>' +   
            '        <label class="mlab_dt_text">' + this.editPrompts.mandatory + '</label>' + 
            '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="mandatory">' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_large_new_line"></div>' +
            '    </div>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_4">' + 
            '        <label class="mlab_dt_text">' + this.editPrompts.alternatives + '</label>' + 
            '        <textarea class="mlab_dt_medium_textarea " data-mlab-dt-quiz-input="alternatives"></textarea>' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_large_new_line"></div>' +         
            '    </div>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_5">' + 
            '        <p id="mlab_dt_quiz_select_response_' + id + '"></p>' +
            '        <label class="mlab_dt_text">' + this.editPrompts.correctResponse + '</label>' + 
            '        <input class="mlab_dt_large_input " data-mlab-dt-quiz-input="correctResponse">' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_large_new_line"></div>' +         
            '    </div>' + 
            '    <div id="mlab_dt_quiz_tabs_' + id + '_6">' + 
            '        <p id="mlab_dt_quiz_next_action_' + id + '"></p>' +
            '        <label class="mlab_dt_text">' + this.editPrompts.nextAction + '</label>' + 
            '        <input class="mlab_dt_small_input " data-mlab-dt-quiz-input="nextAction">' + 
            '        <div class="mlab_dt_small_new_line">' + cont + '</div>' + 
            '        <div class="mlab_dt_large_new_line"></div>' + 
            '    </div>' + 
            '</div>' + 
            '<input type="button" class="mlab_dt_button_cancel mlab_dt_right" data-mlab-dt-quiz-button="cancel" value="Cancel" onclick="mlab.dt.components.quiz.code.cancelCurrentQuestion(true);">' +
            '<input type="button" class="mlab_dt_button_cancel mlab_dt_right" data-mlab-dt-quiz-button="close" value="Close" onclick="mlab.dt.api.closeAllPropertyDialogs();">' 
            
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

this.escape = function(str) {
    return str.replace("'", "&apos;").replace('"', "&quot;")
}