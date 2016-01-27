//image component	

    this.onCreate = function (el) {
        this.onLoad (el);
        
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
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
    
    this.centerFigureCaption = function (el) {
        var img = $('.mlab_current_component').find('img');
        var figcap = $('.mlab_current_component').find('figcaption');
        var imgWidth = img.width();
        figcap.css('width', imgWidth);
    };
      
    this.custom_scale_decrease = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '25%');
        this.centerFigureCaption(el);
    };
    
    this.custom_scale_increase = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '100%');
        this.centerFigureCaption(el);
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
        this.api.uploadMedia(el, this.config, "jpg,jpeg,png,gif", this.cbSetImageSource, event);
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
        var figcap = $('.mlab_current_component').find('figcaption');
        if (figcap.hasClass("mc_large")) {
            figcap.removeClass("mc_large").addClass("mc_medium");
        } else if (figcap.hasClass("mc_medium")) {
            figcap.removeClass("mc_medium").addClass("mc_small");
        }
    };
    
    this.custom_increase_size = function (el) {
		var figcap = $('.mlab_current_component').find('figcaption');
        if (figcap.hasClass("mc_small")) {
            figcap.removeClass("mc_small").addClass("mc_medium");
        } else if (figcap.hasClass("mc_medium")) {
            figcap.removeClass("mc_medium").addClass("mc_large");
        }
    };