#!/usr/bin/env node

require("dotenv").config();

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("db.sqlite",err=>{
  if (err) {
    console.log("Can't open database",err);
  } else {
    console.log("connected to db");;
  }
});


const Discord = require("discord.js")
const client = new Discord.Client();

client.on("ready", ()=>{
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN)


client.on("message", msg=>{
  console.log(msg.content);
  if (msg.content.startsWith(process.env.PREFIX)){
    //msg.delete();
    //msg.reply("pong");
    var command = msg.content.split(" ");
    var serverid = msg.guild.id || 0;
    if (!serverid) {
      console.log("no server id");
      return;
    }
    console.log(command);
    switch (command[1]){
      case "set":
        var name = command[2];
        var tags = command[3];
        command.splice(0,4);
        var text = command.join(" ");
        console.log("setting new entry",name,text);
        db.all("SELECT * FROM `data` WHERE `server` = ? AND `name` LIKE ?",[serverid,name],( err, result)=>{
          if (err) {
            console.log(err);
            return;
          } else {
            console.log("dbresult",result);
            if (result.length > 0) {
              msg.reply(`Eintrag existiert bereits: ${result[0].data}`);
            } else {
              db.run("INSERT INTO `data`(`name`,`data`, `tags`,`author`,`server`) VALUES (?,?,?,?,?)",[name,text,tags,msg.author.username,serverid],err=>{
                if (err === null) {
                  msg.reply("ERFOLG! 42 Punkte!");
                  return;
                } else {
                  console.log("error inserting element into db",err);
                  msg.reply("Fehler beim schreiben. Schade schokolade.");
                }
              })
            }
          }
        });
        break;

      case "del":
        var name = command[2];
        console.log("deleting entry",name);
        db.run("DELETE FROM `data` WHERE `name` LIKE ? AND `server` = ?",[name,serverid],err=>{
          if (err === null) {
            msg.reply("ERFOLG! 100 Punkte!");
            return;
          } else {
            console.log("error deleting element from db",err);
            msg.reply("Fehler beim Löschen. Schade schokolade.");
          }
        });
        break;

      case "get":
        var name = command[2];
        console.log("getting faq entry from db",name);
        db.all("SELECT * FROM `data` WHERE `name` LIKE ? AND `server` = ?",[name,serverid],(err,result) => {
          if (err) {
            msg.reply("Fehler beim holen aus der Datenbank");
            console.log("error running database statement");
            return
          } else {
            if (result.length > 0) {
              console.log("got data",result);
              if (!result[0].tags) result[0].tags = "-";
              var reply = new Discord.MessageEmbed().setColor("#0099ff")
                .setTitle(`FAQ: ${result[0].name}`)
                .setAuthor(`Autor: ${result[0].author}`)
                .addField("Text:",result[0].data)
                .addField("Tags:",result[0].tags)
                .setFooter("FAQ-Bot von Julian Ullrich");
              msg.reply(reply);
	      msg.delete();
            } else {
              msg.reply("Der Eintrag existiert leider nicht *sad bot noise*");
            }
          }
        });
        break;

      case "find":
        var query = command[2];
        console.log("searching for entry with name or tags",query);
        db.all("SELECT * FROM `data` WHERE `name` LIKE ? OR `tags` LIKE ? AND `server` = ?",[`%${query}%`,`%${query}%`,serverid],(err,result) => {
          if (err) {
            console.log("error searching database",err);
            msg.reply("Fehler beim durchsuchen der Datenbank :(");
          } else {
              var reply = new Discord.MessageEmbed().setColor("#0099ff")
                .setTitle(`FAQ-Suche: ${query}`)
                .setFooter("FAQ-Bot von Julian Ullrich");
              var response = [];
              if (result.length > 0){
                //reply.addField("Name","Tags");
                result.forEach(e=>{
                  //reply.addField(e.name,(e.tags)?e.tags:"-",true);
                  response.push(`\`${e.name} - ${e.tags}\``);
                })
                reply.addField("Ergebnis:",response.join("\n"));
              } else {
                reply.addField("Suche:","Keine passenden Einträge gefunden. Schade :(");
              }

              msg.reply(reply);

          }
        });
        break;

      case "list":
        console.log("listing all entried for server");

        db.all("SELECT * FROM `data` WHERE `server` = ?",[serverid],(err,result) => {
          if (err) {
            console.log("error searching database",err);
            msg.reply("Fehler beim durchsuchen der Datenbank :(");
          } else {
              var reply = new Discord.MessageEmbed().setColor("#0099ff")
                .setTitle(`FAQ-Liste:`)
                .setFooter("FAQ-Bot von Julian Ullrich");
              var response = [];
              if (result.length > 0){
                //reply.addField("Name","Tags");
                result.forEach(e=>{
                  //reply.addField(e.name,(e.tags)?e.tags:"-",true);
                  response.push(`\`${e.name} - ${e.tags}\``);
                })
                reply.addField("Ergebnis:",response.join("\n"));
              } else {
                reply.addField("Suche:","Keine passenden Einträge gefunden. Schade :(");
              }

              msg.reply(reply);

          }
        });
        break;

      case "leaderboard":
	console.log("getting leaderboard");
	db.all("SELECT * FROM `data` WHERE `server` = ?",[serverid],(err,result) => {
	  if (err) {
	    console.log("error getting data from database",err);
            msg.reply("Fehler beim durchsuchen der Datenbank :(");
          } else {
              var reply = new Discord.MessageEmbed().setColor("#0099ff")
                .setTitle(`FAQ-Leaderboard:`)
                .setFooter("FAQ-Bot von Julian Ullrich");
              var response = [];
              if (result.length > 0){
                //reply.addField("Name","Tags");
		var list = {};
                result.forEach(e=>{
                  //reply.addField(e.name,(e.tags)?e.tags:"-",true);
		  if (!list.hasOwnProperty(e.author)) list[e.author] = 0;
		  list[e.author] += 42;
                })

		for (var n in list) response.push(`\`${n} - ${list[n]}\``);

                reply.addField("Ergebnis:",response.join("\n"));
              } else {
                reply.addField("Suche:","Keine passenden Einträge gefunden. Schade :(");
              }

              msg.reply(reply);

          }
        });
        break;
	    
        
        

      default:
        console.log("sending help");
        var reply = new Discord.MessageEmbed().setColor("#0099ff")
          .setTitle("FAQ-Bot Hilfe")
          .setFooter("FAQ-Bot von Julian Ullrich");

        reply.addFields({name:"Beschreibung",value:"Dieser Bot wurde extra nur für euch geschrieben.\nHiermit könnt ihr FAQ-Einträge speichern, suchen und anzeigen lassen."},
          {name:"Befehle",value:"```!faq set SchönerTitel tag1,tag2,tag3 Schöner Text - Schreibt den FAQ-Eintrag 'SchönerTitel'(ohne Leerzeichen) mit dem Text 'Schöner Text' und den Tags 'tag1,tag2,tag3'\n\n!faq get foo - Gibt den FAQ-Eintrag mit dem Namen 'foo' zurück.\n\n!faq find query - Sucht in allen Namen und Tags nach dem angegebenen Wort (nur ein einzelnes Wort).\n\n!faq list - Gibt eine Liste aller FAQ-Einträge mit ihren Tags aus.\n\n!faq leaderboard - Gibt ein Leaderboard von allen FAQ-Schreibern zurück. Jeder Eintrag bringt 42 Punkte. Warum? Ist halt so.```"});

        msg.reply(reply);
        break;
    }

  }
})

