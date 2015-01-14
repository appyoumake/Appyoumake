this.config = {};
this.domRoot = null;
this.initialized = false;

this.classes = {
    root: "mlab_dt_quiz",
    page: "mlab_dt_quiz_page",
    question: "mlab_dt_quiz_question",
    nav: "mlab_dt_quiz_page_nav"
};

this.onCreate = function (el, config, api_func) {
    console.log("onCreate");
    this.globalSetup(el, config, api_func);
    this.domRoot.append('<ul class="' + this.classes.nav + '"></ul>');
    this.addQuizPage();
    this.onLoad(el, config, api_func);
}

this.onLoad = function (el, config, api_func) {
    console.log("onLoad");
    this.globalSetup(el, config, api_func);
    if (!this.domRoot.length) return; 
    if (this.initialized) return;
    
    this.setupDesign();
    this.showHide();

};

this.onSave = function (el) {
    console.log("onSave");

};

this.globalSetup = function(el, config, api_func) {
    this.config = config;
    this.api = api_func;
    this.domRoot = el.find("." + this.classes.root);
};

/* Set up quiz builder functionality */
this.setupDesign = function() {
    var self = this;
    //self.domRoot.append('<button class="mlab_dt_quiz_page_add">Legg til side</button>');
    
    self.domRoot.on("click", ".mlab_dt_quiz_page_add", function() {
        self.addQuizPage();
    });
    self.domRoot.on("click", ".mlab_dt_quiz_page_remove", function() {
        self.removeQuizPage();
    });
    self.domRoot.on("click", ".mlab_dt_quiz_question_add", function() {
        self.addQuestion();
    });
    self.domRoot.on("click", ".mlab_dt_quiz_question_edit", function() {
        self.editQuestion();
    });
    self.domRoot.on("click", ".mlab_dt_quiz_question_edit", function() {
        self.removeQuestion();
    });
    self.domRoot.tabs();

    
/*
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
    self.domRoot.find(".questions").sortable();
*/
};


this.addQuizPage = function() {
    // jQuery UI tabs require the use of IDs
    var uuid = this.api.getGUID();
    var pages = this.domRoot.find("." + this.classes.page);
    this.domRoot.append('<div class="' + this.classes.page + '" id="' + uuid + '"></div>');
    this.domRoot.find("." + this.classes.nav).append('<li><a href="#' + uuid + '">Side ' + (pages.length+1) + '</a></li>');
    if (this.domRoot.hasClass(".ui-tabs")) this.domRoot.tabs("refresh");
};

/* 
 * Save the selected option for control mode. 
 * @param {jQuery} input Input element that was selected.
 */
this.saveControlMode = function(input) {
    var value = parseInt(input.val());
    var quiz = input.closest(".quiz-moodle");
//        quiz.data("controlmode", value);
    quiz.attr("data-controlmode", value);
};

/*
 * Sets response data attribute on question. In order for it to be written out in the actual HTML, and not
 * only stored in DOM, we add it both as a data element, and an explicit "data-response" attribute.
 * @param {jQuery} question Question element
 * @param {object} response Object representing the response
 *      @param {string} response.type Question type
 *      @param {string/Array} response.answer The correct answer for the question
 *      @param {boolean} response.checkme Sets whether or not the question actually has a correct answer.
 */
this.setResponse = function(question, response) {
    question.data("response", response);
    // Also set this as an explicit attribute, otherwise it won't be written out in the markup.
    question.attr("data-response", JSON.stringify(response));
};

/*
 * Makes the html object editable, using the contenteditable attribute
 * @param {jQuery} ob Object that is to be made editable
 */
this.makeEditable = function(ob) {
    ob.attr("contenteditable", "true").addClass("editable");
    ob.find("label").on("click", function() { return false; }); // don't let click on labels make focus go to input field.
};

/*
 * Shows/hides elements in the component, based on whether we are in runtime or design mode.
 */
this.showHide = function() {
    if (this.mode=="runtime") {
        this.domRoot.find(".runtimemode").show();
        this.domRoot.find(".designmode").hide();
    }
    else {
        this.domRoot.find(".designmode").show();
        this.domRoot.find(".runtimemode").hide();
    }
};

/*
 * Helper function to convert what jQuery's serializeArray returns into a simple javascript object
 * @param {Array} serializeArray Array of objects with "name" and "value" elements, one for each form element
 * @param {Object} Object with one element per form element serialized
 */
this.serializeArrayToObject = function(serializeArray) {
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
};

/*
 * Check if two arrays contain exactly the same elements
 * @param {Array} arr1 Array to check
 * @param {Array} arr2 Array to check
 * @return {boolean} True if both arrays contain exactly the same elements (disregarding order), false if not
 */
this.compareArrays = function(arr1, arr2) {
    return $(arr1).not(arr2).length==0 && $(arr2).not(arr1).length==0;
}