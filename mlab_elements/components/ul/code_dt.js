	
	
    
    this.onCreate = function (el) {
        this.onLoad (el);
        this.highlight($(el).find("li"));
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("ul").attr("contenteditable", "true");
        $(el).find("ul").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).html("<li>Add content</li>"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("ul").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("ul").attr("contenteditable", "true");
        return temp_html;
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("ul").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
           
    this.getContentSize = function (el) {
        return $(el).find("ul").text().length;
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
    
    this.custom_indent = function (el) {
		document.execCommand('indent', null, null);
    };
    
    this.custom_outdent = function (el) {
		document.execCommand('outdent', null, null);
    };
    
    this.highlight = function (el) {
        el.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    }
  
//we need to use tab to create indents/outdents
    this.onKeyPress = function (e) {
        if (e.keyCode == 9) {
            e.preventDefault();
            this.custom_indent($(e.target));
        }
    };