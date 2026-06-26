require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// CONFIGURAÇÕES
const ID_CANAL_BOAS_VINDAS = '1500503884978851910';
const ID_CARGO_STAFF = process.env.ID_STAFF;
const ID_CARGO_AUTOMATICO = process.env.ID_CARGO_AUTOMATICO;

client.once('ready', () => {
    console.log(`🤖 Bot online como ${client.user.tag}!`);
});

// --- SISTEMA DE BOAS-VINDAS E CARGO AUTOMÁTICO ---
client.on('guildMemberAdd', async (member) => {
    // 1. Dar o cargo automático
    try {
        const cargo = member.guild.roles.cache.get(ID_CARGO_AUTOMATICO);
        if (cargo) {
            await member.roles.add(cargo);
        }
    } catch (err) {
        console.error('Erro ao dar cargo automático:', err);
    }

    // 2. Enviar a mensagem de boas-vindas
    const canal = member.guild.channels.cache.get(ID_CANAL_BOAS_VINDAS);
    if (!canal) return;

    const embedBoasVindas = new EmbedBuilder()
        .setColor('#FF0000') 
        .setTitle('👋 BEM-VINDO(A) À NOSSA COMUNIDADE!')
        .setDescription(`Olá ${member}! Você recebeu o cargo automático. Divirta-se! 🚀`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Agora somos ${member.guild.memberCount} membros! 🎉` })
        .setTimestamp();

    await canal.send({ content: `Seja muito bem-vindo(a), ${member}! ✨`, embeds: [embedBoasVindas] });
});

// --- COMANDOS MENSAGEM ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') message.reply('🏓 Pong!');

    // Teste de recepção
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
        await interaction.reply({ content: '🔒 Fechando canal...' });
        setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }
});

client.login(process.env.DISCORD_TOKEN);