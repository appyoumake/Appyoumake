/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Utility functions for design time
 */

function Mlab_dt_utils () {
    this.parent = null;
    this.timer_save = null;
    this.concat_not_replace = ["required_libs"]; //gah! gory hack to treat the required_libs setting differently when handle inheritance... TODO:Fix!
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

    update_app_title_bar: function (appConfig) {
        $requiresNetworkStatus = $('#mlab_statusbar_requires_network');
        
        appConfig.countInternetComp > 0 ? $requiresNetworkStatus.addClass('internet') : $requiresNetworkStatus.removeClass('internet');
        appConfig.countNetworkComp > 0 ? $requiresNetworkStatus.addClass('network') : $requiresNetworkStatus.removeClass('network');
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
//properties that exist are merged, otherwise it is added as a new object property
//UPDATE: For the required_libs we concatenate and dedupe, otherwise we end up using numbered index for comparison...
    merge_objects : function (from_obj, to_obj, parent_name) {
        for (var p in from_obj) {
            if (Array.isArray(from_obj[p]) && this.concat_not_replace.indexOf(parent_name) > -1) {
                if (typeof to_obj[p] === "undefined") { //if the receiving object does not have a matching object, then it must be created or it will fail
                    to_obj[p] = from_obj[p];
                } else {
                    //to_obj[p] = from_obj[p].concat(to_obj[p]); //for arrays we always merge
                    to_obj[p] = [...new Set([...from_obj[p] ,...to_obj[p]])]; 
                }
            } else if ( typeof from_obj[p] === "object") { //incoming property is a "sub" object, not a value
                if (typeof to_obj[p] === "undefined") { //if the receiving object does not have a matching object, then it must be created or it will fail
                    to_obj[p] = new Object();
                }
                to_obj[p] = this.merge_objects(from_obj[p], to_obj[p], p); //as this is a object we then merge this sub-object
            } else if (typeof to_obj[p] === "undefined") { //this is a value, not an object and it does NOT exist in receiving object, so we add it.
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
                    

//need to check that the object to inherit is either top level, or already inherited, if not we recursively process those inheriances first 
                    if (!components[from].inheritance_processed && components[from].conf["inherit"] != "undefined") {
                        this.process_inheritance_helper(components, from);
                    }
//we copy top level objects and objects within the code and and code.config objects
                    components[index] = this.merge_objects(components[from], components[index], from); 
                    components[index].inheritance_processed = true;

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
        
    },
    
//gets a cookie by name/key                        
    getCookie: function (cname) {
         var name = cname + "=";
         var ca = document.cookie.split(';');
         for(var i=0; i<ca.length; i++) {
             var c = ca[i];
             while (c.charAt(0)==' ') c = c.substring(1);
             if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
         }
         return 1;
     },

/**
 * Place object into history
 * @param {object} obj: history obj
 */   
    addHistory: function (obj) {
        mlab.dt.history.push(obj);
        
        if(mlab.dt.history.length > 0) {
            $("[data-mlab-comp-tool='undo']").show();
        }
        
        return mlab.dt.history.length;
    },
/**
 * Rops obj from history and returns it
 */           
    popHistory: function () {
        var record = mlab.dt.history.pop();
        
        if(mlab.dt.history.length === 0) {
            $("[data-mlab-comp-tool='undo']").hide();
        }
        
        return record;
    },

}