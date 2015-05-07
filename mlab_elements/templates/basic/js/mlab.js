/* api file, merge with stuff from Snapper */
/* namespace = mlabrt */

/**
 * current = page that is currently displayed
 * move_to can be index, first, last, next, previous or a number
 * @param {type} page
 * @returns {undefined}
 */
function mlabrt_load_page(current, move_to, max) {
    var filename, selector = "";
    var new_location = 0;
    switch (move_to) {
        case "index":
            filename = "index.html";
            new_location = 0;
            break;

        case "first" :
            filename = "001.html";
            new_location = 1;
            break;

        case "last" :
            filename = ("000" + max).slice(-3) + ".html";
            new_location = max;
            break;

        case "next" :
            if (current == max) {
                return -1;
            }
            current++;
            filename = ("000" + current).slice(-3) + ".html";
            new_location = current;
            break;

        case "previous" :
            if (current == "index") {
                return -1;
            }
            if (current == 1) {
                filename = "index.html";
                new_location = 0;
            } else {
                current--;
                filename = ("000" + current).slice(-3) + ".html";
                new_location = current;
            }
            break;

//pages are always saved as nnn.html, i.e. 001.html, and so on, so need to format the number
        default:
            var pg = parseInt(move_to);
            if (isNaN(pg)) {
                return -1;
            }
            if (move_to < 0 || move_to > max) {
                return -1;
            }
            if (move_to == 0) {
                filename = "index.html";
            } else {
                filename = ("000" + move_to).slice(-3) + ".html";
            }
            new_location = move_to;
            break;
    }

//have calculated the file name, now we need to try to load it
//must load only content from the index.html to avoid duplicates inside each other
    if (filename == "index.html") {
        selector = " #content"
    }

    $('#content').load(filename + selector, function(response, status, xhr) {
        if (status == "error") {
            var msg = "Sorry but there was an error: ";
            $("#content").html(msg + xhr.status + " " + xhr.statusText);

        }
    });

    return new_location;
}


mlabrt_current = 0;
mlabrt_max = 3;

function mlabrt_move_wrapper(move_to) {
    var tmp = mlabrt_load_page(mlabrt_current, move_to, mlabrt_max);
    if (tmp >= 0) {
        mlabrt_current = tmp;
        $("#page_slider").slider().val(mlabrt_current);
        $("#page_slider").slider("refresh");
    }
}


//runs once the page DOM is ready for JavaScript code to execute - jQuery
$(document).ready(function() {

    //starts with hiding the menu and the footer
    $('.btn_secondary').hide();
    //TODO: jQuery error that makes footer flikker... $('#footer').hide();

    //hides the navigation arrows when clicking the screen 
    //(header and footer are hidden automatically - jQuery Mobile)
    $('[data-role="page"]').on('click', function() {
        $("#panel_left, #panel_right").toggle();
    });


    //hides the header and footer when the gradient part of the 
    // footer is clicked
    $('#gradient_footer').on('click', function() {
        $("#header, #footer").toggle();
    });

    //stops the hide/show functionalilty when it is the header,
    //footer or navigation arrows that has been clicked
    $("#panel_left, #panel_right, #header, #footer").click(function(event) {
        event.stopPropagation();
    });

    //Page slider in footer
    $("#page_slider").slider("option", "max", mlabrt_max);
    $("#page_slider").slider("refresh");
    $("#page_slider").on("slidestop", function(event, ui) {
        mlabrt_move_wrapper($("#page_slider").slider().val());
    });

    //Heraldisk button - show/hide the menu and footer 
    $('#btn_heraldisk').on('click', function() {
        $('.btn_secondary').toggle();
        //TODO: jQuery error that makes footer flikker... $('#footer').toggle();
    });

    //Menu button - opens the index page    
    $("#btn_menu").on('click', function() {
        window.location = "index.html";
    });

    //ColorToogel button - toggles between dark and white color theme
    $("#btn_color_toggle").on('click', function() {
        $('#page').toggleClass('white');
    });

    //tooles between large and small content in the 
    $('#btn_txsize').on('click', function() {
        // $('#btn_txsize').css('font-size','3em');
        $('#mlab_editable_area').toggleClass('large_text');
    });

    //
    $('#panel_left').on('click', function() {
        mlabrt_move_wrapper('previous');
    });

    //
    $('#panel_right').on('click', function() {
        mlabrt_move_wrapper('next');
    });
    
    //Settings button - opens the modal window
    $("#btn_settings").on('click', function() {
        //se på...
        var id = '#mlab_dialog';
    
        //Get the screen height and width
        var maskHeight = $(document).height();
        var maskWidth = $(window).width();
    
        //Set height and width to mask to fill up the whole screen
        $('#mlab_mask').css({'width':maskWidth,'height':maskHeight});
        
        //transition effect        
        $('#mlab_mask').fadeIn(1000);    
        $('#mlab_mask').fadeTo("slow",0.8);    
    
        //Get the window height and width
        var winH = $(window).height();
        var winW = $(window).width();
              
        //Set the popup window to center
        $(id).css('top',  winH/2-$(id).height()/2);
        $(id).css('left', winW/2-$(id).width()/2);
    
        //transition effect
        $(id).fadeIn(2000); 
    
    });
    
    //if close button is clicked
    $('.mlab_window .mlab_close_dialog').click(function (e) {
        //Cancel the link behavior
        e.preventDefault();
        $('#mlab_mask, .mlab_window').hide();
    });        
    
    //if mask is clicked
    $('#mlab_mask').click(function () {
        $(this).hide();
        $('.mlab_window').hide();
    });

});