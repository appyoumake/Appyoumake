//image and text component, inherits from img component	
   
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("figcaption").attr("contenteditable", "true");
        $(el).find("p").attr("contenteditable", "true");
    };

	this.onSave = function (el) {
        $(el).find("figcaption").removeAttr("contenteditable");
        $(el).find("p").removeAttr("contenteditable");
        
        var temp_html = el.outerHTML;

        $(el).find("figcaption").attr("contenteditable", "true");
        $(el).find("p").attr("contenteditable", "true");
        
        return temp_html;
        
    };
    
    this.custom_add_link = function (el) {
        link = this.api.getLink();
        if (link) {
            var newLink = document.execCommand('createlink', false, link);
            newLink.target = "_new";
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