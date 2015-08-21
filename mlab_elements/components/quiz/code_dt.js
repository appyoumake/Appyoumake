/* Pointer to main element in DOM. Just for convenience. */
this.domRoot = null;

/* Flag indicating if component is initialized or not. */
this.initialized = false;


/* Class names are long and easy to misspell, so we define them all here.
 * Make sure to check in the CSS rules above if you change any of these. */
this.classes = {
    root: "mlab_quiz",
    page: "mlab_quiz_page",
    questions: "mlab_quiz_questions",
    question: "mlab_quiz_question",
    questionText: "mlab_quiz_question_text",
    questionAlternatives: "mlab_quiz_question_alternatives",
    textInput: "mlab_quiz_text_input",
    line: "mlab_quiz_line",
    hide: "mlab_quiz_hide",
    
    qtip: "mlab_dt_quiz_dialog_input",

    dtOnly: "mlab_dt_quiz_dtonly", // All elements with this class will be removed on save
    nav: "mlab_dt_quiz_page_nav",
    disabled: "mlab_dt_quiz_disabled",
    active: "mlab_dt_quiz_active",
    editable: "mlab_dt_quiz_editable",
    addPage: "mlab_dt_quiz_page_add",
    removePage: "mlab_dt_quiz_page_remove",
    factory: "mlab_dt_factory",
    floated: "mlab_dt_floated",
    userPrompt: "mlab_dt_user_prompt",
    helpText: "mlab_dt_help_text",
    userInput: "mlab_dt_user_input",
    cancelButton: "mlab_dt_cancel",
    finishButton: "mlab_dt_finish",
    correctResponse: "mlab_dt_correct_response",
    correctResponseAlternative: "mlab_dt_correct_response_alternative",
    mandatory: "mlab_dt_response_mandatory",
    questionType: "mlab_dt_quiz_question_type",
    meta: "mlab_dt_quiz_meta",
    dialogLink: "mlab_dt_quiz_dialog_link",
    currentQuestion: "mlab_dt_quiz_current_question",
    markedAlternative: "mlab_dt_quiz_alternative_marked"
};

/* Question types available. Order matches user's input value. */
this.questionTypes = [
    {"type": "text", "name": "Tekst/tall", "order": 1},
    {"type": "radio", "name": "Radioknapper (ett riktig svar)", "order": 2},
    {"type": "select", "name": "Nedtrekksmeny (ett riktig svar)", "order": 3},
    {"type": "checkbox", "name": "Avkrysning (flere riktige svar)", "order": 4}
];


this.editStages = [
    "pageTitle",
    "question",
    "questionType",
    "alternatives",
    "correctResponse",
    "mandatory"
];

this.editPrompts = {
    "pageTitle": "Vennligst legg inn tittel på siden. Avslutt med enter-tast.",
    "questionType": "Velg spørsmålstype: <br/>%types%<br/> Avslutt med enter-tast.",
    "question": "Skriv inn forklarende tekst eller spørsmål, spørsmål indikeres med spørsmålstegn etterfulgt av enter-tast.",
    "alternatives": "Skriv inn alternativer. Avslutt hvert alternativ med enter-tast. Når du er ferdig, legg inn tom linje.",
    "correctResponse": [
        "Skriv inn riktig svar. Avslutt med enter-tast.", 
        "Velg riktig svar. Skriv nummeret eller klikk på alternativet. Avslutt med enter-tast.", 
        "Velg riktige svar. Skriv numrene, adskilt med mellomrom eller klikk på alternativene. Avslutt med enter-tast."
    ], // text, single select, multi select
    "mandatory": "Er det obligatorisk å svare på dette spørsmålet? Svar med Y/y (for ja) eller N/n for (nei). Avslutt med enter-tast."
};



//---------- SETUP FUNCTIONS, BOTH FOR COMPONENT AND QUIZ CONTENT 

/* Hook called when component is created.
 * @param {jQuery} el Main element for component. 
 */
this.onCreate = function (el) {
    this.onLoad(el);
    this.custom_edit_quiz(el);
};

/* Hook called when component is loaded into app.
 * @param {jQuery} el Main element for component. 
 */
