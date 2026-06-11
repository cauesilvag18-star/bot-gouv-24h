const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ActivityType } = require('discord.js');
const http = require('http');

// Servidor para manter o bot ativo no Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot online!');
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildPresences
    ]
});

client.once('ready', (c) => {
    console.log(`Bot ${c.user.tag} online!`);
    // Contador de membros online
    setInterval(() => {
        const guild = client.guilds.cache.get('1499849954322284607');
        if (guild) {
            const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
            client.user.setActivity(`${online} membros online!`, { type: ActivityType.Playing });
        }
    }, 60000);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'abrir_ticket') {
        try {
            const canal = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText });
            await canal.send({ 
                content: `Olá ${interaction.user}, aguarde um momento que o suporte já irá te atender!`,
                embeds: [new EmbedBuilder().setTitle('Ticket de Suporte').setDescription('Descreva seu problema aqui.')]
            });
            await interaction.reply({ content: `Ticket criado em ${canal}`, ephemeral: true });
        } catch (error) {
            console.error('Erro ao criar ticket:', error);
            await interaction.reply({ content: 'Erro ao criar canal. Verifique as permissões!', ephemeral: true });
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!enviarticket' && message.member?.permissions.has('Administrator')) {
        await message.channel.send({ 
            embeds: [new EmbedBuilder().setTitle('SUPORTE').setDescription('Clique abaixo para abrir um ticket.')], 
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('abrir_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary)
            )] 
        });
        await message.delete();
    }
});

client.login(process.env.DISCORD_TOKEN);