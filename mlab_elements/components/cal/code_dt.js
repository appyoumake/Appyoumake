/**
 * Basic calendar component based 
 * @param {type} el
 * @returns {undefined}
 */
//el = element this is initialising

    this.onCreate = function (el) {
        this.onLoad(el);
    };
    
    this.onCreate = function (el) {
        $(el).find("div").gCalReader({ calendarId: this.config.custom.calendar, apiKey:this.config.custom.apikey });
    }
