document.mlab_code_img = new function() {
	
	this.config = {component_name: "img"};
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer) {
        if (typeof config != "undefined") {
            for (var attrname in config) { this.config[attrname] = config[attrname]; }
        }
        $(el).find('img').resizable({"containment": designer});
    };

	this.onSave = function (el) {
        var img = $(el).find('img');
        var w = img.width();
        var h = img.height();

        img.resizable( "destroy" );
        img.css({ width: w, height: h });
    };
            
    this.getProperties = function (comp) {
    	mlab_properties_dialogue("Last opp bilde", "Velg et bilde som skal lastes opp her", { mlab_property_title: true, mlab_property_uploadfiles: { allowed_types: "jpg, jpeg, png, gif", multi: false} }, this.config.component_name, comp );
	};

	this.setProperties = function (form_data, comp) {
		for (key in form_data) {
			if (form_data[key]["name"] == "mlab_property_title") {
				$(comp).find("img").attr("title", form_data[key]["value"]);
				break;
			}
		}
	};
	
	this.filesUploaded = function ( files, data, comp ) {
		$(comp).find("img").attr("src", data.url );
	};
	
	this.onDelete = function () {
		console.log('delete');
    };
    
};