this.onLoad = function (el) {
    this.globalSetup(el);
    if (!this.domRoot.length) return; 
    if (this.initialized) return;
    this.domRoot.find("style").remove();
//     this.domRoot.prepend(this.css);
//    this.setupDesign();
};

/* Indicator of how much of a quiz is actually set up. Returns number of questions in quiz.
 * @return {int} Number of questions in quiz.
 */
this.getContentSize = function() {
    return this.domRoot.find("." + this.classes.question).length;
};

/* Helper function that sets up basic stuff.
 * @param {jQuery} el Main element for component.
 */
this.globalSetup = function(el) {
    this.domRoot = el.find("." + this.classes.root);
    var id = this.domRoot.attr("id");
    if (!id) {
        id = this.api.getGUID();
        this.domRoot.attr("id", id);
    }
};

/* Sets up quiz builder functionality, adding elements, listeners, etc
 */
this.setupDesign = function() {
    var self = this;
    var pages = self.domRoot.find("." + self.classes.page);
    var nav = $('<ul class="' + self.classes.nav + ' ' + self.classes.dtOnly + '"></ul>').prependTo(self.domRoot);
    self.addStoredQuestions();
    pages.each(function () {
        var page = $(this);
        var title = page.find("h2").text();
        nav.append('<li><a href="#' + page.attr("id") + '">' + title + '</a></li>');    
        self.setUpPage(page);
    });
    nav.append('<li><a class="' + self.classes.addPage + ' ' + self.classes.disabled + '">+</a></li>');
    // Add first page, if there is none
    if (!pages.length) self.addQuizPage();


    self.domRoot.on("click", "." + this.classes.addPage, function() {
        self.addQuizPage();
        return false;
    });
    self.domRoot.on("click", "." + this.classes.removePage, function() {
        self.removeQuizPage($(this));
    });

    self.domRoot.on("keyup", "." + this.classes.userInput, function(e) {
        self.handleUserInput($(this), e);
    });

    self.domRoot.on("click", "." + this.classes.cancelButton, function() {
        self.cancelCurrentQuestion();
    });

    self.domRoot.on("click", "." + this.classes.finishButton, function() {
        self.finishAddingQuestions();
    });


    self.domRoot.on("click", "." + this.classes.editable, function() {
        var ob = $(this);
        self.api.editContent(ob);
        ob.focus();
        return false;
    });
    self.domRoot.on("blur", "." + this.classes.editable, function() {
        var ob = $(this);
        if (ob.closest("." + self.classes.questions).length) self.saveQuestions();
        else self.api.setDirty();
        ob.removeAttr("contenteditable");
        return true;
    });

    self.domRoot.on("input", "." + self.classes.page + " > h2", function() {
        var ob = $(this);
        var page = ob.closest("." + self.classes.page);
        self.domRoot.find("." + self.classes.nav + " li a[href='#" + page.attr("id") + "']").text(ob.text());
    });
    
    self.domRoot.on("click", "." + self.classes.question, function() {
        self.questionClicked($(this));
    });
    
    self.domRoot.on("click", "." + self.classes.questionAlternatives + " li", function() {
        self.alternativeClicked($(this));
        return false;
    });
    
    $("body").on("click", "." + self.classes.dialogLink, function() {
        self.dialogLinkClick($(this));
        return false;
    });

    self.initTabs();
// Adding role="none", to prevent jQuery mobile from turning my inputs and buttons into jQuery UI elements
    self.domRoot.find(":input").attr("data-role", "none");
};

/* Sets up page for editing and adding quesions.
 * @param {jQuery} page The page to be set up.
 * @param {boolean} setActive Whether or not the page should be set as the active page. 
 */
