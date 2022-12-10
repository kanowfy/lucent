const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('maprating')
		.setDescription('view player map statistics')
		.addStringOption(option =>
			option
				.setName('nickname')
				.setDescription('faceit nickname')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const name = interaction.options.getString('nickname');
		const playerRes = await request(`https://open.faceit.com/data/v4/players?nickname=${name}&game=csgo`, {
			headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` },
		});
		const playerData = await playerRes.body.json();
		if (playerData.errors) {
			await interaction.editReply('Player not found');
			return;
		}

		const id = playerData.player_id;
		const statsRes = await request(`https://open.faceit.com/data/v4/players/${id}/stats/csgo`, {
			headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` },
		});
		const stats = await statsRes.body.json();

		const embed = new EmbedBuilder()
			.setTitle(`[${name}] Map statistics`)
			.setColor(0xf5bf42)
			.setURL(`https://www.faceit.com/en/players/${name}`)
			.setThumbnail(`${playerData.avatar}`)
			.setTimestamp()
			.setFooter({ text: 'Faceit CS:GO Stats', iconURL: 'https://play-lh.googleusercontent.com/4iFS-rI0ImIFZyTwjidPChDOTUGxZqX2sCBLRsf9g_noMIUnH9ywsCmCzSu9vSM9Jg=w240-h480-rw' });

		for (const map of stats.segments) {
			const mapstats = `
				Winrate: ${map.stats['Win Rate %']}%
				K/D: ${map.stats['Average K/D Ratio']}
			`;
			embed.addFields(
				{ name: map.label, value: mapstats, inline: true },
			);
		}

		await interaction.editReply({ content: '', embeds: [embed] });
	},
};