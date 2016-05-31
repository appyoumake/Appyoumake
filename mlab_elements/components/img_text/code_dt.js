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
    
    this.custom_add_link = function (el, event) {
        this.api.setLink(el, event);
    };

    this.custom_remove_link = function (el) {
        this.api.removeLink();
    };
    
    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };