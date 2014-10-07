document.mlab_code_googlemap = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        debugger;
        this.config = config;
        this.config["api_function"] = api_func;

        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
        
        $("head").append($("<script src='" + this.config.custom.map_script + "' >")); 
    };

//
	this.onSave = function (el) {
        debugger;
        var temp_el = el.cloneNode(true);
        $(temp_el).find("." + this.config.custom.class_identifier)[0].innerHTML = "";
        var temp_html = $(temp_el)[0].outerHTML + "\n";
        return temp_html;
    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("." + this.class_identifier);
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
            
	this.onDelete = function () {
		console.log('delete');
    };
    
    this.initMap = function() {
        var startLatlng = new google.maps.LatLng(this.config.custom.start_lat, this.config.custom.start_long);
    	
        var map_options = {
    			zoom : this.config.custom.start_zoom,
    			center: startLatlng,
    			mapTypeId : google.maps.MapTypeId.ROADMAP,
    			disableDefaultUI : true,
    			zoomControl: true,
    			scaleControl: true,
    			mapTypeControl: true,
    	};

        map = new google.maps.Map($(el).find("." + this.config.custom.class_identifier)[0], map_options);
    }
    
};