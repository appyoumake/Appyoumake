var quiz_moodle = {
    version: 0.1,
    /* The control mode selected for this quiz. */
    control_mode: null,
    /* Control modes available. Their location in the array corresponds to what is stored in 'control_mode'. */
    control_modes: ["local", "remote", "both"],
    /* More informative texts about the control modes. */
    control_mode_labels: {"local": "Check answers locally only", "remote": "Upload answers to remote LRS (no local check)", "both": "Check answers locally, and upload to remote LRS"},
    
    init: function() {
        
    },
    pageInit: function() {
        
    },
    
    changePage: function() {
        
    },
    
    saveAnswers: function() {
        
    },
    
    loadAnswers: function() {
        
    },
    
    checkAnswers: function(pageRoot) {
        var self = this;
        if (!pageRoot) pageRoot = $("body");
        
        var questions = pageRoot.find(".question");
        
        questions.each(function() {
            var question = $(this);
            
        });
        self.processResults(questions);
    },
    
    processResults: function(questions) {
        var self = this;
        var correctClasses = ["wrong", "correct", "partial"];
        questions.each(function() {
            var question = $(this);
            var correctAnswer = self.getCorrectAnswer(question);
            if (!correctAnswer.checkMe) return true; // Some questions might not have a correct answer at all
            var answer = self.getAnswer(question, correctAnswer.type);
            var correctness = 0;
            if (correctAnswer.type=="checkbox") correctness = correctAnswer.answer==answer ? 1 : 0;
            else if (correctAnswer.type=="select") correctness = correctAnswer.answer==answer ? 1 : 0;
            else if (correctAnswer.type=="multi") {
                // if type==multi, both answer and correct answer needs to be array
                if (self.compareArrays(correctAnswer, answer)) correctness = 1; // All correct options are selected, and no additional ones
                else if ($(correctAnswer).not(answer).length>0) correctness = 2; // Missing some of the correct options
                else if ($(answer).not(correctAnswer).length>0) correctness = 2; // Selected some incorrect options
                else isCorrect = 0; // Nothing is correct
            }
            else if (correctAnswer.type=="text") correctness = correctAnswer.answer.toLowerCase()==answer.toLowerCase() ? 1 : 0;
            
            question.addClass(correctClasses[correctness]);
            if (correctness!=1) self.markCorrectAnswer(question, correctAnswer);
        });
    },
    
    markCorrectAnswer: function(question, correctAnswer) {
        if (correctAnswer.type=="checkbox") ; // Should be obvious
        else if (correctAnswer.type=="select") {
            question.find("[value='" + correctAnswer + "']").attr("selected", "selected");
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
    
    getCorrectAnswer: function(question) {
        return question.data("response") || {"type": "", "answer":"", "checkMe": false};
    },
    
    getAnswer: function(question, questionType) {
        var answer;
        if (!questionType) {
            var correctAnswer = this.getCorrectAnswer();
            questionType = correctAnswer.type;
        }
        if (questionType=="checkbox") answer = question.find("input[type='checkbox']:checked").length==1;
        else if (questionType=="select") answer = question.find(":selected").val();
        else if (questionType=="multi") {
            answer = [];
            question.find(":selected").each(function() {
                answer.push($(this).val());
            });
        }
        else if (questionType=="text") answer = question.find("input[type='text']").val();
        
        return answer;
    },
    
    compareArrays: function(arr1, arr2) {
        return $(arr1).not(arr2).length == 0 && $(arr2).not(arr1).length;
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