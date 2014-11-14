
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <title> - jsFiddle demo</title>
  
  <script type='text/javascript' src='//code.jquery.com/jquery-2.1.0.js'></script>
  
  
  
  
  <link rel="stylesheet" type="text/css" href="/css/result-light.css">
  
  <style type='text/css'>
    #skjema, #skjema_input {
    border: 1px solid red;
    min-height: 200px;
}

#skjema_input {
    width: 600px;
    height: 600px;
}

.question {
    font-weight: bold;
}

.info {
    font-style: italic;
}
  </style>
  


<script type='text/javascript'>//<![CDATA[ 

$(document).on("keypress", "#skjema_input", function(e) {
    
     if (e.which == 13) {
    
         var s = $("#skjema_input").val();
         var items = s.split("\n");
         var state_in_question = false;
         var state_in_responses = false;
         var form_html = "";
         for (i in items) {
             item = items[i].trim();
             var begin = item.slice(0, 1);
             var end = item.slice(-1);
             if (state_in_responses) {
                 if (begin == "-" || begin == "+") {
                     form_html = form_html + "&nbsp;<input type='checkbox'>&nbsp;" + items[i].trim().slice(1) + "<br>";
                 } else if (item == "") {
                     state_in_question = false;
                     state_in_responses = false;
                     form_html = form_html + "</p><hr>";
                 } else {
                      form_html = form_html + "<span class='info'>" + items[i] + "</span>";
                 }
             } else if (state_in_question) {
                 if (begin == "-" || begin == "+") {
                     state_in_responses = true;
                     form_html = form_html + "&nbsp;<input type='checkbox'>&nbsp;" + items[i].trim().slice(1) + "<br>";
                 } else if (item == "" && !state_in_responses) {
                     state_in_question = false;
                     form_html = form_html + "<input type='text'></p><hr>";
                 } else if (item == "") {
                     state_in_question = false;
                     state_in_responses = false;
                     form_html = form_html + "</p><hr>";
                 } else {
                      form_html = form_html + "<p class='info'>" + items[i] + "</p>";
                 }
             } else {
                 if (end == "?") {
                     form_html = form_html + "<p class='question'><b>" + items[i] + "</b><br>";
                     state_in_question = true;
                 } else if (item == "") {
                     form_html = form_html + "<hr>";
                 } else {
                      form_html = form_html + "<p class='info'>" + items[i] + "</p>";
                 }
             }                 
         }
         console.log(form_html);
         $("#skjema").html(form_html);
     }
});
//]]>  

</script>


</head>
<body>
  <div id="skjema"></div>
<br>
Legg inn skjema her:<br>
    <textarea id="skjema_input"></textarea>
<div style="display: hidden">
twst
are u hungry?
+yes
-no

are you ugly?
+yes
+no
maybe
+maybe

How was the weather?



http://jsfiddle.net/kc2x6pce/1/
</div>
</body>


</html>

