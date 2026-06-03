const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const config = require("./config.json");

let coins = require("./coins.json") || {};
let projects = require("./projects.json") || [];

// ================= SAVE =================
function saveCoins() {
    fs.writeFileSync("./coins.json", JSON.stringify(coins, null, 2));
}

function saveProjects() {
    fs.writeFileSync("./projects.json", JSON.stringify(projects, null, 2));
}

function getCoins(id) {
    if (!coins[id]) coins[id] = 0;
    return coins[id];
}

// ================= READY =================
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMANDS =================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(" ");
    const cmd = args.shift().toLowerCase();

    // 💰 رصيد
    if (cmd === "رصيدي") {
        return message.reply(`💰 رصيدك: ${getCoins(message.author.id)} Coin`);
    }

    // 🔁 تحويل
    if (cmd === "تحويل") {
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!user || !amount) return message.reply("❌ !تحويل @user عدد");
        if (getCoins(message.author.id) < amount) return message.reply("❌ رصيدك غير كافي");

        coins[message.author.id] -= amount;
        coins[user.id] = getCoins(user.id) + amount;
        saveCoins();

        return message.reply(`✅ تم تحويل ${amount} Coin`);
    }

    // ➕ إضافة كوين
    if (cmd === "addcoins") {
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!user || !amount) return message.reply("❌ !addcoins @user 100");

        coins[user.id] = getCoins(user.id) + amount;
        saveCoins();

        return message.reply(`💰 تم إضافة ${amount} Coin`);
    }

    // 🏆 top
    if (cmd === "top") {
        const sorted = Object.entries(coins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let text = "🏆 Top:\n\n";

        sorted.forEach((u, i) => {
            text += `#${i + 1} <@${u[0]}> ➜ ${u[1]} Coin\n`;
        });

        return message.reply(text);
    }

    // 📦 add project
    if (cmd === "addproject") {
        const name = args[0];
        const price = parseInt(args[1]);
        const link = args.slice(2).join(" ");

        if (!name || !price || !link)
            return message.reply("❌ !addproject name price link");

        projects.push({ name, price, link });
        saveProjects();

        return message.reply("✅ تم إضافة المشروع");
    }

    // 📦 projects
    if (cmd === "projects") {
        if (projects.length === 0)
            return message.reply("❌ لا يوجد مشاريع");

        let text = "📦 المشاريع:\n\n";

        projects.forEach((p, i) => {
            text += `#${i + 1} ${p.name}\n💰 ${p.price}\n🔗 ${p.link}\n\n`;
        });

        return message.reply(text);
    }

    // 🛒 buy project
    if (cmd === "buyproject") {
        const name = args.join(" ");
        const project = projects.find(p => p.name === name);

        if (!project) return message.reply("❌ غير موجود");
        if (getCoins(message.author.id) < project.price)
            return message.reply("❌ رصيدك غير كافي");

        coins[message.author.id] -= project.price;
        saveCoins();

        return message.reply(`✅ اشتريت: ${project.name}\n${project.link}`);
    }

    // 📌 help
    if (cmd === "help") {
        return message.reply(`
!رصيدي
!تحويل @user عدد
!addcoins @user عدد
!top
!projects
!addproject name price link
!buyproject name
        `);
    }
});

client.login(config.token);
