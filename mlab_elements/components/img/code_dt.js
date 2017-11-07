//image component	

    this.media_type = "image";

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
        $(el).find("figcaption").attr("contenteditable", "true");
    };

	this.onSave = function (el) {
        $(el).find("figcaption").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("figcaption").attr("contenteditable", "true");
        return temp_html;
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