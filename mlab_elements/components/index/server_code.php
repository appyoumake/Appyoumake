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
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the variables sent to us (this is from the JSON encoded variables stored at design time) we check to see if an index should be 
 * summary (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or folding (as previous with accordion jQuery component).
 * They all rely on the user having used the chapter component, if this is not found in any of the files we list pages on a single level
 */
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        $this->variables = array_merge($this->variables, $variables);
        $index = array();

//we do NOT allow sections before index page, so this is always first.
        $index[] = [
            'level' => 1,
            'type' => 'page',
            'page_id' => 0,
            'page_number' => 0,
            'title' => $app_config["tableOfContents"]['index']['title'],
            'chapter' => false,
            'filename' => "index.html"
        ];
        
//now we generate the index, we always add app title as top level and link to first page 
        $html = "    <h2><a class='mc_text mc_display mc_list mc_link mc_internal " . $this->variables['textsize'] . "' onclick='mlab.api.navigation.pageDisplay(0); return false;'>" . $app_config["title"] . "</a></h2>\n";
        
//now we have the data, time to output the HTML. If they asked for a folding layout, but did not specify any chapters, we output a plain list as for the other options
        $activeTree = $this->activeTree($app_config["tableOfContents"]['active'], $app_config["title"]);
        $index = array_merge($index, $activeTree);

        if ($this->variables['style'] == "folding") {
            $html .= $this->foldedListHtml($index);
        } else {
            $html .= $this->detailedListHtml($index);
        }
        return $html;
        
    }

//this function returns the current list of pages in the file conf.json (see ->tableOfContents->active variable)
    protected function activeTree($tableOfContents, $app_title) {
        $tree = [];
        $currentParent = [];
        $currentLevel = 1;
        
//here we loop through the table of contents, we manipulate it directly 
//by using & in front of foreach avrable which makes it a pointer, not a copy of the data
        foreach ($tableOfContents as &$item) {
            
//for index of style summary we exclude the pages and just use section headlines
            if($item['type'] == 'page' && $this->variables['style'] != 'summary') {
                
// modify item
                $item['chapter'] = false;
                $item['level'] = $currentLevel;
                $item['page_id'] = $item['pageNumber'];

                if(isset($currentParent[$currentLevel])) {
                    $currentParent[$currentLevel]['children'][] = $item;
                    if(!$currentParent[$currentLevel]['page_id']) {
                        $currentParent[$currentLevel]['page_id'] = $item['page_id'];
                    }
                } else {
                    $tree[] = $item;
                }
                
            } elseif($item['type'] == 'section') {
                $item['chapter'] = $item['title'];
                $item['page_id'] = null;
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
            $html .= $this->foldedIndexLevelHtml($index, 1);
        }
        $html .= "</div>";
        return $html;
    }

//first param is array of one or more pages and possible children for these pages
//second param tracks previous level. If we go back to same level (and not higher) we do NOT insert a new <details> tag
    protected function foldedIndexLevelHtml($index, $prev_level) {
        $html = '';
        if ($index["chapter"]) {
            $html .= "<details>\n";
            $html .= '    <summary>' . trim($index["chapter"]) . "</summary>\n";
            
            if($this->variables['displayChapterPageTitle']){
                $html .= "    <p><a class='mc_text mc_display mc_list mc_link mc_internal' onclick='mlab.api.navigation.pageDisplay(" . $index["page_id"] . "); return false;'>" . $index["chapter"] . "</a></p>\n";
            }

            if(isset($index['children'])) {
                foreach ($index['children'] as $child) {
                    $html .= $this->foldedIndexLevelHtml($child, $prev_level + 1);
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
