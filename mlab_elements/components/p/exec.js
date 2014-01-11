document.mlab_code_p = new function() {
	
	this.config = new Array();
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config) {
        this.config = config;
        $(el).attr("contenteditable", "true");
    };

    this.onSave = function (el) {
		$(el).removeAttr("contenteditable");
    };

};