this.setUpPage = function(page, setActive, editStage) {
    if (page.data("setupComplete")) return;
    if (!editStage) {
        if (!page.find("h2").text()) editStage = "pageTitle";
        else editStage = "questionType";
    }
    var footer = $('<footer class="' + this.classes.dtOnly + '">'
        + '<section class="' + this.classes.hide + ' ' + this.classes.factory + '">'
        + '    <section class="' + this.classes.userPrompt + '"></section>'
        + '    <section class="' + this.classes.helpText + '"></section>'
        + '    <input name="user_input" type="text" class="' + this.classes.userInput + '" />'
        + '    <input type="button" class="' + this.classes.cancelButton + '" value="Avbryt" />'
        + '    <input type="button" class="' + this.classes.finishButton + '" value="Ferdig" />'
        + '</section>'
        + '<input type="button" class="mlab_dt_button_right ' + this.classes.removePage + '" value="Fjern side" />'
        + '</footer>');
    page.append(footer);
    var link = this.domRoot.find('a[href="#' + page.attr("id") + '"]');
    if (setActive) this.switchTabs(link);
    this.enterEditMode(page, editStage);
    page.data("setupComplete", true);
};

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
this.custom_edit_quiz = function(el) {

    var self = this;
    var id = this.domRoot.attr("id");
    
    var content = $('<div id="mlab_dt_quiz_tabs_' + id + '">' + 
                    '    <ul>' + 
                    '        <li><a href="#mlab_dt_quiz_tabs_' + id + '_1">Page</a></li>' + 
                    '        <li><a href="#mlab_dt_quiz_tabs_' + id + '_2">Question</a></li>' + 
                    '        <li><a href="#mlab_dt_quiz_tabs_' + id + '_3">Type</a></li>' + 
                    '        <li><a href="#mlab_dt_quiz_tabs_' + id + '_4">Responses</a></li>' + 
                    '    </ul>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_1">' + 
                    '        <label>' + this.editPrompts.pageTitle + '</label>' + 
                    '        <input class="' + this.classes.userInput + '" id="mlab_dt_quiz_title_' + id  + '">' + 
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_2">' + 
                    '        <label>' + this.editPrompts.question + '</label>' + 
                    '        <textarea class="' + this.classes.userInput + '" id="mlab_dt_quiz_question_' + id  + '"></textarea>' + 
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_3">' + 
                    '        <label>' + this.editPrompts.questionType + '</label>' + 
                    '        <img id="img_question_type" src="/img/quiz-type.png" style="display: inline-block;">' + 
                    '        <input class="' + this.classes.userInput + '" id="mlab_dt_quiz_type_' + id  + '">' + 
                    '    </div>' + 
                    '    <div id="mlab_dt_quiz_tabs_' + id + '_4">' + 
                    '        <label>' + this.editPrompts.alternatives + '</label>' + 
                    '        <textarea class="' + this.classes.userInput + '" id="mlab_dt_quiz_response_' + id  + '"></textarea>' + 
                    '        <input type="button" class="' + this.classes.finishButton + '" value="Ferdig">' + 
                    '    </div>' + 
                    '</div>' + 
                    '<input type="button" class="' + this.classes.cancelButton + '" value="Avbryt">' 
                    );

    $(content).on("keyup", "." + self.classes.userInput, function(e) {
        self.handleUserInput(e);
    });

    $(content).on("click", "." + self.classes.cancelButton, function() {
        self.cancelCurrentQuestion();
    });

    $(content).on("click", "." + self.classes.finishButton, function() {
        self.finishAddingQuestions();
    });

    this.api.displayPropertyDialog(el, "Edit map", content, null, self.callbackMakeTabs);
};

/**
 * Helper function for custom_edit_quiz, it is called when qtip properties box is displayed so we can turn on tabs
 * @param {type} el
 * @returns {undefined}
 */
this.callbackMakeTabs = function(el) {
    var quiz = el.find(".mlab_quiz");
    var id = quiz.attr("id");
    var self = mlab.dt.components.quiz.code;

    $("#mlab_dt_quiz_tabs_" + id + " ul li a").each(function() {
        $(this).attr("href", location.href.toString() + $(this).attr("href"));
    });
    $("#mlab_dt_quiz_tabs_" + id).tabs();
    
}



//---------- FUNCTIONS FOR STORING QUIZ INFORMATION

