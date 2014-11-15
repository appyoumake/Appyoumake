<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <title> - jsFiddle demo</title>
  
  <script type='text/javascript' src='http://code.jquery.com/jquery-2.1.0.js'></script>
  <link href="https://mlab.sinilab.net/css/mlab_editor_menu.css" rel="stylesheet">
  <link href="https://mlab.sinilab.net/css/mlab_all.css" rel="stylesheet">
  
  <style type='text/css'>
    div {
      float: left;
      width: 45%;

    }
    #skjema, #skjema_input {
    border: 1px solid red;
    min-height: 200px;
}

#skjema_input {
    width: 600px;
    height: 600px;
}


.info {
    font-style: italic;
}

p {
    padding: 0;
    margin: 8px 0;
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
  <div id="skjema_header">Her vil skjemaet ditt vises ettersom du fyller in detaljer p&aring; h&oslash;yre side</div>
  <div id="skjema_input_header">&aring; lage et skjema er s&aring; enkelt som &aring; taste inn dine sp&oslash;rsm&aring;l og svar. <ul><li>Alle sp&oslash;rsm&aring;l 

ender i et sp&oslash;rsm&aring;lstegn p&aring; slutten av en paragraf/linje</li><li>Alle svar begynner med <ul><li>et pluss tegn (for riktig(e) svar) 

<br>eller</li><li>et minus tegn (for feil svar).</li></ul></li><li>En  paragraf uten noen av disse blir vist som forklarende tekst.</li><li>En blank linje betyr at du 

starter et nytt sp&oslash;rsm&aring;l.</li><li>Har du et sp&oslash;rsm&aring;l uten noen svar s&aring; benyttes en tekst boks, sp&oslash;rsm&aring;l med svar benytter 

avkrysningsbokser.</li></ol></div>
  
<br>
<div id="skjema"></div>
    <textarea id="skjema_input"></textarea>
</body>


</html>
