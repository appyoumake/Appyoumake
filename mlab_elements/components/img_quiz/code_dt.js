//image and text component, inherits from img component	
   
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.displayAnswers(el);
    };

/**
 * Basic function to request a list of possible answers
 * @param {type} el
 * @param {type} event
 * @returns {undefined}
 */
    this.custom_set_answers = function (el, event) {
        var content = $('<div>' +
                        '<label>Please enter a list of possible answers here.<em>Enter correct answer first, the order will be set randomly when the user sees the quiz</em></label><br>' + 
                        '<textarea class="mlab_dt_input" data-mlab-dt-img_quiz-answers="answers" ></textarea>' +
                        '<button class="mlab_dt_button_cancel mlab_dt_right" onclick="mlab.dt.api.closeAllPropertyDialogs();">Cancel</button>' +
                        '<button class="mlab_dt_button_ok mlab_dt_right" data-mlab-dt-img_quiz-answers="update">OK</button>' +
                        '</div>');
                
        var temp_answers = mlab.dt.api.getVariable(el, "answers");
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            content.find("[data-mlab-dt-img_quiz-answers='answers']").val(temp_answers.join('\n'));
        }
        
//when click on OK we want to save the data using the standard Mlab API call, and then display the calendar
        content.on("click", "[data-mlab-dt-img_quiz-answers='update']", {component: el }, function(e){ 
                e.preventDefault(); 
                var dlg = $(e.currentTarget).parent();
                var answers = dlg.find("[data-mlab-dt-img_quiz-answers='answers']").val().split('\n');
                mlab.dt.api.setVariable(e.data.component, "answers", answers);
                mlab.dt.api.closeAllPropertyDialogs();
                mlab.dt.components.img_quiz.code.displayAnswers.call(mlab.dt.components.img_quiz.code, e.data.component);
            });

        this.api.displayPropertyDialog(el, "Answers", content, null, null, null, null, false, event);        
        
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