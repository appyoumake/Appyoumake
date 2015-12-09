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
            window.setTimeout(this.clear_status.bind(this), 3000);
        } else if (state == "callback") {
            $("#mlab_statusbar_temporary").text(content);
        } else if (state == "completed") {
            $("#mlab_statusbar_temporary").text('');
            $('#mlab_statusbar_progress_spin').spin(false);
            $("#mlab_statusbar_progress_spin").hide();
            return;
        }

        if (typeof display_progress != "undefined" && display_progress == true) {
            $("#mlab_statusbar_progress_spin").show();
            $("#mlab_statusbar_progress_spin").spin('small', '#fff');
        } else if (typeof display_progress != "undefined" && display_progress == false) {
            $('#mlab_statusbar_progress_spin').spin(false);
            $("#mlab_statusbar_progress_spin").hide();
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
    },

    timer_stop : function () {
        window.clearTimeout(this.timer_save);
    },

//utility to merge two objects, but only ADD non-existing properties to the to_obj
    merge_objects : function (from_obj, to_obj) {
        for (var p in from_obj) {
// Property in destination object set; update its value.
            if ( typeof from_obj[p] == "object" && typeof to_obj[p] != "undefined") {
                to_obj[p] = this.merge_objects(from_obj[p], to_obj[p]);
            } else if (typeof to_obj[p] == "undefined") {
                to_obj[p] = from_obj[p];
            }

        }

        return to_obj;        
    },
    
    process_inheritance_helper : function (components, index) {
//does this component inherit from another component?
            if (typeof components[index].conf["inherit"] != "undefined") {
                var from = components[index].conf.inherit;
                
//does the component to inherit from exist?
                if (typeof components[from] != "undefined") {
                    
//is it of the same type?
                    if (components[from].is_component === components[index].is_component && components[from].is_feature === components[index].is_feature && components[from].is_storage_plugin === components[index].is_storage_plugin) {
                        
//need to check that the object to inherit is either top level, or already inherited, if not we recursively process those inheriances first first
                        if (!components[from].inheritance_processed && components[from].conf["inherit"] != "undefined") {
                            this.process_inheritance_helper(components, from);
                        }
//we copy top level objects and objects within the code and and code.config objects
                        components[index] = this.merge_objects(components[from], components[index]); 
                        components[index].inheritance_processed = true;

                    } else {
                        console.log("Parent object for " + index + " does not match type:" + from);
                    }
                } else {
                    console.log("Parent object for " + index + " does not exist:" + from);
                }
            }        
    },

//this function takes care of the simple inheritance facility that compoennts offer
//Have a property called inheritance_processed, if true we've added properties from parents for that component. Set this to true for components that do not inherit from anyone else
//When loop through components and it inherits from a component that had not loaded parents yet, then process that first, then inherit from grandparent to parent first.
//If grandparent also inherits, then same for that, and so on.
//Need to have a call stack to avoid circular inheritance
    process_inheritance: function (components) {
        for (index in components) {
            this.process_inheritance_helper(components, index);
        }
        
    }
}