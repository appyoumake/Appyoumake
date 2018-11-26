//set the left position of the toolboxes, must be done when layout is ready
$(window).load(function() {
    var main_navbar = $("#mlab_navbar");
    var left = main_navbar[0].getBoundingClientRect().left
    main_navbar.find(".toolbox").each(function(index) { 
        $(this).css("left", (left - $(this).parent()[0].getBoundingClientRect().left) + "px") 
    } ) ;
});

// Init UI elements
$(document).ready(function() {
    mlab.dt.ui.init();

    $('.nav-pages .active')
        .on('dragstart', 'li', function (e) {
            e.stopPropagation(); 
            $(this).addClass('dragging');
            e.originalEvent.dataTransfer.setData("pagenum", $(this).data('pageNum'));
            return true;
        })

        .on('dragover', 'li:not(.dragging)', function (e) {
            e.originalEvent.target.classList.add('insert-before');
            return false;
        }) 
        .on('dragleave', 'li', function (e) {
            e.originalEvent.target.classList.remove('insert-before');
            return false;
        }) 
        .on('dragend', 'li', function (e) {
            $(this).removeClass('dragging');
            $(this).siblings().removeClass('insert-before');

            return false;
        })
        .on('drop', 'li', function (e) {
            e.originalEvent.preventDefault();
            var pageNum = e.originalEvent.dataTransfer.getData("pagenum");
            var dropData = $(this).data();

            mlab.dt.ui.movePage(pageNum, dropData.section, dropData.position);

            return false;
        });
});

