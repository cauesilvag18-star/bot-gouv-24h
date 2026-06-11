const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const http = require('http');

// Servidor HTTP para o Render não dar erro de porta
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot está online!');
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

const CANAL_TICKET_ID = '1499869140586856701';

client.once('ready', (c) => {
    console.log(`Bot ${c.user.tag} online!`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'abrir_ticket') {
        const canal = await interaction.guild.channels.create({ 
            name: `ticket-${interaction.user.username}`, 
            type: ChannelType.GuildText 
        });
        await interaction.reply({ content: `Ticket criado em ${canal}`, ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!enviarticket' && message.author.id === message.guild?.ownerId) {
        const canal = message.guild.channels.cache.get(CANAL_TICKET_ID);
        if (canal) {
            await canal.send({ 
                embeds: [new EmbedBuilder().setTitle('SUPORTE').setDescription('Clique abaixo para abrir um ticket.')], 
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('abrir_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary)
                )] 
            });
            await message.delete();
        }
    }
});

client.login(process.env.DISCORD_TOKEN);