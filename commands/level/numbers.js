//Load modules
const npm = require("../../modules/NPM.js");
npm.npm();

//load database
dbinit = require("../../modules/dbinit.js");
dbinit.dbinit();

//start
module.exports = {
  category: `level`,
  name: "numbers",
  description: "[level] Display role sizes",
  explain: `This command displays all self-asignable roles alongside their sizes.`,
  execute(message) {
    //build prefix
    const prefixstart = getGuild.get(message.guild.id);
    const prefix = prefixstart.prefix;

    //update usage
    usage = getUsage.get("numbers");
    usage.number++;
    setUsage.run(usage);

    //pull roles from database
    const allroles = db
      .prepare("SELECT * FROM roles WHERE guild = ?;")
      .all(message.guild.id);

    //pull all roles from guild
    let array = message.guild.roles.cache
      .sort((a, b) => a.position - b.position)
      .map((role) => role);

    //array
    let array2 = [];

    //empty stuff
    let str = "";

    //loop trough database roles
    for (const data of allroles) {
      //push into array2
      array2.push(data.roles);
    }

    //loop trough array
    for (let i of array) {
      //if role from database matches guild
      if (array2.includes(i.id))
        //push into empty string
        str +=
          `${message.guild.roles.cache.find((r) => r.name === i.name)}` +
          ": " +
          message.guild.roles.cache.find((r) => r.name === i.name).members
            .size +
          "\n";
    }

    //form embed
    const embed = new Discord.MessageEmbed()
      .setTitle("Role Sizes")
      .setColor("RANDOM")
      .addField("Roles", `${str}`);

    //send embed
    message.channel.send({
      embed,
    });
  },
};
