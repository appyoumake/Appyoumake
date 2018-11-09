<?php
namespace Sinett\MLAB\BuilderBundle\Service;

use WebSocket\Client;

class WebSocketService
{
    public $socket = null;
    
    public $errors = [];
    
    public function __construct($config, $logger)
    {
        $this->socket = new Client($config["ws_socket"]["url_client"]);
    }
    
    public function send($data = [])
    {
        try {
            return $this->socket->send(json_encode($data));
        } catch (\Throwable $ex) {
            $this->errors[] = $ex->getMessage();
            return false;
        }
    }
    
    
    public function receive()
    {
        try {
            $data = $this->socket->receive();
            return json_decode($data, true);
        } catch (\Throwable $ex) {
            $this->errors[] = $ex->getMessage();
            return false;
        }
    }
    
}