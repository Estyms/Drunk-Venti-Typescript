import { parseTime, remainingDays } from "../utils/timeRelated.ts"
import { Embed, EmbedField } from "../../deps.ts"

interface eventData {
    currents: eventItem[],
    upcomming: eventItem
}

interface eventItem {
    name: string,
    pos: string,
    image: string,
    start: string,
    end: string,
    zoom: string,
    url: string,
    showOnHome: boolean
}

type eventItems = [[eventItem]]


async function getAllEvents(): Promise<eventItems> {
    // deno-lint-ignore prefer-const
    let allEvents: eventItems | undefined;
    eval("allEvents " + (await (await (await fetch("https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/timeline.js")).text()).replace("export const eventsData", "")));
    allEvents = allEvents as eventItems;
    return allEvents;
}

function getCurrentEventsData(allEvents: eventItem[]): eventItem[] {
    const date = new Date();
    date.setHours(date.getHours() - 4)

    const CurrentEvents = allEvents.filter(event => date > parseTime(event.start) && date < parseTime(event.end))
    CurrentEvents.sort((a, b) => parseTime(a.end).valueOf() - parseTime(b.end).valueOf());
    CurrentEvents.sort((a,b) => (a.url ? 0 : 1) - (b.url ? 0 : 1))
    return CurrentEvents
}

function getUpcommingEvent(allEvents: eventItem[]): eventItem {
    const date = new Date();
    date.setHours(date.getHours() - 4)

    const UpcommingEvents = allEvents.filter(event => date < parseTime(event.start))
    UpcommingEvents.sort((a, b) => parseTime(a.end).valueOf() - parseTime(b.end).valueOf());

    const UpcommingEvent = UpcommingEvents[0]
    return UpcommingEvent;
}

async function getEventsData(): Promise<eventData> {
    const allEvents = await (await getAllEvents()).flat(2)
    const currentEvents = getCurrentEventsData(allEvents);
    const upcommingEvent = getUpcommingEvent(allEvents)

    return { currents: currentEvents, upcomming: upcommingEvent }
}

async function createEmbedEvents(){
    const date = new Date();
    date.setHours(date.getHours() - 4)


    const EventData = await getEventsData();
    const EmbedMessages : Embed[] = [];
    EventData.currents.forEach(event => {
        event.url &&
        EmbedMessages.push({
            title: event.name,
            url: event.url || undefined,
            image: event.image && event.url ? {url:`https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${event.image}`} : undefined,
            description: `${remainingDays(parseTime(event.end))} jour(s) restant`
        })
    });

    const EmbedFields : EmbedField[] = []

    EventData.currents.forEach(event => {
        !event.url &&
        EmbedFields.push({
            name: event.name,
            value: `${remainingDays(parseTime(event.end))} jour(s) restant`
        })
    })

    EmbedMessages.push({
        title: "Autres",
        fields: EmbedFields
    })
    

    EmbedMessages.push({
            title: "BIENTOT : " + EventData.upcomming.name,
            url: EventData.upcomming.url || undefined,
            image: EventData.upcomming.image ? {url:`https://github.com/MadeBaruna/paimon-moe/raw/main/static/images/events/${EventData.upcomming.image}`} : undefined,
            description: `Dans ${remainingDays(parseTime(EventData.upcomming.start))} jour(s)`
    })

    return EmbedMessages;
}

export { getEventsData, createEmbedEvents }