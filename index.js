const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');

// Configuração simples de servidor HTTP para o Render não dar erro de porta
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot está online!');
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildInvites]
});

const sorteiosEmMemoria = new Map();

// IDs e Configurações
const SERVIDOR_ID = '1499849954322284607';
const CANAL_ENTRADA_ID = '1499849955588833335';
const CANAL_TICKET_ID = '1499869140586856701';
const CANAL_AVISOS_REGRAS_ID = '1499910107742605433';
const BANNER = 'https://cdn.discordapp.com/attachments/1499849955588833335/1514152439304032286/be7dca16-a467-410a-909f-cb293b8f940f.png?ex=6a2a53d9&is=6a290259&hm=93861fba31f099d08e5e46cba4039797ae0dc76a0739680cb67d4dd05a125f06&';

function atualizarStatus(guild) {
    client.user.setActivity(`${guild.memberCount} membros!`, { type: ActivityType.Playing });
}

client.once('ready', async (c) => {
    console.log(`Bot ${c.user.tag} online!`);
    const guild = c.guilds.cache.get(SERVIDOR_ID);
    if (guild) atualizarStatus(guild);

    const comandos = [
        new SlashCommandBuilder().setName('invites').setDescription('Veja seus convites'),
        new SlashCommandBuilder().setName('sorteio_v2').setDescription('Cria um novo sorteio')
            .addStringOption(o => o.setName('premio').setDescription('O que será sorteado?').setRequired(true))
            .addIntegerOption(o => o.setName('horas').setDescription('Horas de duração').setRequired(true))
            .addIntegerOption(o => o.setName('minutos').setDescription('Minutos de duração').setRequired(true))
    ].map(c => c.toJSON());
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationGuildCommands(client.user.id, SERVIDOR_ID), { body: comandos });
});

// Eventos do Bot (Sorteios, Tickets, etc)
client.on('guildMemberAdd', (member) => {
    atualizarStatus(member.guild);
    const canal = member.guild.channels.cache.get(CANAL_ENTRADA_ID);
    if(canal) canal.send({ embeds: