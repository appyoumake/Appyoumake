//index component, mainly a placeholder at design time, generated in pre-compile process

    var LEVEL_1 = 1;
    var LEVEL_2 = 2;
    var LEVEL_3 = 2;

//here we replace some placeholders
    this.onCreate = function(el) {
        this.api.setVariable(el, "level", LEVEL_1);
        this.getPreview(el);
    }
    
    this.onLoad = function(el) {
        this.getPreview(el);
    }
    
//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }

    this.getPreview = function(el) {
        mlab.dt.design.component_run_code(el, this.conf.name, "getIndex", this.updatePreview);
    }
    
    this.updatePreview = function(el, data) {
        $(el).html(data.html);
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