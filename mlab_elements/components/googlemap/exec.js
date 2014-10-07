document.mlab_code_googlemap = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        var guid = this.config["api_function"](MLAB_CB_GET_GUID);
        $(el).find(config.custom.class_identifier).attr("id", guid);
        $("#" + guid).after("<script>alert('hi');");


            if ($("script[src*='" + this.config.custom.map_script + "']").length < 1) {
                $("head").append($("<script src='" + document.mlab_code_googlemap.config.custom.map_script + "' >")); 
            }
        </script>
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
    
};