/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    debugger;
    
    $(el).append("<button>Next</button>");
    $(el).find("div").first().show();
    return;
    var self = this;
    self.api.setupStoragePlugin(el);
    self.user = self.api.getDeviceId(); // TODO: Request user name and store it
    self.domRoot = $(el).find("." + self.classes.root);
    self.variables = self.api.getAllVariables(this.domRoot);
    
    self.domRoot.on("change", ":input", function() { return self.storeAnswers($(this)); });
    self.domRoot.on("change", "." + self.classes.questionLocked + " :input", function() { return false; });
    self.domRoot.on("click", "." + this.classes.checkAnswers, function() { self.checkAnswers(); });
    self.domRoot.on("click", "." + this.classes.page + " input." + this.classes.nextButton, function() { self.goToNextPage($(this)); });
    self.domRoot.on("click", "." + this.classes.page + " input." + this.classes.prevButton, function() { self.goToPrevPage($(this)); });
    self.addLastPage();
    self.initPages();
    self.insertQuestions();
    
    self.populateStoredAnswers();
};


/*
    Check if the answers have been answered correctly or not. Also locks all questions for further editing.
    @param {jQuery} root Element containing the questions. If not provided, checks all questions in quiz
*/
this.checkAnswers = function(root) {
    var self = this;
    if (!root) root = self.domRoot;
    var questions = self.variables["questions"];
    var correctResponses = {};
    for (pageId in questions) {
        var pageQuestions = questions[pageId];
        for (var i=0, ii=pageQuestions.length; i<ii; i++) {
            correctResponses[pageQuestions[i].id] = pageQuestions[i].correctResponse;
        }
    }
    var answeredWrong = [];
    root.find("." + this.classes.question).each(function() {
        var question = $(this);
        var id = question.data("questionid");
        var type = question.data("questiontype");
        var value = self.getQuestionValue(question);
        var correctResponse = null;
        if (id in correctResponses) correctResponse = correctResponses[id];
        var correct = false;
        if (correctResponse) {
            if (type=="text") {
                correct = value.toLowerCase()==correctResponse.toLowerCase()
            }
            else if (type=="select" || type=="radio") {
                correct = parseInt(value["id"])==parseInt(correctResponse);
            }
            else if (type=="checkbox") {
                //correctResponse = correctResponse.split(" ");
                for (var i=0, ii=correctResponse.length; i<ii; i++) correctResponse[i] = parseInt(correctResponse[i]);
                var valueIds = [];
                for (var i=0, ii=value.length; i<ii; i++) valueIds.push(parseInt(value[i]["id"]));
                correct = self.compareArrays(correctResponse, valueIds);
            }
            
            self.setQuestionState(question, correct, correctResponse);
            if (!correct) answeredWrong.push(question);
        }
        else if (question.hasClass(self.classes.mandatory) && !value) {
            self.setQuestionState(question, false, correctResponse);
            answeredWrong.push(question);
        }
        self.lockQuestion(question);
    });
    var footer = self.domRoot.find("#" + self.domRoot.attr("id") + "_lastpage").find("footer");
    if (answeredWrong.length) {
        footer.siblings("." + self.classes.errorMessage).remove();
        footer.before('<section class="' + self.classes.errorMessage + '">Du har svart feil på ' + answeredWrong.length + ' spørsmål.</section>');
    }
    else {
        footer.before('<section class="' + self.classes.correctAnswer + '">Du har svart riktig på alle spørsmålene. Gratulerer!</section>');
    }
    self.domRoot.find("." + this.classes.checkAnswers).prop("disabled", true);
};

/*
    Sets "OK" or "not OK" state for question. Also fires markCorrectAnswer for each not OK question.
    @param {jQuery} question jQuery element representing question
    @param {boolean} ok Whether or not the question is OK
    @param {Array/String} correctAnswer The correct answer(s) for the question.
*/
this.setQuestionState = function(question, ok, correctResponse) {
    if (ok) {
        question.addClass(this.classes.questionOK);
        question.removeClass(this.classes.questionNotOK);
    } else {
        question.removeClass(this.classes.questionOK);
        question.addClass(this.classes.questionNotOK);
        self.markCorrectAnswer(question, correctResponse);
    }
};

