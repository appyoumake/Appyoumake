<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class mlab_ct_index {
    
    const LEVEL_1 = 1;
    const LEVEL_2 = 2;
    const LEVEL_3 = 3;

    private $variables = [
        'style' => 'detailed',
        'textsize' => 'mc_medium',
        'displayChapterPageTitle' => true
    ];
    
    /**
     * Simple function to parse a page and look for/extract the following
     * 1 - a chapter component, if found it returns thw following
     *     1.1 name 
     *     1.2 level (from stored variables
     * 2 - page title 
     * @param type $page
     * @return int|string
     */
    private function findChapterHeading($page, $page_id, $def_title) {
        $page_info = array();
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->loadHTMLFile($page);
        libxml_clear_errors();
        $xpath = new DOMXPath($doc);
        
//check if there is a chapter heading here
        $chapter = $xpath->query("//div[@data-mlab-type='chapter']");
        if ($chapter->length > 0 ) {
            $page_info["chapter"] = $chapter->item(0)->firstChild->textContent;
            foreach ($chapter[0]->childNodes as $child_element) {
                $php_class = get_class($child_element);
                $class_pos = strpos($child_element->getAttribute("class"), "mlab_storage");
                if ($php_class == "DOMElement" && $class_pos !== false) {
                    $vars = json_decode($child_element->textContent, true);
                    if (isset($vars["level"])) {
                        $page_info["level"] = $vars["level"];
                    } else {
                        $page_info["level"] = $this->LEVEL_1;
                    }
                }
            }
            
        } else {
            $page_info["chapter"] = false;
            $page_info["level"] = false;
        }
        
        $title = $xpath->query("//title");
        if ($title->length > 0 ) {
            $page_info["title"] = $title->item(0)->textContent;
        } else {
            $page_info["title"] = $def_title;
        }
        
        $page_info["page_id"] = $page_id;
        
        return $page_info;
    }
/**
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the variables sent to us (this is from the JSON encoded variables stored at design time) we check to see if an index should be 
 * summary (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or folding (as previous with accordion jQuery component).
 * They all rely on the user having used the chapter component, if this is not found in any of the files we list pages on a single level
 */
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        $this->variables = array_merge($this->variables, $variables);
        $index = array();

        
//first process index.html file. We check to see if this starts a new chapter through the chapter component, 
//then we add the page title to the chapter element in the index array. 0 = no chapter specified

        //TODO: sjekk om det er section i index - da må index under denne section....
        $index[] = [
            'level' => 0,
            'page_id' => 0,
            'chapter' => $app_config["tableOfContents"]['index']['title'],
            'children' => []
        ];
        
/*
 * now we process all the other files in the app
 * the steps are as follows: 
 * 1 - Check if there is a chapter heading on the page
 * 2 - Extract page title
 * 3 - Build multi-dim array which is [chapter]{[page|another chapter]}{[page|another chapter]}[page]
 */
        // foreach ($app_config["page_order"] as $file) {
        //     $index[] = $this->findChapterHeading($app_path . $file, intval($file), "Page " . intval($file));
        // }

//now we generate the index, we always add app title as top level and link to first page 
        $html = "    <h2><a class='mc_text mc_display mc_list mc_link mc_internal " . $this->variables['textsize'] . "' onclick='mlab.api.navigation.pageDisplay(0); return false;'>" . $app_config["title"] . "</a></h2>\n";
        
//now we have the data, time to output the HTML. If they asked for a folding layout, but did not specify any chapters, we output a plain list as for the other options
        $activeTree = $this->activeTree($app_config["tableOfContents"]['active']);
        $index = array_merge($index, $activeTree);

        if ($this->variables['style'] == "folding") {
            $html .= $this->foldedListHtml($index);
        } else {
            $html .= $this->detailedListHtml($index);
        }
        return $html;
        
    }

    protected function activeTree($tableOfContents) {
        $tree = [];

        $currentParent = [];
        $currentLevel = 1;
        //if first item is not a section - make a face header and 
        //$this->variables['style'] == 'summary' - so face one first section with app name (line 143)

        if ($this->variables['style'] == 'summary' && $tableOfContents[0]['type'] != "section") {
                $item['level'] = $item['level'];
                $item['page_id'] = null;
                $item['chapter'] = $item['title'];
                $item['children'] = [];
        }
        
        foreach ($tableOfContents as &$item) {
            if($item['type'] == 'page' && $this->variables['style'] != 'summary') {
                // modify item
                $item = [
                    'chapter' => false,
                    'level' => $currentLevel,
                    'title' => $item['title'],
                    'page_id' => $item['pageNumber'],
                ];

                if(isset($currentParent[$currentLevel])) {
                    $currentParent[$currentLevel]['children'][] = $item;
                    if(!$currentParent[$currentLevel]['page_id']) {
                        $currentParent[$currentLevel]['page_id'] = $item['page_id'];
                    }
                } else {
                    $tree[] = $item;
                }
            } elseif($item['type'] == 'section') {
                $item['level'] = $item['level'];
                $item['page_id'] = null;
                $item['chapter'] = $item['title'];
                $item['children'] = [];

                if($item['level'] > 0 && $currentParent && $currentParent[$currentLevel]) {
                    if($item['level'] > 1 || $item['level'] == $currentLevel) {
                        if(isset($currentParent[$currentLevel-1])) {
                            $currentParent[$currentLevel-1]['children'][] = &$item;
                        } else {
                            $tree[] = &$item;
                        }
                    } else {
                        $currentParent[$currentLevel]['children'][] = &$item;
                    }

                } else {
                    $tree[] = &$item;
                }

                $currentLevel = min(1, $item['level']);
                $currentParent[$currentLevel] = &$item;
            }
        }

        return $tree;
    }

    protected function foldedListHtml($indexes) {
        $html = "<div class='mc_container mc_index mc_list " . $this->variables['textsize'] . "'>\n";
        foreach ($indexes as $index) {
            $html .= $this->foldedIndexLevelHtml($index);
        }
        $html .= "</div>";
        return $html;
    }

    
    protected function foldedIndexLevelHtml($index) {
        $html = '';
        if ($index["chapter"]) { 
            $html .= "<details>\n";
            $html .= '    <summary onclick="if($(this).parent().is(\'[open]\')) {mlab.api.navigation.pageDisplay(' . $index["page_id"] . '); return false;}">' . trim($index["chapter"]) . "</summary>\n";
            
            if($this->variables['displayChapterPageTitle']){
                $html .= "    <p><a class='mc_text mc_display mc_list mc_link mc_internal' onclick='mlab.api.navigation.pageDisplay(" . $index["page_id"] . "); return false;'>" . $index["chapter"] . "</a></p>\n";
            }

            if(isset($index['children'])) {
                foreach ($index['children'] as $child) {
                    $html .= $this->foldedIndexLevelHtml($child);
                }
            }

            $html .= "</details>\n";
        } else {
            $html .= "<p><a class='mc_text mc_display mc_list mc_link mc_internal' onclick='mlab.api.navigation.pageDisplay(" . $index["page_id"] . "); return false;'>" . $index["title"] . "</a></p>\n";

        }

        return $html;
    }

    
    protected function detailedListHtml($indexes) {
        // $chapters = $this->chapterTree($indexes);
        $html = "<ul class='" . 'mc_container mc_index mc_list ' . $this->variables['textsize'] . "'>\n";;
        foreach ($indexes as $index) {
            $html .= $this->detailedIndexLevelHtml($index);
        }
        $html .= "</ul>\n";
        
        return $html;
    }

    
    protected function detailedIndexLevelHtml($index) {
        $html = "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>\n";
        $html .= "<a onclick='mlab.api.navigation.pageDisplay(" . $index["page_id"] . "); return false;'>" .
            ($index['chapter'] ? $index['chapter'] : $index["title"]) . "</a>";
        
        $html .= "<ul>\n";
        // if($index['chapter'] && $this->variables['displayChapterPageTitle']){
        //     $html .= "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>\n";
        //     $html .= "<a onclick='mlab.api.navigation.pageDisplay(" . $index["page_id"] . "); return false;'>kosio" . $index["title"] . "</a>";
        //     $html .= "</li>";
        // }
        if(isset($index['children'])) {
            foreach ($index['children'] as $child) {
                $html .= $this->detailedIndexLevelHtml($child);
            }
        }
        
        $html .= "</ul>\n";
        $html .= "</li>";

        return $html;
    }

    protected function chapterTree(array $nodes) {
        $activeNodes = [];
        $currentLevel = 0;

        foreach ($nodes as $index => &$node) {
            $node['children'] = [];
            $level = intval($node['level']);
            if($level > 0) {
                $activeNodes[$level] = &$node;
                if(isset($activeNodes[$level - 1])) {
                    $activeNodes[$level - 1]['children'][] = &$node;
                } else {
                    $activeNodes[$currentLevel]['children'][] = &$node;
                }
                unset($nodes[$index]);
                $currentLevel = $level;
            } elseif ($currentLevel > 0) {
                $activeNodes[$currentLevel]['children'][] = &$node;
                unset($nodes[$index]);
            } else {
                $activeNodes[$level] = &$node;
            }
        }
        return $nodes;
    }

}
