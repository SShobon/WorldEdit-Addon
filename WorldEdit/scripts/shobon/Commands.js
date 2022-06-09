/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you would like to share the WorldEdit Addon, be sure to share one of these pages:
 *  https://mcpedl.com/worldedit-addon-1/
 *  https://link-center.net/351352/worldedit-addon
 */
import { world } from "mojang-minecraft";

export class Commands {
    static prefix = "!";
    static usage = {
        help: "help",
        help0: "§cThe following command requires the tag 'worldedit'.",
        help1: "§fGeneral Commands",
        undo: "undo [times] [player]",
        redo: "redo [times] [player]",
        clearhistory: "clearhistory",
        togglehistory: "togglehistory [togglehistory]",
        historysize: "historysize [historysize]",
        limit: "limit [limit]",
        help2: "§fSelection Commands",
        pos1: "pos1 [coordinates]",
        pos2: "pos2 [coordinates]",
        wand: "wand",
        //contract: "contract <amount> [reverseAmount] [direction]",
        //shift: "shift <amount> [direction]",
        //outset: "outset [-hv] <amount>",
        //inset: "inset [-hv] <amount>",
        //size: "size [-c]",
        //count: "count <mask>",
        //distr: "distr [-c] [-p <page>]",
        sel: "sel",
        desel: "desel",
        deselect: "deselect",
        //expand: "expand <amount> [reverseAmount] [direction]",
        help3: "§fRegion Commands",
        set: "set <pattern>",
        //line: "line [-h] <pattern> [thickness]",
        replace: "replace [from] <to>",
        re: "re [from] <to>",
        rep: "rep [from] <to>",
        overlay: "overlay <pattern>",
        center: "center <pattern>",
        middle: "middle <pattern>",
        //naturalize: "naturalize",
        walls: "walls <pattern>",
        faces: "faces <pattern>",
        outline: "outline <pattern>",
        //smooth: "smooth [iterations] [mask]",
        //move: "move [-aes] [multiplier] [offset] [replace] [-m <mask>]",
        //stack: "stack [-aes] [count] [offset] [-m <mask>]",
        //hollow: "hollow [thickness] [pattern]",
        help4: "§fGeneration Commands",
        hcyl: "hcyl <pattern> <radii> [height]",
        cyl: "cyl [-h] <pattern> <radii> [height]",
        hsphere: "hsphere [-r] <pattern> <radii>",
        sphere: "sphere [-h] [-r] <pattern> <radii>",
        hpyramid: "hpyramid <pattern> <size>",
        pyramid: "pyramid [-h] <pattern> <size>",
        help5: "§fClipboard Commands",
        copy: "copy [-m <mask>]",
        cut: "cut [leavePattern] [-m <mask>]",
        paste: "paste [-a] [-o] [-s] [-n] [-m <sourceMask>]",
        rotate: "rotate <rotateY> [rotateX] [rotateZ]",
        //flip: "flip [direction]",
        clearclipboard: "clearclipboard",
        help6: "§fBrush Commands",
        brush: "brush <none|sphere|cylinder>",
        brush_none: "brush none",
        brush_sphere: "brush sphere [-h] <pattern> [radius]",
        brush_cylinder: "brush cylinder [-h] <pattern> [radius] [height]"
    }
    static runWorld(command, i = 0) {
        let dimensionId = ["minecraft:overworld", "minecraft:nether", "minecraft:end"];
        world.getDimension(typeof i == String ? i : dimensionId[i]).runCommand(command);
    }
    static runSender(sender, command) {
        sender.runCommand(command);
    }
    static runSenderExcept(sender, command) {
        try {
            sender.runCommand(command);
        } catch (error) { }
    }
    static tell(sender, message) {
        this.runSenderExcept(sender, `tellraw @s {"rawtext":[{"text":"§d${message}"}]}`);
    }
    static error(sender, message) {
        this.runSenderExcept(sender, `tellraw @s {"rawtext":[{"text":"§c${message}"}]}`);
    }
    static usageError(sender, command) {
        this.error(sender, `Usage: §6${this.prefix}${this.usage[command]}`);
    }
    static isInteger(integer) {
        if (!isNaN(Number(integer)) && Number.isInteger(Number(integer)) && integer.indexOf(".") == -1 && integer.indexOf("x") == -1) {
            return true
        }
        else {
            return false
        }
    }
    static isFloat(float) {
        if (!isNaN(Number(float)) && float.indexOf("x") == -1) {
            return true
        }
        else {
            return false
        }
    }
    static isBoolean(boolean) {
        if (boolean == "true" || boolean == "false") {
            return true
        }
        else {
            return false
        }
    }
    static Boolean(boolean) {
        switch (boolean) {
            case "true":
                return true
            case "false":
                return false
            default:
                return undefined
        }
    }
}