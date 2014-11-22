	
	this.config = {};
    
//el = element this is initialising, config = global config from conf.yml
    this.onCreate = function (el, config, url) {
        this.onLoad (el, config, url);
        var comp = $(el).find('div');
        if (typeof comp.html() == "") {
            comp.css("background-image", this.config.placeholder);
        }

        this.custom_set_QR_code(el);
    };

    this.onLoad = function (el, config, url) {
        this.config = config;
    };
    
	this.onSave = function (el) {
        var temp_html = el.outerHTML;
        return temp_html;		
    };
            
    this.getContentSize = function (el) {
        return $(el).find("h2").text().length;
    };
    
    this.custom_set_QR_code = function () {
        this.loadLibraries();
        var text = prompt(this.config.custom.msg_requesttext);
        if (text != null && text != "") {
            $(el).empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "table"});
        }
    }
