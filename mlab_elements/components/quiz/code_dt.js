/* Pointer to main element in DOM. Just for convenience. */
this.domRoot = null;

/* Flag indicating if component is initialized or not. */
this.initialized = false;

/* CSS rules for design time. Since all of the HTML is added by JS, it makes sense to add CSS by JS too. */
this.css = '<style type="text/css">'
    + '/* Common rules */'
    + '.mlab_quiz, .mlab_quiz * { box-sizing: border-box; -moz-box-sizing: border-box; }'
    + '.mlab_quiz .mlab_quiz_page { width: 100%; border: 1px solid; padding: 0.5em; }'
    + '.mlab_quiz .mlab_quiz_page h4 { margin-top: 0px; }'
    + '.mlab_quiz .mlab_quiz_page footer { display: inline-block; width: 100%; padding-top: 0.5em; }'
    + '.mlab_quiz .mlab_quiz_line { display: block; width: 100%; clear: both; padding-bottom: 0.3em; }'
    + '.mlab_quiz .mlab_quiz_line label { display: inline !important; margin-right: 0.2em; font-size: 1.2em; line-height: 1.4em; }'
    + '.mlab_quiz ul.mlab_quiz_questions { padding: 0 0.5em !important; }'
    + '.mlab_quiz .mlab_quiz_question { display: block; width: 100%; margin-bottom: 0.5em; padding: 0.5em; border: 1px solid transparent; border-bottom: 1px solid; }'
    + '.mlab_quiz .mlab_quiz_question input, .mlab_quiz .mlab_quiz_question select { font-size: 1.2em; }'
    + '.mlab_quiz .mlab_quiz_question select { width: 100%; }'
    + '.mlab_quiz .mlab_quiz_text_input { width: 100%; }'
    + '/* RT only */'
    + '.mlab_quiz .mlab_quiz_button_prev { float: left; }'
    + '.mlab_quiz .mlab_quiz_button_next { float: right; }'
    + '.mlab_quiz textarea { width: 100%; height: 7em; }'
    + '.mlab_quiz .mlab_quiz_question_text { padding-bottom: .5em; }'
    + '.mlab_quiz .mlab_quiz_question_ok { border: 1px solid green; border-radius: 3px; }'
    + '.mlab_quiz .mlab_quiz_question_not_ok { border: 1px solid red; border-radius: 3px; }'
    + '.mlab_quiz .mlab_quiz_correct_answer { color: green; }'
    + '</style>'
    + '<style type="text/css" class="mlab_dt_quiz_dtonly">'
    + '/* DT only */'
    + '.mlab_quiz ul.mlab_dt_quiz_page_nav { width: 100%; list-style: none !important; margin: 0 !important; padding:  0.2em 0 !important; }'
    + '.mlab_quiz ul.mlab_dt_quiz_page_nav li { margin: 0; padding: 0.2em 0; display: inline; }'
    + '.mlab_quiz ul.mlab_dt_quiz_page_nav li a { padding: 0.2em 0.8em; margin-right: -1px; border: 1px solid; border-bottom: 0; text-decoration: none; color: inherit; border-radius: 3px 3px 0px 0px; cursor: pointer; background-color: transparent; color: white; }'
    + '.mlab_quiz ul.mlab_dt_quiz_page_nav li a.mlab_dt_quiz_page_add { padding: 0.2em; 0.2em; }'
    + '.mlab_quiz ul.mlab_dt_quiz_page_nav li a.mlab_dt_quiz_active { background-color: white; color: black; }'
    + '.mlab_quiz .mlab_dt_quiz_question_type, .mlab_quiz .mlab_quiz_question section { font-size: 0.8em;  }'
    + '.mlab_quiz .mlab_dt_quiz_question_add_alternatives > span:first-of-type { padding-left: 1.65em; }'
    + '.mlab_quiz .mlab_dt_quiz_controls { margin-bottom: 10px; }'
    + '.mlab_quiz .mlab_dt_quiz_controls label { width: auto; display: inline; }'
    + '.mlab_quiz .mlab_dt_quiz_controls input { }'
