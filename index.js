require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// --- SERVIDOR HTTP PARA O RENDER (MANTÉM O BOT ACORDADO) ---
const http = require('http');
http.createServer((req, res) => {
    res.write("Bot esta online!");
    res.end();
}).listen(3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// CONFIGURAÇÕES (Variáveis de ambiente)
const ID_CANAL_BOAS_VINDAS = '1500503884978851910';
const ID_CARGO_STAFF = process.env.ID_STAFF;
const ID_CARGO_AUTOMATICO = process.env.ID_CARGO_AUTOMATICO;

client.once('ready', () => {
    console.log(`🤖 Bot online como ${client.user.tag}!`);
});

// --- SISTEMA DE CARGO AUTOMÁTICO ---
client.on('guildMemberAdd', async (member) => {
    try {
        const cargo = member.guild.roles.cache.get(ID_CARGO_AUTOMATICO);
        if (cargo) await member.roles.add(cargo);
    } catch (err) {
        console.error('Erro ao dar cargo:', err);
    }
});

// --- COMANDOS MENSAGEM ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') message.reply('🏓 Pong!');

    // Comando de Teste de Recepção
    if (message.content === '!recepcao') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const canal = message.guild.channels.cache.get(ID_CANAL_BOAS_VINDAS);
        if (canal) await canal.send(`Teste de boas-vindas para ${message.author}!`);
    }

    // Setup Ticket
    if (message.content === '!setup-ticket') {
        const menuSelecao = new StringSelectMenuBuilder()
            .setCustomId('menu_ticket')
            .setPlaceholder('Selecione uma opção')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Suporte Geral').setValue('suporte_geral'),
                new StringSelectMenuOptionBuilder().setLabel('Denúncia').setValue('denuncia'),
                new StringSelectMenuOptionBuilder().setLabel('Bugs').setValue('bugs')
            );

        const linhaMenu = new ActionRowBuilder().addComponents(menuSelecao);
        const embedPainel = new EmbedBuilder()
            .setColor('#332d2d')
            .setTitle('🇧🇷 ROBLOX BRASIL - ATENDIMENTO')
            .setDescription('Escolha uma das opções abaixo para abrir um ticket.');

        await message.channel.send({ embeds: [embedPainel], components: [linhaMenu] });
    }
});

// --- SISTEMA DE INTERAÇÕES (TICKETS) ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
        const opcao = interaction.values[0];
        const nomeCanal = `${opcao}-${interaction.user.username}`.substring(0, 32);

        await interaction.deferReply({ ephemeral: true });

        const canalTicket = await interaction.guild.channels.create({
            name: nomeCanal,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ID_CARGO_STAFF, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });

        const botaoFechar = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
        );

        await canalTicket.send({ 
            content: `${interaction.user} | <@&${ID_CARGO_STAFF}>`, 
            embeds: [new EmbedBuilder().setColor('#FF0000').setTitle(`🎫 Ticket: ${opcao}`).setDescription('Aguarde um staffer responder.')],
            components: [botaoFechar] 
        });

        await interaction.editReply({ content: `✅ Ticket criado em ${canalTicket}` });
    }

    if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
        await interaction.reply({ content: '🔒 Este ticket será fechado e deletado em 5 segundos...' });
        setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }
});

client.login(process.env.DISCORD_TOKEN);