/*
 * Utility functions for design time
 */

function Mlab_dt_utils () {
    this.parent = null;
    this.timer_save = null;
};

Mlab_dt_utils.prototype = {
/**
 * This function is used to display status information, this can be permanent, temporary, or until callback is called, and may have a progress bar
 * If state is completed we get rid of temporary info and any gauges
 *
 * @param {type} state
 * @param {type} content
 * @returns {undefined}
*/
    update_status : function (state, content, display_progress) {
        if (state == "permanent") {
            $("#mlab_statusbar_permanent").text(content);
            return;
        } else if (state == "temporary") {
            $("#mlab_statusbar_temporary").text(content);
            window.setInterval(this.clear_status.bind(this), 3000);
        } else if (state == "callback") {
            $("#mlab_statusbar_temporary").text(content);
        } else if (state == "completed") {
            $("#mlab_statusbar_temporary").text('');
            $("#mlab_statusbar_progressbar").hide();
            return;
        }

        if (typeof display_progress != "undefined" && display_progress == true) {
            $("#mlab_statusbar_progressbar").show();
        } else if (typeof display_progress != "undefined" && display_progress == false) {
            $("#mlab_statusbar_progressbar").hide();
        }
    },

/**
 * Simple wrapper function to clear a temporary status
 * @returns {undefined} */
    clear_status : function () {
        this.update_status("completed");
    },



/**
 * Create a timer to save the current page and stores it in a global variable
 * we call window.clearTimeout(this.timer_save) to stop it should it be required
 *
 * @returns {undefined}
 */
    timer_start : function () {
        var tm = parseInt(this.parent.config["save_interval"]);
        if (tm < 60) { tm = 60; }

//Need to provide context for timer event, otherwise the "this" inside page_save will point to Window object
        this.timer_save = window.setTimeout(this.parent.management.page_save.bind(this.parent.management), tm * 1000);
        console.log("Restartet timer");
    },

    timer_stop : function () {
        window.clearTimeout(this.timer_save);
        console.log("Stopped timer");
    }


}