/* Hook called when app is saved. Returns the HTML that is saved for this component, and must contain enough information to continue 
 * editing when user opens the app in MLAB the next time, and to run the component in rumtime.
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
this.onSave = function (el) {
    var html = $('<div>' + el.outerHTML + '</div>');
    html.find("." + this.classes.dtOnly).remove();
    html.find("[contenteditable]").removeAttr("contenteditable");
    return html.html();
};

/* Saves the added questions and alternatives. Since the layout and functionality for the questions are radically different in DT and RT, 
 * we save only the necessary pieces of information using MLAB's setVariable. This information is used to recreate the question when
 * component is reopened in DT, or started in RT.
 */
this.saveQuestions = function() {
    var self = this;
    var questions = {};
    self.domRoot.find("." + self.classes.page).each(function() {
        var page = $(this);
        var pageId = page.attr("id");
        questions[pageId] = [];
        page.find("." + self.classes.question).each(function() {
            var question = $(this);
            var questionId = question.data("questionid");
            var questionType = question.data("questiontype");
            if (!questionType) questionType = "text";
            var questionOb = {}
            questionOb["id"] = questionId;
            questionOb["question"] = question.find("." + self.classes.questionText).text();
            questionOb["type"] = questionType;
            questionOb["correctResponse"] = self.getCorrectResponse(question);
            questionOb["alternatives"] = [];
            question.find("." + self.classes.questionAlternatives + " li").each(function() {
                questionOb["alternatives"].push($(this).text());
            });
            questionOb["mandatory"] = question.data("mandatory");
            questions[pageId].push(questionOb);
        });
    });
    self.api.setVariable(self.domRoot, "questions", questions);
// Tell MLAB that there's something to save
    self.api.setDirty();
};



//---------- MAIN FUNCTIONS THAT DEAL WITH USER ACTIONS DURING QUIZ CREATION

/**
 * Here we process the user input from the 
 * @param {type} e
 * @returns {undefined}
 */
this.handleUserInput = function(e) {
    var enterKey = 13;
    // Only proceed if we have hit enter
    if (e.which!=enterKey) return;

    var editStage = input.data("editStage");
    var existing = input.data("existing");
    var value = input.val();
    var page = input.closest("." + this.classes.page);
    var helpText = input.siblings("." + this.classes.helpText).empty();
    var question = this.getCurrentQuestion(page);
    var questionType = question.data("questiontype");
    var proceed = true;
    switch (editStage) {
        case this.editStages.indexOf("pageTitle"):
            page.find("h2").text(value).removeClass(this.classes.hide).trigger("input");
            break;
        case this.editStages.indexOf("questionType"):
            value = parseInt(value);
            var minValue = 1;
            var maxValue = this.questionTypes.length;
            if (!existing && question.length) {
                maxValue += 1;
                if (value==maxValue) {
                    // We have selected to not add any more questions.
                    this.finishAddingQuestions(page);
                    proceed = false;
                    break;
                }
            }
            if (!value || value<minValue || value>maxValue) {
                input.val('');
                helpText.text("Gyldige verdier: " + minValue + " - " + maxValue);
                proceed = false;
            }
            else if (existing) {
                this.changeQuestionType(page, question, value);
                editStage = this.editStages.length;
            }
            else {
                this.addQuestion(page, value);
            }
            break;
        case this.editStages.indexOf("question"):
            question.find("." + this.classes.questionText).append('<p class="' + this.classes.editable + '">' + value + '</p>').removeClass(this.classes.hide);
            if (value.slice(-1)!="?") proceed = false;
            input.val('');
            break;
        case this.editStages.indexOf("alternatives"):
            proceed = !this.addQuestionAlternative(question, value, questionType);
            input.val('');
            break;
        case this.editStages.indexOf("correctResponse"):
            proceed = this.addCorrectResponse(question, value, questionType);
            input.val('');
            break;
        case this.editStages.indexOf("mandatory"):
            if (value=="Y" || value=="y") value = true;
            else if (value=="N" || value=="n") value = false;
            if ((typeof value)!="boolean") proceed = false;
            else this.setMandatory(question, value);
            input.val('');
            break;
        default:
            proceed = false;
    }
    editStage++;
    if (editStage>=this.editStages.length) {
        // We are done with this question, move on to the next one
        if (existing) {
            proceed = false;
            this.finishAddingQuestions(page);
            input.data("existing", false);
        }
        editStage = 1;
        this.saveQuestions();
    }
    if (existing) this.floatFactory(question);
    if (proceed) this.enterEditMode(page, this.editStages[editStage], question, existing);
};

