document.mlab_code_ul = new function() {
	
	this.config = new Array();
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config) {
        this.config = config;
        $(el).find("ul").attr("contenteditable", "true");
        $(el).find("ul").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("ul").removeAttr("contenteditable");
    };
            
    this.getContentSize = function (el) {
        return $(el).find("p").text().length;
    };


};