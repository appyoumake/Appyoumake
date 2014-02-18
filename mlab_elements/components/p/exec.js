document.mlab_code_p = new function() {
	
	this.config = new Array();
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config) {
        this.config = config;
        $(el).find("p").attr("contenteditable", "true");
        $(el).find("p").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("p").removeAttr("contenteditable");
    };
            


};