/*
    Function fired when page loads. Sets up the quiz.
    @param {DOM object} el Component element
*/
this.onPageLoad = function(el) {
    var self = this;
    self.domRoot = $(el);
    self.deviceId = self.api.getDeviceId(); 
    self.settings = self.api.getVariable(this.domRoot, "settings");
    this.di
};

this.loadAnswers = function() {
    
    mlab.api.db.getAllResult(mlab.api.components.quiz.deviceId, mlab.api.components.quiz.domRoot.attr("id"), mlab.api.components.quiz.processAnswers);
};


//the answer check utilises the "data-mlab-cp-quiz-correct-response=true" we use for checkboxes, radio boxes and options to 
this.checkAnswer = function(page) {
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



    this.displayAnswers = function (el) {
        var container = el.find("figcaption").html('');
        var temp_answers = mlab.dt.api.getVariable(el, "answers");
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            var correct_answer = temp_answers[0];
            var answers = this.shuffleAnswers(temp_answers);
            for (i in answers) {
                if (correct_answer != answers[i]) {
                    container.append("<a class='mc_button mc_medium mc_left' onclick='return false;'>" + answers[i] + "</a>");
                } else {
                    container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mc_correct' onclick='return false;'>" + answers[i] + "</a>");
                }
            }
        }
    }
    
//simple shuffle: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    this.shuffleAnswers = function(answers) { 
      var currentIndex = answers.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = answers[currentIndex];
        answers[currentIndex] = answers[randomIndex];
        answers[randomIndex] = temporaryValue;
      }

      return answers;
    }