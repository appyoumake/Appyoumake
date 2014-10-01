document.mlab_code_ul = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        this.highlight($(el).find("li"));
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        $(el).find("ul").attr("contenteditable", "true");
        $(el).find("ul").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).html("<li>Add content</li>"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("ul").removeAttr("contenteditable");
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("ul").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
           
    this.getContentSize = function (el) {
        return $(el).find("ul").text().length;
    };

    this.custom_add_link = function (el) {
        var link = prompt(this.config.custom.msg_requestlink);
        var page_name = "";
        if (link != null && link != "") {
            var num = parseInt(link);
            if (parseInt(link) > 0 && num < 1000) {
                var page_name = ("000" + document.mlab_current_app.curr_page_num).slice(-3) + ".html";
            } else if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                page_name = link.trim();
            }
            document.execCommand("createlink", false, page_name);
        }
        if (page_name == "") {
            alert(this.config.custom.msg_wronglink);
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
    }
    
};