+ '</style>';


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

    dtOnly: "mlab_dt_quiz_dtonly", // All elements with this class will be removed on save
    nav: "mlab_dt_quiz_page_nav",
    disabled: "mlab_dt_quiz_disabled",
    active: "mlab_dt_quiz_active",
//     quizControls: "mlab_dt_quiz_controls",
    editable: "mlab_dt_quiz_editable",
    addPage: "mlab_dt_quiz_page_add",
    removePage: "mlab_dt_quiz_page_remove",
    addQuestion: "mlab_dt_quiz_question_add",
    removeQuestion: "mlab_dt_quiz_question_remove",
    questionType: "mlab_dt_quiz_question_type",
    changeQuestionType: "mlab_dt_quiz_question_change_type",
    addQuestionAlternative: "mlab_dt_quiz_question_add_alternative"
};

/* Question types available. */
this.questionTypes = {
    "text": "Tekst/tall",
    "checkbox": "Ja/nei-svar",
    "select": "Flervalgsspørsmål (nedtrekksmeny)",
    "multicheck": "Flervalgsspørsmål (avkrysning, flere svar)"
};


/* Hook called when component is created.
 * @param {jQuery} el Main element for component. 
 */
this.onCreate = function (el) {
    console.log("onCreate");
    this.globalSetup(el);
    
    this.onLoad(el);
}
/* Hook called when component is loaded into app.
 * @param {jQuery} el Main element for component. 
 */
this.onLoad = function (el) {
    console.log("onLoad");
    this.globalSetup(el);
    if (!this.domRoot.length) return; 
    if (this.initialized) return;
    this.domRoot.find("style").remove();
    this.domRoot.prepend(this.css);
    this.setupDesign();
};
/* Hook called when app is saved. Returns the HTML that is saved for this component, and must contain enough information to continue 
 * editing when user opens the app in MLAB the next time, and to run the component in rumtime.
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
this.onSave = function (el) {
    console.log("onSave");
    var html = $('<div>' + el.outerHTML + '</div>');
    html.find("." + this.classes.dtOnly).remove();
    html.find("[contenteditable]").removeAttr("contenteditable");
    return html.html();
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
    pages.each(function () {
        var page = $(this);
        var title = page.find("h4").text();
        nav.append('<li><a href="#' + page.attr("id") + '">' + title + '</a></li>');    
        self.setUpPage(page);
    });
    nav.append('<li><a class="' + self.classes.addPage + ' ' + self.classes.disabled + '">+</a></li>');
    // Add first page, if there is none
    if (!pages.length) self.addQuizPage();

/*
    self.domRoot.prepend('<section class="' + this.classes.dtOnly + ' ' + this.classes.quizControls + '">'
        + '<fieldset class="' + this.classes.line + '">'
        + '<input type="radio" name="mlab_dt_quiz_mode" value="local"/>'
        + '<label>Sjekk svar kun lokalt</label>'
        + '</fieldset>'
        + '<fieldset class="' + this.classes.line + '">'
        + '<input type="radio" name="mlab_dt_quiz_mode" value="remote" />'
        + '<label>Sjekk svar lokalt, last opp til tjener</label>'
        + '</fieldset>'
        + '</section>');
    var controlMode = self.api.getVariable(self.domRoot, "controlMode");
    if (!controlMode) controlMode = "local";
    self.domRoot.find("." + this.classes.quizControls + " input[value='" + controlMode + "']").prop("checked", true);
*/
    
    self.domRoot.on("click", "." + this.classes.addPage, function() {
        self.addQuizPage();
        return false;
    });
    self.domRoot.on("click", "." + this.classes.removePage, function() {
        self.removeQuizPage($(this));
    });
    self.domRoot.on("click", "." + this.classes.addQuestion, function() {
        self.addQuestion($(this));
        return false;
    });
    self.domRoot.on("click", "." + this.classes.changeQuestionType, function() {
        self.questionTypeChange($(this));
        return false;
    });
    self.domRoot.on("click", "." + this.classes.addQuestionAlternative, function() {
        self.createQuestionAlternative($(this));
    });
    self.domRoot.on("click", "." + this.classes.removeQuestionAlternative, function() {
        self.removeQuestionAlternative($(this));
    });
    self.domRoot.on("click", "." + this.classes.removeQuestion, function() {
        self.removeQuestion();
    });
    
    self.domRoot.on("input", "." + this.classes.question + " ." + this.classes.editable, function() {
        self.saveQuestions();
    });
    self.domRoot.on("input", "." + this.classes.page + " > h4", function() {
        self.updateTab($(this));
    });
    self.domRoot.on("change", "." + this.classes.question + " input[type='radio'], ." + this.classes.question + " input[type='checkbox']", function() {
        self.saveQuestions();
    });
