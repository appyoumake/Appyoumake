    this.getHTMLElement = function(el)  {
        return $(el).find("table");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("th, td").attr("contenteditable", "true").focus(function(){
            $(this).closest('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
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
        var table = this.getHTMLElement(el);
		var row = table.find("[data-mlab-dt-table-focus='1']").parent();
        var num_cells = row.find("td").length;
        
        var new_row = $(this.config.custom.row_start_html + Array(num_cells + 1).join(this.config.custom.cell_html) + "</tr>");
        
        new_row.find('[contenteditable="true"]').focus(function() {
            $(this).parents('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
            $(this).attr("data-mlab-dt-table-focus", 1);
        });
        row.after(new_row);
    };
    
//inserts a cell in each row of the table, including header
    this.custom_add_col = function (el) {
        debugger;
        var table = this.getHTMLElement(el);
        var table_native = table[0];
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        var current_col = current_cell.index();
		var num_rows = table.find("tbody tr").length;
        
//first insert a cell in the header
        var new_col = $(this.config.custom.header_cell_html);
        new_col.focus(function() {
            $(this).closest('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
            $(this).attr("data-mlab-dt-table-focus", 1);
        });
        $(table_native.rows[0].cells[current_col]).after(new_col);

//because we exclude header, and this should always be 1 row, we go up to the complete row count in th eloop
        for (var i = 1; i <= num_rows; i++) { 
            new_col = $(this.config.custom.cell_html);
            new_col.focus(function() {
                $(this).closest('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
                $(this).attr("data-mlab-dt-table-focus", 1);
            });
            $(table_native.rows[i].cells[current_col]).after(new_col);
        }
    };
    
    this.custom_remove_row = function (el) {
        var table = this.getHTMLElement(el);
		table.find("[data-mlab-dt-table-focus='1']").parent().remove();
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