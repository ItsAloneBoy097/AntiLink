const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const moment = require('moment');
const config = require('./config.json');

// Create a new Discord client
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        // Add more intents as needed
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'] // Required for some features like message delete handling
});

// Array of statuses to cycle through
const statuses = ['online', 'idle', 'dnd'];

// Function to update presence
const updatePresence = () => {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    client.user.setPresence({
        status: randomStatus,
        activities: [{ name: `${config.prefix}help || ${config.prefix}setup`, type: 'LISTENING' }]
    });
};

// Function to calculate bot uptime
const calculateUptime = () => {
    const totalSeconds = client.uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

// Event listener for when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Update presence initially
    updatePresence();
    // Update presence every 2 seconds
    setInterval(updatePresence, 2000);
});

// Event listener for when a message is received
client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore messages from bots
    if (!message.guild) return; // Ignore DMs

    // Check if bot is mentioned
    if (message.mentions.has(client.user)) {
        const mentionEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('AntiLink')
            .setDescription(`Hello ${message.author}, you mentioned me ?\n\n> • My Prefix Is: \`${config.prefix}\``)
            .setTimestamp();

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Invite Me')
                    .setStyle('LINK')
                    .setURL(config.invite_link),
                new MessageButton()
                    .setLabel('Support Server')
                    .setStyle('LINK')
                    .setURL(config.support_server_link)
            );

        message.reply({ embeds: [mentionEmbed], components: [row] });
        return;
    }

    if (!message.content.startsWith(config.prefix)) return; // Ignore messages that don't start with the prefix

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Ping')
            .setDescription(`Pong! Bot latency is ${Math.round(client.ws.ping)}ms.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    } else if (command === 'uptime') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Uptime')
            .setDescription(`Bot has been running for ${calculateUptime()}.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    } else if (command === 'support') {
        const supportEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Support')
            .setDescription('For support, please visit our support page.')
            .setTimestamp();

        const supportButton = new MessageButton()
            .setLabel('Support')
            .setStyle('LINK')
            .setURL(config.support_server_link);

        const row = new MessageActionRow().addComponents(supportButton);

        message.channel.send({ embeds: [supportEmbed], components: [row] });
    } else if (command === 'help') {
        const helpEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help Commands')
            .setDescription('List of available commands:')
            .addFields(
                { name: `${config.prefix}setup`, value: 'Setup AntiLink Fution on your server. '},
                { name: `${config.prefix}ping`, value: 'Check bot\'s latency.' },
                { name: `${config.prefix}uptime`, value: 'Check how long the bot has been running.' },
                { name: `${config.prefix}support`, value: 'Get support information.' },
                { name: `${config.prefix}invite`, value: 'Invite Me on your server .' },
                { name: `${config.prefix}help`, value: 'Display this help message.' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    } else if (command === 'invite') {
        const inviteEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Invite')
            .setDescription('You can invite me to your server using this invite link.')
            .setTimestamp();

        const inviteButton = new MessageButton()
            .setLabel('Invite')
            .setStyle('LINK')
            .setURL(config.invite_link);

        const row = new MessageActionRow().addComponents(inviteButton);

        message.channel.send({ embeds: [inviteEmbed], components: [row] });
    } else if (command === 'setup') {
        // Check if the user has admin permissions
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You need administrator permissions to use this command.')
                .setTimestamp();
            message.channel.send({ embeds: [errorEmbed] });
            return;
        }

        // Set up filter to delete messages containing links sent by non-admin users
        const filter = msg => {
            return !msg.author.bot && !msg.member.permissions.has('ADMINISTRATOR') && /https?:\/\/\S+/gi.test(msg.content);
        };

        const collector = message.channel.createMessageCollector({
            filter,
            dispose: true // Required for message deletion
        });

        collector.on('collect', msg => {
            msg.delete().catch(err => console.error('Failed to delete message:', err));
            const warningEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('Warning')
                .setDescription(`${msg.author}, you are not allowed to send links in this server.`)
                .setTimestamp();
            message.channel.send({ embeds: [warningEmbed] });
        });

        const setupEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Setup Complete')
            .setDescription('I will now delete any message containing links sent by non-administrator users.')
            .setTimestamp();
        message.channel.send({ embeds: [setupEmbed] });
    }
});

// Log in to Discord with your bot token
client.login(config.token);