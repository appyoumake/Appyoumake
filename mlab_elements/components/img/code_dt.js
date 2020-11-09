//image component	

    this.media_type = "image";
    var component = this;
    
    this.onCreate = function (el) {
        this.onLoad (el);
        
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
            el.find('figure').css('width', '50%');
        }
        
        $(el).find('figcaption').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "caption"]));
        $(el).find('p').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "text"]));

    }
    
//el = element this is initialising, config = global config from conf.yml
    this.onLoad = function (el) {
        var imageConainer = $("<div class='img-container'></div>");
        var pasteConainer = mlab.dt.api.pasteImageReader(function(results) {
            var url = mlab.dt.urls.component_upload_file
                    .replace("_APPID_", mlab.dt.app.id)
                    .replace("_COMPID_", component.config.name);

            $.ajax({
                url: url,
                data: {image: results.dataURL, name: results.name},
                type: 'POST',
                success: function( json ) {
                    component.cbSetImageSource(el, json.urls[0]);
                }
            });
        });

        el.find("img").wrap(imageConainer);
        el.find(".img-container").prepend(pasteConainer)
        
        $(el).find("figcaption").attr("contenteditable", "true");
        $(el).find("p").attr("contenteditable", "true");
    }
    
    this.onSave = function (el) {
        var local_el = $(el).clone();
        local_el.find("figcaption").removeAttr("contenteditable");
        local_el.find("p").removeAttr("contenteditable");
        local_el.find(".paste-container").remove();
        local_el.find(".img-container > img").unwrap();
        
        return local_el[0].outerHTML;
    };
    
    this.onDelete = function () {

    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("img");
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
    
      
    this.custom_scale_decrease = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        var w = fig[0].style.width;
        if (w == "" || w.slice(-1) != "%") {
            var scale = 100;
        } else {
            var scale = parseInt(w);
        }
        if (scale >= 20) {
            fig.css('width', (scale - 10).toString() + '%');
        }
    };
    
    this.custom_scale_increase = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        var w = fig[0].style.width;
        if (w == "" || w.slice(-1) != "%") {
            var scale = 100;
        } else {
            var scale = parseInt(w);
        }
        if (scale <= 90) {
            fig.css('width', (scale + 10).toString() + '%');
        }
    };
    
    this.custom_position_left = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'left', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_right = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'right', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_centre = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'none', 'margin-left': 'auto', 'margin-right': 'auto'});
    };
    
    this.custom_upload_image = function (el, event) {
        this.api.uploadMedia(el, this.config, this.media_type, this.cbSetImageSource, event);
    };
    
/**
     * Callback function for MLAB API to set image selected
     * @param {type} el
     * @param {type} img_url
     * @returns {undefined}
     */
    this.cbSetImageSource = function(el, img_url) {
        var img = $(el).find('img');
        img.attr('src', img_url);
    };

    this.custom_decrease_size = function (el) {
        var text = $('.mlab_current_component').find('figcaption,p');
        if (text.hasClass("mc_large")) {
            text.removeClass("mc_large").addClass("mc_medium");
            text
        } else if (text.hasClass("mc_medium")) {
            text.removeClass("mc_medium").addClass("mc_small");
        } else {
            text.addClass("mc_small");
        }
    };
    
    this.custom_increase_size = function (el) {
		var text = $('.mlab_current_component').find('figcaption,p');
        if (text.hasClass("mc_small")) {
            text.removeClass("mc_small").addClass("mc_medium");
        } else if (text.hasClass("mc_medium")) {
            text.removeClass("mc_medium").addClass("mc_large");
        } else {
            text.addClass("mc_large");
        }
    };
    
    this.onBlur = function (el) {
        if ( $(el).find('p').text().trim() == "" ) {
            $(el).find('p').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "text"]));
        }
        if ( $(el).find('figcaption').text().trim() == "" ) {
            $(el).find('figcaption').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "caption"]));
        }
    }
    
    this.custom_add_link = function (el, event) {
        this.api.setLink(el, event);
    };

    this.custom_remove_link = function (el) {
        this.api.removeLink();
    };
    
    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };

    this.toggle = function (el, type, tag, after, html) {
        var text = $(el).find(tag);
        if (text.length > 0) {
            if (confirm("Are you sure you want to turn off the " + type + " on this image? The content of the " + type + " will be lost")) {
                text.remove();
            }
        } else {
            $(el).find(after).after(html);
            $(el).find(tag).attr("contenteditable", "true");
        }
    }

//adds or removes the para html element, see html definition in conf.yml for the corect HTML to use
    this.custom_toggle_text = function (el) {
        this.toggle(el, "text", "p", "figure", "<p class='mc_text mc_display mc_medium'>Your text goes here</p>");
    };


//adds or removes the para html element, see html definition in conf.yml for the corect HTML to use
    this.custom_toggle_caption = function (el) {
        this.toggle(el, "caption", "figcaption", ".img-container", "<figcaption class='mc_text mc_display mc_figure_text' contenteditable='true'>Caption</figcaption>");
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
    