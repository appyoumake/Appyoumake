<?php

namespace Sinett\MLAB\BuilderBundle\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ServicesControllerTest extends WebTestCase
{
    public function testMktgettaggedusers()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktGetTaggedUsers/token/tag');
    }

    public function testMktsubmitappdetails()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktSubmitAppDetails/app_details');
    }

    public function testMktuploadappfile()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktUploadAppFile/token/uid/replace_existing');
    }

    public function testMktpublishapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktPublishApp/token/uid/version');
    }

    public function testMktunpublishapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktUnpublishApp/token/uid/version/action');
    }

    public function testMktlogin()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktLogin/username/password');
    }

    public function testMktcreateuser()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktCreateUser/token/user_details');
    }

    public function testMktgetnewusers()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktGetNewUsers/token');
    }

    public function testMktsetuserstate()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktSetUserState/token/uid/state');
    }

    public function testMktsettaggedusersstate()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/mktsetTaggedUsersState/token/tag/state');
    }

    public function testCmpgetappstatus()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpGetAppStatus/passphrase/app_uid/app_version/platform');
    }

    public function testCmpcreateapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpCreateApp/passphrase/app_uid/app_version');
    }

    public function testCmpuploadfiles()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpUploadFiles/app_uid/app_version');
    }

    public function testCmpverifyapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpVerifyApp/passphrase/app_uid/app_version/checksum');
    }

    public function testCmpcompileapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpCompileApp/passphrase/app_uid/app_version/checksum/platform');
    }

    public function testCmpgetapp()
    {
        $client = static::createClient();

        $crawler = $client->request('GET', '/cmpGetApp/user_uid/app_uid/app_version/checksum/platform');
    }

}
