//image and text component, inherits from img component	
   var component = this;
   
//el = element this is initialising, config = global config from conf.yml
    this.onLoad = function (el) {
        var that = this;
        var that_el = el;
        this.displayAnswers(el);
        var pasteConainer = mlab.dt.api.pasteImageReader(function(results) {
            var url = mlab.dt.urls.component_upload_file
                    .replace("_APPID_", mlab.dt.app.id)
                    .replace("_COMPID_", component.config.name);

            $.ajax({
                url: url,
                data: {image: results.dataURL, name: results.name},
                type: 'POST',
                success: function( json ) {
                    component.cbAddImage(el, json.urls[0]);
                }
            });
        });

        el.find(".mlab_ct_img_quiz_carousel").prepend(pasteConainer)
    };

//we remove answers for any quizzes before we save, they are generated on the fly at runtime and design time
	this.onSave = function (el) {
        var local_el = $(el).clone();
        var answer_container = $(local_el).find("[data-mlab-ct-" + this.config.name + "-role='display_answers']");
        answer_container.html("");
        local_el.find("img").removeClass("active").first().addClass("active");
        local_el.find("span").removeClass("active").first().addClass("active");
        local_el.find(".paste-container").remove();

        return local_el[0].outerHTML;
    };

/**
 * Identical to the same function inthe parent multi_img, except it also displays the answers
 * @param {type} el
 * @returns {undefined}
 */
    this.custom_show_image_previous = function (el) {
        this.showImage(el, -1);
        this.displayAnswers(el);
    }
    
    this.custom_show_image_next = function (el) {
        this.showImage(el, 1);
        this.displayAnswers(el);
    }
    
/**
 * Basic function to request a list of possible answers. This is done is a simple dialog where they add one question per line
 * The questions are linked to the current image, so the control may have 10 images and they set the answers for each in turn.
 * @param {type} el
 * @param {type} event
 * @returns {undefined}
 */
    this.custom_set_answers = function (el, event) {
        
//prepare the HTML for the dialog box requesting input
        var content = $('<div>' +
                        '<label>Please enter a list of possible answers here, with an optional explanation for why an incorrect answer might have been selected. Add one answer per line and use a comma between the answer and the explanation.<br><br><em>Enter the correct answer first, the order will be set randomly when the user sees the quiz</em></label><br>' + 
                        '<textarea class="mlab_dt_input mlab_dt_medium_textarea" data-mlab-dt-img_quiz-answers="answers" ></textarea>' +
                        '<button class="mlab_dt_button_ok mlab_dt_right" data-mlab-dt-img_quiz-answers="update">OK</button>' +
                        '<button class="mlab_dt_button_cancel mlab_dt_right" onclick="mlab.dt.api.closeAllPropertyDialogs();">Cancel</button>' +
                        '</div>');

//set HTML element variables
        var container = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']");
        var image_count = container.find("img").length;
        if (image_count === 0) {
            alert("You must add one or more images before trying to set the possible answers for the image.");
            return;
        }
        var curr_img = container.find(".active").data("mlab-ct-" + this.config.name + "-id");
        
//load existing answers, if any
        var temp_answers = mlab.dt.api.getVariable(el, "answers_" + curr_img);
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            content.find("[data-mlab-dt-img_quiz-answers='answers']").val(temp_answers.join('\n'));
        }
        
//when click on OK we want to save the data using the standard Mlab API call, and then display the possible answers as buttons
        content.on("click", "[data-mlab-dt-img_quiz-answers='update']", {component: el }, function(e){ 
                e.preventDefault(); 
                var dlg = $(e.currentTarget).parent();
                var answers = dlg.find("[data-mlab-dt-img_quiz-answers='answers']").val().split('\n');
                mlab.dt.api.setVariable(e.data.component, "answers_" + curr_img, answers);
                mlab.dt.api.closeAllPropertyDialogs();
                mlab.dt.components.img_quiz.code.displayAnswers.call(mlab.dt.components.img_quiz.code, e.data.component, curr_img);
            });

//finally display the dialog box
        this.api.displayPropertyDialog(el, "Answers", content, null, null, null, null, false, event);        
        
    };
    
/**
 * Simple function to ask how many questions to ask in each quiz.
 * @param {type} el
 * @param {type} event
 * @returns {undefined}
 */
    this.custom_set_number_to_display = function (el, event) {
        
//get number from user
        var num = prompt("How many questions do you want to display at a time?", mlab.dt.api.getVariable(el, "display_num_questions"));
        if (parseInt(num) > 0) {
            mlab.dt.api.setVariable(el, "display_num_questions", num);
        }
    };    
    
    
/**
 * Function that will display one for button each answer that has been entered
 * It randomises the order because the first answer entered is always the correct one
 * @param {type} el
 * @param {type} image_index
 * @returns {undefined}
 */
    this.displayAnswers = function (el, image_index) {
        if (typeof image_index == "undefined") {
            image_index = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']").find(".active").data("mlab-ct-" + this.config.name + "-id");
        }
        var answer_container = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display_answers']");
        answer_container.html("");
        var temp_answers = mlab.dt.api.getVariable(el, "answers_" + image_index);
        
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            var answer_text, pos;
            var correct_answer = temp_answers[0];
            var answers = this.shuffleAnswers(temp_answers);
            for (i in answers) {
                pos = answers[i].indexOf(',');
                answer_text = (pos >= 0 ? answers[i].substring(0, pos) : answers[i]);
                if (correct_answer != answers[i]) {
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer mc_wrong' onclick='return false;'>" + answer_text + "</a>");
                } else {
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer mc_correct' onclick='return false;'>" + answer_text + "</a>");
                }
            }
        }
    }
    
//simple shuffle: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    this.shuffleAnswers = function(answers) { 
      var currentIndex = answers.length, temporaryValue, randomIndex;
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = answers[currentIndex];
        answers[currentIndex] = answers[randomIndex];
        answers[randomIndex] = temporaryValue;
      }
      return answers;
      
    }
