import { Server, ServerTweet, Tweet } from "./mongodb.ts";
import { Twitter } from "./twitter.ts";
import { DiscordenoMessage } from "../deps.ts";

/**
 * @param { Client } client
 * @param { String } command
 * @param { Config } Config
 * @param { Message } message
 */
async function executeCommand(command: string, message: DiscordenoMessage) {
    const serverTest = await Server.where("guild_id", String(message.guildId))
        .first();

    if (!serverTest) {
        await Server.create([{
            guild_id: String(message.guildId),
        }]);
    }

    const server = await Server.where("guild_id", String(message.guildId))
        .first();

    switch (command) {
        case "setNewsChannel": {
            if (server["news_channel"] == String(message.channelId)) {
                message.reply("This channel is already the News Channel !");
                break;
            }
            if (server["reminder_channel"] == String(message.channelId)) {
                message.reply(
                    "This channel is already the Reminder Channel, choose another Text Channel !",
                );
                break;
            }
            Server.where("guild_id", String(message.guildId)).update({
                news_channel: String(message.channelId),
            });
            message.reply("This channel is now set as the News Channel !");
            break;
        }

        case "setReminderChannel": {
            if (server["reminder_channel"] == String(message.channelId)) {
                message.reply("This channel is already the Reminder Channel !");
                break;
            }
            if (server["news_channel"] == String(message.channelId)) {
                message.reply(
                    "This channel is already the News Channel, choose another Text Channel !",
                );
                break;
            }
            Server.where("guild_id", String(message.guildId)).update({
                reminder_channel: String(message.channelId),
            });
            message.reply("This channel is now set as the Reminder Channel !");
            break;
        }

        case "addTwitterAccount": {
            if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
                message.reply("This is not a twitter username.");
                break;
            }

            if (!server["news_channel"]) {
                message.reply(
                    "Please set News channel first with command ``!dv setNewsChannel`` !",
                );
                break;
            }

            Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
                if (json["errors"]) {

                    return;
                }

                if ((await Server.tweets(String(message.guildId))).find(m => m["user_id"] == json["data"]["id"])) {
                    message.reply("This account is already tracked !");
                    return;
                }


                Twitter.getUserTweets(json["data"]["id"]).then(async (res) => {
                    if (res["errors"]) {
                        message.reply("This Account is invalid.");
                        return;
                    }

                    if (await Tweet.where("user_id", json["data"]["id"]).count() === 0) {
                        Tweet.create([{
                            user_id: json["data"]["id"],
                        }]);
                    }

                    ServerTweet.create([{
                        serverId: String(message.guildId),
                        tweetId: String(json["data"]["id"]),
                    }]);

                    message.reply(
                        `Account @${json["data"]["username"]} is now tracked !`,
                    );
                });
            });
            break;
        }

        case "removeTwitterAccount": {
            if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)) {
                message.reply("This is not a twitter username.");
                break;
            }

            Twitter.getUserId(message.content.split(" ")[2]).then(async (json) => {
                if (
                    !(await Server.tweets(String(message.guildId))).find(c => c["user_id"] === json["data"]["id"])
                ) {
                    message.reply("This account isn't tracked !");
                    return;
                }


                ServerTweet.where({
                    serverId: String(message.guildId),
                    tweetId: String(json["data"]["id"]),
                }).delete()

                if (await ServerTweet.where("tweetId", json["data"]["id"]).count() === 0) {
                    Tweet.where("user_id", json["data"]["id"]).delete();
                }

                message.reply(
                    `Account @${json["data"]["username"]} is no longer tracked !`,
                );
            });

            break;
        }

        case "help": {
            message.reply(
                " Here are the commands !\
            ```• !dv help : Displays available commands.\n\
\n\
• !dv setNewsChannel : Set current channel as the News Channel.\n\
\n\
• !dv addTwitterAccount [twitterAccount] : Add twitterAccount to track list.\n\
\n\
• !dv removeTwitterAccount [twitterAccount] : Remove twitter Account from track list.```\
",
            );
            break;
        }

        default:
    }
}

export { executeCommand as Commands };