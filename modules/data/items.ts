import { AsyncFunction } from "../../deps.ts";

interface ItemType {
  id: string;
  name: string;
  day?: [string];
  rarity?: number;
  parent?: string;
}

interface ItemsType {
  [id: string]: ItemType;
}

class ItemClass {
  private itemList: ItemsType = {};

  async initItems() {
    this.itemList = await new AsyncFunction(
      (await (await fetch(
        "https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/itemList.js",
      )).text()).replace("export const itemList =", "return"),
    )();
  }

  getItems() {
    return this.itemList;
  }
  getItem(id: string) {
    return this.itemList[id];
  }
}

const itemClass = new ItemClass();

export { itemClass };
export type { ItemsType, ItemType };
