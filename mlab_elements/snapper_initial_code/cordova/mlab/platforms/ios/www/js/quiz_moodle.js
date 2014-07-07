var quiz_moodle = {
    version: 0.1,
    initialized: false,
    /* Using localuser when we are not logged in to Moodle */
    username: "localuser",
    /* Short cut to root element of component, for convenience */
    domRoot: null,
    /* List if IDs to the pages in the quiz */
    pageIds: [],
    
    /*
     * Initialization function for the component. Decides whether we are in runtime/design mode and
     * acts accordingly.
     */
    init: function() {
        this.domRoot = $(".quiz-moodle");
        if (!this.domRoot.length) return; 
        if (this.initialized) return;
        
        this.mode = mlab.getName();
        this.domRoot.addClass(this.mode);
        if (this.mode=="runtime") {
            this.run();
        }
        else {
            this.setupDesign();
        }
        this.showHide();

    },
    
    /* Set up quiz builder functionality */
    setupDesign: function() {
        var self = this;
        self.domRoot.find(".add-page a").on("click", function() {
            self.addPage($(this));
            return false;
        });
        self.domRoot.on("click", ".remove-page", function() {
            self.removePage($(this));
        });
        self.domRoot.find(".add-question").on("click", function() {
            self.toggleQuestionDropdown($(this));
        });
        self.domRoot.find(".add-question-dropdown a").on("click", function() {
            self.addQuestion($(this));
        });
        self.domRoot.on("click", ".question .edit", function() {
            self.editQuestion($(this).parents(".question"));
        });
        self.domRoot.on("click", ".question .remove", function() {
            self.removeQuestion($(this).parents(".question"));
        });
        self.domRoot.on("submit", ".edit-question form", function() {
            self.updateQuestion($(this));
            return false;
        });
        self.domRoot.on("click", ".close-questionform", function() {
            self.closeQuestionForm($(this).parents(".edit-question"));
        });
        self.domRoot.on("click", ".add-question-option", function() {
            self.addOption();
        });
        self.domRoot.on("click", ".remove-option", function() {
            self.removeOption($(this));
        });
        self.domRoot.find(".quiz-options input").on("change", function() {
            self.saveControlMode($(this));
        });
        self.domRoot.tabs({"disabled": [1]});
        self.domRoot.find(".questions").sortable();
    },

    /* 
     * Save the selected option for control mode. 
     * @param {jQuery} input Input element that was selected.
     */
    saveControlMode: function(input) {
        var value = parseInt(input.val());
        var quiz = input.closest(".quiz-moodle");
//        quiz.data("controlmode", value);
        quiz.attr("data-controlmode", value);
    },

    /*
     * Add page to quiz.
     * @param {jQuery} link Tab element that was clicked
     */
    addPage: function(link) {
        // Get existing pages
        var pages = this.domRoot.find(".quiz-page");
        // Clone the last one, and remove the contents
        var newPage = pages.eq(-1).clone();
        newPage.find(".questions").empty();
        // Calculate the number and ID of the new page
        var pageId = newPage.attr("id");
        var pageNum = parseInt(pageId.substring(17)) + 1;
        pageId = "quiz-moodle-page-" + pageNum;
        // Set new ID
        newPage.attr("id", pageId);
        
        // Add new item to list of tabs
        var tabItem = $('<li><a href="#' + pageId + '">Page ' + pageNum + '</a><span class="remove-page button">X</span></li>');
        link.parent("li").before(tabItem);
        
        // Add new page
        pages.eq(-1).after(newPage);
        this.domRoot.find(".quiz-page").eq(-1).find(".questions").sortable();
        
        // Refresh the tabs widget
        this.domRoot.tabs("refresh");
        
    },
    
    /*
     * Remove page from quiz
     * @param {jQuery} button Button clicked to remove page
     */
    removePage: function(button) {
        var tab = button.closest("li");
        var page = $(tab.find("a").attr("href"));
        tab.remove();
        page.remove();
        // Refresh the tabs widget
        this.domRoot.tabs("refresh");
    },
    
    /*
     * Show/hide dropdown for adding question to page
     * @param {jQuery} button Button clicked to toggle dropdown
     */
    toggleQuestionDropdown: function(button) {
        var dropdown = this.domRoot.find(".add-question-dropdown");
        if (dropdown.is(":hidden")) dropdown.slideDown(200);
        else dropdown.slideUp(100);
    },
    
    /*
     * Add question to page
     * @param {jQuery} link Link in dropdown that was clicked. Represents question type.
     */
    addQuestion: function(link) {
        var currentPage = this.domRoot.find(".quiz-page:visible");
        var container = currentPage.find(".questions");
        var questionType = link.data("type");
        var question = this.domRoot.find(".question-templates .type-" + questionType).clone();
        // Create an ID/name unique to the quiz
        var maxId = 0;
        this.domRoot.find(".question").each(function() {
            var id = $(this).data("questionId");
            maxId = Math.max(maxId, id);
        });
        maxId += 1;
        var questionId = "question-" + maxId;
        if (questionType=="checkbox" || questionType=="text") {
            question.find(":input").attr("name", questionId).attr("id", questionId);
            question.find("label").attr("for", questionId);
        }
        else if (questionType=="select") {
            question.find(":input").attr("name", questionId).attr("id", questionId);
            question.find("label").attr("for", questionId);
        }
        else if (questionType=="multi") {
            
        }
        question.addClass("question");
        question.attr("id", "question-box-" + maxId);
        question.data("questionId", maxId);
        this.setResponse(question, {"type": questionType, "answer":"", "checkme": true});
        question.append('<div class="controls designmode"><span class="button edit">e</span><span class="button remove">X</span></div>');
        question.removeClass("hide");
        this.makeEditable(question.find(".qlabel, option"));
        container.append(question);
        container.sortable("refresh");
        this.toggleQuestionDropdown();
        this.editQuestion(question);
        
    },
    
    /*
     * Sets response data attribute on question. In order for it to be written out in the actual HTML, and not
     * only stored in DOM, we add it both as a data element, and an explicit "data-response" attribute.
     * @param {jQuery} question Question element
     * @param {object} response Object representing the response
     *      @param {string} response.type Question type
     *      @param {string/Array} response.answer The correct answer for the question
     *      @param {boolean} response.checkme Sets whether or not the question actually has a correct answer.
     */
    setResponse: function(question, response) {
        question.data("response", response);
        // Also set this as an explicit attribute, otherwise it won't be written out in the markup.
        question.attr("data-response", JSON.stringify(response));
    },
    
    /*
     * Makes the html object editable, using the contenteditable attribute
     * @param {jQuery} ob Object that is to be made editable
     */
    makeEditable: function(ob) {
        ob.attr("contenteditable", "true").addClass("editable");
        ob.find("label").on("click", function() { return false; }); // don't let click on labels make focus go to input field.
    },
    
    /*
     * Open the edit form for question. Shows and hides form elements according to question type.
     * @param {jQuery question Element representing the question to be edited
     */
    editQuestion: function(question) {
        var questionFormBox = this.domRoot.find(".edit-question");
        this.closeQuestionForm(questionFormBox);
        var response = this.getCorrectAnswer(question);
        var answer = response.answer;
        if (answer && response.type=="multi") answer = answer.join(",");
        questionFormBox.find("#questionform-type").val(response.type);
        questionFormBox.find("#questionform-answer").val(answer);
        questionFormBox.find("#questionform-checkme").prop("checked", response.checkme);
        questionFormBox.find("#questionform-questionid").val(question.data("questionId"));
        questionFormBox.find(".visible-by-type").hide();
        questionFormBox.find("." + response.type).show();
        this.positionQuestionForm(questionFormBox, question);
        if (response.type=="multi" || response.type=="select") this.showManageOptions(questionFormBox);
        questionFormBox.show();
    },

    /*
     * Set the correct position on screen for the edit form for question
     * @param {jQuery} questionFormBox Container element for question form
     * @param {jQuery} question Element representing the question
     */
    positionQuestionForm: function(questionFormBox, question) {
        var editButton = question.find(".edit");
        var position = editButton.offset();
        var componentPosition = question.parents(".quiz-moodle").offset();
        questionFormBox.css({"top": position.top-componentPosition.top-4, "left": position.left-questionFormBox.outerWidth(true)+12});
    },

    /*
     * Show form elements to add and remove options in multi-option questions and selects
     * @param {jQuery} ob Container element for question form
     */
    showManageOptions: function(ob) {
        var optionsContainer = ob.find(".manage-options");
        var optionsBox = optionsContainer.find(".options-box");
        optionsBox.html("");
        var question = $("#question-box-" + $("#questionform-questionid").val());
        var questionOptions = [];
        var response = this.getCorrectAnswer(question);
        if (response.type=="select") {
            question.find("option").each(function() {
                var option = $(this);
                questionOptions.push({"value": option.val(), "label": option.text(), "iscorrect": option.val==response.answer});
            });
        }
        else if (response.type=="multi") {
            question.find("input[type='checkbox']").each(function() {
                var option = $(this);
                var label = option.siblings("label");
                questionOptions.push({"value": option.val(), "label": label.text(), "iscorrect": $.inArray(option.val(), response.answer)>-1});
            });
        }
        for (var i=0, ii=questionOptions.length; i<ii; i++) {
            this.addOption(questionOptions[i], optionsBox, i, response);
        }
        optionsContainer.show();
    },

    /*
     * Add option to question edit form
     * @param {object} option Object representing the option
     *      @param {String} option.value Value for the option
     *      @param {String} option.label Label for the option
     *      @param {boolean} option.iscorrect Whether or not this is a correct answer option
     * @param {jQuery} optionsBox Element option is to be added to
     * @param {int} i Index for the new option. Will be calculated if not defined
     * @param {object} response Response object
     */
    addOption: function(option, optionsBox, i, response) {
        if (!option) option = {"value": "", "label": "", "iscorrect": false};
        if (!optionsBox) optionsBox = this.domRoot.find(".options-box");
        if (typeof i=="undefined") {
            i = 0;
            optionsBox.find(".line").each(function() {
                i = Math.max(i, parseInt($(this).attr("id").replace("option-line-", "")));
            });
            i += 1;
        }
        if (!response) response = this.getCorrectAnswer($("#question-box-" + $("#questionform-questionid").val()));
        var optionLine = $('<div class="line" id="option-line-' + i + '" ></div>');
        optionLine.append('<span class="cell option-remove"><span class="remove-option button">X</span></span>');
        optionLine.append('<span  class="cell option-value"><input class="text" type="text" name="value-' + i + '"/></span>');
        optionLine.append('<span class="cell option-label"><input class="text" type="text" name="label-' + i + '"/></span>');
        if (response.type=="select") optionLine.append('<span class="cell option-iscorrect"><input class="radio" type="radio" name="iscorrect" value="'+ i +'"/></span>');
        else optionLine.append('<span class="cell option-iscorrect"><input class="check" type="checkbox" name="iscorrect-' + i + '" value="1"/></span>');
        optionLine.find(".option-value input").val(option.value);
        optionLine.find(".option-label input").val(option.label);
        optionLine.find(".option-iscorrect input").prop("checked", option.iscorrect);
        this.domRoot.find("#maxoptionid").val(i);
        optionsBox.append(optionLine);
    },

    /*
     * Remove option from edit question form
     * @param {jQuery} button Button clicked to remove option
     */
    removeOption: function(button) {
        button.closest(".line").remove();
    },

    /*
     * Save the edit form to the question. Updates options, correct answers, etc
     * @param {jQuery} form Question edit form element
     */
    updateQuestion: function(form) {
        // Todo: Validate form before submit
        var formValues = this.serializeArrayToObject(form.serializeArray());
        var question = $("#question-box-" + formValues.questionId);
        var response = this.getCorrectAnswer(question);
        response.checkme = "checkme" in formValues;
        var type = formValues.questionType;
        if (type=="checkbox") response.answer = formValues.answer=="1";
        else if (type=="text") response.answer = formValues.answer;
        else if (type=="select" || type=="multi") {
            var target; 
            var answer;
            if (type=="select") {
                target = question.find("select");
            }
            else {
                answer = [];
                target = question.find(".multi-options");
            }
            target.empty();
            for (var i=0, ii=parseInt(formValues.maxoptionid)+1; i<ii; i++) {
                var label = formValues["label-" + i];
                var value = formValues["value-" + i];
                if (!label || !value) continue;
                if (type=="select") {
                    if (parseInt(formValues["iscorrect"])==i) answer = value;
                    target.append('<option value="' + value + '">' + label + '</option>');
                }
                else {
                    if (formValues["iscorrect-" + i]) answer.push(value);
                    var name = 'multi-' + formValues.questionId;
                    var id = 'multi-' + formValues.questionId + '-' + i;
                    target.append('<div class="line"><input type="checkbox" name="' + name + '" id="' + id + '" value="' + value + '"/><label for="' + id + '">' + label + '</label></div>');
                }
            }
            response.answer = answer;
        }
        question
        this.closeQuestionForm(form.parents(".edit-question"));
    },

    /*
     * Closes the question form. Also resets form and cleans out the options, to make it ready for new question to be edited.
     * @param {jQuery} formBox Container element for the form
     */
    closeQuestionForm: function(formBox) {
        if (!formBox) formBox = this.domRoot.find(".edit-question");
        formBox.find("form")[0].reset();
        formBox.find(".options-box").html("");
        formBox.hide();
    },

    /*
     * Remove question from page
     * @param {jQuery} question Question to be removed
     */
    removeQuestion: function(question) {
        question.remove();
    },

    /*
     * Starts and sets up the runtime functionality for the quiz. Loads Moodle plugin and logs in, if necessary.
     */
    run: function() {
        var self = this;
        var pages = $(".quiz-page");
        // Load moodle plugin if user has set that the quiz answers should be uploaded
        var controlMode = $(".quiz-moodle").data("controlmode");
        if (controlMode=="remote" || controlMode=="both") {
            $(document).on("pluginloaded", function(e, pluginName) {
                if (self.initialized) return;
                if (pluginName=="moodle") {
                    var token = mlab.loginRemotely("local_tcapi"); // plugin_moodle will ask for username/password if needed
                    if (token) {
                        self.initialized = true;
                        self.pageInit();
                    }
                }
                
            });
            $(document).on("moodleloginsuccess", function(e, service, username) {
                if (service=="local_tcapi") {
                    self.username = username;
                    window.sessionStorage.setItem("username", username);
                    self.initialized = true;
                    self.pageInit();
                }
            });
            mlab.loadPlugin("moodle");
        }
        else {
            self.initialized = true;
        }
        pages.eq(-1).after('<div class="quiz-page hide" id="final-page">You have now finished the quiz.</div>');
        pages = $(".quiz-page");
        pages.hide();
        pages.each(function() {
            self.pageIds.push("#" + $(this).attr("id"));
        });
        $(window).on("hashchange", function() {
            $(".quiz-page").hide();
            $(document.location.hash).fadeIn();
            self.pageInit();
        });
        self.domRoot.find(".next-page").on("click", function() {
            self.changePage(1, $(this));
        });
        self.domRoot.find(".prev-page").on("click", function() {
            self.changePage(-1, $(this));
        });
        self.domRoot.find(".check-answers").on("click", function() {
            self.checkAnswers($(this));
        });
        document.location.hash = self.pageIds[0];

    },
    
    /*
     * Initializes an individual quiz page
     */
    pageInit: function() {
        // If we are not initialized, we are probably waiting for remote login
        if (!this.initialized) return;
        this.loadAnswers();
    },
    
    /*
     * Switch to next/previous page
     * @param {int} incr The increment. Should be 1 or -1, to indicate which direction we are moving in.
     * @param {jQuery} button Button clicked
     */
    changePage: function(incr, button) {
        if (button && button.hasClass("disabled")) return false;
        var newId =  Math.max($.inArray(''+document.location.hash, this.pageIds), 0) + incr;
        // Check if we are within  boundaries
        if (newId<0) return false;
        if (newId>=this.pageIds.length) return false;

        // Save current answers
        this.saveAnswers();

        // Set the hash for the new page. Actual page change is handled in the event listener.
        document.location.hash = this.pageIds[newId];
        
        // Update button states
        var nextButton = this.domRoot.find(".next-page");
        var prevButton = this.domRoot.find(".prev-page");
        if (newId==0) prevButton.addClass("disabled");
        else prevButton.removeClass("disabled");
        if (newId==this.pageIds.length-1) nextButton.addClass("disabled");
        else nextButton.removeClass("disabled");
        
    },
    
    /*
     * Get the page we are currently viewing
     * @return {jQuery} The current page element
     */
    getCurrentPage: function() {
        return $(this.pageIds[Math.max($.inArray(''+document.location.hash, this.pageIds), 0)]);
    },
    
    /*
     * Save answers the user has given, for later use
     * @param {jQuery} questions Set of questions to be saved
     */
    saveAnswers: function(questions) {
        var self = this;
        if (!questions) {
            var page = self.getCurrentPage();
            questions = page.find(".question");
        }
        questions.each(function() {
            var question = $(this);
            var answers = self.serializeArrayToObject(question.find(":input").serializeArray());
            mlab.setResult(self.username, question.closest(".quiz-moodle").attr("id"), question.attr("id"), answers);
        });
    },
    
    /*
     * Populate saved answers into questions on the current page.
     */
    loadAnswers: function() {
        var self = this;
        var page = self.getCurrentPage();
        page.find(".question").each(function() {
            var question = $(this);
            var response = self.getCorrectAnswer(question);
            var answer = mlab.getResult(self.username, question.closest(".quiz-moodle").attr("id"), question.attr("id"));
            if (!answer) return true;
            if (response.type=="checkbox") {
                var input = question.find("input[type='checkbox']");
                input.prop("checked", answer[input.attr("name")]=="on");
            }
            else if (response.type=="select") {
                var select = question.find("select");
                question.find("option[value='" + answer[select.attr("name")] + "']").prop("selected", true);
            }
            else if (response.type=="multi") {
                var inputs = question.find("input[type='checkbox']");
                var answerValues = answer[inputs.attr("name")];
                if (!$.isArray(answerValues)) answerValues = [answerValues];
                inputs.each(function() {
                    var input = $(this);
                    input.prop("checked", $.inArray(input.val(), answerValues)>-1);
                });
            }
            else if (response.type=="text") {
                var input = question.find("input[type='text']");
                input.val(answer[input.attr("name")]);
            }
        });
    },
    
    /*
     * Check if the answers the user has given are correct. If verified is false, a popup is presented, 
     * prompting the user to accept that the answers cannot be changed after being checked. If user accepts,
     * this function is called again, with verified=true.
     * @param {jQuery} button Button clicked to initiate check
     * @param {boolean} verified Whether or not user has accepted popup message
     */
    checkAnswers: function(button, verified) {
        var self = this;
        var page = self.getCurrentPage();
        var quiz = page.closest(".quiz-moodle");
        var questions;
        
        var controlMode = quiz.data("controlmode");
        // If we are on the last page, we should check ALL questions in quiz.
        if (page.attr("id")=="final-page") questions = quiz.find(".question").not(".checked");
        else questions = page.find(".question").not(".checked");

        if (!questions.length) return;
        if (!verified) {
            self.domRoot.append(''
            +'<div class="popup">'
            +'<div class="message">Your questions will be checked. You will not be able to change your questions after they have been checked.</div>'
            +'<div class="buttons">'
            +'<button class="verify button">OK, do it!</button>'
            +'<button class="close button">Wait, let me change a few things...</button>'
            +'</div>'
            +'</div>'
            );
            self.domRoot.on("click", ".popup .verify", function() {
                self.checkAnswers(button, true);
                self.domRoot.find(".popup").remove();
            });
            self.domRoot.on("click", ".popup .close", function() {
                self.domRoot.find(".popup").remove();
            });
            return;
        }
        
        // Lock the questions for further change
        questions.addClass("checked");
        questions.append('<div class="locked"></div>');
        // Check locally
        if (controlMode=="local" || controlMode=="both") self.processResults(questions);
        self.saveAnswers(questions);
    },
    
    /*
     * Loops through questions, sets class according to the correctness of the answers given, and marks/updates with correct answer
     * @param {jQuery} Set of questions to be processed
     */
    processResults: function(questions) {
        var self = this;
        var correctClasses = ["wrong", "correct", "partial"];
        questions.each(function() {
            var question = $(this);
            question.removeClass("wrong").removeClass("correct").removeClass("partial");
            var correctAnswer = self.getCorrectAnswer(question);
            if (!correctAnswer.checkme) return true; // Some questions might not have a correct answer at all
            var answer = self.getAnswer(question, correctAnswer.type);
            var correctness = 0;
            if (correctAnswer.type=="checkbox") correctness = correctAnswer.answer==answer ? 1 : 0;
            else if (correctAnswer.type=="select") correctness = correctAnswer.answer==answer ? 1 : 0;
            else if (correctAnswer.type=="multi") {
                // if type==multi, both answer and correct answer needs to be array
                if (self.compareArrays(correctAnswer.answer, answer)) correctness = 1; // All correct options are selected, and no additional ones
                //else if ($(correctAnswer.answer).not(answer).length>0) correctness = 2; // Missing some of the correct options
                else if ($(answer).not(correctAnswer.answer).length>0) correctness = 2; // Selected some incorrect options
                else isCorrect = 0; // Nothing is correct
            }
            else if (correctAnswer.type=="text") correctness = correctAnswer.answer.toLowerCase()==answer.toLowerCase() ? 1 : 0;
            
            question.addClass(correctClasses[correctness]);
            if (correctness!=1) self.markCorrectAnswer(question, correctAnswer);
        });
    },
    
    /*
     * Marks/updates what the correct answer is for this question
     * @param {jQuery} question Question to be marked
     * @param {object} correctAnswer Response object for the question
     */
    markCorrectAnswer: function(question, correctAnswer) {
        if (correctAnswer.type=="checkbox") ; // Should be obvious
        else if (correctAnswer.type=="select") {
            question.find("[value='" + correctAnswer.answer + "']").attr("selected", "selected");
        }
        else if (correctAnswer.type=="multi") {
            for (var i=0, ii=correctAnswer.answer.length; i<ii; i++) {
                question.find("[value='" + correctAnswer.answer[i] + "']").attr("selected", "selected"); // or checked?
            }
        }
        else if (correctAnswer.type=="text") {
            // TODO: Not sure how to handle this
        }
    },
    
    /*
     * Get correct answer/response object for question, or default response object
     * @param {jQuery} question Question to get response for
     */
    getCorrectAnswer: function(question) {
        return question.data("response") || {"type": "", "answer":"", "checkme": false};
    },
    
    /*
     * Get answer given by user for question
     * @param {jQuery} question Question in question
     * @param {String} questionType Type of question, to determine type of answer.
     * @retnr {boolean/String/Array} Answer given by question. Type depends on questionType
     */
    getAnswer: function(question, questionType) {
        var answer;
        if (!questionType) {
            var correctAnswer = this.getCorrectAnswer(question);
            questionType = correctAnswer.type;
        }
        if (questionType=="checkbox") answer = question.find("input[type='checkbox']:checked").length==1;
        else if (questionType=="select") answer = question.find(":selected").val();
        else if (questionType=="multi") {
            answer = [];
            question.find(":checked").each(function() {
                answer.push($(this).val());
            });
        }
        else if (questionType=="text") answer = question.find("input[type='text']").val();
        
        return answer;
    },


    /*
     * Shows/hides elements in the component, based on whether we are in runtime or design mode.
     */
    showHide: function() {
        if (this.mode=="runtime") {
            this.domRoot.find(".runtimemode").show();
            this.domRoot.find(".designmode").hide();
        }
        else {
            this.domRoot.find(".designmode").show();
            this.domRoot.find(".runtimemode").hide();
        }
    },

    /*
     * Helper function to convert what jQuery's serializeArray returns into a simple javascript object
     * @param {Array} serializeArray Array of objects with "name" and "value" elements, one for each form element
     * @param {Object} Object with one element per form element serialized
     */
    serializeArrayToObject: function(serializeArray) {
        var serializeObject = {};
        for (var i=0, ii=serializeArray.length; i<ii; i++) {
            var ob = serializeArray[i];
            if (ob.name in serializeObject) {
                if (!$.isArray(serializeObject[ob.name])) serializeObject[ob.name] = [serializeObject[ob.name]];
                serializeObject[ob.name].push(ob.value);
            }
            else serializeObject[ob.name] = ob.value;
        }
        return serializeObject;
    },

    /*
     * Check if two arrays contain exactly the same elements
     * @param {Array} arr1 Array to check
     * @param {Array} arr2 Array to check
     * @return {boolean} True if both arrays contain exactly the same elements (disregarding order), false if not
     */
    compareArrays: function(arr1, arr2) {
        return $(arr1).not(arr2).length==0 && $(arr2).not(arr1).length==0;
    }
};

/* Register the component's init functions to be run when Mlab/page is ready */
initialiseApp.push(
    function() {
        quiz_moodle.init();
    }
);
initialiseComponent.push(
    function() {
        quiz_moodle.pageInit();
    }
);