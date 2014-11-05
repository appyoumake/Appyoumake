
// final template "best practices", we see if there are too many or too few of certain categories of components on a page
    function mlab_page_check_content(component_categories, template_best_practice_msg) {

        var rules = document.mlab_current_app.template_config.components;
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
        };
    }

/**
 * Runs the "best practices" check for a single component, can check if video is too long, if there is too much text, etc, etc
 * @param {type} comp
 * @param {type} comp_id
 * @param {type} component_categories
 * @param {type} template_best_practice_msg
 * @returns {undefined}
 */
    function mlab_component_check_content(comp, comp_id, component_categories, template_best_practice_msg) {
        var rules = document.mlab_current_app.template_config.components;
        if (mlab_components[comp_id].hasOwnProperty("conf") && mlab_components[comp_id].conf.hasOwnProperty("category")) {
            var comp_category = mlab_components[comp_id].conf.category;

            if (!component_categories.hasOwnProperty(comp_category)) {
                component_categories[comp_category] = 1;
            } else {
                component_categories[comp_category]++;
            }

            if (document.hasOwnProperty("mlab_code_" + comp_id)) {
                if (document["mlab_code_" + comp_id].hasOwnProperty("getContentSize")) {
//can only do this if component supprts the getContentSize function
                    if (document["mlab_code_" + comp_id].hasOwnProperty("getContentSize")) {
                        var size = document["mlab_code_" + comp_id].getContentSize(comp);
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
    }

