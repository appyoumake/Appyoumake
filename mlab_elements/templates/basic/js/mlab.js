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
            if (current == max) { return -1; }
            current++;
            filename = ("000" + current).slice(-3) + ".html";
            new_location = current;
            break;
            
        case "previous" :
            if (current == "index") { return -1; }
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
             if (move_to < 0 || move_to > max) { return -1; }
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
    
    $('#content').load(filename + selector, function( response, status, xhr ) {
        if ( status == "error" ) {
            var msg = "Sorry but there was an error: ";
            alert( msg + xhr.status + " " + xhr.statusText );
        } 
    });
    
    return new_location;
}