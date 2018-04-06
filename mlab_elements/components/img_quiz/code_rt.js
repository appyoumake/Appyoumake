/*
    Function fired when page loads. Does the following:
        - Assigns event handlers 
        - Moves to first image
        - Loads answers for the first image
    @param {DOM object} el Component element
*/

    this.onPageLoad = function(el) {
        this.displayAnswers(el);    
    };

/**
 * This does the actual task of displaying next/previous image.
 * If no previous/next image exists we just bail
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.showImage = function (el, direction) {
        var container = $(el).find("[data-mlab-ct-multi_img-role='display']");
        var curr_img = container.find(".active");
        if (direction == 1) {
            var move_to = curr_img.next();
            if (move_to.length == 0) {
                alert("Quiz finished");
            }
        } else {
            var move_to = curr_img.prev();
            if (move_to.length == 0) {
                return;
            }
        }  
        curr_img.removeClass("active");
        move_to.addClass("active");
        var num_active = move_to.index() + 1;
        $(el).find("[data-mlab-ct-multi_img-role='indicator'] span:nth-child(" + num_active + ")").addClass("active").siblings().removeClass("active");
        this.displayAnswers(el);
    }
    
/**
 * Function that will display one button for each answer that has been entered
 * It randomises the order because the first answer entered is always the correct one
 * @param {type} el
 * @param {type} image_index
 * @returns {undefined}
 */
    this.displayAnswers = function (el, image_index) {
        if (typeof image_index == "undefined") {
            image_index = $(el).find("[data-mlab-ct-multi_img-role='display']").find(".active").data("mlab-ct-multi_img-id");
            console.log(image_index);
        }
        var answer_container = $(el).find("[data-mlab-ct-multi_img-role='display_answers']");
        answer_container.html("");
        var temp_answers = mlab.api.getVariable(el, "answers_" + image_index);
        
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            var answer_text;
            var correct_answer = temp_answers[0];
            var answers = this.shuffleAnswers(temp_answers);
            for (i in answers) {
                var answer_and_text = answers[i].split(/\,(.+)/);
                if (correct_answer != answers[i]) {
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer' data-mlab-ct-multi_img-explanation='" + answer_and_text[1].replace(/'/g, "\\'") + "' onclick='mlab.api.components.img_quiz.checkAnswers(this); return false;'>" + answer_and_text[0] + "</a>");
                } else {
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer' data-mlab-ct-multi_img-answer_type='correct' onclick='mlab.api.components.img_quiz.checkAnswers(this); return false;'>" + answer_and_text[0] + "</a>");
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
    
/**
 * Checks the answer for 
 */
    this.checkAnswers = function(button) {
        var btn_clicked = $(button);
        if (btn_clicked.data("mlab-ct-multi_img-answer_type") == "correct") {
            btn_clicked.addClass("mc_correct");
            alert("Correct answer");
        } else {
            btn_clicked.addClass("mc_wrong").parent().find("[data-mlab-ct-multi_img-answer_type='correct']").addClass("mc_correct");
            alert("Wrong answer");
        }
        
        $('[data-mlab-ct-img_quiz-role="explain"]').text().slideDown()
        this.showImage(btn_clicked.parents('[data-mlab-type="img_quiz"]'), 1);
    }