//this function will process user input after each possible stage in the process
this.enterEditMode = function(page, editStage, question, existing) {
    var factory = page.find("." + this.classes.factory);
    var prompt = factory.find("." + this.classes.userPrompt);
    var input = factory.find("." + this.classes.userInput);
    if (!question) question = this.getCurrentQuestion(page);
    if (!existing) existing = false;
    var questionType = question.data("questiontype");
    
// If text question, skip alternatives stage
    if (editStage=="alternatives" && questionType=="text") editStage = this.editStages[this.editStages.indexOf(editStage) + 1];
    input.data("editStage", this.editStages.indexOf(editStage));
    input.data("existing", existing);
    if (editStage!="questionType") factory.find("input." + this.classes.cancelButton).show();
    else factory.find("input." + this.classes.cancelButton).hide();
    var promptText = "";
    if (editStage=="questionType") {
        promptText = this.editPrompts[editStage];
        var typesText = [];
        for (var i=0, ii=this.questionTypes.length; i<ii; i++) {
            typesText.push(i+1 + ": " + this.questionTypes[i]["name"] + ".");
        }
        if (!existing && this.getLastQuestion(page).length) typesText.push(this.questionTypes.length + 1 + ": Ikke legg til flere spørsmål.");
        promptText = promptText.replace("%types%", typesText.join("<br/>"));
    }
    else if (editStage=="correctResponse") {
        promptText = this.editPrompts[editStage];
        if (questionType=="text") {
            promptText = promptText[0];
        }
        else if (questionType=="radio" || questionType=="select") {
            promptText = promptText[1];
        }
        else if (questionType=="checkbox") {
            promptText = promptText[2];
        }
        
        question.find("." + this.classes.questionAlternatives + " li").on("click", function() {
            if (editStage!="correctResponse") return true;
            var item = $(this);
            var itemNumber = item.index() + 1;
            var inputVal = input.val().split(" ");
            var values = [];
            for (var i=0, ii=inputVal.length; i<ii; i++) {
                var val = parseInt(inputVal[i]);
                if (val) values.push(val);
            }
            if (values.indexOf(itemNumber)==-1) values.push(itemNumber);
            input.val(values.join(" "));
            return false;
        });
    }
    else promptText = this.editPrompts[editStage];
    
    if (editStage!="correctResponse") question.find("." + this.classes.questionAlternatives + " li").off("click");
    if (existing) this.floatFactory(question, factory, page);
    else this.unfloatFactory(factory, page);
    factory.removeClass(this.classes.hide);
    prompt.html(promptText);
    input.val('').focus();
};



//---------- HELPER FUNCTIONS EXECUTING USER ACTIONS DURING QUIZ CREATION

/**
 * cancels current question, removes HTML and closes the qtip input dialog
 * @returns {undefined}
 */
this.cancelCurrentQuestion = function() {
    var page = this.getActivePage();
    var question = this.getCurrentQuestion(page);
    var input = page.find("." + this.classes.userInput);
    if (input.data("editStage")>1) {
        this.removeQuestion(question);
        this.enterEditMode(page,"questionType");
    }
    mlab.dt.api.closeAllPropertyDialogs();
};

/**
 * Requests 
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

this.getQuestionType = function(type) {
    var questionType;
    for (var i=0, ii=this.questionTypes.length; i<ii; i++) {
        if (this.questionTypes[i]["type"]==type) {
            questionType = this.questionTypes[i];
            break;
        }
    }
    return questionType;
};

/* Fetches stored questions, adds them to pages and sets them up for further editing.
 */
