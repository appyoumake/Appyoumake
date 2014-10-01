document.mlab_code_googlemap = new function() {
	
	this.config = {};
    this.class_identifier = "mlab_cp_googlemap_map";
    
    this.onCreate = function (el, config, url) {
        this.onLoad (el, config, url);
    };
    
//el = element this is initialising, config = global config from conf.txt
//maps are a bit tricky, 
	this.onLoad = function (el, config, url) {
        for (var attrname in config) { this.config[attrname] = config[attrname]; }
        
        var startLatlng = new google.maps.LatLng(START_LAT, START_LONG);

    	var myOptions = {
    			zoom : 16,
    			center: startLatlng,
    			mapTypeId : google.maps.MapTypeId.ROADMAP,
    			disableDefaultUI : true,
    			zoomControl: true,
    			scaleControl: true,
    			mapTypeControl: true,
    	};
    	map = new google.maps.Map(el.get(0), myOptions);
    	$(el).css("height", "300px");
    	$(el).resizable({"containment": designer}).find('#mlab_temp_map').attr("id", "").addClass(this.class_identifier);
        
    };

	this.onSave = function (el) {
		$(el).find('div').resizable( "destroy" );
    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("." + this.class_identifier);
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
            
	this.onDelete = function () {
		console.log('delete');
    };
    
};