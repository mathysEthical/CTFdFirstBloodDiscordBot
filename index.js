let fs=require("fs")
let fetch=require("node-fetch")
require("dotenv").config()
let { Client, GatewayIntentBits,EmbedBuilder } = require('discord.js');

let {SESSION_COOKIE,BOT_TOKEN,API_BASE,CHANNEL_ID}=process.env

let db=JSON.parse(fs.readFileSync("db.json","utf-8"))

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function updateDb(){
    fs.writeFileSync("db.json",JSON.stringify(db,null,2),"utf-8")
}

async function getChallenges(){
    let res=await (await fetch(API_BASE+"/challenges",{
        headers:{
            cookie: "session="+SESSION_COOKIE
        }
    })).json()
    return res.data
}

async function getChallengeSolves(challenge_id){
    let endpoint=`/challenges/${challenge_id}/solves`
    let res=await (await fetch(API_BASE+endpoint,{
        headers:{
            cookie: "session="+SESSION_COOKIE
        }
    })).json()
    return res.data
}

async function firstBlood(challengeId,challengeName, userName, solveDate){
    if(typeof(db.bloods[challengeId])=="undefined"){
        db.bloods[challengeId]={
            "userName": userName,
            "solveDate": solveDate
        }
        updateDb()   
        const bloodEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🩸First Blood !🩸')
        .setDescription(`**Challenge**: ${challengeName}\n**Joueur**: ${userName}\n**Date**: ${solveDate}`)
        .setThumbnail('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F020%2F967%2F309%2Foriginal%2Fred-blood-icon-free-png.png&f=1&nofb=1&ipt=b92e614f7e838052facbe66da7efe3cc7ce8c3750915885b938f00321d8c0c7a&ipo=images')
        
        let bloodMessage=await bloodChannel.send({ embeds: [bloodEmbed] });
        await bloodMessage.react("🩸")
    }
}

let bloodChannel ;

async function checkNewFirstBlood(){
    let challenges=await getChallenges()
    challenges.forEach(async challenge => {
        let solves=await getChallengeSolves(challenge.id)
        if(solves.length>0){
            firstBlood(challenge.id,challenge.name, solves[0].name,solves[0].date)
        }
    });
}

client.on('ready', async() => {
    console.log(`Logged in as ${client.user.tag}!`);
    bloodChannel=await client.channels.fetch(CHANNEL_ID)
    checkNewFirstBlood()
});

setInterval(async() => {
    checkNewFirstBlood()
}, 10*1000);

client.login(BOT_TOKEN);
