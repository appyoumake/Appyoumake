<?php
namespace Sinett\MLAB\BuilderBundle\Service;
use WebSocket\Client;

class WebSocketService
{
    public $socket = null;
    
    public function __construct($config, $logger)
    {
        $this->socket = new Client($config["ws_socket"]["url_client"]);
        return $this->socket;
    }
    
    public function send($data = [])
    {
        $this->socket->send(json_encode($data));
    }
    
    
    public function receive()
    {
        $data = $this->socket->receive();
        return json_decode($data, true);
    }
    
}