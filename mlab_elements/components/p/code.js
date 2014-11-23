	
	this.config = {};

    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        this.highlight($(el).find("p"));
    };

    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.api = api_func;
        $(el).find("p").attr("contenteditable", "true");
        $(el).find("p").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("p").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("p").attr("contenteditable", "true");
        return temp_html;
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("p").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
            
    this.getContentSize = function (el) {
        return $(el).find("p").text().length;
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

    this.highlight = function (el) {
        el.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    };
  
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var sel, range, html;
            sel = window.getSelection();
            range = sel.getRangeAt(0);
            range.deleteContents();
            var linebreak = document.createElement("br") ;
            range.insertNode(linebreak);
            sel.modify("move", "forward", "character");
        }
    };