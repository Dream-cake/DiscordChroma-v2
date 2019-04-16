const DiscordRPC = require('discord-rpc');


// don't change the client id if you want this example to work
const clientId = '506569031403307038';

// only needed for discord allowing spectate, join, ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity() {


  rpc.setActivity({
    details: `v5.0.0 | v2`,
    state: 'The Best Of Both Worlds!',
    startTimestamp,
    largeImageKey: 'logo512',
    largeImageText: 'Made By Spooder#1111',
    smallImageKey: 'razerlogo',
    smallImageText: 'All Chroma Razer Products Work!',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15000);
});

rpc.login({ clientId }).catch(console.error);

