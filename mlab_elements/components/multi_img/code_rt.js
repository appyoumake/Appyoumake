/*
    Function fired when page loads. Does the following:
        - Assigns event handlers 
        - Moves to first image
        - Loads answers for the first image
    @param {DOM object} el Component element
*/
    this.onPageLoad = function(el) {
        var that = this;
        var that_el = el;
        $(el).find("[data-mlab-ct-multi_img-role='previous_image']").on("click", function() { that.custom_show_image_previous(that_el); } );
        $(el).find("[data-mlab-ct-multi_img-role='next_image']").on("click", function() { that.custom_show_image_next(that_el); } );

//from http://demos.jquerymobile.com/1.4.5/popup-dynamic/
        $(el).find("[data-mlab-ct-multi_img-role='display'] > img").on( "click", function() {
            var target = $( this ),
                image_name = target.attr( "src" ),
                short = image_name.substring(6, image_name.length - 37),
                img = '<img src="' + image_name + '" alt="' + short + '" class="photo">',
                popup = '<div data-role="popup" id="popup-' + short + '" data-short="' + short +'" data-theme="none" data-overlay-theme="a" data-corners="false" data-tolerance="15"></div>';

            // Create the popup.
            $( img )
                .appendTo( $( popup )
                .appendTo( $.mobile.activePage )
                .popup() )
                .toolbar();

// Wait with opening the popup until the popup image has been loaded in the DOM.
// This ensures the popup gets the correct size and position
            $( ".photo", "#popup-" + short ).load(function() {
// Open the popup
                $( "#popup-" + short ).popup( "open" );
                $( "#popup-" + short + " > img").imgViewer2();
// Clear the fallback
                clearTimeout( fallback );
            });
// Fallback in case the browser doesn't fire a load event
            var fallback = setTimeout(function() {
                $( "#popup-" + short ).popup( "open" );
            }, 2000);
        });

        // Set a max-height to make large images shrink to fit the screen.
        $( document ).on( "popupbeforeposition", ".ui-popup", function() {
            var image = $( this ).children( "img" ),
                height = image.height(),
                width = image.width();

            // Set height and width attribute of the image
            $( this ).attr({ "height": height, "width": width });

            // 68px: 2 * 15px for top/bottom tolerance, 38px for the header.
            var maxHeight = $( window ).height() - 68 + "px";

            $( "img.photo", this ).css( "max-height", maxHeight );
        });

        // Remove the popup after it has been closed to manage DOM size
        $( document ).on( "popupafterclose", ".ui-popup", function() {
            $( this ).remove();
        });

    };

/**
 * Flips between the images
 * @param {type} el
 * @returns {undefined}
 */
    this.custom_show_image_previous = function (el) {
        this.showImage(el, -1);
    }
    
    this.custom_show_image_next = function (el) {
        this.showImage(el, 1);
    }

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
                move_to = container.children(":first");
            }
        } else {
            var move_to = curr_img.prev();
            if (move_to.length == 0) {
                move_to = container.children(":last");
            }
        }  
        curr_img.removeClass("active");
        move_to.addClass("active");
        var num_active = move_to.index() + 1;
        $(el).find("[data-mlab-ct-multi_img-role='indicator'] span:nth-child(" + num_active + ")").addClass("active").siblings().removeClass("active");
    }
        