/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you would like to share the WorldEdit Addon, be sure to share one of these pages:
 *  https://mcpedl.com/worldedit-addon-1/
 *  https://link-center.net/351352/worldedit-addon
 */
import { BlockLocation, MinecraftBlockTypes } from "mojang-minecraft";
import { Commands } from "./Commands.js";
import { EditSession } from "./EditSession.js";
import { EditSettings } from "./EditSettings.js";

export class SetBlocks {
    static pattern(pattern) {
        let percentages = []
        let patterns = pattern.split(",");
        for (let i = 0; i < patterns.length; i++) {
            let percentage = patterns[i].match(/(\d+(?:\.\d+)?)%/);
            if (percentage == undefined) {
                percentages.push(1);
            }
            else {
                percentage = percentage[1]
                if (patterns[i].startsWith(percentage)) {
                    patterns[i] = patterns[i].replace(/(\d+(?:\.\d+)?)%/, "");
                    percentages.push(Number(percentage));
                }
                else {
                    percentages.push(1);
                }
            }
            if (patterns[i].indexOf("[") == -1) {
                let blockType = MinecraftBlockTypes.getAllBlockTypes().map(x => x.id).indexOf(patterns[i].indexOf(":") == -1 ? "minecraft:" + patterns[i] : patterns[i]);
                if (blockType == -1) throw `Block name '${patterns[i]}' was not recognized, acceptable values are any pattern`;
                blockType = MinecraftBlockTypes.getAllBlockTypes()[blockType];
                let blockPermutation = blockType.createDefaultBlockPermutation();
                patterns[i] = blockPermutation;
            }
            else {
                if (patterns[i].lastIndexOf("]") == -1) throw `State is missing trailing ']', acceptable values are any pattern`;
                let block = patterns[i].substr(0, patterns[i].indexOf("["));
                if (block.length == 0) throw `Bad state format in ${patterns[i]}, acceptable values are any pattern`;
                let blockType = MinecraftBlockTypes.getAllBlockTypes().map(x => x.id).indexOf(block.indexOf(":") == -1 ? "minecraft:" + block : block);
                if (blockType == -1) throw `Block name '${patterns[i]}' was not recognized, acceptable values are any pattern`;
                blockType = MinecraftBlockTypes.getAllBlockTypes()[blockType];
                let blockPermutation = blockType.createDefaultBlockPermutation();
                let states = patterns[i].substring(patterns[i].indexOf("[") + 1, patterns[i].lastIndexOf("]"));
                states = states.split(";");
                for (let j = 0; j < states.length; j++) {
                    if (states[j].indexOf("=") == -1 || states[j].split("=")[1] == "") throw `Bad state format in ${states[j]}, acceptable values are any pattern`;
                    states[j] = states[j].split("=");
                    let blockProperties = blockPermutation.getAllProperties().map(x => x.name);
                    if (!blockProperties.includes(states[j][0])) throw `Unknown property '${states[j][0]}' for block '${block}'(Properties: ${blockProperties}), acceptable values are any pattern`;
                    let blockProperty = blockPermutation.getProperty(states[j][0]);
                    if (typeof (blockProperty.value) == "boolean") states[j][1] = Commands.Boolean(states[j][1]);
                    if (typeof (blockProperty.value) == "number") states[j][1] = Commands.isInteger(states[j][1]) ? Number(states[j][1]) : states[j][1];
                    if (!blockProperty.validValues.includes(states[j][1])) throw `Unknown value '${states[j][1]}' for property '${states[j][0]}'(Values: ${blockProperty.validValues.join(",")}), acceptable values are any pattern`;
                    blockProperty.value = states[j][1];
                }
                patterns[i] = blockPermutation;
            }
        }
        function block(random = true) {
            if (random) {
                let rate = 0
                for (let percentage = 0; percentage < percentages.length; percentage++) {
                    rate += percentages[percentage];
                    if (Math.random() * percentages.reduce((i, j) => i + j) <= rate) {
                        return patterns[percentage];
                    }
                }
            } else {
                return patterns;
            }
        }
        return block;
    }
    constructor(player) {
        this.player = player;
        this.setblocks = [];
        this.settings = EditSettings.get(player);
        this.toggle_history = this.settings.toggle_history;
        this.limit = this.settings.limit;
    }
    add(setblock) {
        if (this.setblocks.length == this.limit) {
            this.set();
            Commands.error(this.player, `Max blocks change limit reached (${this.limit}).`);
            return true;
        }
        this.setblocks.push(setblock);
        return false;
    }
    set() {
        const player = this.player;
        if (this.toggle_history) {
            const history_block = [];
            const history_undo = [];
            const history_redo = [];
            try {
                for (let i = 0; i < this.setblocks.length; i++) {
                    const block = player.dimension.getBlock(new BlockLocation(this.setblocks[i].x, this.setblocks[i].y, this.setblocks[i].z));
                    const undo = block.permutation.clone();
                    const redo = this.setblocks[i].block.clone();
                    history_block.push(block);
                    history_undo.push(undo);
                    history_redo.push(redo);
                }
            }
            catch (error) {
                Commands.error(player, `A system error occurred while get the block. This error may be cured by turning off history with ${Commands.prefix}togglehistory.`);
                return;
            }
            try {
                for (let i = 0; i < this.setblocks.length; i++) {
                    history_block[i].setPermutation(history_redo[i]);
                }
            }
            catch (error) {
                Commands.error(player, `A system error occurred while change the block. This error may be cured by turning off history with ${Commands.prefix}togglehistory.`);
                return;
            }
            EditSession.get(player.name).add(history_block, history_undo, history_redo);
        }
        else {
            for (let i = 0; i < this.setblocks.length; i++) {
                player.dimension.getBlock(new BlockLocation(this.setblocks[i].x, this.setblocks[i].y, this.setblocks[i].z)).setPermutation(this.setblocks[i].block.clone());
            }
        }
        return this.setblocks.length;
    }
    copy(mask = undefined) {
        const player = this.player;
        const blocks = [];
        try {
            const playerLocation = player.location;
            playerLocation.x = Math.floor(playerLocation.x);
            playerLocation.y = Math.floor(playerLocation.y);
            playerLocation.z = Math.floor(playerLocation.z);
            if (mask == undefined) {
                for (let i = 0; i < this.setblocks.length; i++) {
                    const blockLocation = new BlockLocation(this.setblocks[i].x, this.setblocks[i].y, this.setblocks[i].z);
                    const blockPermutation = player.dimension.getBlock(blockLocation).permutation.clone();
                    blockLocation.x = playerLocation.x > blockLocation.x ? -Math.abs(playerLocation.x - blockLocation.x) : Math.abs(playerLocation.x - blockLocation.x);
                    blockLocation.y = playerLocation.y > blockLocation.y ? -Math.abs(playerLocation.y - blockLocation.y) : Math.abs(playerLocation.y - blockLocation.y);
                    blockLocation.z = playerLocation.z > blockLocation.z ? -Math.abs(playerLocation.z - blockLocation.z) : Math.abs(playerLocation.z - blockLocation.z);
                    blocks.push({ blockLocation: blockLocation, blockPermutation: blockPermutation });
                }
            }
            else {
                const air = SetBlocks.pattern("minecraft:air")();
                for (let i = 0; i < this.setblocks.length; i++) {
                    const blockLocation = new BlockLocation(this.setblocks[i].x, this.setblocks[i].y, this.setblocks[i].z);
                    const blockPermutation = player.dimension.getBlock(blockLocation).permutation.clone();
                    blockLocation.x = playerLocation.x > blockLocation.x ? -Math.abs(playerLocation.x - blockLocation.x) : Math.abs(playerLocation.x - blockLocation.x);
                    blockLocation.y = playerLocation.y > blockLocation.y ? -Math.abs(playerLocation.y - blockLocation.y) : Math.abs(playerLocation.y - blockLocation.y);
                    blockLocation.z = playerLocation.z > blockLocation.z ? -Math.abs(playerLocation.z - blockLocation.z) : Math.abs(playerLocation.z - blockLocation.z);
                    if (mask.some(m =>
                        m.type == blockPermutation.type &&
                        m.getAllProperties().map(property => property.name).toString() == blockPermutation.getAllProperties().map(property => property.name).toString() &&
                        m.getAllProperties().map(property => property.value).toString() == blockPermutation.getAllProperties().map(property => property.value).toString()
                    )) {
                        blocks.push({ blockLocation: blockLocation, blockPermutation: blockPermutation });
                    }
                    else {
                        blocks.push({ blockLocation: blockLocation, blockPermutation: air });
                    }
                }
            }
        }
        catch (error) {
            Commands.error(player, `A system error occurred while get the block. This error may be cured by clearing the clipboard with ${Commands.prefix}clearclipboard.`);
            return;
        }
        return blocks;
    }
}