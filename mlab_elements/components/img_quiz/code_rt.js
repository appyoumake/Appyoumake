    this.selected_questions = [];
/*
    Function fired when page loads. Does the following:
        - Assigns event handlers 
        - Moves to first image
        - Loads answers for the first image
    @param {DOM object} el Component element
*/
    this.onPageLoad = function(el) {
        
        function getRandomInts(num, max) {
            var ints = [];
            while (ints.length < num) {
                var randNum = Math.floor(Math.random() * (max - 1)) + 1; //start from 1 because we use nth-child in jQuery and this is 1-indexed: https://api.jquery.com/nth-child-selector/
                if (!(ints.indexOf(randNum) > -1)) { ints.push(randNum); }
            }
            return ints;
        }
        
//first we get the number of questions they want to display
        var display_num_questions = parseInt(mlab.api.getVariable(el, "display_num_questions")),
            total_num_questions = $(el).find("[data-mlab-ct-img_quiz-role='display'] > img").length;
        if (display_num_questions != 0 && display_num_questions < total_num_questions) {
            this.selected_questions = getRandomInts(display_num_questions, total_num_questions);
            this.selected_questions.sort();
            console.log(this.selected_questions);
        } else {
            this.selected_questions = Array.from({length: total_num_questions}, (v, k) => k+1); 
        }
        this.prepareImages(el);
        this.showImage(el);
        this.displayAnswers(el);
    };

/**
 * This prepares the images to show, we only use a subset as listed in the this.selected_questions array
 * The others we hide for this quiz session
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.prepareImages = function (el) {
        if (!el) {
            el = $('[data-mlab-type="img_quiz"]').filter(":visible");
            el.find('[data-mlab-ct-img_quiz-role="explain"]').slideUp();
        }
        
        var container = $(el).find("[data-mlab-ct-img_quiz-role='indicator']");
        for (var i = 1, max = container.find("span").length; i < max + 1; i++) {
            if ( this.selected_questions.indexOf(i) < 0 ) { //hide the non-selected questions
                container.find("span:nth-child(" + i + ")").addClass("mlab_hide");
                console.log("hide" + i);
            } else {
                container.find("span:nth-child(" + i + ")").removeClass("mlab_hide");
                console.log("show" + i);
            }
        }
    }

/**
 * This does the actual task of displaying next/previous image.
 * If no previous/next image exists we just bail
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.showImage = function (el, direction) {
        if (!el) {
            el = $('[data-mlab-type="img_quiz"]').filter(":visible");
            el.find('[data-mlab-ct-img_quiz-role="explain"]').slideUp();
        }
        
        var container = $(el).find("[data-mlab-ct-img_quiz-role='display']"),
            curr_img = container.find(".active"),
            num_active = curr_img.index() + 1,
            selected_index = this.selected_questions.indexOf(num_active),
            total_questions = this.selected_questions.length;
    
        if (direction === 1 && selected_index === (total_questions - 1)) {
            alert("Quiz finished");
            return;
        } else if (direction === 1 && selected_index < (total_questions - 1)) {
            selected_index++;
        } else if (direction === -1 && selected_index > 0) {
            selected_index--;
        } else { //kicks in when no direction value is defined, means we want to display first one
            selected_index = 0;
        }
        var move_to = container.find("img:nth-child(" + this.selected_questions[selected_index] + ")");
        curr_img.removeClass("active");
        move_to.addClass("active");
        $(el).find("[data-mlab-ct-img_quiz-role='indicator']").text((selected_index + 1) + "/" + total_questions);
        //$(el).find("[data-mlab-ct-img_quiz-role='indicator'] span:nth-child(" + this.selected_questions[] + ")").addClass("active").siblings().removeClass("active");
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
            image_index = $(el).find("[data-mlab-ct-img_quiz-role='display']").find(".active").data("mlab-ct-img_quiz-id");
            console.log(image_index);
        }
        var answer_container = $(el).find("[data-mlab-ct-img_quiz-role='display_answers']");
        answer_container.html("");
        var temp_answers = mlab.api.getVariable(el, "answers_" + image_index);
        
        if (typeof temp_answers != "undefined" && temp_answers.constructor == Array) {
            var answer_text;
            var correct_answer = temp_answers[0];
            var answers = this.shuffleAnswers(temp_answers);
            for (i in answers) {
                var answer_and_text = answers[i].split(/\,(.+)/);
                if (correct_answer != answers[i]) {
//they may not have specified a message to display
                    if (answer_and_text.length > 1) {
                        var expl = answer_and_text[1].replace(/'/g, "\\'");
                    } else {
                        var expl = "";
                    }
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer' data-mlab-ct-img_quiz-explanation='" + expl + "' onclick='mlab.api.components.img_quiz.checkAnswers(this); return false;'>" + answer_and_text[0] + "</a>");
                } else {
                    answer_container.append("<a class='mc_button mc_medium mc_left mc_entry mc_input mlab_ct_img_quiz_answer' data-mlab-ct-img_quiz-answer_type='correct' onclick='mlab.api.components.img_quiz.checkAnswers(this); return false;'>" + answer_and_text[0] + "</a>");
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
        var btn_clicked = $(button),
            el = btn_clicked.parents('[data-mlab-type="img_quiz"]'),
            res = msg = "";
        
        
        if (btn_clicked.data("mlab-ct-img_quiz-answer_type") == "correct") {
            btn_clicked.addClass("mc_correct");
            res = "Correct";
        } else {
            btn_clicked.addClass("mc_wrong").parent().find("[data-mlab-ct-img_quiz-answer_type='correct']").addClass("mc_correct");
            res = "Incorrect";
            msg = btn_clicked.data("mlab-ct-img_quiz-explanation");
        }
        
        el.find("[data-mlab-ct-img_quiz-role='result']").text(res);
        el.find('[data-mlab-ct-img_quiz-role="explain"] > p').text(msg);
        el.find('[data-mlab-ct-img_quiz-role="explain"]').slideDown();
        
        
    }
