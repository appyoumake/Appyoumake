	
	
    
//el = element this is initialising, config = global config from conf.yml
    this.onCreate = function (el) {
        var comp = $(el).find('div');
        if (comp.html() == "") {
            comp.html("<img src='" + this.config.placeholder + "'>");
        }

        this.custom_set_QR_code(el);
    };

    this.onLoad = function (el) {
    };
    
	this.onSave = function (el) {
        var temp_html = el.outerHTML;
        return temp_html;		
    };
            
    this.custom_set_QR_code = function (el) {
        this.api.getLibraries(this.config.name);
        var text = prompt(this.config.custom.msg_requesttext);
        if (text != null && text != "") {
            $(el).empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "table"});
        }
    };

//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    };