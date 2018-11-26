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
                <li class="display-alt" draggable="true">
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
    
