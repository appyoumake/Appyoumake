document.mlab_code_chapter = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, designer, api_func) {
        
        if ($(el).siblings("[data-mlab-type='chapter']").length > 0) {
            $(el).remove();
            alert("You already have a chapter component on this page, you cannot have more than one per page");
            return;
        } 

        this.onLoad (el, config, designer, api_func);
        $(el).attr("data-mlab-chapter-id", this.config["api_function"](MLAB_CB_GET_GUID));
        this.highlight($(el).find("h1"));
    };

    //el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        $(el).find("h1").attr("contenteditable", "true");
        $(el).find("h1").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add chapter headline"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("h1").removeAttr("contenteditable");
    };
            
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("h1").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
    
    this.getContentSize = function (el) {
        return $(el).find("h1").text().length;
    };

    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };
  
    this.highlight = function (el) {
        el.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    
};