document.mlab_code_h2 = new function() {
	
	this.config = new Array();
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config) {
        this.config = config;
        $(el).find("h2").attr("contenteditable", "true");
        $(el).find("h2").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("h2").removeAttr("contenteditable");
    };
            
    this.getContentSize = function (el) {
        return $(el).find("h2").text().length;
    };

};