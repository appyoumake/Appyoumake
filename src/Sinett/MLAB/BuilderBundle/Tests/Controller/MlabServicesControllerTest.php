<?php

namespace Sinett\MLAB\BuilderBundle\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class MlabServicesControllerTest extends WebTestCase
{
    public function testMktgettaggedusers()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktGetTaggedUsers');
    }

}
