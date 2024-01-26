require('dotenv').config();
const { Client, IntentsBitField, User, CachedManager, GuildScheduledEventManager, Message } = require('discord.js');
const fs = require('fs');
const path = require('path');
const rolesFilePath = path.join(`../`, 'eventRoles.json');

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildScheduledEvents
	],
});

const eventRoles = new Map();

client.once('ready', async () => {
    console.log("Ding intialized. Hey there!");

    // Load roles from file
    /*
    if (fs.existsSync(rolesFilePath)) {
        const savedRoles = new Map(JSON.parse(fs.readFileSync(rolesFilePath)));
        eventRoles = new Map([...eventRoles, ...savedRoles]);
    }
    */

     // Fetch all guilds the bot is part of
     client.guilds.cache.forEach(async guild => {
        // Fetch scheduled events for each guild
        let events = await guild.scheduledEvents.fetch();

        // Check each event
        events.forEach(event => {
            let startTime = new Date(event.scheduledStartTime);
            let currentTime = new Date();
            let timeUntilStart = startTime.getTime() - currentTime.getTime();

            if (timeUntilStart <= 24 * 60 * 60 * 1000 && timeUntilStart > 0) {
                // If within 24 hours of the start and not started yet, create role
                createRole(event);
            }
        });
    });

});

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

    console.log("Event created");
});

client.on('guildScheduledEventUserAdd', async (event, member) => {
    //Event and member correctly passed - see event creation for errors.
    let membername = member.username;
    let eventName = event.name;
    console.log(`${membername} interested`);

    let role = eventRoles.get(event.id);
    var rolePass = event.guild.roles.cache.find(role => role.name === `Ding! - ${eventName}`)
    console.log(rolePass);
    
    if (!rolePass) {
        // Wait for some time and check again
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
        console.log("Waiting");
        rolePass = event.guild.roles.cache.find(role => role.name === `Ding! - ${eventName}`)

        if (!rolePass) {
            console.log(`Role still not found for event: ${event.id}`);
            return;
        }
    }
    
    //When a user adds themselves to an event, updates their role
    let startTime = new Date(event.scheduledStartTime);
    let currentTime = new Date();
    let timeUntilStart = startTime.getTime() - currentTime.getTime();

    let guild = event.guild;
    let memberPass = await guild.members.fetch(member.id);
    //console.log(memberPass);

    if (timeUntilStart > 24 * 60 * 60 * 1000) {
        setTimeout(() => member.user.add(role), timeUntilStart - 24 * 60 * 60 * 1000);
    } else {
        memberPass.roles.add(rolePass);
    }
});


async function createRole(event) {
    let guild = event.guild
    let roleName = event.name;
    console.log(`Guild: ${guild}, Name: ${roleName}`);
    
    // Create a role with the event's name
    let role = await guild.roles.create({
        name: `Ding! - ${roleName}`,
        reason: `Role for event: ${roleName}`
    });

    //Check if the role was created
    let eventName = event.name;
    var rolePass = event.guild.roles.cache.find(role => role.name === `Ding! - ${eventName}`)
    if (!rolePass) {
        console.log("Role not created.");
    }

    eventRoles.set(event.id, role);  // Store the role
    //console.log(role);

    // Assign role to interested users
    /*
    const event_manager = new GuildScheduledEventManager(event.guild);

    let interestedUsers = await event_manager.fetchSubscribers(event.id)
    console.log(interestedUsers);

    interestedUsers.forEach(async user => {
        let username = user.username
        console.log(`${username} is interested.`);
        let member = await guild.members.fetch(user.user.id);
        member.roles.add(role);
    });
    //await saveRolesToFile();  // Save the updated map to the file
    */

    // Schedule role deletion 24 hours after event ends
    let endTime = new Date(event.scheduledEndTime);
    let duration = endTime.getTime() - Date.now() + 60 * 1000; //24 * 60 * 60 * 1000;
    setTimeout(() => role.delete(), duration);
}



async function getInterestedUsers(event) {
    let eventGuild = event.guild;
    console.log(`Event Guild: ${eventGuild}`)
   
    const event_manager = new GuildScheduledEventManager(event.guild);

    let users = await event_manager.fetchSubscribers(event.id)

    //console.log(users);
    return users;
}

async function saveRolesToFile() {
    fs.writeFileSync(rolesFilePath, JSON.stringify(Array.from(eventRoles.entries())));
}

client.login(process.env.TOKEN);

/* 
Ideas
 - Export a file that contains the role ID and end date of the event, 
 every time the bot is started back up, 
 it checks the file to see if it needs to delete the role. (timeout doesn't continue )

*/

async function fileCheck() {

}