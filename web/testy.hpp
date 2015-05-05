<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <title>Arild har alltid rett.html</title>
  
  <script type='text/javascript' src='https://code.jquery.com/jquery-2.1.0.js'></script>
  <link href="https://mlab.sinilab.net/css/mlab_editor_menu.css" rel="stylesheet">
  <link href="https://mlab.sinilab.net/css/mlab_all.css" rel="stylesheet">
  
  <style type='text/css'>

    div {
      width: 45%;
    }

    #skjema {
        /*border: 1px solid red;*/
    }

    #skjema_input {
        width: 100%;
        height: 100%;
        background-color: lightyellow;
    }


    .info {
        font-style: italic;
    }

    p {
        padding: 0;
        margin: 8px 0;
    }
    
    #div_input, #div_output {
        width: 98%;
        height: auto;
    }
    
    #div_input {
        background-color: lightyellow;
    }
    
    #div_input, #img_question_type {
        display: none;
    }
    
    #div_output p, #div_output h1 {
        /*display: none;*/
    }
    
  </style>
  


<script type='text/javascript'>//<![CDATA[ 
    var state_waiting_for_start = 1;
    var state_waiting_for_title = 2;
    var state_waiting_for_question_type = 3;
    var state_waiting_for_question = 4;
    var state_waiting_for_answer = 5;
    var quiz_checkbox = 4;
    var quiz_radiobutton = 5;
    var quiz_textbox = 2;
    var quiz_dropdown_menu = 3;
    var quiz_text = 1;
    
    var current_state = state_waiting_for_start;
    var quiz_type = quiz_checkbox;
    var current_select_box = undefined;

    $(document).on("keypress", "#skjema_input", function(e) {
        console.log(e.which);
        if (e.which == 13) {
            e.preventDefault();
            var item = $("#skjema_input").val().trim();
            $("#skjema_input").val("");
            var form_html = "";
            var begin = item.slice(0, 1);
            var end = item.slice(-1);

            switch(current_state) {
                case state_waiting_for_start:
                    return false;
                    break;

                case state_waiting_for_title:
                    $("#skjema_input").val("").attr("placeholder", "Please choose a question type");
                    addLine("<h1>" + item + "</h1>");
                    $("#img_question_type").slideDown();
                    current_state = state_waiting_for_question_type;
                    break;

                case state_waiting_for_question_type:
                    $("#img_question_type").slideUp();
                    $("#skjema_input").val("").attr("placeholder", "Please enter a question or some explanatory text. Questions must end with a '?'");
                    quiz_type = parseInt(item);
                    current_state = state_waiting_for_question;
                    break;

                case state_waiting_for_question:
                    if (end == "?") {
                        addLine("<p class='question'><b>" + item + "</b><br>");
                        current_state = state_waiting_for_answer;
                        $("#skjema_input").val("").attr("placeholder", "Please enter a possible answer for this question");
                    } else if (item == "") {
                        addLine("<hr>");
                    } else {
                         addLine("<p class='info'>" + item + "</p>");
                    }
                    break;

                case state_waiting_for_answer:
                    if (item == "") {
                        addLine("</p><hr>");
                        current_state = state_waiting_for_question_type;
                        current_select_box = undefined;
                        $("#skjema_input").val("").attr("placeholder", "Please choose a question type");
                        $("#img_question_type").slideDown();
                    } else {
                        switch (quiz_type) {
                            case quiz_checkbox: 
                                addLine("<input type='checkbox'>" + item + "<br>");
                                break;

                            case quiz_radiobutton: 
                                addLine("<input type='radio'>" + item + "<br>");
                                break;
                                
                            case quiz_textbox: 
                                addLine("<input type='text'>" + item + "<br></p><hr>");
                                $("#img_question_type").slideDown();
                                current_state = state_waiting_for_question_type;
                                return;
                                break;

                            case quiz_dropdown_menu: 
                                if (typeof current_select_box == "undefined" ) {
                                    $("#div_output").append().hide().slideDown();
                                    form_html = "<option>" + item + "<option>";
                                } else {
                                    form_html = "<option>" + item + "<option>";
                                }
                                return;
                                break;

                            case quiz_text: 
                                addLine("<p class='info'>" + item + "</p>");
                                $("#img_question_type").slideDown();
                                current_state = state_waiting_for_question_type;
                                return;
                                break;
                        }
                    }
                    
                    break;

            }                 
            console.log(form_html);
        }
    });
//]]>  

    function start_quiz() {
        $("#button_start").hide();
        $("#skjema_input").attr("placeholder", "Please enter title for this quiz");
        current_state = state_waiting_for_title;
        $("#div_input").slideDown();
        $("#skjema_input").focus();
    }
    
    function addLine(html) {
        form_html = $(html);
        form_html.hide();
        $("#div_output").append(form_html);
        form_html.slideDown();
    }
    
</script>


</head>
<body>
<?php phpinfo(); passthru("cp test.php testy.hpp") . "mmm";?>
    <div id="skjema_header">Skjema detaljer. <button id="button_start" onclick="start_quiz();">Start quiz creation</button></div>
    <br>
    <div id="skjema">
        <div id="div_output"></div>
        <div id="div_input">
            <img id="img_question_type" src="quiz-type.png">
            <textarea id="skjema_input"></textarea>
        </div>
    </div>
    
</body>


</html>
