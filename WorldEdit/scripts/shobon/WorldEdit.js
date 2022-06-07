/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you wish to share WorldEdit Addon, please be sure to share this page:
 *  https://link-center.net/351352/worldedit-addon
 */
import { BlockRaycastOptions, world } from "mojang-minecraft";
import { Commands } from "./Commands.js";
import { EditSelection } from "./EditSelection.js";
import { EditSession } from "./EditSession.js";
import { EditSettings } from "./EditSettings.js";
import { SetBlocks } from "./SetBlocks.js";

const prefix = Commands.prefix;
const usage = Commands.usage;

let brush = [];

world.events.beforeChat.subscribe((event) => {
    if (event.message.startsWith(prefix)) {
        const command = event.message.split(" ").filter(x => x.length > 0);
        command[0] = command[0].slice(prefix.length);
        if (command[0] == "help") {
            event.cancel = true;
            if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
            Commands.tell(event.sender, `§e----------§rHelp§e----------`);
            for (const i of Object.keys(usage)) {
                Commands.tell(event.sender, `§6${usage[i]}`);
            }
        }
        if (event.sender.hasTag("worldedit")) {
            if (command[0] == "undo") {
                event.cancel = true;
                if (command.length >= 4) { Commands.usageError(event.sender, command[0]); return; }
                let count = 0;
                if (command.length == 1) {
                    if (EditSession.get(event.sender.name).undo()) count++;
                }
                else if (command.length == 2 && Commands.isInteger(command[1])) {
                    command[1] = Number(command[1]);
                    if (command[1] < 0) {
                        if (EditSession.get(event.sender.name).undo()) count++;
                    }
                    else {
                        for (let i = 0; i < command[1]; i++) {
                            if (EditSession.get(event.sender.name).undo()) count++; else break;
                        }
                    }
                }
                else if (command.length == 2 && !Commands.isInteger(command[1])) {
                    if (command[1] != event.sender.name && !EditSession.exists(command[1])) {
                        Commands.error(event.sender, `Unable to find session for ${command[1]}`);
                        return;
                    }
                    else {
                        if (EditSession.get(command[1]).undo()) count++;
                    }
                }
                else if (command.length == 3 && Commands.isInteger(command[1])) {
                    if (command[2] != event.sender.name && !EditSession.exists(command[2])) {
                        Commands.error(event.sender, `Unable to find session for ${command[2]}`);
                        return;
                    }
                    else {
                        command[1] = Number(command[1]);
                        if (command[1] < 0) {
                            if (EditSession.get(command[2]).undo()) count++;
                        }
                        else {
                            for (let i = 0; i < command[1]; i++) {
                                if (EditSession.get(command[2]).undo()) count++; else break;
                            }
                        }
                    }
                }
                else {
                    Commands.usageError(event.sender, command[0]);
                    return;
                }
                if (count > 0) {
                    Commands.tell(event.sender, `Undid ${count} available edits.`);
                }
                else {
                    Commands.error(event.sender, "Nothing left to undo.");
                }
            }
            else if (command[0] == "redo") {
                event.cancel = true;
                if (command.length >= 4) { Commands.usageError(event.sender, command[0]); return; }
                let count = 0;
                if (command.length == 1) {
                    if (EditSession.get(event.sender.name).redo()) count++;
                }
                else if (command.length == 2 && Commands.isInteger(command[1])) {
                    command[1] = Number(command[1]);
                    if (command[1] < 0) {
                        if (EditSession.get(event.sender.name).redo()) count++;
                    }
                    else {
                        for (let i = 0; i < command[1]; i++) {
                            if (EditSession.get(event.sender.name).redo()) count++; else break;
                        }
                    }
                }
                else if (command.length == 2 && !Commands.isInteger(command[1])) {
                    if (command[1] != event.sender.name && !EditSession.exists(command[1])) {
                        Commands.error(event.sender, `Unable to find session for ${command[1]}`);
                        return;
                    }
                    else {
                        if (EditSession.get(command[1]).redo()) count++;
                    }
                }
                else if (command.length == 3 && Commands.isInteger(command[1])) {
                    if (command[2] != event.sender.name && !EditSession.exists(command[2])) {
                        Commands.error(event.sender, `Unable to find session for ${command[2]}`);
                        return;
                    }
                    else {
                        command[1] = Number(command[1]);
                        if (command[1] < 0) {
                            if (EditSession.get(command[2]).redo()) count++;
                        }
                        else {
                            for (let i = 0; i < command[1]; i++) {
                                if (EditSession.get(command[2]).redo()) count++; else break;
                            }
                        }
                    }
                }
                else {
                    Commands.usageError(event.sender, command[0]);
                    return;
                }
                if (count > 0) {
                    Commands.tell(event.sender, `Redid ${count} available edits.`);
                }
                else {
                    Commands.error(event.sender, "Nothing left to redo.");
                }
            }
            else if (command[0] == "clearhistory") {
                event.cancel = true;
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                EditSession.get(event.sender.name).clear();
                Commands.tell(event.sender, "History cleared.");
            }
            else if (command[0] == "togglehistory") {
                event.cancel = true;
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSettings.get(event.sender).setToggleHistory(command[1]);
            }
            else if (command[0] == "historysize") {
                event.cancel = true;
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSettings.get(event.sender).setHistorySize(command[1]);
            }
            else if (command[0] == "limit") {
                event.cancel = true;
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSettings.get(event.sender).setLimit(command[1]);
            }
            else if (command[0] == "pos1") {
                event.cancel = true;
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).setPos1(command[1]);
            }
            else if (command[0] == "pos2") {
                event.cancel = true;
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).setPos2(command[1]);
            }
            else if (command[0] == "wand") {
                event.cancel = true;
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                Commands.runSenderExcept(event.sender, `give @s shobon:wand`);
                Commands.tell(event.sender, "Left click: select pos #1; Right click: select pos #2");
            }
            else if (command[0] == "sel" || command[0] == "desel" || command[0] == "deselect") {
                event.cancel = true;
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).sel();
            }
            else if (command[0] == "set") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).set(command[1]);
            }
            else if (command[0] == "replace" || command[0] == "re" || command[0] == "rep") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 4) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).replace(command[1], command[2]);
            }
            else if (command[0] == "overlay") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).overlay(command[1]);
            }
            else if (command[0] == "center" || command[0] == "middle") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).center(command[1]);
            }
            else if (command[0] == "walls") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).walls(command[1]);
            }
            else if (command[0] == "faces" || command[0] == "outline") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).faces(command[1]);
            }
            else if (command[0] == "hcyl" || command[0] == "cyl") {
                event.cancel = true;
                let h = command[0] == "hcyl";
                if (command[0] == "cyl" && command.indexOf("-h") != -1) { command.splice(command.indexOf("-h"), 1); h = true; }
                if (command.length <= 2 || command.length >= 5) { Commands.usageError(event.sender, command[0]); return; }
                let pattern;
                try {
                    pattern = SetBlocks.pattern(command[1]);
                }
                catch (error) {
                    Commands.error(event.sender, error);
                    Commands.usageError(event.sender, command[0]); return;
                }
                command[2] = command[2].split(",");
                for (let i = 0; i < command[2].length; i++) {
                    if (command[2][i].length == 0 || !Commands.isFloat(command[2][i])) {
                        Commands.error(event.sender, `For input string: \\"${command[2][i]}\\", acceptable values are up to 2 comma separated values of: any double`);
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                    else {
                        command[2][i] = Number(command[2][i]) > 1 ? Number(command[2][i]) : 1;
                    }
                }
                if (command.length == 4) {
                    if (command[3].length == 0 || !Commands.isInteger(command[3])) {
                        Commands.error(event.sender, `For input string: \\"${command[3]}\\", acceptable values are any integer`);
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                    else {
                        command[3] = Number(command[3]);
                    }
                }
                else {
                    command[3] = 1;
                }
                if (!(command[2].length == 1 || command[2].length == 2)) { Commands.error(event.sender, `You must either specify 1 or 2 radius values.`); return; }
                const affected = EditSession.cylinder(event.sender, event.sender.location, pattern, command[2], command[3], !h);
                if (affected != undefined) Commands.tell(event.sender, `${affected} blocks have been created.`);
            }
            else if (command[0] == "hsphere" || command[0] == "sphere") {
                event.cancel = true;
                let r = false;
                if (command.indexOf("-r") != -1) { command.splice(command.indexOf("-r"), 1); r = true; }
                let h = command[0] == "hsphere";
                if (command[0] == "sphere" && command.indexOf("-h") != -1) { command.splice(command.indexOf("-h"), 1); h = true; }
                if (command.length <= 2 || command.length >= 4) { Commands.usageError(event.sender, command[0]); return; }
                let pattern;
                try {
                    pattern = SetBlocks.pattern(command[1]);
                }
                catch (error) {
                    Commands.error(event.sender, error);
                    Commands.usageError(event.sender, command[0]); return;
                }
                command[2] = command[2].split(",");
                for (let i = 0; i < command[2].length; i++) {
                    if (command[2][i].length == 0 || !Commands.isFloat(command[2][i])) {
                        Commands.error(event.sender, `For input string: \\"${command[2][i]}\\", acceptable values are up to 3 comma separated values of: any double`);
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                    else {
                        command[2][i] = Number(command[2][i]) > 0 ? Number(command[2][i]) : 0;
                    }
                }
                if (!(command[2].length == 1 || command[2].length == 3)) { Commands.error(event.sender, `You must either specify 1 or 3 radius values.`); return; }
                const location = event.sender.location;
                if (r) location.y = command[2].length == 1 ? location.y + command[2][0] : location.y + command[2][1];
                const affected = EditSession.sphere(event.sender, location, pattern, command[2], !h);
                if (affected != undefined) Commands.tell(event.sender, `${affected} blocks have been created.`);
            }
            else if (command[0] == "hpyramid" || command[0] == "pyramid") {
                event.cancel = true;
                let h = command[0] == "hpyramid";
                if (command[0] == "pyramid" && command.indexOf("-h") != -1) { command.splice(command.indexOf("-h"), 1); h = true; }
                if (command.length <= 2 || command.length >= 4) { Commands.usageError(event.sender, command[0]); return; }
                let pattern;
                try {
                    pattern = SetBlocks.pattern(command[1]);
                }
                catch (error) {
                    Commands.error(event.sender, error);
                    Commands.usageError(event.sender, command[0]); return;
                }
                if (command[2].length == 0 || !Commands.isInteger(command[2])) {
                    Commands.error(event.sender, `For input string: \\"${command[2]}\\", acceptable values are any integer`);
                    Commands.usageError(event.sender, command[0]);
                    return;
                }
                else {
                    command[2] = Number(command[2]);
                }
                if (r) location.y = command[2].length == 1 ? location.y + command[2][0] : location.y + command[2][1];
                const affected = EditSession.pyramid(event.sender, event.sender.location, pattern, command[2], !h);
                if (affected != undefined) Commands.tell(event.sender, `${affected} blocks have been created.`);
            }
            else if (command[0] == "copy") {
                event.cancel = true;
                let m = undefined;
                if (command.indexOf("-m") != -1) {
                    if (command[command.indexOf("-m") + 1] != undefined) {
                        m = command[command.indexOf("-m") + 1];
                        command.splice(command.indexOf("-m"), 2);
                    }
                    else {
                        Commands.error(event.sender, "Not enough arguments.");
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                }
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).copy(m);
            }
            else if (command[0] == "cut") {
                event.cancel = true;
                let m = undefined;
                if (command.indexOf("-m") != -1) {
                    if (command[command.indexOf("-m") + 1] != undefined) {
                        m = command[command.indexOf("-m") + 1];
                        command.splice(command.indexOf("-m"), 2);
                    }
                    else {
                        Commands.error(event.sender, "Not enough arguments.");
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                }
                if (command.length >= 3) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).cut(command[1], m);
            }
            else if (command[0] == "paste") {
                event.cancel = true;
                let a = false;
                if (command.indexOf("-a") != -1) { command.splice(command.indexOf("-a"), 1); a = true; }
                let o = false;
                if (command.indexOf("-o") != -1) { command.splice(command.indexOf("-o"), 1); o = true; }
                let s = false;
                if (command.indexOf("-s") != -1) { command.splice(command.indexOf("-s"), 1); s = true; }
                let n = false;
                if (command.indexOf("-n") != -1) { command.splice(command.indexOf("-n"), 1); n = true; }
                let m = undefined;
                if (command.indexOf("-m") != -1) {
                    if (command[command.indexOf("-m") + 1] != undefined) {
                        m = command[command.indexOf("-m") + 1];
                        command.splice(command.indexOf("-m"), 2);
                    }
                    else {
                        Commands.error(event.sender, "Not enough arguments.");
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                }
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).paste(a, o, s, n, m);
            }
            else if (command[0] == "rotate") {
                event.cancel = true;
                if (command.length <= 1 || command.length >= 5) { Commands.usageError(event.sender, command[0]); return; }
                for (let i = 1; i < command.length; i++) {
                    if (command[i].length == 0 || !Commands.isInteger(command[i])) {
                        Commands.error(event.sender, `For input string: \\"${command[i]}\\", acceptable values are any integer`);
                        Commands.usageError(event.sender, command[0]);
                        return;
                    }
                    else {
                        command[i] = Number(command[i]);
                    }
                }
                EditSelection.get(event.sender).rotate(command[1], command[2], command[3]);
            }
            else if (command[0] == "clearclipboard") {
                event.cancel = true;
                if (command.length >= 2) { Commands.usageError(event.sender, command[0]); return; }
                EditSelection.get(event.sender).clearclipboard();
            }
            else if (command[0] == "brush" || command[0] == "br") {
                event.cancel = true;
                if (command.length == 1) { Commands.usageError(event.sender, "brush"); return; }
                if (event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot) == undefined) { Commands.error(event.sender, "Can't bind tool to Air."); return; }
                if (command[1] == "none" || command[1] == "unbind") {
                    if (command.length >= 3) { Commands.usageError(event.sender, `brush_none`); return; }
                    let test = false;
                    for (let i = 0; i < brush.length; i++) {
                        if (brush[i][0] == event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot).id && brush[i][2] == event.sender) {
                            brush.splice(i, 1);
                            test = true;
                        }
                    }
                    if (test) {
                        Commands.tell(event.sender, "Brush unbound from your current item.");
                    }
                    else {
                        Commands.tell(event.sender, "Your current item is not bound.");
                    }
                }
                else if (command[1] == "sphere" || command[1] == "s") {
                    let h = false;
                    if (command.indexOf("-h") != -1) { command.splice(command.indexOf("-h"), 1); h = true; }
                    if (command.length <= 2 || command.length >= 5) { Commands.usageError(event.sender, `brush_sphere`); return; }
                    for (let i = 0; i < brush.length; i++) {
                        if (brush[i][0] == event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot).id && brush[i][2] == event.sender) {
                            brush.splice(i, 1);
                        }
                    }
                    let pattern;
                    try {
                        pattern = SetBlocks.pattern(command[2]);
                    }
                    catch (error) {
                        Commands.error(event.sender, error);
                        Commands.usageError(event.sender, `brush_sphere`); return;
                    }
                    if (command.length == 4) {
                        if (command[3].length == 0 || !Commands.isFloat(command[3])) {
                            Commands.error(event.sender, `For input string: \\"${command[3]}\\", acceptable values are any double`);
                            Commands.usageError(event.sender, `brush_sphere`);
                            return;
                        }
                        else {
                            command[3] = Number(command[3]);
                        }
                    }
                    else {
                        command[3] = 2;
                    }
                    brush.push([
                        event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot).id,
                        "sphere",
                        event.sender,
                        pattern,
                        command[3],
                        !h
                    ]);
                    Commands.tell(event.sender, `Sphere brush shape equipped (${Math.round(command[3])}).`);
                    Commands.tell(event.sender, `§7Run §b${prefix}brush unbind§7 while holding the item to unbind it.`);
                }
                else if (command[1] == "cylinder" || command[1] == "cyl" || command[1] == "c") {
                    let h = false;
                    if (command.indexOf("-h") != -1) { command.splice(command.indexOf("-h"), 1); h = true; }
                    if (command.length <= 2 || command.length >= 6) { Commands.usageError(event.sender, `brush_cylinder`); return; }
                    for (let i = 0; i < brush.length; i++) {
                        if (brush[i][0] == event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot).id && brush[i][2] == event.sender) {
                            brush.splice(i, 1);
                        }
                    }
                    let pattern;
                    try {
                        pattern = SetBlocks.pattern(command[2]);
                    }
                    catch (error) {
                        Commands.error(event.sender, error);
                        Commands.usageError(event.sender, `brush_cylinder`); return;
                    }
                    if (command.length >= 4) {
                        if (command[3].length == 0 || !Commands.isFloat(command[3])) {
                            Commands.error(event.sender, `For input string: \\"${command[3]}\\", acceptable values are any double`);
                            Commands.usageError(event.sender, `brush_cylinder`);
                            return;
                        }
                        else {
                            command[3] = Number(command[3]);
                        }
                    }
                    else {
                        command[3] = 2;
                    }
                    if (command.length == 5) {
                        if (command[4].length == 0 || !Commands.isInteger(command[4])) {
                            Commands.error(event.sender, `For input string: \\"${command[4]}\\", acceptable values are any integer`);
                            Commands.usageError(event.sender, `brush_cylinder`);
                            return;
                        }
                        else {
                            command[4] = Number(command[4]);
                        }
                    }
                    else {
                        command[4] = 1;
                    }
                    brush.push([
                        event.sender.getComponent("inventory").container.getItem(event.sender.selectedSlot).id,
                        "cylinder",
                        event.sender,
                        pattern,
                        command[3],
                        command[4],
                        !h
                    ]);
                    Commands.tell(event.sender, `Cylinder brush shape equipped (${Math.round(command[3])} by ${Math.round(command[4])}).`);
                    Commands.tell(event.sender, `§7Run §b${prefix}brush unbind§7 while holding the item to unbind it.`);
                }
                else {
                    Commands.usageError(event.sender, "brush"); return;
                }
            }
        }
    }
});
world.events.itemUse.subscribe((event) => {
    if (brush.length == 0) return;
    const entity = event.source;
    if (entity.id != "minecraft:player") return;
    if (entity.hasTag("worldedit")) {
        for (const b of brush.filter(x => x[2].name == entity.name)) {
            const item = b[2].getComponent("inventory").container.getItem(entity.selectedSlot).id;
            if (b[0] == item) {
                const options = new BlockRaycastOptions();
                options.includeLiquidBlocks = true;
                options.includePassableBlocks = true;
                options.maxDistance = 256;
                const block = entity.getBlockFromViewVector(options);
                if (block == undefined) return;
                const blockLocation = block.location;
                if (b[1] == "sphere") {
                    EditSession.sphere(b[2], blockLocation, b[3], b[4], b[5]);
                }
                else if (b[1] == "cylinder") {
                    EditSession.cylinder(b[2], blockLocation, b[3], b[4], b[5], b[6]);
                }
            }
        }
    }
});
world.events.entityHit.subscribe((event) => {
    const entity = event.entity;
    if (entity.hasTag("worldedit")) {
        const hitBlock = event.hitBlock;
        const hitEntity = event.hitEntity;
        if (entity.id != "minecraft:player") return;
        if (hitEntity != undefined) return;
        if (entity.getComponent("inventory").container.getItem(entity.selectedSlot) == undefined) return;
        if (entity.getComponent("inventory").container.getItem(entity.selectedSlot).id != "shobon:wand") return;
        EditSelection.get(entity).setPos1(hitBlock, true);
    }
});
world.events.beforeItemUseOn.subscribe((event) => {
    const entity = event.source;
    if (entity.hasTag("worldedit")) {
        const blockLocation = event.blockLocation;
        if (entity.id != "minecraft:player") return;
        if (entity.getComponent("inventory").container.getItem(entity.selectedSlot) == undefined) return;
        if (entity.getComponent("inventory").container.getItem(entity.selectedSlot).id != "shobon:wand") return;
        event.cancel = true;
        EditSelection.get(entity).setPos2(blockLocation, true);
    }
});