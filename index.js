const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ActivityType } = require('discord.js');
const http = require('http');

http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences]
});

const CANAL_ENTRADA_ID = '1499849955588833335';
const ID_SERVIDOR = '1499849954322284607';
const ID_MSG_IMAGEM = '1514835174389448745';

client.once('ready', (c) => {
    console.log(`Bot ${c.user.tag} online!`);
    setInterval(() => {
        const guild = client.guilds.cache.get(ID_SERVIDOR);
        if (guild) {
            const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
            client.user.setActivity(`${online} membros online!`, { type: ActivityType.Playing });
        }
    }, 60000);
});

// Boas-vindas
client.on('guildMemberAdd', async (member) => {
    const canal = member.guild.channels.cache.get(CANAL_ENTRADA_ID);
    if (!canal) return;
    try {
        const msg = await canal.messages.fetch(ID_MSG_IMAGEM);
        const anexo = msg.attachments.first();
        await canal.send({ content: `BEM-VINDO! Olá ${member}, seja bem-vindo(a)!`, files: anexo ? [anexo.url] : [] });
    } catch (e) { canal.send(`Bem-vindo(a), ${member}!`); }
});

// Lógica de Tickets
client.on('interactionCreate', async (interaction) => {
    // ABRIR TICKET
    if (interaction.isButton() && interaction.customId === 'abrir_ticket') {
        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [{ id: interaction.guild.id, deny: ['ViewChannel'] }, { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }]
        });
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );

        await canal.send({
            content: `Olá ${interaction.user}, bem-vindo ao suporte! Um membro da nossa equipe irá atendê-lo em breve.`,
            embeds: [new EmbedBuilder().setTitle('🎫 Ticket de Atendimento').setDescription('Descreva seu problema aqui com detalhes.')],
            components: [row]
        });
        await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });
    }

    // FECHAR TICKET
    if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
        if (!interaction.member.permissions.has('Administrator')) return interaction.reply({ content: 'Apenas admins podem fechar tickets!', ephemeral: true });
        await interaction.reply('Fechando o ticket em 5 segundos...');
        setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }
});

// Comando para enviar o botão de abrir ticket
client.on('messageCreate', async (message) => {
    if (!message.member?.permissions.has('Administrator')) return;
    if (message.content === '!enviarticket') {
        await message.channel.send({
            embeds: [new EmbedBuilder().setTitle('SUPORTE').setDescription('Clique abaixo para abrir um ticket.')],
            components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('abrir_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary))]
        });
        await message.delete();
    }
    if (message.content === '!testeentrada') client.emit('guildMemberAdd', message.member);
});

client.login(process.env.DISCORD_TOKEN);