/*
    Mark the correct alternatives, or print out the correct answer.
    @param {jQuery} question Element representing question
    @param {Array/String} correctAnswer The correct answer(s) for the question.
*/
this.markCorrectAnswer = function(question, correctResponse) {
    var type = question.data("questiontype");
    var id = question.data("questionid");
    if (type=="text") {
        question.find("." + this.classes.textInput).after('<span class="' + this.classes.line + '">Riktig svar: ' + correctResponse + '</span>');
    }
    else if (type=="radio") {
        var correctLine = question.find("input#" + id + "_" + correctResponse).closest("." + this.classes.line);
        correctLine.addClass(this.classes.correctAnswer);
    }
    else if (type=="select") {
        var correctText = question.find("option#" + id + "_" + correctResponse).text();
        question.find("select").after('<span class="' + this.classes.line + '">Riktig svar: ' + correctText + '</span>');
    }
    else if (type=="checkbox") {
        //correctResponse = correctResponse.split(" ");
        for (var i=0, ii=correctResponse.length; i<ii; i++) {
            var correctLine = question.find("input#" + id + "_" + correctResponse[i]).closest("." + this.classes.line);
            correctLine.addClass(this.classes.correctAnswer);
        }
    }
};

/*
    Set the question in a locked state.
    @param {jQuery} question Element representing question
*/
this.lockQuestion = function(question) {
    question.addClass(this.classes.questionLocked);
    question.find(":input").prop("disabled", true);
};

/*
    Fetch the stored answers and populate the questions.
*/
this.populateStoredAnswers = function() {
    var self = this;
    var quizId = self.domRoot.attr("id");
    this.domRoot.find("." + self.classes.question).each(function() {
        var question = $(this);
        var id = question.data("questionid");
        var type = question.data("questiontype");
        var answer = self.api.getResult(self.user, quizId, id);
        if (!answer) return true;

        if (type=="text") {
            question.find("." + self.classes.textInput).val(answer);
        }
        else if (type=="select") {
            question.find("option[value='" + answer.value + "']").prop("selected", true);
        }
        else if (type=="radio") {
            question.find("input[value='" + answer.value + "']").prop("checked", true);
        }
        else if (type=="checkbox") {
            for (var i=0, ii=answer.length; i<ii; i++) {
                question.find("input[value='" + answer[i].value + "']").prop("checked", true);
            }
        }
    });
};

/*
    Save the answers given by the user, fired either when an answer changes, or when user switches pages.
    @param {jQuery} input Input element that has changed
    @param {jQuery} page Element for page user is leaving
    @return Undefined if there are no questions, true otherwise
*/
this.storeAnswers = function(input, page) {
    var quizId = this.domRoot.attr("id");
    var serialized = [];
    var questions;
    if (input) questions = input.closest("." + this.classes.question);
    else if (page) questions = page.find("." + this.classes.question);
    if (!questions) return;
    
    questions.each(function() {
        var question = $(this);
        var id = question.data("questionid");
        var value = self.getQuestionValue(question);
        serialized.push({"name": id, "value": value});
    });
    
    for (var i=0, ii=serialized.length; i<ii; i++) {
        var input = serialized[i];
        this.api.setResult(this.user, quizId, input.name, input.value);
    }
    return true;
};

/*
    Get the value for the answer given by user.
    @param {jQuery} question Element representing question
    @return {String/Array} value given/selected by user
*/
this.getQuestionValue = function(question) {
    var type = question.data("questiontype");
    var id = question.data("questionid");
    var value;
    if (type=="text") value = question.find("." + this.classes.textInput).val();
    else if (type=="select") {
        var selected = question.find(":selected");
        if (selected.length && selected.val()!="") value = {"value": selected.val(), "text": selected.text(), "id": selected.data("id")};
    }
    else if (type=="radio") {
        var checked = question.find(":checked");
        if (checked.length) {
            var label = checked.siblings("label");
            value = {"value": checked.val(), "text": label.text(), "id": checked.data("id")};
        }
    }
    else if (type=="checkbox") {
         value = [];
         question.find(":checked").each(function() {
             var checked = $(this);
             var label = checked.siblings("label");
             value.push({"value": checked.val(), "text": label.text(), "id": checked.data("id")});
         });
    }
    return value;
};

/*
    Add a final page to quiz. This is page where the user checks the answers, and where the user gets feedback.
*/
this.addLastPage = function() {
    var pageId = this.domRoot.attr("id") + "_lastpage";
    var lastPage = this.domRoot.find("." + this.classes.page).eq(-1);
    var page = $('<section class="' + this.classes.page + '" id="' + pageId + '"><h4>Oppsummering og sjekk</h4></section>');
    page.append('<input type="button" class="' + this.classes.checkAnswers + '" value="Sjekk svar" />');
    page.append('<label>Merk: du vil ikke kunne endre svarene dine etter at de er sjekket.</label>');
    page.hide();
    lastPage.after(page);
};

