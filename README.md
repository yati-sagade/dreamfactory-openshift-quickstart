## DreamFactory Services Platform(tm) Core Server v1.9.2

DreamFactory is an open source mobile backend that provides RESTful services
for building modern applications. This QuickStart allows you to deploy
DreamFactory on OpenShift in no time.

Install
--------

    $ rhc app create dreamfactory php-5.4 mysql-5.5 --from-code https://github.com/yati-sagade/dreamfactory-openshift-quickstart.git

This should clone the newly created app into `./dreamfactory`. In case it
doesn't, do
    
    $ rhc clone -a dreamfactory -n <your-openshift-domain>

You can access your instance of the DreamFactory platform at
`dreamfactory-<your-openshift-domain>.rhcloud.com`.

