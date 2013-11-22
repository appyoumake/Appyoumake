<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Menu
 */
class Menu
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var integer
     */
    private $parentId;

    /**
     * @var integer
     */
    private $orderBy;

    /**
     * @var string
     */
    private $content_html;

    /**
     * @var string
     */
    private $content_php;

    /**
     * @var string
     */
    private $class;

    /**
     * @var string
     */
    private $help;

    /**
     * @var string
     */
    private $filterRole;

    /**
     * @var string
     */
    private $filterUrl;

    /**
     * @var string
     */
    private $url;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set parentId
     *
     * @param integer $parentId
     * @return Menu
     */
    public function setParentId($parentId)
    {
        $this->parentId = $parentId;
    
        return $this;
    }

    /**
     * Get parentId
     *
     * @return integer 
     */
    public function getParentId()
    {
        return $this->parentId;
    }

    /**
     * Set orderBy
     *
     * @param integer $orderBy
     * @return Menu
     */
    public function setOrderBy($orderBy)
    {
        $this->orderBy = $orderBy;
    
        return $this;
    }

    /**
     * Get orderBy
     *
     * @return integer 
     */
    public function getOrderBy()
    {
        return $this->orderBy;
    }

    /**
     * Set content_html
     *
     * @param string $contentHtml
     * @return Menu
     */
    public function setContentHtml($contentHtml)
    {
        $this->content_html = $contentHtml;
    
        return $this;
    }

    /**
     * Get content_html
     *
     * @return string 
     */
    public function getContentHtml()
    {
        return $this->content_html;
    }

    /**
     * Set content_php
     *
     * @param string $contentPhp
     * @return Menu
     */
    public function setContentPhp($contentPhp)
    {
        $this->content_php = $contentPhp;
    
        return $this;
    }

    /**
     * Get content_php
     *
     * @return string 
     */
    public function getContentPhp()
    {
        return $this->content_php;
    }

    /**
     * Set class
     *
     * @param string $class
     * @return Menu
     */
    public function setClass($class)
    {
        $this->class = $class;
    
        return $this;
    }

    /**
     * Get class
     *
     * @return string 
     */
    public function getClass()
    {
        return $this->class;
    }

    /**
     * Set help
     *
     * @param string $help
     * @return Menu
     */
    public function setHelp($help)
    {
        $this->help = $help;
    
        return $this;
    }

    /**
     * Get help
     *
     * @return string 
     */
    public function getHelp()
    {
        return $this->help;
    }

    /**
     * Set filterRole
     *
     * @param string $filterRole
     * @return Menu
     */
    public function setFilterRole($filterRole)
    {
        $this->filterRole = $filterRole;
    
        return $this;
    }

    /**
     * Get filterRole
     *
     * @return string 
     */
    public function getFilterRole()
    {
        return $this->filterRole;
    }

    /**
     * Set filterUrl
     *
     * @param string $filterUrl
     * @return Menu
     */
    public function setFilterUrl($filterUrl)
    {
        $this->filterUrl = $filterUrl;
    
        return $this;
    }

    /**
     * Get filterUrl
     *
     * @return string 
     */
    public function getFilterUrl()
    {
        return $this->filterUrl;
    }

    /**
     * Set url
     *
     * @param string $url
     * @return Menu
     */
    public function setUrl($url)
    {
        $this->url = $url;
    
        return $this;
    }

    /**
     * Get url
     *
     * @return string 
     */
    public function getUrl()
    {
        return $this->url;
    }
    /**
     * @var string
     */
    private $contentHtml;

    /**
     * @var string
     */
    private $contentPhp;

    /**
     * Get display value
     *
     * @return \String
     */
    public function __toString()
    {
    	return $this->contentHtml . " " . $this->help;
    }
    

}