/*
    self.domRoot.on("change", "." + this.classes.quizControls + " input[type='radio']", function() {
        self.saveControls();
    }),
*/

    self.initTabs();
    self.addStoredQuestions();
    
    // Adding role="none", to prevent jQuery mobile from turning my inputs and buttons into jQuery UI elements
    self.domRoot.find(":input").attr("data-role", "none");
};

/* Saves the added questions and alternatives. Since the layout and functionality for the questions are radically different in DT and RT, 
 * we save only the necessary pieces of information using MLAB's setVariable. This information is used to recreate the question when
 * component is reopened in DT, or started in RT.
 */
this.saveQuestions = function() {
    console.log("save questions");
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
            var correctAnswer = null;
            var alternatives = [];
            if (questionType=="text") {
                correctAnswer = question.find('input[name="' + questionId + '"]').val();
                if (!correctAnswer) correctAnswer = null;
            }
            else if (questionType=="checkbox")
                correctAnswer = question.find('input[name="' + questionId + '"]:checked').val();
            else if (questionType=="select") {
                correctAnswer = question.find('input[name="' + questionId + '"]:checked').val();
            }
            else if (questionType=="multicheck") {
                correctAnswer = [];
                question.find('input[name^="' + questionId + '"]:checked').each(function() {
                    correctAnswer.push($(this).val());
                });
            }
            
            if (questionType=="select" || questionType=="multicheck") {
                question.find("." + self.classes.questionAlternatives + " ." + self.classes.line).each(function() {
                    var line = $(this);
                    var input = line.find('input[name^="' + questionId + '"]');
                    var label = line.find('label');
                    alternatives.push([input.val(), label.text()]);
                });
            }
            console.log("storing correct answer");
            console.log(correctAnswer);
            questionOb["correctAnswer"] = correctAnswer;
            questionOb["alternatives"] = alternatives;
            questions[pageId].push(questionOb);
        });
    });
    self.api.setVariable(self.domRoot, "questions", questions);
    // Tell MLAB that there's something to save
    self.api.setDirty();
};

/* Saves the control mode for the quiz, that is, if the questions should only be checked locally, or also uploaded to server (via remote storage component).
 */
/*
this.saveControls = function() {
    var controlMode = this.domRoot.find("." + this.classes.quizControls + " input[type='radio']:checked").val();
    if (!controlMode) controlMode = "local";
    this.api.setVariable(this.domRoot, "controlMode", controlMode);
    this.api.setDirty();
};
*/

/* Fetches stored questions, adds them to pages and sets them up for further editing.
 */
