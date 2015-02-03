	
	

    this.onCreate = function (el) {
        this.onLoad (el);
        
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
        }

        this.custom_upload_image(el);
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
    
    this.custom_scale_to_25_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '25%');
    };
    
    this.custom_scale_to_50_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '50%');
    };
    
    this.custom_scale_to_75_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '75%');
    };
    
    this.custom_scale_to_100_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '100%');
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
    
    
    this.custom_upload_image = function (el) {
        this.api.uploadMedia(el, this.config, "jpg,jpeg,png,gif", this.cbSetImageSource);
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

  