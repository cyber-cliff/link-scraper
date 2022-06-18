<?php 

class HTTPResonse implements JsonSerializable{

    private $status;
    private $title;
    private $description;

    private function __construct($status, $title, $description){
        $this->status = $status;
        $this->title = $title;
        $this->description = $description;
    }

    public static function badRequest(){
        return new self(400, "Bad Request", "The request should contain a url key with a valid URL as the value.");
    }

    public static function methodNotAllowed(){
        return new self(405, "Method Not Allowed", "HTTP method must be POST");
    }

    public function jsonSerialize(){
        $props = get_object_vars($this);
        return $props;
    }

    // GETTERS

    public function getStatus(){
        return $this->status;
    }

    public function getTitle(){
        return $this->title;
    }

    public function getDescription(){
        return $this->description;
    }

}

?>