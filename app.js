const Discord = require('discord.js');

const client = new Discord.Client();

const config = require('./config.json');

let courtChannel, introductionChannel;
let guiltyEmoji, notGuiltyEmoji;
let jailedRole;
const arrestedUsers = new Set();
const COURT_CHANNEL_NAME = 'vegan-court';
const GUILTY_EMOJI_NAME = 'upgary';
const NOT_GUILTY_EMOJI_NAME = 'downgary';
const VOTING_TIME = 60; // in seconds
const JAIL_TIME = 30; // in minutes

client.on("ready", () => {
  console.log(`Bot has started, ready to hunt down criminals.`);

  [...client.channels.values()].forEach(async channel => {
    if (channel.name === COURT_CHANNEL_NAME) {
      courtChannel = channel;
    }
  });

  [...client.guilds.values()].forEach(guild => {
    [...guild.emojis.values()].forEach(emoji => {
      if (emoji.name === GUILTY_EMOJI_NAME) {
        guiltyEmoji = emoji;
      }
      if (emoji.name === NOT_GUILTY_EMOJI_NAME) {
        notGuiltyEmoji = emoji;
      }
    });
    [...guild.roles.values()].forEach(role => {
      if (role.name.toLowerCase() === 'in vegan jail') {
        jailedRole = role;
      }
    });
  });
  client.user.setActivity(`blueberries with ketchup and milk powder`);
});


client.on("message", async message => {
  if (message.author.bot) return;

  // if (message.author.username !== 'Jožo') return;
  if (message.content.startsWith('arest')) {
    await message.channel.send(`It's "arrest", not "arest", you illiterate fuck`);
    return;
  }

  if (message.content.toLowerCase().startsWith('arrest')) {
    const arr = message.content.split(' ');
    if (arr.length < 2) {
      await message.channel.send(`I don't know who to arrest, <@${message.author.id}>!!`);
      return;
    } else if (arr.length < 2) {
      await message.channel.send(`You need to provide a reason for arrest, <@${message.author.id}>!!`);
      return;
    }
    if (!arr[1].startsWith('<@') || !arr[1].endsWith('>')) {
      await message.channel.send(`You need to @ the user you want me to arrest, <@${message.author.id}>!!`);
      return;
    }

    const criminalId = arr[1].slice(2, arr[1].length - 1);
    const crime = arr.slice(2).join(' ');

    if (arrestedUsers.has(criminalId)) {
      await message.channel.send(`They are already in the vegan jail, <@${message.author.id}>!`);
      return;
    }
    arrestedUsers.add(criminalId);

    await message.channel.send(`🚓🚓 WEEOOWEEOOWEEOO 🚓🚓
🔫👮🌾  THIS IS VEGAN POLICE🔫👮🍃
🌼 <@${criminalId}>, YOU ARE UNDER ARREST! 😤⛓️
🌷 You are accused of the following crime: ${crime} 🌱
🌳👨‍⚖️ <#${courtChannel.id}> will decide your fate! 👩🏼‍⚖️🍀`);

    const courtMessage = await courtChannel.send(`<@${criminalId}> has been accused of "${crime}" by <@${message.author.id}> in <#${message.channel.id}>!
<:${guiltyEmoji.name}:${guiltyEmoji.id}> if you think they should be punished, <:${notGuiltyEmoji.name}:${notGuiltyEmoji.id}> if not!'
You have ${VOTING_TIME} seconds to vote!`);
    const guiltyPlaceholderReaction = await courtMessage.react(guiltyEmoji);
    const notGuiltyPlaceholderReaction = await courtMessage.react(notGuiltyEmoji);
    setTimeout(async () => {
      const guiltyCount = courtMessage.reactions.get(`${guiltyEmoji.name}:${guiltyEmoji.id}`).count - 1;
      const notGuiltyCount = courtMessage.reactions.get(`${notGuiltyEmoji.name}:${notGuiltyEmoji.id}`).count - 1;
      await guiltyPlaceholderReaction.remove();
      await notGuiltyPlaceholderReaction.remove();
      if (notGuiltyCount >= guiltyCount) {
        courtChannel.send(`The voting is over, result: ${guiltyCount}:${notGuiltyCount}. You're free to go!`);
        return;
      }
      let criminalGm = message.guild.members.get(criminalId.replace(/\!/g, '')) || message.guild.owner;
      criminalGm.addRole(jailedRole, crime);
      courtChannel.send(`The voting is over, result: ${guiltyCount}:${notGuiltyCount}. <@${criminalId}>, you are going to the vegan jail and will be unable to gain xp for ${JAIL_TIME} minutes!`);
      setTimeout(() => {
        arrestedUsers.delete(criminalId);
        courtChannel.send(`<@${criminalId}>, you did your time, you're free to go now!`);
        criminalGm.removeRole(jailedRole, `Punishment for "${crime}" ended`);
      }, JAIL_TIME * 60 * 1000)
    }, VOTING_TIME * 1000);
    return;
  }

  const offIndex = message.content.toLowerCase().indexOf('officer');
  if (offIndex > 0) {
    message.channel.send(`${message.content.slice(0, offIndex - 1)} citizen`);
    return;
  }

  if (message.content.toLowerCase().includes('vegan police')) {
    message.channel.send(`Usage:
arrest @Criminal Reason for arrest
Example:
arrest <@${message.author.id}> Dating omni
`);
    return;
  }
});

client.login(config.token);