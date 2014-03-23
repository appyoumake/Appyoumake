document.mlab_code_h1 = new function() {
	
	this.config = new Array();
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config) {
        this.config = config;
        $(el).find("h1").attr("contenteditable", "true");
        $(el).find("h1").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("h1").removeAttr("contenteditable");
    };
            
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("h1").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };

    this.custom_add_link = function (el) {
        var link = prompt("Please enter a valid URL or a page number to link to.");
        if (link != null && link != "") {
            document.execCommand("CreateLink", false, link);
        }
    };

    this.custom_remove_link = function (el) {
		document.execCommand("unlink", false, false);
    };

    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };


};