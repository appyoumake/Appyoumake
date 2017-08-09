    this.getHTMLElement = function(el)  {
        return $(el).find("table");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("td").attr("contenteditable", "true");
        $(el).find("td").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).html("Add content"); } } ) ;
        $('[contenteditable="true"]').focus(function(){
            $(this).parents('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
            $(this).attr("data-mlab-dt-table-focus", 1);
        });
    };
    
	this.onSave = function (el) {
		$(el).find("tr").removeAttr("contenteditable");
        var temp_html = $(el).outerHTML;
        $(el).find("tr").attr("contenteditable", "true");
        return temp_html;
    };
           
    this.getContentSize = function (el) {
        return $(el).find("tr").length;
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
    
    this.custom_add_row = function (el) {
		var clone = $(el).find("[data-mlab-dt-table-focus='1']").parent().clone(true);
        clone.find("td").removeAttr('data-mlab-dt-table-focus');
        clone.find('[contenteditable="true"]').focus(function(){
            $(this).parents('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
            $(this).attr("data-mlab-dt-table-focus", 1);
        });
        $(el).find("[data-mlab-dt-table-focus='1']").parent().after(clone);
    };
    
    this.custom_add_col = function (el) {
		
    };
    
    this.custom_remove_row = function (el) {
		$(el).find("[data-mlab-dt-table-focus='1']").parent().remove();
    };
    
    this.custom_remove_col = function (el) {
		
    };
//we need to use tab to create indents/outdents
/*    this.onKeyPress = function (e) {
        if (e.keyCode == 9) {
            e.preventDefault();
            this.custom_indent($(e.target));
            
        }
    };*/  