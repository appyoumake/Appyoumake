//index component, mainly a placeholder at design time, generated in pre-compile process

//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }
    
    this.custom_summary_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "summary"}});
    };
    
    this.custom_detailed_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "detailed"}});
    };
    
    this.custom_folding_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "folding"}});
    };
