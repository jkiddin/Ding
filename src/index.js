require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildScheduledEvents
	],
});

client.once('ready', () => {
    console.log("Ding intialized. Hey there!")
})


client.on('guildScheduledEventCreate', async event => {
    // Check for event start time and schedule role creation 24 hours before event starts
    let startTime = new Date(event.scheduledStartTime);
    let currentTime = new Date();
    let timeUntilStart = startTime.getTime() - currentTime.getTime();

    if (timeUntilStart > 24 * 60 * 60 * 1000) {
        setTimeout(() => createRole(event), timeUntilStart - 24 * 60 * 60 * 1000);
    } else {
        createRole(event);
    }
});

async function createRole(event) {
    let guild = event.guild;
    let roleName = event.name;
    
    // Create a role with the event's name
    let role = await guild.roles.create({
        name: roleName,
        reason: `Role for event: ${roleName}`
    });

    // Assign role to interested users
    const interestedUsers = await getInterestedUsers(event.guildId, event.id);
    interestedUsers.forEach(async user => {
        let member = await guild.members.fetch(user.user.id);
        member.roles.add(role);
    });

    // Schedule role deletion 24 hours after event ends
    let endTime = new Date(event.scheduledEndTime);
    let duration = endTime.getTime() - Date.now() + 24 * 60 * 60 * 1000;
    setTimeout(() => role.delete(), duration);
}

async function getInterestedUsers(guildId, eventId) {
    // Fetch users interested in the event
    // Implement API call to "Get Guild Scheduled Event Users" endpoint
    // Handle pagination if necessary
    // Return a list of user objects
}

client.login(process.env.TOKEN);