/*
    Fetch questions from variables and add them to page.
*/
this.insertQuestions = function() {
    var self = this;
    var allQuestions = self.variables["questions"];
    if (!allQuestions) allQuestions = {};
    self.domRoot.find("." + self.classes.page).each(function() {
        var page = $(this);
        var pageId = page.attr("id");
        if (!(pageId in allQuestions)) return true;
        var pageQuestions = allQuestions[pageId];
        for (var i=0, ii=pageQuestions.length; i<ii; i++) {
            self.addQuestion(page, pageQuestions[i]);
        }
    });
};

/*
    Gets HTML for different question types, as they have different ways of providing answers.
    @param {String} type The question type
    @param {String} id Unique ID for question, used for names, IDs, etc
    @param {Array} alternatives Array of possible alternatives
*/
this.getQuestionTypeHtml = function(type, id, alternatives) {
    var html = "";
    
    if (type=="text") {
        html = '<span class="' + this.classes.line + '">'
            + '<input class="' + this.classes.textInput + '" name="' + id + '"/>'
            + '</span>';
    }
    else if (type=="checkbox" || type=="radio") {
        html = '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">';
        for (var i=0, ii=alternatives.length; i<ii; i++) {
            var altId = id + '_' + (i+1);
            html += '<span class="' + this.classes.line + '"><input type="' + type + '" name="' + id + '" id="' + altId + '" value="' + alternatives[i] + '" data-id="' + (i+1) + '" /><label for="' + altId + '">' + alternatives[i] + '</label></span>';
        }
        html += '</span>';
    }
    else if (type=="select") {
        html = '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">'
            + '<select name="' + id + '">'
            + '<option value="">Velg et alternativ</option>';
        for (var i=0, ii=alternatives.length; i<ii; i++) {
            var altId = id + '_' + (i+1);
            html += '<option value="' + alternatives[i] + '" data-id="' + (i+1) + '" id="' + altId + '">' + alternatives[i] + '</option>';
        }
        html += '</select></span>';
    }
    return html;
};

/*
    Add a single question to page.
    @param {jQuery} page Element for page
    @param {Object} question Object representing question
*/
this.addQuestion = function(page, question) {
    var questions = page.find("ul." + this.classes.questions);
    var questionOb = $('<li class="' + this.classes.question + ' ' + this.classes.line + '">'
        + '<span class="' + this.classes.line + '">'
        + '<label class="' + this.classes.questionText + '" for="' + question.id + '">' + question.question + '</label>'
        + this.getQuestionTypeHtml(question.type, question.id, question.alternatives)
        + '</span>'
    + '</li>');
    if (question.mandatory) questionOb.addClass(this.classes.mandatory);
    questionOb.data("questiontype", question.type);
    questionOb.data("questionid", question.id);
    questions.append(questionOb);
};

/*
    Initialize the quiz pages, with buttons and such
*/
this.initPages = function() {
    var self = this;
    var pages = self.domRoot.find("." + self.classes.page);
    pages.hide();
    pages.eq(0).show();
    var pagesLength = pages.length;
    pages.each(function(i) {
        var page = $(this);
        var html = '<footer class="' + self.classes.line + '">';
        if (i>0) html += '<input type="button" class="' + self.classes.prevButton + '" value="Forrige" />';
        if (i<pagesLength) html += '<input type="button" class="' + self.classes.nextButton + '" value="Neste" />';
        html += '</footer>';
        page.append(html);
    });
};

/*
    Got to the next page within quiz
    @param {jQuery} button Button that was clicked.
*/
this.goToNextPage = function(button) {
    this.navigatePage(button, true);
};

/*
    Got to the next page within quiz
    @param {jQuery} button Button that was clicked.
*/
this.goToPrevPage = function(button) {
    this.navigatePage(button, false);
};
/*
    Go back and forth within quiz
    @param {jQuery} button Button that was clicked.
    @param {boolean} direction Forward if true, backward if false
*/

this.navigatePage = function(button, direction) {
    var currentPage = button.closest("." + this.classes.page);
    this.storeAnswers(null, currentPage);
    var targetPage;
    if (direction) targetPage = currentPage.next("." + this.classes.page);
    else targetPage = currentPage.prev("." + this.classes.page);
    if (targetPage && targetPage.length && targetPage!=currentPage) {
        currentPage.hide();
        targetPage.show();
    }
};

/*
 * Check if two arrays contain exactly the same elements
 * @param {Array} arr1 Array to check
 * @param {Array} arr2 Array to check
 * @return {boolean} True if both arrays contain exactly the same elements (disregarding order), false if not
 */
this.compareArrays = function(arr1, arr2) {
    return $(arr1).not(arr2).length==0 && $(arr2).not(arr1).length==0;
};
