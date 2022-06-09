/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you would like to share the WorldEdit Addon, be sure to share one of these pages:
 *  https://mcpedl.com/worldedit-addon-1/
 *  https://link-center.net/351352/worldedit-addon
 */
import { Commands } from "./Commands.js";
import { EditSession } from "./EditSession.js";

export class EditSettings {
    static players = [];
    static get(player) {
        if (this.players.map(x => x.player.name == player.name).indexOf(true) == -1) {
            this.players.push(new EditSettings(player));
        }
        return this.players[this.players.map(x => x.player.name == player.name).indexOf(true)];
    }
    constructor(player) {
        this.player = player;
        this.toggle_history = true;
        this.history_size = 15;
        this.limit = -1;
    }
    setToggleHistory(toggle_history = undefined) {
        if (toggle_history == undefined) {
            this.toggle_history = this.toggle_history ? false : true;
            Commands.tell(this.player, `Toggle history set to ${this.toggle_history}.`);
        }
        else {
            if (Commands.isBoolean(toggle_history)) {
                this.toggle_history = Commands.Boolean(toggle_history);
                Commands.tell(this.player, `Toggle history set to ${this.toggle_history}.`);
            }
            else {
                Commands.error(this.player, `For input string: \\"${toggle_history}\\", acceptable values are any boolean`);
            }
        }
    }
    setHistorySize(history_size = undefined) {
        if (history_size == undefined) {
            this.history_size = 15;
            EditSession.get(this.player.name).size(this.history_size);
            Commands.tell(this.player, `History size set to ${this.history_size}.`);
        }
        else {
            if (Commands.isInteger(history_size)) {
                history_size = Number(history_size);
                this.history_size = history_size < 0 ? 0 : history_size;
                EditSession.get(this.player.name).size(this.history_size);
                Commands.tell(this.player, `History size set to ${this.history_size}.`);
            }
            else {
                Commands.error(this.player, `For input string: \\"${history_size}\\", acceptable values are any integer`);
            }
        }
    }
    setLimit(limit = undefined) {
        if (limit == undefined) {
            this.limit = -1;
            Commands.tell(this.player, `Block change limit set to ${this.limit}.`);
        }
        else {
            if (Commands.isInteger(limit)) {
                limit = Number(limit);
                this.limit = limit < 0 ? -1 : limit;
                Commands.tell(this.player, `Block change limit set to ${this.limit}.`);
            }
            else {
                Commands.error(this.player, `For input string: \\"${limit}\\", acceptable values are any integer`);
            }
        }
    }
}