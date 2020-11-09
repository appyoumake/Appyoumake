//image component	

    this.media_type = "image";
    var component = this;

    this.onCreate = function (el) {
        this.onLoad(el);
        var comp = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']");
        if (comp.find("img").length == 0) {
            comp.css("background-image", "url(" + this.config.placeholder + ")");
        }
    }
    
//el = element this is initialising, config = global config from conf.yml
    this.onLoad = function (el) {
        var that = this;
        var that_el = el;
        $(el).find("[data-mlab-ct-" + this.config.name + "-role='previous_image']").on("click", function() { that.custom_show_image_previous(that_el); } );
        $(el).find("[data-mlab-ct-" + this.config.name + "-role='next_image']").on("click", function() { that.custom_show_image_next(that_el); } );
        
        var pasteConainer = mlab.dt.api.pasteImageReader(function(results) {
            var url = mlab.dt.urls.component_upload_file
                    .replace("_APPID_", mlab.dt.app.id)
                    .replace("_COMPID_", component.config.name);

            $.ajax({
                url: url,
                data: {image: results.dataURL, name: results.name},
                type: 'POST',
                success: function(json) {
                    component.cbAddImage(el, json.urls[0]);
                }
            });
        });

        el.find(".mlab_ct_multi_img_carousel").prepend(pasteConainer)
    };

    this.onSave = function (el) {
        var local_el = $(el).clone();
        local_el.find("img").removeClass("active").first().addClass("active");
        local_el.find("span").removeClass("active").first().addClass("active");
        
        local_el.find(".paste-container").remove();

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
        var config_name = $(el).data("mlab-type");
        var guid = mlab.dt.api.getGUID();
        var container = $(el).find("[data-mlab-ct-" + config_name + "-role='display']");
        var indicator = $(el).find("[data-mlab-ct-" + config_name + "-role='indicator']");
        container.css("background-image", "");
        container.find("img").removeClass("active");
        indicator.find("span").removeClass("active");
        $("<img src='" + img_url + "' data-mlab-ct-" + config_name + "-id='" + guid + "' data class='active'>").appendTo(container);
        $("<span data-mlab-ct-" + config_name + "-role='current' class='active'></span>").appendTo(indicator);
        $(el).css("background-image", '');
    };

    this.custom_show_image_previous = function (el) {
        this.showImage(el, -1);
    };
    
    this.custom_show_image_next = function (el) {
        this.showImage(el, 1);
    };

    this.custom_delete_image = function (el) {
        var container = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']");
        var image_count = container.find("img").length;
        var curr_img = container.find(".active");
        if (image_count > 0) {
            if (image_count > 1) {
                this.showImage(el, 1);
            }
            var num_active = curr_img.index() + 1;
            curr_img.remove();
            $(el).find("[data-mlab-ct-" + this.config.name + "-role='indicator'] span:nth-child(" + num_active + ")").remove();
        }
    };
    

/**
 * This does the actual task of displaying next/previous image.
 * If no previous/next image exists we just bail
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.showImage = function (el, direction) {
        var container = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']");
        var curr_img = container.find(".active");
        if (direction == 1) {
            var move_to = curr_img.next("img");
            if (move_to.length == 0) {
                move_to = container.children("img:first");
            }
        } else {
            var move_to = curr_img.prev("img");
            if (move_to.length == 0) {
                move_to = container.children("img:last");
            }
        }  
        curr_img.removeClass("active");
        move_to.addClass("active");
        var num_active = move_to.index() ;
        $(el).find("[data-mlab-ct-" + this.config.name + "-role='indicator'] span:nth-child(" + num_active + ")").addClass("active").siblings().removeClass("active");
    };
    
/**
 * This task moves the currently view image to the left or right depending on the direction 
 * It also udates the "active" status of the image navigation dots so the correct one is highlighted
 * @param {type} el
 * @param {type} direction
 * @returns {undefined}
 */
    this.moveImage = function (el, direction) {
        var container = $(el).find("[data-mlab-ct-" + this.config.name + "-role='display']");
        var curr_img = container.find(".active");
        var num_active;
        if (direction == 1) {
            var move_to = curr_img.next("img");
            if (move_to.length != 0) {
                move_to.after(curr_img);
            } else {
                return;
            }
        } else {
            var move_to = curr_img.prev("img");
            if (move_to.length != 0) {
                move_to.before(curr_img);
            } else {
                return;
            }
        }
//update navigation dot
        var num_active = curr_img.index();
        $(el).find("[data-mlab-ct-" + this.config.name + "-role='indicator'] span:nth-child(" + num_active + ")").addClass("active").siblings().removeClass("active");
    };
    
    this.preview = function (el) {
        return { image_url: el.find('img:first').attr("src") };
    };
    
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var sel, range, html;
            sel = window.getSelection();
            range = sel.getRangeAt(0);
            range.deleteContents();
            var linebreak = document.createElement("br") ;
            range.insertNode(linebreak);
            var linebreak = document.createElement("br") ;
            range.insertNode(linebreak);
            range.setStartAfter(linebreak);
            range.setEndAfter(linebreak); 
        }
    };
    