this.addStoredQuestions = function() {
    console.log("add stored Qs")
    var self = this;
    var allQuestions = self.api.getVariable(self.domRoot, "questions");
    if (!allQuestions) allQuestions = {};
    self.domRoot.find("." + self.classes.page).each(function() {
        var page = $(this);
        var pageId = page.attr("id");
        if (!(pageId in allQuestions)) return true;
        var pageQuestions = allQuestions[pageId];
        for (var i=0, ii=pageQuestions.length; i<ii; i++) {
            var question = self.addQuestion(null, page, pageQuestions[i]["question"], pageQuestions[i]["type"], pageQuestions[i]["id"]);
            self.changeQuestionType(null, null, question, pageQuestions[i]["type"]);
            if (pageQuestions[i]["type"]=="select" || pageQuestions[i]["type"]=="multicheck") {
                var alternatives = pageQuestions[i]["alternatives"];
                var button = question.find("." + self.classes.addQuestionAlternative);
                var alternative = question.find("." + self.classes.questionAlternatives + " ." + self.classes.line);
                var newAlternative = alternative.clone();
                alternative.remove();
                for (var j=0, jj=alternatives.length; j<jj; j++) {
                    thisAlternative = newAlternative.clone()
                    self.addQuestionAlternative(thisAlternative, pageQuestions[i]["id"], alternatives[j][0], button, alternatives[j][1], j==0);
                }
            }
            console.log("correct answer from store");
            console.log(pageQuestions[i]["correctAnswer"]);
            if (pageQuestions[i]["correctAnswer"]) {
                if (pageQuestions[i]["type"]=="text") {
                    question.find("#" + pageQuestions[i]["id"]).val(pageQuestions[i]["correctAnswer"]);
                }
                if (pageQuestions[i]["type"]=="multicheck") {
                    for (var j=0, jj=pageQuestions[i]["correctAnswer"].length; j<jj; j++) {
                        question.find('input[value="' + pageQuestions[i]["correctAnswer"][j] + '"]').prop("checked", true);
                    }
                }
                else question.find('input[value="' + pageQuestions[i]["correctAnswer"] + '"]').prop("checked", true);
            }
        }
    });
};

/* Adds a new page to the quiz.
 */
this.addQuizPage = function() {
    console.log("add quiz page");
    // tabs require the use of IDs
    var uuid = this.api.getGUID();
    var pages = this.domRoot.find("." + this.classes.page);
    var nav = this.domRoot.find("." + this.classes.nav);
    var title = 'Side ' + (pages.length+1);
    var content = '<h4>Side ' + (pages.length+1) + '</h4>'
        + '<ul class="' + this.classes.questions + '"></ul>';
    nav.find("." + this.classes.addPage).closest("li").before('<li><a href="#' + uuid + '">' + title + '</a></li>');
    
    this.domRoot.append('<section class="' + this.classes.page + '" id="' + uuid + '">' + content + '</section>');
    var page = this.domRoot.find("#" + uuid);
    this.setUpPage(page, true);
    
    this.api.setDirty();
};

/* Sets up page for editing and adding quesions.
 * @param {jQuery} page The page to be set up.
 * @param {boolean} setActive Whether or not the page should be set as the active page. 
 */
this.setUpPage = function(page, setActive) {
    if (page.data("setupComplete")) return;
    var footer = $('<footer class="' + this.classes.dtOnly + '">'
        + '<input type="button" class="mlab_dt_button_left ' + this.classes.addQuestion + '" value="Legg til spørsmål" />'
        + '<input type="button" class="mlab_dt_button_right ' + this.classes.removePage + '" value="Fjern side" />'
        + '</footer>');
    page.append(footer);
    this.api.editContent(page.find("h4"));
    var link = this.domRoot.find('a[href="#' + page.attr("id") + '"]');
    if (setActive) this.switchTabs(link);
    page.data("setupComplete", true);
};

/* Removes a page from the component. 
 * @param {jQuery} button The button that was clicked to remove the page.
 */
this.removeQuizPage = function(button) {
    console.log("remove quiz page");
    var page = button.closest("." + this.classes.page);
    var link = this.domRoot.find('a[href="#' + page.attr("id") + '"]');
    var li = link.parent();
    var neighbour = li.siblings("li").eq(0);
    this.switchTabs(neighbour.find("a"));
    page.remove();
    li.remove();
    this.api.setDirty();
};

