document.mlab_code_qrcode = new function() {
	
	this.config = {};
    
//el = element this is initialising, config = global config from conf.txt
    this.onCreate = function (el, config, designer, url) {
        this.onLoad (el, config, designer, url);
        var comp = $(el).find('div');
        if (typeof comp.html() == "") {
            comp.css("background-image", this.config.placeholder);
        }

        this.custom_set_QR_code(el);
    };

    this.onLoad = function (el, config, designer, url) {
        this.config = config;
    };
    
	this.onSave = function (el) {
		
    };
            
    this.getContentSize = function (el) {
        return $(el).find("h2").text().length;
    };
    
    this.loadLibraries = function () {
        if ("required_libs" in this.config) {
            for (i in this.config.required_libs) {
                if (this.config.required_libs[i].substr(-3) == ".js") {
                    if ($("script[src*='" + this.config.required_libs[i] + "']").length < 1) {
                        $("head").append($("<script src='" + this.config.component_url + this.config.name + "/js/" + this.config.required_libs[i] +"'>")); 
                    }
                } else if (this.config.required_libs[i].substr(-4) == ".css") {
                    if ($("link[href*='" + this.config.required_libs[i] + "']").length < 1) {
                        $("head").append($("<link rel='stylesheet' type='text/css' href='" + this.config.component_url + this.config.name + "/css/" + this.config.required_libs[i] +"'>")); 
                    }
                }
            }
        }
        
    }

    
    this.custom_set_QR_code = function () {
        this.loadLibraries();
        var text = prompt(this.config.custom.msg_requesttext);
        if (text != null && text != "") {
            $(el).empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "table"});
        }
    }

};