this.addStoredQuestions = function() {
    var self = this;
    var allQuestions = self.api.getVariable(self.domRoot, "questions");
    if (!allQuestions) allQuestions = {};
    self.domRoot.find("." + self.classes.page).each(function() {
        var page = $(this);
        var pageId = page.attr("id");
        if (!(pageId in allQuestions)) return true;
        var pageQuestions = allQuestions[pageId];
        
        for (var i=0, ii=pageQuestions.length; i<ii; i++) {
            var questionType = self.getQuestionType(pageQuestions[i]["type"]);
            var question = self.addQuestion(page, questionType["order"], pageQuestions[i]["question"], pageQuestions[i]["id"]);
            var alternatives = pageQuestions[i]["alternatives"];
            for (var j=0, jj=alternatives.length; j<jj; j++) {
                self.addQuestionAlternative(question, alternatives[j], questionType["type"]);
            }
            if (pageQuestions[i]["correctResponse"]) {
                if (questionType["type"]=="checkbox") {
                    self.addCorrectResponse(question, pageQuestions[i]["correctResponse"], questionType["type"]);
                }
                else self.addCorrectResponse(question, pageQuestions[i]["correctResponse"], questionType["type"]);
            }
            self.setMandatory(question, pageQuestions[i]["mandatory"]);
        }
    });
};

/* Adds a new page to the quiz.
 */
this.addQuizPage = function() {
    // tabs require the use of IDs
    var uuid = this.api.getGUID();
    var pages = this.domRoot.find("." + this.classes.page);
    var nav = this.domRoot.find("." + this.classes.nav);
    var title = 'Side ' + (pages.length+1);
    var content = '<h2 class="' + this.classes.hide + ' ' + this.classes.editable + '"></h2>'
        + '<ul class="' + this.classes.questions + '"></ul>';
    
    nav.find("." + this.classes.addPage).closest("li").before('<li><a href="#' + uuid + '">' + title + '</a></li>');
    var lastPage = this.domRoot.find("." + this.classes.page).eq(-1);
    if (!lastPage.length) lastPage = nav;
    lastPage.after('<section class="' + this.classes.page + '" id="' + uuid + '">' + content + '</section>');
    var page = this.domRoot.find("#" + uuid);
    this.setUpPage(page, true);
    
    this.api.setDirty();
};

this.floatFactory = function(question, factory, page) {
    if (!page) page = question.closest("." + this.classes.page);
    if (!factory) factory = page.find("." + this.classes.factory);
    
    var top = question.position()["top"];
    top += question.outerHeight();
    var bottom = top + factory.outerHeight();
    factory.css({"top": top + "px"});
    factory.addClass(this.classes.floated);
    if (bottom>page.outerHeight()) page.css({"height":bottom + "px"});
};

this.unfloatFactory = function(factory, page) {
    if (!factory) factory = page.find("." + this.classes.factory);
    if (!page) page = factory.closest("." + this.classes.page);
    factory.removeClass(this.classes.floated);
    page.css({"height": "auto"});
};

this.setMandatory = function(question, value) {
    question.data("mandatory", value);
    if (value) question.addClass(this.classes.mandatory);
    else question.removeClass(this.classes.mandatory);
};

this.addQuestionAlternative = function(question, value, questionType) {
    var added = false;
    if (value && (questionType=="radio" || questionType=="select" || questionType=="checkbox")) {
        var alternatives = question.find("." + this.classes.questionAlternatives)
        var alternativesList = alternatives.find("ol");
        alternativesList.append('<li>' + value + '</li>');
        alternatives.removeClass(this.classes.hide);
        added = true;
    }
    return added;
};

this.addCorrectResponse = function(question, value, questionType) {
    var proceed = true;
    var correctResponse = "";
    if (questionType=="text" || questionType=="radio" || questionType=="select") {
        correctResponse = value;
    }
    else if (questionType=="checkbox") {
        if (value) {
            if (typeof value=="object") value = value.join(" ");
            if (typeof value!="string") value = value.toString();
            value = value.split(" ");
            for (var i=0, ii=value.length; i<ii; i++) {
                var val = parseInt(value[i]);
                if (val) value[i] = val;
            }
            value = value.join(" ");
            correctResponse = value;
        }
    }
    question.data("correctResponse", correctResponse);
    var correctResponse = question.find("." + this.classes.correctResponse);
    if (questionType=="text") {
        correctResponse.find("label").text(value);
        correctResponse.show();
    }
    else {
        this.markAlternativesAsCorrect(question,questionType);
        correctResponse.hide();
    }

    return proceed;
};