/* Adds a new question to page.
 * @param {jQuery} button The button that was clicked to add question. Button is located on the page, so we can use this to look up the page.
 * @param {jQuery} page If no button was clicked, the page we want to add the question to, must be provided.
 * @param {string} questionText The actual question being asked. If not provided, a text is generated.
 * @param {string} type The type of the question. Defaults to type "text".
 * @param {string} uuid Unique ID for question, for existing questions. If not provided, one is generated.
 * @return {jQuery} The question that was added.
 */
this.addQuestion = function(button, page, questionText, type, uuid) {
    console.log("add question");
    if (!page) page = button.closest("." + this.classes.page);
    if (!questionText) questionText = "[Spørsmål]";
    if (!type) type = "text";
    if (!uuid) uuid = this.api.getGUID();
    var typeName = this.questionTypes[type];
    var questions = page.find("." + this.classes.questions);
    var question = $('<li class="' + this.classes.question + ' ' + this.classes.dtOnly + '"></li>');
    question.append('<span class="' + this.classes.line + '">'
        + '<label class="' + this.classes.editable + ' ' + this.classes.questionText + '">' + questionText + '</label>'
        + '</span>'
        + '<span class="' + this.classes.line + ' ' + this.classes.questionType + '">'
        + '<label>' + typeName + '</label>'
        + '<input type="button" class="' + this.classes.changeQuestionType + '" value="Endre" />'
        + '</span>'
        + '<section></section>');
    question.data("questionid", uuid);
    question = question.appendTo(questions);
    this.api.editContent(questions.find("." + this.classes.editable));
    this.saveQuestions();
    return question;
};

/* Displays dialog to change type of question. 
 * @param {jQuery} button Element that was clicked to change type.
 */
this.questionTypeChange = function(button) {
    var self = this;
    var html = [];
    html.push('<select name="questiontype">');
    for (type in this.questionTypes) {
        html.push('<option value="' + type + '">' + this.questionTypes[type] + '</option>');
    }
    html.push('</select>');
    html.push('<input type="button" value="OK" class="mlab_dt_button_right" />');
    html = html.join("");
    this.api.displayPropertyDialog(button, "Endre spørsmålstype", html, function(el) { self.questionTypeSetup(el, button); }, null, function(el) { self.changeQuestionType(el); });
};

/* Sets up the dialog box for changing type.
 * @param {Object} el qTip element, sent from the qTip dialog system
 * @param {jQuery} button The element clicked to change type
 */
this.questionTypeSetup = function(el, button) {
    console.log("change question setup");
    var self = this;
    var ob = $(el.target);
    var question =  button.closest("." + this.classes.question);
    var type = question.data("questiontype");
    if (type) {
        ob.find("select[name='questiontype']").val(type);
    }
    ob.on("click", "input", function() { 
        self.changeQuestionType(ob, button);
        button.qtip('hide');
    });
};

/* Changes the type of the question. Usually called when dialog is closed. 
 * @param {jQuery} ob Element containing the dialog content
 * @param {jQuery} button Element that was clicked to change type. Used to know which question we are changing.
 * @param {jQuery} question The question we are changing, if button not provided.
 * @param {string} type Type of the question, if ob not provided.
 */
this.changeQuestionType = function(ob, button, question, type) {
    console.log("change question type");
    if (!type && ob) type = ob.find("select[name='questiontype']").val();
    if (!question && button) question =  button.closest("." + this.classes.question);
    var typeName = this.questionTypes[type];

    if (!type || !question) return;
    if (type==question.data("questiontype")) return;
    question.data("questiontype", type);
    question.find("> span." + this.classes.questionType + " label").text(typeName);
    var typeHtml = this.getQuestionTypeHtml(type, question.data("questionid"));
    question.find("section").empty().append(typeHtml);
    var editable = question.find("." + this.classes.questionAlternatives + " ." + this.classes.editable);
    if (editable.length) this.api.editContent(editable);
    this.saveQuestions();
};

/* Gets the HTML for the question type selected.
 * @param {string} type The question type selected
 * @param {string} uuid Unique ID for question. To be inserted into HTML
 * @return {string} HTML specific for question type
 */
