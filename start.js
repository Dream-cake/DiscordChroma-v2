const { ChromaApp, Color, Key, BcaAnimation } = require('@chroma-cloud/chromajs');
const path = require('path');
var fs = require('fs');
const electron = require('electron');
const {Menu, Tray} = require('electron');
const { app, BrowserWindow } = require('electron')
const autoUpdater = require("electron-updater").autoUpdater;
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info"
var log = require('electron-log');
var childProcess = require('child_process');
let Discord = require('discord.js');
var shell = require('electron').shell;
const { ipcRenderer } = require('electron');
const {ipcMain} = require('electron');
const {session} = require('electron');
const { dialog } = require('electron')


let client = null;
var DiscordRP = null;
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
var spamProtection = true;
const WindowsToaster = require('node-notifier').WindowsToaster;

var notifier = new WindowsToaster({
    withFallback: false, // Fallback to Growl or Balloons?
});

//save icon to userData for later refference
if(!fs.existsSync(path.join(app.getPath(`userData`), 'logo.png'))){
    fs.writeFileSync(path.join(app.getPath(`userData`), 'logo.png'), fs.readFileSync(path.join(__dirname, 'images/logo.png')))
}

//save config to userData for later refference
var config;
if(!fs.existsSync(path.join(app.getPath(`userData`), 'config.json'))){
    config = {
        "autoStart": false,
        "ServerPort": 3789,
        "RichPresence": true
    }
    fs.writeFileSync(path.join(app.getPath(`userData`), 'config.json'), JSON.stringify(config))

} else {
    config = JSON.parse(fs.readFileSync(path.join(app.getPath(`userData`), 'config.json')));
}

console.log(path.join(app.getPath(`userData`), 'config.json'))

log.transports.file.appName = 'DiscordChroma v2';
log.transports.file.level = 'info';
log.transports.file.format = '{m}/{d}/{y} | {h}:{i}:{s} | {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.file = path.join(app.getPath(`userData`),'logs.log');
log.transports.file.streamConfig = { flags: 'w' };
log.transports.file.stream = fs.createWriteStream(path.join(app.getPath(`userData`),'logs.log'));
log.info("HERE IS THE FORMAT THAT WE PUT IN ARE LOGS: Month/Date/Year | Hour:Minute:Second | TEXT");


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
    log.info("Checking For New Updates");
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-downloaded', () => {
        let updatewin = new BrowserWindow({width: 1000, height: 600, frame: false});
        updatewin.loadURL(path.join('file://', __dirname, '/pages/update.html'));
        log.info("Updated Downloaded");
        setTimeout(function() {
            log.info("Restarting To Install Update");
            autoUpdater.quitAndInstall();
        }, 4000);
    });

    log.info("Starting DiscordChroma v2");
    var invoked = false;
    if(config.RichPresence){
        DiscordRP = childProcess.fork(path.join(__dirname, '/utils/DiscordRP.js'));
    }

    win = new BrowserWindow({width: 1000, height: 600, frame: false, show: false});
    win.loadURL(path.join('file://', __dirname, '/pages/main.html'));
    //makes tray icon for closing and managing the program
    tray = new Tray(path.join(__dirname, '/images/icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Close'},
    ]);
    tray.setToolTip('DiscordChroma (click to open settings)');
    //tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        let settingswin = new BrowserWindow({width: 1500, height: 900, frame: false, resizable: true});
        settingswin.loadURL(path.join('file://', __dirname, '/pages/settings.html'));
    });

    win.on("ready-to-show", ()=>{
        win.show();
        //show startup animation on razerchroma
        //startupAnimation();
        setTimeout(function() {
            //hide loading/splash window
            win.hide();
            //start login process
            authenticateDiscord();
        }, 6000);
    });
});

function authenticateDiscord() {

    const filter = {
        urls: ['https://discordapp.com/api/*']
    }
    authWindow = new BrowserWindow({width: 1000, height: 600, frame:false, show: false, webPreferences: { nodeIntegration: false }})
    authWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        //details.requestHeaders['User-Agent'] = 'MyAgent'
        const answer = { cancel: false, requestHeaders: details.requestHeaders };
        if(details.url === "https://discordapp.com/api/v6/gateway") {
            answer.cancel = true;
            token = details.requestHeaders["Authorization"];
            console.log("TOKEN: " + token);
            login();
            authWindow.close();
        }
        callback(answer);
    });

    authWindow.webContents.on('did-navigate-in-page', function (event, newUrl) {
        console.log("IN", newUrl);
        if(newUrl.startsWith("https://discordapp.com/login")) {
            authWindow.show();
        }
    });
    authWindow.loadURL("https://discordapp.com/channels/@me");
}

