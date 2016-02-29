/*
 * Functionality that deals with the template defined best practices
 *
 */

function Mlab_dt_bestpractice () {
    this.parent = null;
}

Mlab_dt_bestpractice.prototype = {

//get the object with rules, such as max charavcters, max length, etc
//return rules for current template, could be used to track when user has typed in too much text (for instance)
//to do preemptive checks (we do post-save check)
    get_template_rules : function () {
        return this.parent.app.template_config.components;
    },


// final template "best practices", we see if there are too many or too few of certain categories of components on a page
    page_check_content : function (component_categories, template_best_practice_msg) {

        var rules = this.parent.app.template_config.components;
        for (var category in rules) {
            if (rules[category].hasOwnProperty("max")) {
                if (component_categories[category] > rules[category].max.count) {
                    if ($.inArray(rules[category].max.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].max.message);
                    }
                }
            }
            if (rules[category].hasOwnProperty("min")) {
                if (component_categories[category] < rules[category].min.count) {
                    if ($.inArray(rules[category].min.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].min.message);
                    }
                }
            }
        }
    },

/**
 * Runs the "best practices" check for a single component, can check if video is too long, if there is too much text, etc, etc
 * @param {type} comp
 * @param {type} comp_id
 * @param {type} component_categories
 * @param {type} template_best_practice_msg
 * @returns {undefined}
 */
    component_check_content : function (comp, comp_id, component_categories, template_best_practice_msg) {
        var rules = this.parent.app.template_config.components;
        if (this.parent.components[comp_id].hasOwnProperty("conf") && this.parent.components[comp_id].conf.hasOwnProperty("category")) {
            var comp_category = this.parent.components[comp_id].conf.category;

            if (!component_categories.hasOwnProperty(comp_category)) {
                component_categories[comp_category] = 1;
            } else {
                component_categories[comp_category]++;
            }

//can only do this if component supprts the getContentSize function
            if (typeof this.parent.components[comp_id].code != "undefined") {
                if (typeof this.parent.components[comp_id].code.getContentSize != "undefined") {
                    var size = this.parent.components[comp_id].code.getContentSize(comp);
                    if (rules.hasOwnProperty(comp_category)) {
                        if (rules[comp_category].hasOwnProperty("max")) {
                            if (size > rules[comp_category].max.size) {
                                if ($.inArray(rules[comp_category].max.message, template_best_practice_msg) < 0) {
                                    template_best_practice_msg.push(rules[comp_category].max.message);
                                }
                            }
                        }
                        if (rules[comp_category].hasOwnProperty("min")) {
                            if (size < rules[comp_category].min.size) {
                                if ($.inArray(rules[comp_category].min.message, template_best_practice_msg) < 0) {
                                    template_best_practice_msg.push(rules[comp_category].min.message);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

} // end prototype

