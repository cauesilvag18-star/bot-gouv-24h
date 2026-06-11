const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot está online!');
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildInvites]
});

const sorteiosEmMemoria = new Map();

const SERVIDOR_ID = '1499849954322284607';
const CANAL_ENTRADA_ID = '1499849955588833335';
const CANAL_TICKET_ID = '1499869140586856701';
const BANNER = 'https://cdn.discordapp.com/attachments/1499849955588833335/1514152439304032286/be7dca16-a467-410a-909f-cb293b8f940f.png?';

function atualizarStatus(guild) {
    client.user.setActivity(`${guild.memberCount} membros!`, { type: ActivityType.Playing });
}

client.once('ready', async (c) => {
    console.log(`Bot ${c.user.tag} online!`);
    const guild = c.guilds.cache.get(SERVIDOR_ID);
    if (guild) atualizarStatus(guild);
});

client.on('guildMemberAdd', (member) => {
    atualizarStatus(member.guild);
    const canal = member.guild.channels.cache.get(CANAL_ENTRADA_ID);
    if(canal) canal.send({ embeds: [new EmbedBuilder().setTitle('BEM-VINDO!').setImage(BANNER).setDescription(`Olá ${member}, seja bem-vindo(a)!`).setColor('#001F3F')] });
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'sorteio_v2') {
        const premio = interaction.options.getString('premio');
        const tempoMs = (interaction.options.getInteger('horas') * 3600000) + (interaction.options.getInteger('minutos') * 60000);
        const msg = await interaction.reply({ 
            embeds: [new EmbedBuilder().setColor('#FFD700').setTitle('🎉 SORTEIO').setDescription(`Prêmio: **${premio}**\n\nClique para participar!`)], 
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('part_sorteio').setLabel('Participar').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ver_sorteio').setLabel('Ver Lista').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('encerrar_sorteio').setLabel('Encerrar').setStyle(ButtonStyle.Danger)
            )], fetchReply: true 
        });
        sorteiosEmMemoria.set(msg.id, new Set());
        setTimeout(() => finalizarSorteio(msg, premio), tempoMs);
    }
    if (interaction.isButton()) {
        const lista = sorteiosEmMemoria.get(interaction.message.id) || new Set();
        if (interaction.customId === 'part_sorteio') {
            lista.add(interaction.user.id);
            sorteiosEmMemoria.set(interaction.message.id, lista);
            await interaction.reply({ content: 'Você entrou no sorteio!', ephemeral: true });
        } else if (interaction.customId === 'ver_sorteio') {
            const nomes = Array.from(lista).map(id => `<@${id}>`).join('\n') || 'Ninguém ainda.';
            await interaction.reply({ content: `**Participantes (${lista.size}):**\n${nomes}`, ephemeral: true });
        } else if (interaction.customId === 'encerrar_sorteio') {
            if (interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: 'Apenas o dono pode encerrar.', ephemeral: true });
            finalizarSorteio(interaction.message, "Sorteio Manual");
            await interaction.reply({ content: 'Sorteio encerrado manualmente!', ephemeral: true });
        } else if (interaction.customId === 'abrir_ticket') {
            const canal = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText });
            await interaction.reply({ content: `Ticket criado em ${canal}`, ephemeral: true });
        }
    }
});

async function finalizarSorteio(msg, premio) {
    const lista = sorteiosEmMemoria.get(msg.id) || new Set();
    const participantes = Array.from(lista);
    const ganhador = participantes.length > 0 ? participantes[Math.floor(Math.random() * participantes.length)] : null;
    await msg.edit({ 
        embeds: [new EmbedBuilder().setTitle('🎉 SORTEIO ENCERRADO').setDescription(`Prêmio: **${premio}**\n\nGanhador: ${ganhador ? `<@${ganhador}>` : 'Ninguém participou!'}\nTotal: ${lista.size}`)], 
        components: [] 
    });
    sorteiosEmMemoria.delete(msg.id);
}

client.on('messageCreate', async (message) => {
    if (message.author.id !== message.guild?.ownerId) return;
    if (message.content === '!enviarticket') {
        const canal = message.guild.channels.cache.get(CANAL_TICKET_ID);
        await canal.send({ embeds: [new EmbedBuilder().setTitle('SUPORTE')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('abrir_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary))] });
        await message.delete();
    }
});

client.login(process.env.DISCORD_TOKEN);