function login() {
    if(client) client.destroy();
    client = new Discord.Client();

    client.on('ready', () => {
        log.info(`Logged in as ` + client.user.tag);
        userStatus = client.user.settings.status;


        const expressSite = require('express')

        var httpSite = require('http');


        const appAPI = expressSite()

        let corsSite = require("cors");


        appAPI.use(corsSite());

        appAPI.get('/', (req, res) => {
            
            res.json({
                id: `${client.id}`,
                status: `${userStatus}`,
                username: `${client.user.tag}`
            });
            
        });


        let HttpSiteData = httpSite.createServer(appAPI);

        HttpSiteData.listen(config.ServerPort);


        //show running notification
        notifier.notify(
            {
                title: 'DiscordChroma is running in the background',
                message: 'To open the main menu click here or on the tray icon in the taskbar',
                icon: path.join(app.getPath(`userData`), 'logo.png'),
                sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                wait: true, // Bool. Wait for User Action against Notification or times out
                appID: "ga.dreaming.DiscordChroma",
            },
            function(error, response) {
                if (response == "the user clicked on the toast.") {
                    let settingswin = new BrowserWindow({width: 1500, height: 900, frame: false, resizable: true});
                    settingswin.loadURL(path.join('file://', __dirname, '/pages/settings.html'));

                } else {
                }
            }
        );

        //console.log(client.user);

        //refreshData()
    });

    //when you receive a message
    client.on('message', message => {
        if(message.channel.type == "text"){
            if(message.guild.muted == false){
                if(message.channel.muted == false){
                    if(message.author.id != client.user.id){
                        //do only when it's a message from a non-muted server and not from yourself
                        if(spamProtection == false){
                            log.info('NEW MESSAGE, in ' + message.guild.name + ".");
                            spamProtection = true;

                            messageAnimation();

                            notifier.notify(
                                {
                                    title: `${message.author.tag} Sent You An Message In ${message.guild.name}`,
                                    message: `${message.content}`,
                                    icon: path.join(app.getPath(`userData`), 'logo.png'), //`https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.png`,
                                    sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                                    wait: true, // Bool. Wait for User Action against Notification or times out
                                    appID: "ga.dreaming.DiscordChroma",
                                },
                                function(error, response) {
                                    log.info(response);
                                    if (response == "the user clicked on the toast.") {
                                        let settingswin = new BrowserWindow({width: 1500, height: 900, frame: false, resizable: true});
                                        settingswin.loadURL(path.join('file://', __dirname, '/pages/settings.html'));

                                    } else {

                                    }
                                }
                            );



                        } else {
                            log.info('NEW MESSAGE, in ' + message.guild.name + ", but ignored due to spam protection.");
                        }
                    }
                }
            }
        } else if(message.channel.type == "dm" || message.channel.type == "group"){
            if(message.author.id != client.user.id){
                //do only when it's a message from DM or GroupDM and if it's not from yourself
                if(spamProtection == false){
                    log.info('NEW DM');
                    spamProtection = true;
                    //dmAnimation();

                    let titleMEssage;
                    let TitleGroupNull;
                    if(message.channel.type == "group"){
                        if(message.channel.name == null){
                            TitleGroupNull = `${message.author.tag}`;
                        } else {
                            TitleGroupNull = `${message.channel.name}`;
                        }
                        titleMEssage = `${message.author.tag} Sent An Group Message In ${TitleGroupNull}`;
                    } else {
                        titleMEssage = `${message.author.tag} Sent You An DM`;
                    }


                    notifier.notify(
                        {
                            title: `${titleMEssage}`,
                            message: `${message.content}`,
                            icon: path.join(app.getPath(`userData`), 'logo.png'), //`https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.png`,
                            sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                            wait: false, // Bool. Wait for User Action against Notification or times out
                            appID: "ga.dreaming.DiscordChroma",
                        },
                        function(error, response) {
                            log.info(response);
                            if (response == "the user clicked on the toast.") {
                                let settingswin = new BrowserWindow({width: 1500, height: 900, frame: false, resizable: true});
                                settingswin.loadURL(path.join('file://', __dirname, '/pages/settings.html'));

                            } else {

                            }
                        }
                    );

                } else {
                    log.info('NEW DM, but ignored due to spam protection.');
                }
            }
        }
    });

    // ---------------------------------- discord.js ERROR section --------------------------------- \\
    client.on('error', err => {
        error1 = error1 + 1;
        if (error1 == 1) {
            log.info("There has been an error!");
            log.error(err);
            //show succesfully started window
            let errorwin = new BrowserWindow({width: 1000, height: 600, frame: false});
            errorwin.loadURL(path.join('file://', __dirname, '/pages/error.html'));//ADD ?error=err and add to site so can show data
            errorwin.on('closed', function () {
                app.exit();
            });
        }
    });


    client.on('warn', () => {
        warn1 = warn1 + 1;
        if (warn1 == 1) {
            log.warn("There has been a warning/error!");
            //show succesfully started window
            let errorwin = new BrowserWindow({width: 1000, height: 600, frame: false});
            errorwin.loadURL(path.join('file://', __dirname, '/pages/error.html'));//ADD ?error=err and add to site so can show data
            errorwin.on('closed', function () {
                app.exit();
            });
        }
    });
    // ---------------------------------------- END discord.js ERROR section -------------------------------- \\

    client.login(token).catch(function(err){
        log.info(err);
        logout();
    });
}

