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

//code to display a zoom popup (partly from http://demos.jquerymobile.com/1.4.5/popup-dynamic/)
        $(el).find("[data-mlab-ct-multi_img-role='display'] > img").on( "click", function() {
            var target = $( this ),
                image_name = target.attr( "src" ),
                img_height = target[0].naturalHeight,
                img_width = target[0].naturalWidth,
                header_height = $("[data-role='header']").height(),
                zoom_height = $( window ).height() - (header_height + 10),
                zoom_width = $( window ).width() - 20,
                short = new String(image_name).substring(image_name.lastIndexOf('/') + 1).replace(/\W/g, ''),
                img = '<img src="' + image_name + '" data-image-height="' + img_height + '" data-image-width="' + img_width + '" class="photo" height="' + zoom_height + '" >', // width="' + zoom_width + '"
                popup = '<div data-role="popup" id="popup-' + 
                        short + '" data-short="' + short +'" data-theme="none" data-overlay-theme="a" data-corners="false" data-tolerance="' + 
                        header_height + ',5,10,5" data-position-to="[data-role=\'header\']"></div>';
// Create the popup window hosting the image
            var temp_popup = $( img ).appendTo( $( popup ).appendTo( $.mobile.activePage ).popup() );
            temp_popup.parent().on('swipeleft swiperight', function(e){e.stopPropagation();e.preventDefault();})

// Wait with opening the popup until the popup image has been loaded in the DOM.
// This ensures the popup gets the correct size and position
            $( ".photo", "#popup-" + short ).load(function() {
                var img = $( "#popup-" + short + " > img");
                
// Open the popup
                $( "#popup-" + short ).popup( "open" );
                                
                img.imgViewer2({
                    onReady: function() {
                        debugger;
                        var orig_height = $( this.element[0] ).data("image-height"),
                            orig_width = $( this.element[0] ).data("image-width"),
                            img = $( "#popup-" + short + " > img"),
                            width = img.width(),
                            height = img.height(),
                            zoom = Math.max((orig_height / height), (orig_width / width), 1);
                        this.setZoom(zoom).panTo([0.5,0.5]);
                    }
                });
                
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

// Set height and width attribute of the popup
            var maxHeight = $( window ).height() - ($("[data-role='header']").height() + 10);
            $( this ).attr({ "height": maxHeight, "width": ($( window ).width() - 20) });
            $( "img.photo", this ).css( "max-height", maxHeight + "px" );
            

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
