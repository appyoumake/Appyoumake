document.mlab_code_googlemap = new function() {
	
	this.config = {component_name: "map"};
    this.map_class_identifier = "mc_map";
    
//el = element this is initialising, config = global config from conf.txt
//maps are a bit tricky, 
	this.onLoad = function (el, config, designer) {
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
    	$(el).resizable({"containment": designer}).find('#mlab_temp_map').attr("id", "").addClass(this.map_class_identifier);
        
    };

	this.onSave = function (el) {
		$(el).find('div').resizable( "destroy" );
    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("." + this.map_class_identifier);
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
            
    this.getProperties = function (comp) {
    	mlab_properties_dialogue("Velg kart plassering", "Velg hvor kartet skal starte", { mlab_property_title: true}, this.config.component_name, comp );
	};

	this.setProperties = function (form_data, comp) {
		return;
		for (key in form_data) {
			if (form_data[key]["name"] == "mlab_property_title") {
				$(comp).find("div").attr("title", form_data[key]["value"]);
				break;
			}
		}
	};
	
	this.onDelete = function () {
		console.log('delete');
    };
    
};