function logout() {
    log.info("user logged out");
    session.defaultSession.clearStorageData({
        origin: "https://discordapp.com",
        storages: ["localstorage"]
    }, ()=> {
        token = null;
        if(client) client.destroy();
        client = new Discord.Client();
        authenticateDiscord();
    });
}

const ioHook = require('iohook');
const id = ioHook.registerShortcut([10, 11, 29], (keys) => {

    const options = {
        type: 'question',
        buttons: ['Cancel', 'Yes', 'No'],
        defaultId: 2,
        title: 'ADMIN AREA [KeyBind]',
        message: 'Are you usre you want to force quit?',
        detail: 'This will stop ALL DiscordChroma stuff',
        icon: path.join(app.getPath(`userData`), 'logo.png')
    };

    dialog.showMessageBox(null, options, (response, checkboxChecked) => {
        if(response === 1){
            app.quit();
            log.info("FORCE SHUT DOWN KEYBIND");
            process.exit(0);
            return;
        } else {
            return;
        }
    });

    /*
    app.quit();
    log.info("FORCE SHUT DOWN KEYBIND");
    process.exit(0);*/
});

const id2 = ioHook.registerShortcut([10, 9, 29], (keys) => {
    let focusedWindow = BrowserWindow.getFocusedWindow();

    if(!focusedWindow){
        notifier.notify(
            {
                title: `ADMIN AREA [KeyBind]`,
                message: `No Express Page Open`,
                icon: path.join(app.getPath(`userData`), 'logo.png'), //`https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.png`,
                sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                wait: false, // Bool. Wait for User Action against Notification or times out
                appID: "ga.dreaming.DiscordChroma",
            });
    } else {
        focusedWindow.webContents.openDevTools();
        notifier.notify(
            {
                title: `ADMIN AREA [KeyBind]`,
                message: `Express Dev Tools Used`,
                icon: path.join(app.getPath(`userData`), 'logo.png'), //`https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.png`,
                sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                wait: false, // Bool. Wait for User Action against Notification or times out
                appID: "ga.dreaming.DiscordChroma",
            });
    }
});
ioHook.start();

ipcMain.on('asynchronous-message', (event, arg, arg1) => {
    if (arg == "logout") {
        logout();
    } else if (arg == "msgcolor") {
        log.info("changed messagecolor to " + arg1);
    } else if (arg == "toggleAutoStart") {
        var AutoLauncher = new AutoLaunch({
            name: 'DiscordChroma'
        });
        AutoLauncher.isEnabled()
            .then(function(isEnabled){
                if(isEnabled){
                    AutoLauncher.disable();
                    config.autoStart = false;
                    fs.writeFileSync(path.join(app.getPath(`userData`), 'config.json'), JSON.stringify(config))
                } else {
                    AutoLauncher.enable();
                    config.autoStart = true;
                    fs.writeFileSync(path.join(app.getPath(`userData`), 'config.json'), JSON.stringify(config))
                }
            })
            .catch(function(err){
                // handle error
            });
    } else if (arg == "exitapp") {
        log.info("closing DiscordChroma");
        //show thx window
        let thxwin = new BrowserWindow({width: 1000, height: 600, frame: false});
        thxwin.loadURL(path.join('file://', __dirname, '/thx.html'));
        tray.destroy();
        //plays shutdown animation and exit's app at ending
        shutdownAnimation();
    }
});

ipcMain.on('sendappGetPathConfig', (event, arg) => {
    let Data = path.join(app.getPath(`userData`), 'config.json');
    event.sender.send('sentappGetPathConfig', `${Data}`)
})

