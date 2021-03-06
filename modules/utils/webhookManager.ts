import {
  Client,
  Embed,
  fetchAuto,
  Message,
  RESTEndpoints,
  RESTManager,
  TextChannel,
  User,
  UserPayload,
  Webhook,
  WebhookPayload,
} from "../../deps.ts";

class WebHookManagerClass {
  static restEndpoints: RESTEndpoints;
  static manager: RESTManager;
  static client: Client;

  create(client: Client) {
    WebHookManagerClass.manager = new RESTManager({
      token: Deno.env.get("DISCORD_TOKEN"),
      client: client,
      version: 8,
    });
    WebHookManagerClass.restEndpoints = new RESTEndpoints(
      WebHookManagerClass.manager,
    );
    WebHookManagerClass.client = client;
  }

  async getMessage(channelID: string, messageID: string) {
    const messagePayload = await WebHookManagerClass.restEndpoints
      .getChannelMessage(channelID, messageID).catch((e) => console.error(e));

    const textChannel = await WebHookManagerClass.client.channels.get(channelID).catch((e)=>console.error(e));

    if (!messagePayload || !textChannel) return null;

    return new Message(
      WebHookManagerClass.client,
      messagePayload,
      <TextChannel> textChannel,
      new User(WebHookManagerClass.client, messagePayload.author),
    );
  }

  async createChannelWebhook(
    channelID: string,
  ): Promise<WebhookPayload | undefined> {
    const avatarData = await fetchAuto(
      <string> WebHookManagerClass.client.user?.avatarURL(),
    ).catch((e) => console.error(e));

    const webhook = await this.getWebhookPayload(channelID).catch((e) =>
      console.error(e)
    );
    if (webhook == undefined) {
      return WebHookManagerClass.restEndpoints.createWebhook(channelID, {
        name: WebHookManagerClass.client.user?.username,
        avatar: avatarData ? avatarData : undefined,
      }).catch((e) => {
        console.error(e);
        return undefined;
      });
    }

    return webhook;
  }

  async getWebhookPayload(
    channelID: string,
  ): Promise<WebhookPayload | undefined> {
    const webhooks = await WebHookManagerClass.restEndpoints.getChannelWebhooks(
      channelID,
    ).catch((e) => console.error(e));
    if (webhooks == undefined) return;
    const webhookPayload = webhooks.find((c) =>
      c.user?.username == WebHookManagerClass.client.user?.username
    );

    return webhookPayload;
  }

  async sendWebhookMessage(
    channelID: string,
    embeds: Embed[],
  ): Promise<{ message?: Message; success: boolean }> {
    const webhookPayload = await this.getWebhookPayload(channelID).catch((e) =>
      console.error(e)
    );
    if (!webhookPayload) return { success: false };
    const message = await new Webhook(webhookPayload).send({
      embeds: embeds,
    }).catch((e) => console.error(e));
    return {
      message: message ? message : undefined,
      success: message ? true : false,
    };
  }

  async editWebhookMessage(
    message: Message,
    channelID: string,
    embeds: Embed[],
  ): Promise<{ success: boolean }> {
    const webhookPayload = await this.getWebhookPayload(channelID).catch((e) =>
      console.error(e)
    );
    if (!webhookPayload) return { success: false };
    WebHookManagerClass.restEndpoints.editWebhookMessage(
      webhookPayload.id,
      <string> webhookPayload.token,
      message.id,
      {
        embeds: embeds,
      },
    ).catch((e) => console.error(e));
    return { success: true };
  }

  async getWebhookMessage(channelID: string, messageID: string) {
    const message = await WebHookManagerClass.restEndpoints.getChannelMessage(
      channelID,
      messageID,
    ).catch((e) => {console.error(e); return undefined});

    const textChannel = await WebHookManagerClass.client.channels.get(channelID)
      .catch((e) => console.error(e));

    const webhookPayload = await this.getWebhookPayload(channelID).catch((e) =>
      console.error(e)
    );

    if (message && textChannel && webhookPayload) {
      return new Message(
        WebHookManagerClass.client,
        message,
        <TextChannel> textChannel,
        new User(
          WebHookManagerClass.client,
          <UserPayload> (<WebhookPayload> webhookPayload)?.user,
        ),
      );
    } else {
      throw new Error();
    }
  }
}

const webHookManager = new WebHookManagerClass();
export { webHookManager };
