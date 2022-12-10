const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('view csgo faceit stats')
		.addStringOption(option =>
			option
				.setName('nickname')
				.setDescription('faceit nickname')
				.setRequired(true),
		),
	async execute(interaction) {
		await interaction.deferReply();
		const name = interaction.options.getString('nickname');
		const playerRes = await request(`https://open.faceit.com/data/v4/players?nickname=${name}&game=csgo`, {
			headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` },
		});
		const playerData = await playerRes.body.json();
		const id = playerData.player_id;
		const statsRes = await request(`https://open.faceit.com/data/v4/players/${id}/stats/csgo`, {
			headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` },
		});
		const stats = await statsRes.body.json();

		const recentResults = stats.lifetime['Recent Results'].map(result => result == '1' ? 'W' : 'L');

		const embed = new EmbedBuilder()
			.setTitle(`[${name}] Faceit CS:GO Statistics`)
			.setURL(`https://www.faceit.com/en/players/${name}`)
			.setColor(0x18a97b)
			.setThumbnail(`${playerData.avatar}`)
			.addFields(
				{ name: 'Skill Level', value: playerData.games.csgo.skill_level.toString(), inline: true },
				{ name: 'Elo', value: playerData.games.csgo.faceit_elo.toString(), inline: true },
			)
			.addFields(
				{ name: 'Matches', value: stats.lifetime.Matches.toString(), inline: true },
				{ name: 'Average K/D', value: stats.lifetime['Average K/D Ratio'].toString(), inline: true },
				{ name: 'Win Rate', value: `${stats.lifetime['Win Rate %']}%`, inline: true },
				{ name: 'Headshot %', value: stats.lifetime['Average Headshots %'].toString(), inline: true },
			)
			.addFields(
				{ name: 'Recent Results', value: recentResults.join(' ') },
			)
			.setTimestamp()
			.setFooter({ text: 'Faceit CS:GO Stats', iconURL: 'https://play-lh.googleusercontent.com/4iFS-rI0ImIFZyTwjidPChDOTUGxZqX2sCBLRsf9g_noMIUnH9ywsCmCzSu9vSM9Jg=w240-h480-rw' });

		await interaction.editReply({ content: '', embeds: [embed] });

	},
};