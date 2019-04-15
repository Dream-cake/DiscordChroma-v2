const { ChromaApp, Color, Key, BcaAnimation } = require('@chroma-cloud/chromajs');
const path = require('path');
var fs = require('fs');
const electron = require('electron');
const { app, BrowserWindow } = require('electron')
const autoUpdater = require("electron-updater").autoUpdater;
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info"
var log = require('electron-log');

let authWindow = null;
let token = null;
let win = null;
let loginwin;
let tray = null;
var debugerror = 0;
var error1 = 0;
var warn1 = 0;
var urError = 0;
var ECONNRESET = 0;
var token1 = null;
var color_var = 16777215;
let userStatus;
var spamProtection = false;

//save icon to userData for later refference
if(!fs.existsSync(path.join(app.getPath(`userData`), 'logo.png'))){
    fs.writeFileSync(path.join(app.getPath(`userData`), 'logo.png'), fs.readFileSync(path.join(__dirname, 'images/logo.png')))
}

//save config to userData for later refference
var config;
if(!fs.existsSync(path.join(app.getPath(`userData`), 'config.json'))){
    config = {
        "autoStart": false,
        "ServerPort": 3789
    }
    fs.writeFileSync(path.join(app.getPath(`userData`), 'config.json'), JSON.stringify(config))

} else {
    config = JSON.parse(fs.readFileSync(path.join(app.getPath(`userData`), 'config.json')));
}

log.transports.file.appName = 'DiscordChroma v2';
log.transports.file.level = 'info';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.file = path.join(app.getPath(`userData`),'logs.log');
log.transports.file.streamConfig = { flags: 'w' };
log.transports.file.stream = fs.createWriteStream(path.join(app.getPath(`userData`),'logs.log'));

const chroma = new ChromaApp("DiscordChroma v2", "A Discord integration For Razer Chroma", "Spooder [Dreaming Development Member]", "Spooder@dreaming.ga");

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            let alreadyrunningwin = new BrowserWindow({width: 1000, height: 600, frame: false});
            alreadyrunningwin.loadURL(path.join('file://', __dirname, '/pages/alreadyrunning.html'));
            log.info('DiscordChroma v2 was already running.');
            setTimeout(function () {
                app.quit();
                return;
            }, 10000);
        })
    })
}

app.on('ready', function () {

});