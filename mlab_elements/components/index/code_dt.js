//index component, mainly a placeholder at design time, generated in pre-compile process

    var LEVEL_1 = 1;
    var LEVEL_2 = 2;
    var LEVEL_3 = 2;

//here we replace some placeholders
    this.onCreate = function(el) {
        this.api.setVariable(el, "level", LEVEL_1);
        this.updatePreview(el);
    }
    
    this.onLoad = function(el) {
        this.updatePreview(el);
    }
    
//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }

    this.updatePreview = function(el, html) {
        var local_el = el;
        $.ajax({
            type: 'GET',
            url: componentRunFunctionAction,
                    //mlab.dt.api.getUrlComponentAbsolute() + this.conf.name,
            dataType: 'html',
            success: function(data) { $(local_el).html(data); },
            error: function(error) { console.log(error); }
        });
            
        
        
    }

/*
 * Following two functions change the level of the chapter heading and updates text size as well.
 * When the compile time index is created, then we use level to set indents
 */
    this.custom_decrease_size = function (el) {
        var level = this.api.getVariable(el, "level");
        if (level == LEVEL_1) {
            text.removeClass("mc_large").addClass("mc_medium");
            this.api.setVariable(el, "textsize", "mc_medium");
            this.api.setVariable(el, "level", LEVEL_2);
        } else {
            text.removeClass("mc_medium").addClass("mc_small");
            this.api.setVariable(el, "textsize", "mc_small");
            this.api.setVariable(el, "level", LEVEL_3);
        } 
    };

    this.custom_increase_size = function (el) {
		var level = this.api.getVariable(el, "level");
        if (level == LEVEL_3) {
            text.removeClass("mc_small").addClass("mc_medium");
            this.api.setVariable(el, "textsize", "mc_medium");
            this.api.setVariable(el, "level", LEVEL_2);
        } else {
            text.removeClass("mc_medium").addClass("mc_large");
            this.api.setVariable(el, "textsize", "mc_large");
            this.api.setVariable(el, "level", LEVEL_1);
        } 
    };