import './deps.ts'
import { Twitter } from "./modules/twitter.ts";
import { Tweet } from "./modules/mongodb.ts";
import { editBotStatus, startBot, sendMessage, cron } from "./deps.ts";
import { Commands } from "./modules/commands.ts";
import { updateDailyInfos } from "./modules/daily/dailyInfos.ts"
import { dailyEvents } from "./modules/daily/dailyEvents.ts"


/**
 * Checks if there is tweets to send, and if so, send them
 */
async function checkTweets() {
	// Gets every twitter accounts in the database
	const Tweets: Tweet[] = await Tweet.all();

	// Itterate over every tweets
	Tweets.forEach((tweet: Tweet) => {
		// If an error has occured, skip
		if (tweet["errors"]) return;

		// Gets updated tweet
		Twitter.getUserTweets(String(tweet["user_id"])).then((json) => {

			// If an error has occured skip
			if (json["errors"]) return;

			// If the latest tweet is already the latest sent, skip
			if (json["data"][0]["id"] == tweet["tweet_id"]) {
				return;
			}

			// Update Tweet object with the latest tweet id
			Tweet.where("user_id", String(tweet["user_id"])).update({
				tweet_id: json["data"][0]["id"],
				tweet_text: json["data"][0]["text"],
			});


			// Gets all servers that uses this tweet
			Tweet.servers(json["data"]["id"]).then((serverList) => {
				// Itterate over all servers
				serverList.forEach(server => {
					// Send tweet in news channel
					Twitter.getUsername(String(tweet["user_id"])).then((userJSON) => {
						postMessage(
							String(server["news_channel"]),
							`https://twitter.com/${userJSON["data"]["username"]}/status/${json["data"][0]["id"]}`,
						);
					});
				});
			})
		});
	});
}

/**
 * Easy wrapper to send a message in a channel
 * @param channelId Channel where you want to send the message
 * @param message Message you wanna send
 */
function postMessage(channelId: string, message: string) {
	sendMessage(BigInt(channelId), message);
}

/**
 * Start function for the bot 
 */
function start() {
	// Tweets
	checkTweets();
	cron("0/15 * * * *", ()=>{checkTweets()});

	// Tweets
	dailyEvents.getEventsData();
	cron("0 0/1 * * *", ()=> {
		dailyEvents.getEventsData();
	})

	// Embed Messages Infos
	updateDailyInfos();
	cron("* * * * *", ()=>{updateDailyInfos()});
}


startBot({
	token: Deno.env.get("DISCORD_TOKEN") || "",
	intents: ["Guilds", "GuildMessages", "GuildEmojis"],

	eventHandlers: {
		// What happens when connected to discord
		ready() {
			console.log("Bot Ready");
			editBotStatus({
				status: "online",
				activities: [{
					name: "!dv help",
					createdAt: 0,
					type: 0,
				}],
			});
			start();
		},

		// When a message is created
		messageCreate(message) {
			if (message.content.startsWith("!dv")) {
				const args = message.content.split(" ");
				Commands(args[1], message);
			}
		},
	},
});