var Mlab_dt_ui = {

    parent: null,

    props: new Proxy({}, {
        set: function(obj, prop, value) {
            if(typeof Mlab_dt_ui.watch[prop] !== 'undefined') {
                Mlab_dt_ui.watch[prop](value, obj[prop]);
            }

            obj[prop] = value;

            return true;
        }
    }),

    init: function() {
        this.initTooltips();
        this.initModals();
        this.initActions();
        this.initPages();
        this.initToolbar();

        this.initialiseDropdownButtons('.toolbox-menu');
    },
    
    initTooltips: function() {
    //prepare tooltip display for all buttons
        $('[data-tooltip]').mouseenter(function () {
            var $target = $(this);
            // dont display tooltip if menu open
            if($target.is('[data-open-menu]:focus')) {
                return;
            }

            var targetOffsets = $target.offset(),
                $arrow = $('<span>'),
                $tooltip = $('<span class="tooltip" style="top:0; left:0"></span>')
                    .text($target.data('tooltip'))
                    .append($arrow);
            
            $target.after($tooltip);

            var header = $('#mlab_menu_header');
            var maxLeft = header.offset().left + header.width();
            var targetScreenCenter = targetOffsets.left + $target.innerWidth()/2,
                tooltipWidth = $tooltip.outerWidth(),
                tooltipLeft = Math.min(
                    maxLeft - tooltipWidth,
                    Math.max(header.offset().left, targetScreenCenter - (tooltipWidth/2))
                ),
                arrowLeft = targetScreenCenter - tooltipLeft - 3;

            $arrow.css('left', arrowLeft)
            $tooltip.css('top', targetOffsets.top + $target.outerHeight() + $arrow.outerHeight())
                .css('left', tooltipLeft);
        }).on('mouseleave focus', function () {
            $(this).siblings('.tooltip').remove();
        });
    },

    initToolbar: function() {
    //set active tab on click
        $('.header ul.tabs > li > a').click(function (e) {
            e.preventDefault();
            $(this).parent().siblings('li').removeClass('active');
            $(this).parent().addClass('active');
        });
    },

    initActions: function() {
        var _this = this;

        $('body').on('click', '[data-action-click]', function (e) {
            var data = $(this).data();
            _this[data.actionClick](data, e);
        });

        $('[data-action]').click(function () {
            mlab.dt.utils.runActions($(this).data("action"));
        });
    },
        
    initPages: function() {
        $('input[type=radio][name=pages-list-display]').change(function() {
            $('.nav-pages .active .list-pages').attr('class', 'list-pages ' + this.value);
        });

        $('.pages-wrapper .close').click(function (e) {
            $(this).closest('.deleted-open').removeClass('deleted-open');
            $('[data-open-deleted]').removeClass('selected');
        });
    },
    
    initModals: function() {
        $('[data-open-modal]').click(function () {
            $modal = $('#' + $(this).data('open-modal'));
            $modal.show();
            $overlay = $('<div class="modal-overlay"></div>');

            var close = function() {
                $modal.hide();
                $overlay.remove();
            };

            $overlay.click(close);
            $modal.find('[data-close-modal]').click(close);

            $('body').append($overlay);
        });
    },

    initialiseDropdownButtons : function(selector) {
        $(selector + ' [data-open-menu]').click(function (e) {
            var $menuOpener = $(this);
            var $toolboxMenu = $menuOpener.closest('.toolbox-menu');
            $toolboxMenu.toggleClass('open');
            if (!$toolboxMenu.hasClass('open')) {
                return;
            }
            var $menu = $toolboxMenu.find('.menu');
            var menuOffsetLeft = $menu.offset().left;
            var header = $('#mlab_menu_header');
            var maxLeft = header.offset().left + header.width();
   
            if(menuOffsetLeft < header.offset().left) {
                $menu.css('left', menuOffsetLeft + 35);
            } else if((maxLeft - (menuOffsetLeft + $menu.outerWidth())) < 0) {
                $menu.css('left', "-100%");
            }


            $(window).bind("click.closeMenu", function(e) {
                if(e.target !== $menuOpener[0] && $toolboxMenu.find(e.target).length === 0) {
                    $(this).unbind("click.closeMenu");
                    $('.toolbox-menu').removeClass('open');
                }
            });
        })
    },
    
    displayComponents : function (components) {
        var sorted = [];
        for (var comp in components) {
            sorted.push([comp, components[comp].order_by]);
        }

        sorted.sort(function(a, b) {
            return a[1] - b[1];
        });

        var byCategory = [];

        for (var i = 0; i < sorted.length; i++) {
            var compName = sorted[i][0];
            var c = components[compName]
            if (c.accessible && !c.is_storage_plugin) {
                if (!byCategory.hasOwnProperty(c.conf.category)) {
                    byCategory[c.conf.category] = {
                        components: [],
                        name: mlab.dt.api.getLocaleComponentMessage(compName, ["category_name"])
                    };
                }

                byCategory[c.conf.category].components.push(components[compName]);
            }
        }

        $("#mlab_toolbar_components").append(Object.keys(byCategory).map(
            (key) => this.render.toolbar(byCategory[key].name, byCategory[key].components)
        ));

        this.initialiseDropdownButtons("#mlab_toolbar_components");
    },

    displayComponentTools: function (curr_comp) {
        if (curr_comp.length < 1) {
            return;
        }
        var comp_name = curr_comp.data("mlab-type");
        var conf = this.parent.components[comp_name].conf;
        var items = new Object();
        var title = "";
        var menu = $("#mlab_toolbar_for_components");
        var temp_menu = [];
        var loc = mlab.dt.api.getLocale();
        
//-        $("#mlab_toolbar_for_components .mlab_component_toolbar_heading").text(this.parent.api.getLocaleComponentMessage(comp_name, ["extended_name"]));
        menu.html("");
        

        if (typeof conf.custom != "undefined") {
            
//preliminary loop to create a lookuptable for the position of tools that handles duplicate order numbers
            var temp_comp_order = [];
            for(var index in this.parent.components[comp_name].code) {
                if (index.substr(0, 7) == "custom_") {
                    title = index.slice(7);
                    
//we may have a case where the custom code is written, but we have forgotten to create a matching conf.yml entry
                    if (typeof conf.custom[title] != "undefined") {
                        temp_comp_order.push( ( typeof conf.custom[title]["order"] != "undefined" ) ? conf.custom[title]["order"] : 0 );
                    }
                }
            }
            temp_comp_order.sort(function(a, b) {return a - b;});
            
//repeating loop that generates the tool buttons for the custom code
            for(var index in this.parent.components[comp_name].code) {
                if (index.substr(0, 7) == "custom_") {
                    title = index.slice(7);
                    if (typeof conf.custom[title] != "undefined") {
                        var icon = ( typeof conf.custom[title]["icon"] != "undefined" ) ? "src='" + conf.custom[title]["icon"] + "'" : "class='missing_icon'";
                        var tt = this.parent.api.getLocaleComponentMessage(comp_name, ["custom", title, "tooltip"]);

//get unique position
                        var order = temp_comp_order.indexOf(parseInt( ( typeof conf.custom[title]["order"] != "undefined" ) ? conf.custom[title]["order"] : 0 ));
                        delete temp_comp_order[order];

                        if (typeof conf.custom[title]["newline"] != "undefined" && conf.custom[title]["newline"] === true) {
                            var cl = "mlab_newline";
                        } else {
                            var cl = "";
                        }

                        temp_menu[order] = "<img onclick='(function(e){ mlab.dt.components." + comp_name + ".code." + index + "($(\".mlab_current_component\"), e);})(event)' " + 
                                         "title='" + tt + "' " + 
                                         "class='" + cl + "' " + 
                                         "data-mlab-comp-tool-id='" + index + "' " + 
                                         icon + " >";
                    } else {
                        console.log("Missing conf.yml entry for custom:" + title);
                    }
                }
            }
            menu.append(temp_menu.join(""));
            menu.append("<div class='clear'>&nbsp;</div>");
            
        }
        
        
//display credentials selection button, if this supports credentials
        if (typeof conf.credentials != "undefined" && Object.prototype.toString.call( conf.credentials ) === "[object Array]") {
            $("[data-mlab-comp-tool='credentials']").removeClass("mlab_hidden");
        } else {
            $("[data-mlab-comp-tool='credentials']").addClass("mlab_hidden");
        }

//display storage selection list button, if this supports storage
        if (typeof conf.storage_plugin != "undefined" && conf.storage_plugin == true) {
            $("[data-mlab-comp-tool='storage_plugin']").removeClass("mlab_hidden");
        } else {
            $("[data-mlab-comp-tool='storage_plugin']").addClass("mlab_hidden");
        }
        
//display size and aspect ratio selection list buttons, if this supports resizing
        if (typeof conf.resizeable != "undefined" && conf.resizeable == true) {
            $("[data-mlab-comp-tool='comp_size']").removeClass("mlab_hidden");
            $("[data-mlab-comp-tool='comp_aspect']").removeClass("mlab_hidden");
            $("#mlab_component_size_list li").removeClass("mlab_item_applied");
            $("#mlab_component_aspect_list li").removeClass("mlab_item_applied");
//update the menus with the existing selection, if any
            $("#mlab_component_size_list [data-data-mlab-comp-size='" + curr_comp.data("mlab-comp-size") + "']").addClass("mlab_item_applied");
            $("#mlab_component_aspect_list [data-data-mlab-comp-aspect='" + curr_comp.data("mlab-comp-aspect") + "']").addClass("mlab_item_applied");
        } else {
            $("[data-mlab-comp-tool='comp_size']").addClass("mlab_hidden");
            $("[data-mlab-comp-tool='comp_aspect']").addClass("mlab_hidden");
        }
    },
    
    updateAppTableOfContents: function(content, oldContent) {
        var deletedPages = [];

        var activePages = content.filter(function f(o) {
            if (o.children) {
                o.children = o.children.filter(f);
            }
            if(o.is_deleted) {
                deletedPages.push(o);
                return false;
            }
            return true;
        });

        var tableOfContents = this.render.tableOfContents(activePages);
        var deletedList = this.render.deletedList(deletedPages);
        var $activeTab = $('.nav-pages .active');
        var $listActive = $activeTab.find('.list-pages');
        var $listDeleted = $('.nav-pages .deleted .list-pages');

        $listActive.html(tableOfContents);
        $listDeleted.html(deletedList);

        // scroll pages list if last element is different
        if(oldContent && JSON.stringify(content[content.length-1]) !== JSON.stringify(oldContent[oldContent.length-1])) {
            $activeTab.scrollTop($activeTab.prop('scrollHeight'));
        }
    },

    openPage: function(data) {
        mlab.dt.management.page_open(mlab.dt.app.id, data.pageNum);
    },

    showDeleted: function() {
        $pagesNav = $('.nav-pages .pages-wrapper');
        $pagesNav.toggleClass('deleted-open');
        $pagesNav.is('.deleted-open') ? $(this).addClass('selected') : $(this).removeClass('selected');
    },

    newPage: function(data) {
        mlab.dt.management.page_new(data.section, data.position);
    },

    newSection: function(data) {
        mlab.dt.management.section_new(data.section, data.position);
    },

    movePage: function(pageNum, section, position) {
        var tableOfContents = this.props.tableOfContents;

        var cut = this.findBy('pageNumber', pageNum, tableOfContents);
        delete cut.parent[cut.key];

        var paste = section ? this.findBy('id', section, tableOfContents).node.children : tableOfContents;
        paste.splice(position, 0, {...cut.node});

        this.props.tableOfContents = tableOfContents;
    },

    findBy: function(prop, id, o) {
        var result, p;
        for (p in o) {
            if (o[p][prop] == id){
              return {node: o[p], parent: o, key: p};
            }

            if(typeof o[p].children === 'object' ) {
                result = this.findBy(prop, id, o[p].children);
            }

            if(result){
                return result;
            }
        }
        return result;
    },

    editSectionTitle: function(data, e) {
        var $title = $(e.currentTarget),
            sectionId = data.sectionId;

        $title.data('previousTitle', $title.text().trim());

        if($title.attr('contenteditable') != "true"){
            $title.attr('contenteditable', true)
                .focus()
                .one('focusout', function() {
                    $title.attr('contenteditable', false);
                    var newTitle = $title.text().trim();
                    if($title.data('previousTitle') !== newTitle) {
                        mlab.dt.management.section_update_title(sectionId, newTitle);
                    }
                });
        }
    },

    deleteSection: function(data, e) {
        if (!confirm(_tr["mlab.dt.management.js.page_copy.alert.sure.delete"])) {
            return;
        }

        mlab.dt.management.section_delete(data.sectionId);
    },

    deletePage: function(data, e) {
        if (!confirm(_tr["mlab.dt.management.js.page_copy.alert.sure.delete"])) {
            return;
        }

        mlab.dt.management.page_delete(data.pageNum);
    },

    restorePage: function(data, e) {
        mlab.dt.management.page_restore(data.pageNum);
    },

    watch: {
        tableOfContents: function (newVar, oldVar) {
            Mlab_dt_ui.updateAppTableOfContents(newVar, oldVar);
        },

        components: function (newVar) {
            Mlab_dt_ui.displayComponents(newVar);
        },
    },

    render: {

        tableOfContents: function (toc, section = null) {
            return toc.map((item, i) => this[item.type](item, i, section))
                .concat(this.addToBottom(section))
                .join('');
        },

        deletedList: function (toc, section = null) {
            return toc.map((item, i) => this.deletedPage(item))
                .join('');
        },

        page: function (pageTOC, i, section) {
            return `
                <li
                    class="display-alt"
                    draggable="true"
                    data-page-num="${pageTOC.pageNumber}"
                    data-position="${i}"
                    data-section="${section}">
                    <div class="insert-new-here">
                        <button data-action-click="newPage" data-position="${i}" data-section="${section}">
                            <i class="fas fa-plus fa-fw"></i>
                        </button>
                    </div>
                    <div data-action-click="openPage" data-page-num="${pageTOC.pageNumber}">
                        <div class="preview"><img src="https://via.placeholder.com/100x150/FFFFFF/000000"></div><p>${pageTOC.title}</p>
                    </div>
                    <button class="delete-alt" data-action-click="deletePage" data-page-num="${pageTOC.pageNumber}">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </li>
            `;
        },

        deletedPage: function (pageTOC) {
            return `
                <li>
                    <div class="page">
                        <div class="image" data-action-click="restorePage" data-page-num="${pageTOC.pageNumber}">
                            <div class="preview"><img src="https://via.placeholder.com/100x150/FFFFFF/000000"></div>
                        </div>
                        <p>${pageTOC.title}</p>
                    </div>
                </li>
            `;
        },

        section: function (sectionTOC, i, section) {
            return `
                <li class="display-alt">
                    <div class="insert-new-here">
                        <button data-action-click="newPage" data-position="${i}" data-section="${section}">
                            <i class="fas fa-plus fa-fw"></i>
                        </button>
                    </div>
                    <div class="level-name" data-action-click="editSectionTitle" data-section-id="${sectionTOC.id}">
                        ${sectionTOC.title}
                        <i class="fas fa-pencil-alt"></i>
                        <button data-action-click="deleteSection" data-section-id="${sectionTOC.id}">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                    <ul>
                        ${sectionTOC.children ? this.tableOfContents(sectionTOC.children, sectionTOC.id) : ''}
                    </ul>
                </li>
            `;
        },

        addToBottom: function (section) {
            return `
                <li class="insert-in-section">
                    <button data-action-click="newPage" data-section="${section}">
                        <i class="fas fa-plus fa-fw"></i>
                    </button>
                </li>
            `;
        },

        toolbar: function (category, components) {
            return `
                <div class='toolbox-menu'>
                    <button data-open-menu data-tooltip='' class='toolbox-btn btn-lg'>
                        <i class='far fa-file'></i> ${category}
                    </button>
                    <div class='menu'>
                        ${components.map(comp => this.componentButton(comp)).join('')}
                    </div>
                </div>
            `;
        },

        componentButton: function (component) {
            return `
                <button data-mlab-type='${component.conf.name}' 
                    onclick='mlab.dt.design.${'component'}_add("${component.conf.name}");'
                    class='toolbox-btn btn-lg' >
                    <i style='background-image: url("${mlab.dt.config.urls.component}${component.conf.name}/${mlab.dt.config.component_files.ICON}");'>
                    </i>
                    ${mlab.dt.api.getLocaleComponentMessage(component.conf.name, ["tooltip"])}
                </button>
            `;
        },
    }
};
    