this.getQuestionTypeHtml = function(type, uuid) {
    var htmls = {
        "": "",
        "text": '<span class="' + this.classes.line + '">Korrekt svar:</span>'
            + '<span class="' + this.classes.line + '"><input type="text" name="' + uuid + '" id="' + uuid + '" class="' + this.classes.textInput + '"/></span>',
        "checkbox": '<span class="' + this.classes.line + '">Korrekt svar:'
            + '<span class="' + this.classes.line + '"><input type="radio" name="' + uuid + '" id="' + uuid + '_yes" value="yes" /><label for="' + uuid + '_yes">Ja</label></span>'
            + '<span class="' + this.classes.line + '"><input type="radio" name="' + uuid + '" id="' + uuid + '_no" value="no" /><label for="' + uuid + '_no">Nei</label></span>'
            + '</span>',
        
        "select": '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">Korrekt svar:'
            + '<span class="' + this.classes.line + '"><input type="radio" name="' + uuid + '" value="1" /><label class="' + this.classes.editable + '">[Alternativ 1]</label></span>'
            + '<input type="button" class="' + this.classes.addQuestionAlternative + '" value="+" />'
            + '</span>',
        
        "multicheck": '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">Korrekte svar:'
            + '<span class="' + this.classes.line + '"><input type="checkbox" name="' + uuid + '_1" value="1" /><label class="' + this.classes.editable + '">[Alternativ 1]</label></span>'
            + '<input type="button" class="' + this.classes.addQuestionAlternative + '" value="+" />'
            + '</span>'
    }
    var html = ""
    if (type in htmls) html = htmls[type];
    return html;
};

/* Creates an answer alternative for question.
 * @param {button} button Button that was clicked to add alternative.
 */
this.createQuestionAlternative = function(button) {
    var question = button.closest("." + this.classes.question);
    var target = button.closest("." + this.classes.questionAlternatives);
    var alternatives = target.find("> ." + this.classes.line);
    var maxValue = 0;
    alternatives.each(function() {
        maxValue = Math.max(parseInt($(this).find('input[name^="' + question.data("questionid") + '"]').val()), maxValue);
    });
    var newValue = maxValue + 1;
    var newAlternative = alternatives.eq(0).clone();
    
    this.addQuestionAlternative(newAlternative, question.data("questionid"), newValue, button, null, false);
};

/* Adds answer alternative to question. Split off from createQuestionAlternative to make more useable for adding stored questions.
 * @param {jQuery} newAlternative Element containing the actual alternative.
 * @param {string} questionId Unique ID for the question.
 * @param {string} value Value for the question alternative input element.
 * @param {string} labelText Text for the alternative.
 * @param {boolean} first Whether or not this is first element. The first element should not have a "remove" button.
 */
this.addQuestionAlternative = function(newAlternative, questionId, value, button, labelText, first) {
    if (!first) newAlternative.append('<input type="button" value="Fjern" class="' + this.classes.removeQuestionAlternative + '" />');
    
    var input = newAlternative.find('input[name^="' + questionId + '"]');
    input.val(value);
    
    if (input.attr("type")=="checkbox") {
        var newName = input.attr("name").replace("_1", "_" + value);
        input.attr("name", newName);
    }
    if (!labelText) labelText = "[Alternativ " + value + "]";
    var label = newAlternative.find("label");
    label.text(labelText);
    
    this.api.editContent(newAlternative.find("." + this.classes.editable));
    button.before(newAlternative);
    this.saveQuestions();
};

/* Removes question alternative from question.
 * @param {jQuery} button Button that was clicked to remove alternative.
 */
this.removeQuestionAlternative = function(button) {
    button.closest("." + this.classes.line).remove();
    this.saveQuestions();
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
    console.log("updateTab");
    console.log(el);
    var title = el.text();
    var pageId = el.closest("." + this.classes.page).attr("id");
    this.domRoot.find("." + this.classes.nav + " a[href='#" + pageId + "']").text(title);
};