this.markAlternativesAsCorrect = function(question, questionType) {
    var value = question.data("correctResponse");
    var alternatives = question.find("." + this.classes.questionAlternatives + " li").removeClass(this.classes.correctResponseAlternative);
    if (questionType=="radio" || questionType=="select") {
        value = [value];
    }
    else if (questionType=="checkbox") {
        if (typeof value!="string") value = value.toString();
        value = value.split(" ");
    }
    for (var i=0, ii=value.length; i<ii; i++) {
        alternatives.eq(parseInt(value[i])-1).addClass(this.classes.correctResponseAlternative);
    }
};

this.finishAddingQuestions = function(page) {
    if (!page) page = this.getActivePage();
    page.find("." + this.classes.factory).addClass(this.classes.hide);
    this.unfloatFactory(null, page);
    return true;
};

/* Makes a new question
 * @param {jQuery} page If no button was clicked, the page we want to add the question to, must be provided.
 * @param {string} type The type of the question. Defaults to type "text".
 * @param {string} questionText The actual question being asked. If not provided, a text is generated.
 * @param {string} uuid Unique ID for question, for existing questions. If not provided, one is generated.
 * @return {jQuery} The question that was added.
 */
this.makeQuestion = function(page, type, questionText, uuid) {
    if (!questionText) questionText = "";
    if (!type) type = 1;
    if (!uuid) uuid = this.api.getGUID();
    var typeOb = this.questionTypes[type-1];
    var typeType = typeOb["type"];
    var typeName = typeOb["name"];
    var question = $('<li class="' + this.classes.question + ' ' + this.classes.dtOnly + '"></li>');
    question.append('<span class="' + this.classes.line + '">'
        + '<label class="' + this.classes.questionText + ' '  + this.classes.hide + '">' + questionText + '</label>'
        + '</span>'
        + '<span class="' + this.classes.line + ' ' + this.classes.questionType + '">'
        + '<label>' + typeName + '</label>'
        + '</span>'
        + '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + ' ' + this.classes.hide + '">'
        + '<ol class="' + this.classes.meta + '"></ol>'
        + '</span>'
        + '<span class="' + this.classes.line + ' ' + this.classes.correctResponse + ' ' + this.classes.hide + '">'
        + '<span>Korrekt svar:</span><label></label>'
        + '</span>'
        + '<section></section>');
    question.data("questionid", uuid);
    question.data("questiontype", typeType);
    return question;
};

this.addQuestion = function(page, type, questionText, uuid) {
    var questions = page.find("." + this.classes.questions);
    var question = this.makeQuestion(page, type, questionText, uuid);
    question = question.appendTo(questions);
    this.markQuestionAsCurrent(question);
    return question;
};

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
    
    var newQuestion = self.makeQuestion(page, type, questionText);
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

