//image component	

    this.media_type = "image";

    this.onCreate = function (el) {
        this.onLoad(el);
        var comp = $(el).find("[data-mlab-ct-multi_img-role='display']");
        if (comp.find("img").length == 0) {
            comp.css("background-image", "url(" + this.config.placeholder + ")");
        }
    }
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        var that = this;
        var that_el = el;
        $(el).find("[data-mlab-ct-multi_img-role='previous_image']").on("click", function() { that.custom_show_image_previous(that_el); } );
        $(el).find("[data-mlab-ct-multi_img-role='next_image']").on("click", function() { that.custom_show_image_next(that_el); } );
    };

	this.onSave = function (el) {
        var local_el = $(el).clone();
        local_el.find("img").removeClass("active").first().addClass("active");
        local_el.find("span").removeClass("active").first().addClass("active");
        return local_el[0].outerHTML;
    };
    
	this.onDelete = function () {

    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).first("img");
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
    
    this.custom_move_image_left = function (el) {
        this.moveImage(el, -1);
    };
    
    this.custom_move_image_right = function (el) {
        this.moveImage(el, 1);
    };

    this.custom_upload_images = function (el, event) {
        this.api.uploadMedia(el, this.config, this.media_type, this.cbAddImage, event, true);
    };
    
/**
     * Callback function for MLAB API to set image selected
     * As this is a multi-image control we add the images every time
     * @param {type} el
     * @param {type} img_url
     * @returns {undefined}
     */
    this.cbAddImage = function(el, img_url) {
        var guid = mlab.dt.api.getGUID();
        var container = $(el).find("[data-mlab-ct-multi_img-role='display']");
        var indicator = $(el).find("[data-mlab-ct-multi_img-role='indicator']");
        container.css("background-image", "");
        container.find("img").removeClass("active");
        indicator.find("span").removeClass("active");
        $("<img src='" + img_url + "' data-mlab-ct-multi_img-id='" + guid + "' data class='active' style='height: 100%; width: auto;'>").appendTo(container);
        $("<span data-mlab-ct-multi_img-role='current' class='active'></span>").appendTo(indicator);
        $(el).css("background-image", '');
    };

    this.custom_show_image_previous = function (el) {
        this.showImage(el, -1);
    }
    
    this.custom_show_image_next = function (el) {
        this.showImage(el, 1);
    }

    this.custom_delete_image = function (el) {
        var container = $(el).find("[data-mlab-ct-multi_img-role='display']");
        var image_count = container.find("img").length;
        var curr_img = container.find(".active");
        if (image_count > 0) {
            if (image_count > 1) {
                this.showImage(el, 1);
            }
            var num_active = curr_img.index() + 1;
            curr_img.remove();
            $(el).find("[data-mlab-ct-multi_img-role='indicator'] span:nth-child(" + num_active + ")").remove();
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
    
/**
 * This task moves the currently view image to the left or right depending on the direction 
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.moveImage = function (el, direction) {
        var container = $(el).find("[data-mlab-ct-multi_img-role='display']");
        var curr_img = container.find(".active");
        if (direction == 1) {
            var move_to = curr_img.next();
            if (move_to.length != 0) {
                move_to.after(curr_img);
            }
        } else {
            var move_to = curr_img.prev();
            if (move_to.length != 0) {
                move_to.before(curr_img);
            }
        }  
        
    }