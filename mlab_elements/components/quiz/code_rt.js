/*
    Object containing all classes used in the HTML. Note that the associated CSS rules are defined in the DT script.
*/
this.classes = {
    root: "mlab_quiz",
    page: "mlab_quiz_page",
    questions: "mlab_quiz_questions",
    question: "mlab_quiz_question",
    questionText: "mlab_quiz_question_text",
    questionAlternatives: "mlab_quiz_question_alternatives",
    textInput: "mlab_quiz_text_input",
    checkAnswers: "mlab_quiz_check_answers",
    nextButton: "mlab_quiz_button_next",
    prevButton: "mlab_quiz_button_prev",
    line: "mlab_quiz_line",
    questionOK: "mlab_quiz_question_ok",
    questionNotOK: "mlab_quiz_question_not_ok",
    questionLocked: "mlab_quiz_question_locked",
    errorMessage: "mlab_quiz_errors",
    correctAnswer: "mlab_quiz_correct_answer"
};


/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.user = "LOCAL"; // TODO: Can't remember why mlab.api always requires a user. Maybe something about the Moodle api? This might be changed when the MySQL storage is implemented.
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
    var correctAnswers = {};
    for (pageId in questions) {
        var pageQuestions = questions[pageId];
        for (var i=0, ii=pageQuestions.length; i<ii; i++) {
            correctAnswers[pageQuestions[i].id] = pageQuestions[i].correctAnswer;
        }
    }
    var answeredWrong = [];
    root.find("." + this.classes.question).each(function() {
        var question = $(this);
        var id = question.data("questionid");
        var type = question.data("questiontype");
        var value = self.getQuestionValue(question);
        var correctAnswer = null;
        if (id in correctAnswers) correctAnswer = correctAnswers[id];
        if (correctAnswer) {
            if (type=="text" || type=="checkbox") {
                if (value.toLowerCase()==correctAnswer.toLowerCase()) self.setQuestionState(question, true);
                else {
                    self.setQuestionState(question, false, correctAnswer);
                    answeredWrong.push(question);
                }
            }
            else if (type=="select") {
                if (value==correctAnswer) self.setQuestionState(question, true);
                else {
                    self.setQuestionState(question, false, correctAnswer);
                    answeredWrong.push(question);
                }
            }
            else if (type=="multicheck") {
                var answerValues = [];
                for (var i=0, ii=value.length; i<ii; i++) answerValues.push(value[i].value);
                
                if (self.compareArrays(correctAnswer, answerValues)) self.setQuestionState(question, true);
                else {
                    self.setQuestionState(question, false, correctAnswer);
                    answeredWrong.push(question);
                }
            }
        }
        self.lockQuestion(question);
    });
    if (answeredWrong) {
        var footer = self.domRoot.find("#" + self.domRoot.attr("id") + "_lastpage").find("footer");
        footer.before('<section class="' + self.classes.errorMessage + '">Du har svart feil på ' + answeredWrong.length + ' spørsmål.</section>');
    }
};

/*
    Sets "OK" or "not OK" state for question. Also fires markCorrectAnswer for each not OK question.
    @param {jQuery} question jQuery element representing question
    @param {boolean} ok Whether or not the question is OK
    @param {Array/String} correctAnswer The correct answer(s) for the question.
*/
this.setQuestionState = function(question, ok, correctAnswer) {
    if (ok) {
        question.addClass(this.classes.questionOK);
        question.removeClass(this.classes.questionNotOK);
    }
    else {
        question.removeClass(this.classes.questionOK);
        question.addClass(this.classes.questionNotOK);
        self.markCorrectAnswer(question, correctAnswer);
    }
};

/*
    Mark the correct alternatives, or print out the correct answer.
    @param {jQuery} question Element representing question
    @param {Array/String} correctAnswer The correct answer(s) for the question.
*/
this.markCorrectAnswer = function(question, correctAnswer) {
    var type = question.data("questiontype");
    if (type=="text") {
        question.find("." + this.classes.textInput).after('<span class="' + this.classes.line + '">Riktig svar: ' + correctAnswer + '</span>');
    }
    else if (type=="checkbox") {
        var correctLine = question.find("input[value='" + correctAnswer + "']").closest("." + this.classes.line);
        correctLine.addClass(this.classes.correctAnswer);
    }
    else if (type=="select") {
        var correctText = question.find("option[value='" + correctAnswer + "']").text()
        question.find("select").after('<span class="' + this.classes.line + '">Riktig svar: ' + correctText + '</span>');
    }
    else if (type=="multicheck") {
        for (var i=0, ii=correctAnswer.length; i<ii; i++) {
            console.log(correctAnswer[i]);
            var correctLine = question.find("input[value='" + correctAnswer[i] + "']").closest("." + this.classes.line);
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
        else if (type=="checkbox") {
            question.find("input[value='" + answer + "']").prop("checked", true);
        }
        else if (type=="select") {
            question.find("option[value='" + answer.value + "']").prop("selected", true);
        }
        else if (type=="multicheck") {
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
    var value;
    if (type=="text") value = question.find("." + this.classes.textInput).val();
    else if (type=="checkbox") value = question.find(":checked").val();
    else if (type=="select") {
        var selected = question.find(":selected")
        value = {"value": selected.val(), "text": selected.text()};
    }
    else if (type=="multicheck") {
         value = [];
         question.find(":checked").each(function() {
             var checked = $(this);
             var label = checked.siblings("label");
             value.push({"value": checked.val(), "text": label.text()});
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
    else if (type=="checkbox") {
        html = '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">'
            + '<span class="' + this.classes.line + '"><input type="radio" name="' + id + '" id="' + id + '_yes" value="yes" /><label for="' + id + '_yes">Ja</label></span>'
            + '<span class="' + this.classes.line + '"><input type="radio" name="' + id + '" id="' + id + '_no" value="no" /><label for="' + id + '_no">Nei</label></span>'
            + '</span>'
    }
    else if (type=="select") {
        html = '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">'
            + '<select name="' + id + '">'
            + '<option value="">Velg et alternativ</option>';
        for (var i=0, ii=alternatives.length; i<ii; i++) {
            html += '<option value="' + alternatives[i][0] + '">' + alternatives[i][1] + '</option>'
        }
        html += '</select></span>';
    }
    else if (type=="multicheck") {
        html = '<span class="' + this.classes.line + ' ' + this.classes.questionAlternatives + '">';
        for (var i=0, ii=alternatives.length; i<ii; i++) {
            html += '<span class="' + this.classes.line + '">'
                + '<input type="checkbox" name="' + id + '_' + alternatives[i][0] + '" id="' + id + '_' + alternatives[i][0] + '" value="' + alternatives[i][0] + '" />'
                + '<label for="' + id + '_' + alternatives[i][0] + '">' + alternatives[i][1] + '</label>'
                + '</span>'
        }
        html += '</select></span>';
    }
    return html
}

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