this.alternativeClicked = function(alternative) {
    this.closeAllPropertyDialogs();
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
    this.api.displayPropertyDialog(alternative, "Redigér svaralternativ", html);
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

this.questionClicked = function(question) {
    this.closeAllPropertyDialogs();
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

this.markQuestionAsCurrent = function(question) {
    question.siblings("." + this.classes.currentQuestion).removeClass(this.classes.currentQuestion);
    question.addClass(this.classes.currentQuestion);
};

this.getCurrentQuestion = function(page) {
    if (!page) page = this.getActivePage();
    var question = page.find("." + this.classes.currentQuestion).first();
    if (!question.length) question = this.getLastQuestion(page);
    return question; 
};

this.getLastQuestion = function(page) {
    var question = page.find("." + this.classes.questions + " ." + this.classes.question).last();
    return question;
};

this.dialogLinkClick = function(link) {
    var linkFunction = link.data("function");
    this.closeAllPropertyDialogs();
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

/*
The function in API of the same name simply does not work. Creating our own.
*/
this.closeAllPropertyDialogs = function() {
    $("body .qtip").qtip("destroy");
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

this.removeAlternative = function(alternative) {
    if (this.alternativeIsCorrect(alternative)) this.toggleAlternativeCorrectness(alternative);
    alternative.remove();
    this.saveQuestions();
};

this.moveAlternativeUp = function(alternative) {
    var previous = alternative.prev("." + this.classes.questionAlternatives + " li");
    var isCorrect = this.alternativeIsCorrect(previous);
    if (isCorrect) this.toggleAlternativeCorrectness(previous);
    previous = this.switchPositions(previous, alternative);
    if (isCorrect) this.toggleAlternativeCorrectness(previous);
}

this.moveAlternativeDown = function(alternative) {
    var isCorrect = this.alternativeIsCorrect(alternative);
    if (isCorrect) this.toggleAlternativeCorrectness(alternative);
    var next = alternative.next("." + this.classes.questionAlternatives + " li");
    alternative = this.switchPositions(alternative, next);
    if (isCorrect) this.toggleAlternativeCorrectness(alternative);
}

this.toggleMandatory = function(question) {
    this.setMandatory(question, !question.data("mandatory"));
};

this.removeQuestion = function(question) {
    question.remove();
    this.saveQuestions();
};

/* Removes a page from the component. 
 * @param {jQuery} button The button that was clicked to remove the page.
 */
this.removeQuizPage = function(button) {
    var page = button.closest("." + this.classes.page);
    var link = this.domRoot.find('a[href="#' + page.attr("id") + '"]');
    var li = link.parent();
    var neighbour = li.siblings("li").eq(0);
    this.switchTabs(neighbour.find("a"));
    page.remove();
    li.remove();
    this.api.setDirty();
};


/* Initiates a tab system for component. Not using jQuery UI's tabs because of conflict with base href value.
 */
this.initTabs = function() {
    if (this.domRoot.data("tabsinit")) return;
    var me = this;
    this.domRoot.on("click", "." + this.classes.nav + " a", function() { return me.switchTabs($(this)); });
    var pages = this.domRoot.find("." + this.classes.page);
    pages.hide();
    this.domRoot.data("tabsinit", true);
    // Set first page as active
    this.switchTabs(this.domRoot.find("." + this.classes.nav + " a").eq(0));
};

/* Switch to a different tab pane.
 * @param {jQuery} link The link that was clicked.
 * @return {boolean} Always false
 */
this.switchTabs = function(link) {
    if (link.hasClass(this.classes.disabled)) return true;
    var target = this.domRoot.find(link.attr("href"));
    var pages = this.domRoot.find("." + this.classes.page).not(target);
    if (pages.length) {
        pages.hide(0, function() {
            target.show(0);
        });
    }
    else target.show();
    link.addClass(this.classes.active);
    this.domRoot.find("." + this.classes.nav + " a").not(link).removeClass(this.classes.active);
    return false;
};

this.updateTab = function(el) {
    var title = el.text();
    var pageId = el.closest("." + this.classes.page).attr("id");
    this.domRoot.find("." + this.classes.nav + " a[href='#" + pageId + "']").text(title);
};

this.getActivePage = function() {
    var activeLink = this.domRoot.find("." + this.classes.nav + " a." + this.classes.active);
    return this.domRoot.find(activeLink.attr("href"));
};

this.switchPositions = function(firstOb, secondOb) {
    if (!firstOb.length || !secondOb.length) return;
    firstObClone = firstOb.clone();
    firstOb.remove();
    secondOb.after(firstObClone);
    return firstObClone;
};

this.custom_add_question = function(el) {
    var page = this.getActivePage();
    page.find("." + this.classes.currentQuestion).removeClass(this.classes.currentQuestion);
    this.enterEditMode(page,"questionType");
};

this.custom_move_question_up = function(question) {
    var previous = question.prev("." + this.classes.question);
    this.switchPositions(previous, question);
};

this.custom_move_question_down = function(question) {
    var next = question.next("." + this.classes.question);
    this.switchPositions(question, next);
};

