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
    
    this.zoomImage = function (el) {
        var cid = mlab.api.getGUID();
        //mlab.api.setAppVariable('multi_img', 'canvas_id', cid)
        var canvas = $("<canvas class='mlab_ct_multi-img_zoom-canvas' onclick='$(this).remove();' id='" + cid + "'>").appendTo("body");
        ctx = canvas.getContext("2d");

        /*canvas.width = 903;
        canvas.height = 657;*/

        /*var img = $(el);
        ctx.drawImage(img,0,0);   */
        var gesturableImg = new ImgTouchCanvas({
            canvas: $('#' + cid),
            path: $(el).attr('src')
        });        
    }
    