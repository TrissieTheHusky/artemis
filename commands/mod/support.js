//start modules
const npm = require("../../modules/NPM.js");
npm.npm();

//load database
dbinit = require("../../modules/dbinit.js");
dbinit.dbinit();

//start
module.exports = {
  category: `mod`,
  name: "support",
  description: "[mod] Set a support channel",
  explain: `This command allows you to view, modify and answer support tickets.\n
  \`support view CaseNUM\` will show you the support ticket linked to this number.\n
  \`support answer caseNUM\` will add your answer to the ticket number, everything that comes after this command in the same message will count as an answer.\n
  \`support user @mention\` will show the last 25 tickets of a user.\n
  \`support user userID\` will show the last 25 tickets of a user.\n
  \`support search kde\` //No filter\n
  \`support search --a kde\` //Answered only cases\n
  \`support search --u kde\` //Unanswered only cases`,
  execute(message) {
    //load prefix
    const prefixstart = getGuild.get(message.guild.id);
    const prefix = prefixstart.prefix;

    //Usage
    usage = getUsage.get("support");
    usage.number++;
    setUsage.run(usage);

    //build args
    const args = message.content.slice(prefix.length + 8).split(" ");

    //If no args
    if (!args[0]) {
      return message.reply(
        "Simply type `help` to start a session if you are in a support channel\n" +
          "Then write `done` when you received the help!\n" +
          "To resume a session write `resume caseNum`\n" +
          "To fill out a proper answer for the case use:\n`" +
          prefix +
          "support answer caseNum <answer>`"
      );
    }

    //search
    if (args[0].toLowerCase() == "search") {
      //def user
      let user = message.guild.members.cache.get(message.author.id);

      //init db
      let searchCase = db.prepare("SELECT * FROM supcase;").all();

      //form array
      let supCaseArray = [];

      //Search db
      for (let i of searchCase) {
        //first switch case
        switch (args[1].toLowerCase()) {
          //if answered
          case "--a":
            //define args
            let sargs1 = message.content
              .toLowerCase()
              .slice(prefix.length + 19);

            //if args match question
            if (
              i.question
                .toLowerCase()
                .includes(sargs1.toLowerCase().slice(2)) &&
              i.answer !== "None given"
            )
              supCaseArray.push(
                `Support case: ${i.scase}\n${i.question.slice(0, 250)}`
              );
            break;

          //if unanswered
          case "--u":
            //define args
            let sargs2 = message.content
              .toLowerCase()
              .slice(prefix.length + 19);

            //if args match question
            if (
              i.question
                .toLowerCase()
                .includes(sargs2.toLowerCase().slice(2)) &&
              i.answer == "None given"
            )
              supCaseArray.push(
                `Support case: ${i.scase}\n${i.question.slice(0, 250)}`
              );
            break;

          //if default
          default:
            //define args
            let sargs3 = message.content
              .toLowerCase()
              .slice(prefix.length + 15);

            //if args match question
            if (
              i.question.toLowerCase().includes(sargs3.toLowerCase().slice(2))
            )
              supCaseArray.push(
                `Support case: ${i.scase}\n${i.question.slice(0, 250)}`
              );
        }
      }

      //build embed
      const embed = new Discord.MessageEmbed()
        .setTitle(`Searching support database`)
        .setAuthor(
          user.user.username + "#" + user.user.discriminator,
          user.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          })
        )
        .setDescription(`Use ${prefix}support view CaseNum`)
        .setColor("RANDOM")
        .setTimestamp();

      //if array is empty
      if (supCaseArray < 1)
        embed.addField(
          "No cases found!",
          "None of the cases in the database matched your search!"
        );

      //counter
      let counter = 0;

      //loop array
      for (let i of supCaseArray) {
        //upp counter
        counter++;

        //if counter is not 10
        if (counter < 11) {
          //add Field
          embed.addField("Found: ", i);
        }
      }

      //send embed
      return message.reply({
        embed: embed,
      });
    }

    //Answer
    if (args[0].toLowerCase() == "answer") {
      //get the case entry
      let prevCaseGet = getSupCase.get(args[1]);

      //if no entry
      if (!prevCaseGet) return message.reply("Invalid case number.");

      //run answer
      prevCaseGet.solveby = message.author.id;
      prevCaseGet.answer = args.slice(2).join(" ");
      setSupCase.run(prevCaseGet);

      //reply
      return message.reply("Answer submitted!");
    }

    //edit question
    //Answer
    if (args[0].toLowerCase() == "question") {
      //get the case entry
      let prevCaseGet = getSupCase.get(args[1]);

      //if no entry
      if (!prevCaseGet) return message.reply("Invalid case number.");

      //run answer
      prevCaseGet.question = args.slice(2).join(" ");
      setSupCase.run(prevCaseGet);

      //reply
      return message.reply("Question altered!");
    }

    //View user
    if (args[0].toLowerCase() == "user") {
      //redefine args
      let sargs = message.content.slice(prefix.length + 13).split(" ");

      //form user
      if (!sargs[0]) {
        var user = message.guild.members.cache.get(message.author.id);
      }
      if (message.guild.members.cache.get(sargs[0])) {
        var user = message.guild.members.cache.get(sargs[0]);
      }
      if (sargs[0].startsWith("<@") && sargs[0].endsWith(">")) {
        var user = message.guild.members.cache.get(
          message.mentions.users.first().id
        );
      }

      //get cases by user
      let casesGet = db
        .prepare("SELECT * FROM supcase WHERE askby = ? LIMIT 25;")
        .all(user.user.id);

      //build embed
      const supTic5 = new Discord.MessageEmbed()
        .setTitle(`Viewing past cases for ${user.user.username}`)
        .setAuthor(
          user.user.username + "#" + user.user.discriminator,
          user.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          })
        )
        .setDescription("Use " + prefix + "support view CaseNum")
        .setColor("RANDOM")
        .setTimestamp();

      //loop trough data
      for (let data of casesGet) {
        let q = data.question.toString();
        supTic5.addField(
          "Case number: " + data.scase,
          "Question: " + q.slice(0, 20)
        );
      }

      //send embed
      return message.reply({
        embed: supTic5,
      });
    }

    //view
    if (args[0].toLowerCase() == "view") {
      //get the case entry
      let prevCaseGet = getSupCase.get(args[1]);

      //if no entry
      if (!prevCaseGet) return message.reply("Invalid case number.");

      //define user
      var user = message.guild.members.cache.get(prevCaseGet.askby);

      //if no user
      if (!user) var user = message.guild.members.cache.get(message.author.id);

      //define answer
      var question = prevCaseGet.question;

      //if no answer
      if (question.length < 4)
        var question = "The user opened an empty support ticket, sorry";

      const supTic4 = new Discord.MessageEmbed()
        .setTitle("Support case: " + prevCaseGet.scase)
        .setAuthor(
          user.user.username + "#" + user.user.discriminator,
          user.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          })
        )
        .setDescription("Viewing case")
        .addField("Asked by: ", `${user}`)
        .addField("Context link: ", prevCaseGet.murl)
        .addField("Question: ", question.slice(0, 1000))
        .addField("\u200b", "\u200b")
        .addField("Answer: ", prevCaseGet.answer)
        .setColor("RANDOM")
        .setTimestamp();

      //send support embed
      return message.reply({
        embed: supTic4,
      });
    }

    //reject non mods after this point
    if (!message.member.permissions.has("KICK_MEMBERS")) return;

    //add or delete support channel
    if (args[0].toLowerCase() == "set") {
      let cCheck = getSupport.get(message.channel.id, message.guild.id);
      if (!cCheck) {
        cCheck = {
          cid: message.channel.id,
          gid: message.guild.id,
          inuse: `0`,
          casenumber: `0`,
          mainchan: message.channel.parent.id,
          inusechan: message.channel.parent.id,
        };
        setSupport.run(cCheck);
        return message.reply(
          `Added: ${message.channel} to the support channel list!`
        );
      } else {
        db.prepare(
          `DELETE FROM support WHERE cid = '${message.channel.id}' AND gid = '${message.guild.id}'`
        ).run();
        return message.reply(
          `Removed: ${message.channel} from the support channel list!`
        );
      }
    }

    //Load support channels available in guild
    const supC = db
      .prepare("SELECT * FROM support WHERE gid = ?;")
      .all(message.guild.id);
    let array2 = [];
    for (const data of supC) {
      array2.push(
        message.guild.channels.cache.find((channel) => channel.id === data.cid)
      );
    }
    const embed = new Discord.MessageEmbed()
      .setTitle("Current support channels")
      .setColor("RANDOM")
      .setDescription(
        "usage:\n" +
          "Use in channel you want assigned/removed as support channel\n" +
          prefix +
          "support set" +
          "\n\nUse in support channel when support is done\n`done`"
      )
      .addField("Support channels of this server: ", array2.join("\n"));
    return message.channel.send({
      embed,
    });

    //next
  },
};
