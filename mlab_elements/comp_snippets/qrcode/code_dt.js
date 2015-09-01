//el = element this is initialising, config = global config from conf.yml
    this.onCreate = function (el) {
        var comp = $(el).find('div');
        if (comp.html() == "") {
            comp.html("<img class='mc_figure mc_display mc_qr_border' src='" + this.config.placeholder + "'>");
        }

        this.custom_set_QR_code(el);
    };

    this.onLoad = function (el) {
        //
    };
    
	this.onSave = function (el) {
        var temp_html = el.outerHTML;
        return temp_html;		
    };
    
    this.custom_scale_to_25_percent = function (el) {
        var text = this.api.getVariable(el, 'text');
        var size = this.config.custom.scale_to_25_percent_size;
        el.empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "canvas", size : size});
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'border': 'solid 10px white', 'padding': '0px'});
    };
    
    this.custom_scale_to_50_percent = function (el) {
        var text = this.api.getVariable(el, 'text');
        var size = this.config.custom.scale_to_50_percent_size;
        el.empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "canvas", size : size});
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'border': 'solid 10px white', 'padding': '0px'});
    };
    
    this.custom_scale_to_100_percent = function (el) {
        var text = this.api.getVariable(el, 'text');
        var size = this.config.custom.scale_to_100_percent_size;
        el.empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "canvas", size : size});
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'border': 'solid 10px white', 'padding': '0px'});
    };
    
    this.custom_position_left = function (el) {
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'float': 'left', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_right = function (el) {
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'float': 'right', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_centre = function (el) {
        var qr = $('.mlab_current_component').find('canvas');
        qr.css({'float': 'none', 'margin-left': 'auto', 'margin-right': 'auto'});
    };
            
    this.custom_set_QR_code = function (el) {
        var size = $('.mlab_current_component').find('canvas').width();
        
        if (size === null) {
            size = 147;
        }
        this.api.getLibraries(this.config.name);
        var content = $('<label class="mlab_dt_text_info">' + this.config.custom.msg_request_title + '</label>' + 
                    '<input class="mlab_dt_input" onkeyup="mlab.dt.components.qrcode.code.callback_update_qr(event, ' + size + ');" autofocus>');
        this.api.displayPropertyDialog(el, this.config.custom.msg_request_text, content);
    };
    
    this.callback_update_qr = function (event, size) {
        var enterKey = 13;
        
        if (event.which!=enterKey) return;

        var text = $(event.target).val();
        if (text != null && text != "") {
            $(".mlab_current_component").empty().qrcode({text: text, background: "#ffffff", foreground: "#000000", render : "canvas", size : size});
            var qr = $('.mlab_current_component').find('canvas');
            qr.css({'border': 'solid 10px white', 'padding': '0px'});
        }
        
        this.api.closeAllPropertyDialogs();
        
        this.api.setVariable($(".mlab_current_component"), 'text', text);
    }

//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    };