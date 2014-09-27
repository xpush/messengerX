messengerX
=====================
**This project is currently under development.**

"messengerX" is the messenger application based [node-xpush](https://github.com/xpush/node-xpush).

## Using this project

We recommend using the `ionic` utility to create new Ionic projects that are based on this project but use a ready-made starter template.

For example, to start a new Ionic project with the default tabs interface, make sure the `ionic` utility is installed:

```bash
$ sudo npm install -g ionic
```

Then run:

```bash
$ ionic start messengerX tabs
```

More info on this can be found on the Ionic [Getting Started](http://ionicframework.com/getting-started) page.

## Installation & Run

While we recommend using the `ionic` utility to create new Ionic projects, you can use this repo as a barebones starting point to your next Ionic app.

To use this project as is, first clone the repo from GitHub, then run:

```bash
$ git clone https://github.com/xpush/messengerX.git
$ cd messengerX
$ sudo npm install -g cordova ionic gulp
$ npm install
$ gulp install
```

This following command will display the url, then open the url with your chrome browser.

```bash
$ ionic serve
Running dev server at http://**USER_IP**:8100/
```

## Add cordova plugins for mobile application (optional)

```bash
$ cordova plugin add org.apache.cordova.console  // only for developing
$ cordova plugin add org.apache.cordova.device
$ cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard
$ cordova plugin add de.appplant.cordova.plugin.local-notification
$ cordova plugin add https://github.com/phonegap-build/PushPlugin.git
$ cordova plugins add org.apache.cordova.inappbrowser
$ cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
```

## Using Sass (optional)

This project makes it easy to use Sass (the SCSS syntax) in your projects. This enables you to override styles from Ionic, and benefit from
Sass's great features.

Just update the `./scss/ionic.app.scss` file, and run `gulp` or `gulp watch` to rebuild the CSS files for Ionic.

Note: if you choose to use the Sass method, make sure to remove the included `ionic.css` file in `index.html`, and then uncomment
the include to your `ionic.app.css` file which now contains all your Sass code and Ionic itself:

```html
<!-- IF using Sass (run gulp sass first), then remove the CSS include above
<link href="css/ionic.app.css" rel="stylesheet">
-->
```

## Updating Ionic

To update to a new version of Ionic, open bower.json and change the version listed there.

For example, to update from version `1.0.0-beta.9` to `1.0.0-beta.10`, open bower.json and change this:

>**Note**: This application optimized with ionic version 1.0.1-beta.11 

```
"ionic": "driftyco/ionic-bower#1.0.0-beta.9"
```

To this:

```
"ionic": "driftyco/ionic-bower#1.0.0-beta.10"
```

After saving the update to bower.json file, run `gulp install`.

Alternatively, install bower globally with `npm install -g bower` and run `bower install`.

#### Using the Nightly Builds of Ionic

If you feel daring and want use the bleeding edge 'Nightly' version of Ionic, change the version of Ionic in your bower.json to this:

```
"ionic": "driftyco/ionic-bower#master"
```

Warning: the nightly version is not stable.


## Issues
Issues have been disabled on this repo, if you do find an issue or have a question consider posting it on the [Ionic Forum](http://forum.ionicframework.com/).  Or else if there is truly an error, follow our guidelines for [submitting an issue](http://ionicframework.com/contribute/#issues) to the main Ionic repository. On the other hand, pull requests are welcome here!

## Downloads binary files

#### Windows

[*download*](https://github.com/messengerx/messengerx.github.io/raw/master/download/messengerX-0.0.1-win.zip)

#### Linux 32 bit

[*download*](https://github.com/messengerx/messengerx.github.io/raw/master/download/messengerX-0.0.1-i386.tar.gz)

#### Linux 64 bit

[*download*](https://github.com/messengerx/messengerx.github.io/raw/master/download/messengerX-0.0.1-x86_64.tar.gz)

#### MAC

[*download*](https://github.com/messengerx/messengerx.github.io/raw/master/download/messengerX-0.0.1-osx.dmg)

## Use With node-webkit

#### In Ubuntu 13.04+ 32bit
```sh
sudo apt-get install libudev1 && cd /lib/i386-linux-gnu/ && sudo ln -s libudev.so.1 libudev.so.0
```
#### In Ubuntu 13.04+ 64bit
```sh
sudo apt-get install libudev1 && cd /lib/x86_64-linux-gnu/ && sudo ln -s libudev.so.1 libudev.so.0
```

[For detail] https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0 