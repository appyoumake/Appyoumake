document.mlab_code_video = new function() {
	
	this.config = {component_name: "video"};
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer) {
        for (var attrname in config) { this.config[attrname] = config[attrname]; }
        if ($(el).find('video').attr("poster") == "") {
        	$(el).find('video').attr("poster", "/img/mlab_placeholder_video.jpg").resizable({"containment": designer});
        } else {
        	$(el).find('video').resizable({"containment": designer});
        }
    };

	this.onSave = function (el) {
		$(el).find('video').resizable( "destroy" );
    };
            
    this.getProperties = function (comp) {
    	mlab_properties_dialogue("Last opp video", "Velg en video som skal lastes opp her", { mlab_property_title: true, mlab_property_uploadfiles: { allowed_types: ".mp4, webm, ogv", multi: false} }, this.config.component_name, comp );
	};

	this.setProperties = function (form_data, comp) {
		for (key in form_data) {
			if (form_data[key]["name"] == "mlab_property_title") {
				$(comp).find("video").attr("title", form_data[key]["value"]);
				break;
			}
		}
	};
	
	//must set the source of the video
	this.filesUploaded = function ( files, data, comp ) {
		if ($(comp).find("video").find("source").length > 0) {
			$(comp).find("video").find("source").attr("src", data.url ).attr("type", data.type);
		} else { 
			$(comp).find("video").append("<source src='" + data.url +"' type='" + data.type + "' />");
		}
		
	};
	
	this.onDelete = function () {
		console.log('delete');
    };
    
    this.getContentSize = function (el) {
        return $(el).find("video").duration;
    };

    
};