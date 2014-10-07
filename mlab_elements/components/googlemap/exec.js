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
        
        var startLatlng = new google.maps.LatLng(this.config.start_lat, this.config.start_long);
    	
        var map_options = {
    			zoom : this.config.start_zoom,
    			center: startLatlng,
    			mapTypeId : google.maps.MapTypeId.ROADMAP,
    			disableDefaultUI : true,
    			zoomControl: true,
    			scaleControl: true,
    			mapTypeControl: true,
    	};

        map = new google.maps.Map($(el).find("." + this.config.custom.class_identifier)[0], map_options);
    	$(el).css("height", "300px");
    };

	this.onSave = function (el) {

    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("." + this.class_identifier);
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
            
	this.onDelete = function () {
		console.log('delete');
    };
    
};