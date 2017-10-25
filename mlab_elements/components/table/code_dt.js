    this.getHTMLElement = function(el)  {
        return $(el).find("table");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("th, td").attr("contenteditable", "true");
        $(el).on("focus", "th, td", function(){
            $(this).closest('table').find("[data-mlab-dt-table-focus='1']").removeAttr('data-mlab-dt-table-focus');
            $(this).attr("data-mlab-dt-table-focus", 1);
            if (this.childNodes.length == 0) {
                $(this).text(" ");
                var pos = 0;
            } else {
                var pos = this.childNodes[this.childNodes.length - 1].length;
            }
            var strLength = $(this).text().length * 2;
            var range = document.createRange();
            var sel = window.getSelection();
            range.setStart(this.childNodes[this.childNodes.length - 1], pos);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        });
    };
    
	this.onSave = function (el) {
        var local_el = $(el).clone();
        local_el.find("th, td").removeAttr("contenteditable");
        return local_el[0].outerHTML;
    };
           
    this.getContentSize = function (el) {
        return $(el).find("tr").length;
    };
    
    this.custom_add_link = function (el, event) {
        this.api.setLink(el, event);
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
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length == 0) {
            return;
        }
		var row = current_cell.parent();
        var num_cells = row.find("*").length;
        
        var new_row = $(this.config.custom.row_start_html + Array(num_cells + 1).join(this.config.custom.cell_html) + "</tr>");

        if (row.parent().prop("tagName").toLowerCase() == "thead") {
            table.find("tbody").prepend(new_row)
        } else {
            row.after(new_row);
        }
    };
    
//inserts a cell in each row of the table, including header
    this.custom_add_col = function (el) {
        var table = this.getHTMLElement(el);
        var table_native = table[0];
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var current_col = current_cell.index();
		var num_rows = table.find("tbody tr").length;
        
//first insert a cell in the header
        $(table_native.rows[0].cells[current_col]).after(this.config.custom.header_cell_html);

//next do all the rows in the body
        for (var i = 1; i <= num_rows; i++) { 
            $(table_native.rows[i].cells[current_col]).after(this.config.custom.cell_html);
        }
    };
    
    this.custom_remove_row = function (el) {
        var table = this.getHTMLElement(el);
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var row = current_cell.parent();
		if (row.parent().prop("tagName").toLowerCase() == "tbody") {
            row.detach();
        }
    };
    
    this.custom_remove_col = function (el) {
        var table = this.getHTMLElement(el);
        var table_native = table[0];
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var current_col = current_cell.index();
		var num_rows = table.find("tr").length;
        
//loop throug the rows and remove the specified column cell for all 
        for (var i = 0; i < num_rows; i++) { 
            $(table_native.rows[i].cells[current_col]).detach();
        }
    };
    
    this.custom_move_up = function (el) {
        var table = this.getHTMLElement(el);
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var row = current_cell.parent();
        if (row.parent().prop("tagName").toLowerCase() == "tbody") {
            row.insertBefore(row.prev());
        }
    };
    
    this.custom_move_down = function (el) {
        var table = this.getHTMLElement(el);
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var row = current_cell.parent();
        if (row.parent().prop("tagName").toLowerCase() == "tbody") {
            row.insertAfter(row.next());
        }
    };
    
//here we set the width in percentage increments. If the percentage width is not set OR it is pixels we calculate from width of table 
//otherwise we just add a percentage point.
    this.custom_set_col_width = function (el, adjust) {
        var table = this.getHTMLElement(el);
        var current_cell = table.find("[data-mlab-dt-table-focus='1']");
        if (current_cell.length < 1) {
            return;
        }
        var current_col = current_cell.index();
        var table_width = table.width();
        var table_native = table[0];
        var width_percent = $(table_native.rows[0].cells[current_col]).css("width");
        if (width_percent.indexOf("%") > 0) {
            var new_width = parseInt(width_percent) + adjust;
        } else {
            var new_width = Math.ceil((parseInt(width_percent) / table_width) * 100) + adjust;
        }
        if (new_width >= 10 && new_width <= 90) {
            var old_style = table_native.rows[0].cells[current_col].style.display;
            table_native.rows[0].cells[current_col].style.display = "none";
            $(table_native.rows[0].cells[current_col]).css("width", new_width + "%");
            table_native.rows[0].cells[current_col].offsetHeight; 
            table_native.rows[0].cells[current_col].style.display = old_style;
        }
//add code here so that if still same PX we add one percentage point.
    };
    
    this.custom_increase_col_width = function (el, ev) {
        var adjust = 1;
        if (ev.shiftKey) {
            adjust = 10;
        }
        this.custom_set_col_width(el, adjust);
    };
    
    this.custom_decrease_col_width = function (el, ev) {
        var adjust = -1;
        if (ev.shiftKey) {
            adjust = -10;
        }this.custom_set_col_width(el, adjust);
    };
    
//we need to use tab to create indents/outdents
    this.onKeyPress = function (e) {
        if (e.keyCode == 38 || e.keyCode == 40) { //up & down arrow
            e.preventDefault();
            var table = this.getHTMLElement(e.currentTarget);
            var table_native = table[0];
            var current_cell = table.find("[data-mlab-dt-table-focus='1']");
            if (current_cell.length < 1) {
                return;
            }
            var current_col = current_cell.index();
            var current_row = current_cell.parent().index();
            var max_row = table.find("tbody tr").length - 1;
            var in_body = (current_cell.parent().parent().prop("tagName").toLowerCase() == "tbody");
            
//we use a proper thead/tbody division of the table, 
//but the can edit header, so need to check where we are before moving cursor
            if (in_body) {
                if (e.keyCode == 38) {
                    if (current_row == 0) { //because we get index within the thead/tbody tags, 0 AND in body means we need to move to header
                        $(table_native.rows[0].cells[current_col]).focus();
//we get current_row from jQuery within tbody, but the native JS includes header, so numbers are one out. 
//Therefore setting index focus to current row index effectively sets it one above
                    } else { 
                        $(table_native.rows[current_row].cells[current_col]).focus();
                    }
                } else if (e.keyCode == 40 && current_row < max_row) {
                    $(table_native.rows[current_row + 2].cells[current_col]).focus();
                } 
            } else { //in header, always just one row, so up arrow is ignored
                if (e.keyCode == 40) {
                    $(table_native.rows[1].cells[current_col]).focus();
                } 
            }
        }
    };