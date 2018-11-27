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
        obj.id = this.parent.api.getGUID();
        mlab.dt.history.push(obj);
        
        if(mlab.dt.history.length > 0) {
            $("[data-mlab-comp-tool='undo']").show();
        }
        
        return mlab.dt.history.length;
    },
/**
 * Rops obj from history and returns it
 */           
    popHistory: function (id) {
        var record;
        
        if(id) {
            mlab.dt.history = mlab.dt.history.filter(function(item) {
                if(!record && item.id === id) {
                    record = item;
                    return false;
                }
                return true;
            })
        } else {
            record = mlab.dt.history.pop();
        }
        
        if(mlab.dt.history.length === 0) {
            $("[data-mlab-comp-tool='undo']").hide();
        }
        
        return record;
    },
    
    prepareComponents: function (data) {
        
        mlab.dt.components = data.mlab_components;
        mlab.dt.storage_plugins = {};
        var category_translations = {};
        var features_html = [];
        var additional_html = "";
        var comp_type;

//loop to clean up components so that there are no duplicate order_by entries and also generate JS code from text in code_dt.js file
        var temp_comp_order = [];
        for (comp_id in mlab.dt.components) {
            temp_comp_order.push(parseInt(mlab.dt.components[comp_id].order_by));
//we need to attach the code_dt.js content to an object so we can use it as JS code
            if (mlab.dt.components[comp_id].code !== false) {
                eval("mlab.dt.components['" + comp_id + "'].code = new function() { " + mlab.dt.components[comp_id].code + "};");
            }
        }
        temp_comp_order.sort(function(a, b) {return a - b;});

//now loop through all components and for those that inherit another we transfer properties
        mlab.dt.utils.process_inheritance(mlab.dt.components);

//second loop which is for displaying the tools loaded & prepared above in the editor page
        for (comp_id in mlab.dt.components) {
//here we create the conf object inside the newly created code object, this way we can access the configuration details inside the code
            mlab.dt.components[comp_id].code.config = mlab.dt.components[comp_id].conf;
            var c = mlab.dt.components[comp_id];
            if (c.accessible && !(c.is_storage_plugin)) {

//prepare the tooltips (regular/extended). Can be a string, in which use as is, or an key-value object, if key that equals mlab.dt.api.getLocale() is found use this, if not look for one called "default"
                var tt = mlab.dt.api.getLocaleComponentMessage(comp_id, ["tooltip"]);
                var eName = mlab.dt.api.getLocaleComponentMessage(comp_id, ["extended_name"]);

                if (c.is_feature) {
                    comp_type = "feature";
                } else {
                    comp_type = "component";
                }

                var pos = temp_comp_order.indexOf(parseInt(c.order_by));
                delete temp_comp_order[pos];
                
            } else if (c.accessible && c.is_storage_plugin) {
                mlab.dt.storage_plugins[comp_id] = eName;
            }
        }

//finally we assign the API object to the component, cannot do this earlier as it would create a loop to parents, etc 
//when trying to merge properties in the previous code block
        for (index in mlab.dt.components) {
            if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                mlab.dt.components[index].code.api = mlab.dt.api;
            }

//added to inherit HTML to the additional mlab.dt.components.html which is set in loadSingleComponent in /src/Sinett/MLAB/BuilderBundle/FileManagement/FileManagement.php
            if (!mlab.dt.components[index].html && mlab.dt.components[index].conf.inherit) {
                mlab.dt.components[index].html = mlab.dt.components[mlab.dt.components[index].conf.inherit].html;
            }
        }
        
    },
    
/*
 * "traffic police" function which redirect clicks on buttons to relevant actions in Mlab
 * Most of these actions were from before a major UI design so are spread in different parts of the code
 */
    runActions: function (action_element, action) {
        switch (action) {
            case "page.save":
                var temp; //dummy variable, should redo for more modern ES/JS
                mlab.dt.management.page_save(temp, true);
                break;
                
            case "page.unlock":
                mlab.dt.management.app_remove_locks();
                break;
                
            case "app.preview":
                mlab.dt.management.page_preview();
                break;
                
            case "app.test":
                mlab.dt.management.compiler.get_app("android");
                break;
                
//display the list of deleted pages
            case "page.restore":
                $pagesNav = $('.nav-pages .pages-wrapper');
                $pagesNav.toggleClass('deleted-open');
                $pagesNav.is('.deleted-open') ? $(this).addClass('selected') : $(this).removeClass('selected');
                break;
                
            case "component.restore":
                mlab.dt.design.component_trash();
                break;
                
            case "page.new":
                mlab.dt.management.page_new();
                break;
                
            case "section.new":
                console.log("implement");
                alert('new section');
                break;
                
            case "component.up":
                mlab.dt.design.component_moveup();
                break;
                
            case "component.down":
                mlab.dt.design.component_movedown();
                break;
                
            case "component.delete":
                debugger;
                mlab.dt.design.component_delete(false);
                break;
                
            case "component.cut":
                mlab.dt.design.component_cut();
                break;
                
            case "component.copy":
                mlab.dt.design.component_copy();
                break;
                
            case "component.paste":
                mlab.dt.design.component_paste();
                break;
                
            case "help.tutorial":
                console.log("implement");
                break;
                
            case "help.toggle_hover":
                console.log("implement");
                break;
                
            case "component.tool.aspect":
                mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), $(action_element).data("aspect"));
                $(action_element).parent().find("button").removeClass("selected");
                $(action_element).addClass("selected");
                break;
                
            case "component.tool.size":
                mlab.dt.api.display.setSize($(".mlab_current_component"), $(action_element).data("size"));
                $(action_element).parent().find("button").removeClass("selected");
                $(action_element).addClass("selected");
                break;
                
            case "component.tool.storage_plugin":
                var el = $(this).siblings("[data-mlab-get-info='storage_plugins']");
                if( !el.is(":visible")) { 
                    el.html(mlab.dt.api.getStoragePluginList(mlab.dt.api.getSelectedComponent()));
                }
                el.slideToggle();
                break;
                
            case "component.tool.credentials":
                mlab.dt.design.component_edit_credentials();
                break;
                
            default:
                console.log("Unknown action");
                break;
        }
    }

}