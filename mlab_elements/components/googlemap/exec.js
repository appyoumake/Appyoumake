document.mlab_code_googlemap = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        debugger;
        this.onLoad (el, config, api_func);
        var self = this;
        var guid = this.config["api_function"](MLAB_CB_GET_GUID);
        $(el).find("." + this.config.custom.class_identifier).attr("id", guid);
        
//warning about script not necessarily executed before success: api.jquery.com/jquery.getscript/
//is apparently wrong: http://stackoverflow.com/questions/21196617/jquery-getscript-load-vs-execution
//so we assume gmaps file is loaded in the success callback.
        $.getScript(this.config.custom.map_script, function() {
            debugger;
            $("#" + guid).after("<script id=script_" + guid +
                                "var myOptions = " + eval("(" + JSON.stringify(document.mlab_code_googlemap.config.custom.map_options) +")") + ";\n" +
                                "myOptions.center = new google.maps.LatLng(" + self.config.custom.lat + ", " + self.config.custom.lng + ")" + 
                                "map = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                                "</script>");
        });
        
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
    };

//
	this.onSave = function (el) {
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
    
    this.initMap = function () {
        
    }
    
};