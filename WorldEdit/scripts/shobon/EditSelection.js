/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you wish to share WorldEdit Addon, please be sure to share this page:
 *  https://link-center.net/351352/worldedit-addon
 */
import { BlockLocation, Location } from "mojang-minecraft";
import { Commands } from "./Commands.js";
import { SetBlocks } from "./SetBlocks.js";

function dSin(degrees) {
    let dInt = parseInt(degrees);
    if (degrees == dInt && dInt % 90 == 0) {
        dInt %= 360;
        if (dInt < 0) {
            dInt += 360;
        }
        switch (dInt) {
            case 0:
                return 0.0;
            case 90:
                return 1.0;
            case 180:
                return 0.0;
            case 270:
                return -1.0;
            default:
                break;
        }
    }
    return Math.sin(degrees * (Math.PI / 180));
}

function dCos(degrees) {
    let dInt = parseInt(degrees);
    if (degrees == dInt && dInt % 90 == 0) {
        dInt %= 360;
        if (dInt < 0) {
            dInt += 360;
        }
        switch (dInt) {
            case 0:
                return 1.0;
            case 90:
                return 0.0;
            case 180:
                return -1.0;
            case 270:
                return 0.0;
            default:
                break;
        }
    }
    return Math.cos(degrees * (Math.PI / 180));
}

class AffineTransform {
    constructor() {
        this.m00; this.m01; this.m02; this.m03;
        this.m10; this.m11; this.m12; this.m13;
        this.m20; this.m21; this.m22; this.m23;
    }
    default() {
        this.m00 = this.m11 = this.m22 = 1;
        this.m01 = this.m02 = this.m03 = 0;
        this.m10 = this.m12 = this.m13 = 0;
        this.m20 = this.m21 = this.m23 = 0;
    }
    set(xx, yx, zx, tx, xy, yy, zy, ty, xz, yz, zz, tz) {
        this.m00 = xx; this.m01 = yx; this.m02 = zx; this.m03 = tx;
        this.m10 = xy; this.m11 = yy; this.m12 = zy; this.m13 = ty;
        this.m20 = xz; this.m21 = yz; this.m22 = zz; this.m23 = tz;
    }
    concatenate(that) {
        const n00 = this.m00 * that.m00 + this.m01 * that.m10 + this.m02 * that.m20;
        const n01 = this.m00 * that.m01 + this.m01 * that.m11 + this.m02 * that.m21;
        const n02 = this.m00 * that.m02 + this.m01 * that.m12 + this.m02 * that.m22;
        const n03 = this.m00 * that.m03 + this.m01 * that.m13 + this.m02 * that.m23 + this.m03;
        const n10 = this.m10 * that.m00 + this.m11 * that.m10 + this.m12 * that.m20;
        const n11 = this.m10 * that.m01 + this.m11 * that.m11 + this.m12 * that.m21;
        const n12 = this.m10 * that.m02 + this.m11 * that.m12 + this.m12 * that.m22;
        const n13 = this.m10 * that.m03 + this.m11 * that.m13 + this.m12 * that.m23 + this.m13;
        const n20 = this.m20 * that.m00 + this.m21 * that.m10 + this.m22 * that.m20;
        const n21 = this.m20 * that.m01 + this.m21 * that.m11 + this.m22 * that.m21;
        const n22 = this.m20 * that.m02 + this.m21 * that.m12 + this.m22 * that.m22;
        const n23 = this.m20 * that.m03 + this.m21 * that.m13 + this.m22 * that.m23 + this.m23;
        this.m00 = n00; this.m01 = n01; this.m02 = n02; this.m03 = n03;
        this.m10 = n10; this.m11 = n11; this.m12 = n12; this.m13 = n13;
        this.m20 = n20; this.m21 = n21; this.m22 = n22; this.m23 = n23;
    }
    rotateX(theta) {
        const cot = dCos(theta);
        const sit = dSin(theta);
        const affineTransform = new AffineTransform;
        affineTransform.set(
            1, 0, 0, 0,
            0, cot, -sit, 0,
            0, sit, cot, 0
        )
        return this.concatenate(affineTransform);
    }
    rotateY(theta) {
        const cot = dCos(theta);
        const sit = dSin(theta);
        const affineTransform = new AffineTransform;
        affineTransform.set(
            cot, 0, sit, 0,
            0, 1, 0, 0,
            -sit, 0, cot, 0
        )
        return this.concatenate(affineTransform);
    }
    rotateZ(theta) {
        const cot = dCos(theta);
        const sit = dSin(theta);
        const affineTransform = new AffineTransform;
        affineTransform.set(
            cot, -sit, 0, 0,
            sit, cot, 0, 0,
            0, 0, 1, 0
        )
        return this.concatenate(affineTransform);
    }
    apply(pos) {
        return {
            x: pos.x * this.m00 + pos.y * this.m01 + pos.z * this.m02 + this.m03,
            y: pos.x * this.m10 + pos.y * this.m11 + pos.z * this.m12 + this.m13,
            z: pos.x * this.m20 + pos.y * this.m21 + pos.z * this.m22 + this.m23
        };
    }
}

export class EditSelection {
    static players = [];
    static get(player) {
        if (this.players.map(x => x.player.name == player.name).indexOf(true) == -1) {
            this.players.push(new EditSelection(player));
        }
        return this.players[this.players.map(x => x.player.name == player.name).indexOf(true)];
    }
    constructor(player) {
        this.player = player;
        this.pos1 = undefined;
        this.pos2 = undefined;
        this.clipboard = undefined;
    }
    getMinimumPoint() { return [Math.min(this.pos1[0], this.pos2[0]), Math.min(this.pos1[1], this.pos2[1]), Math.min(this.pos1[2], this.pos2[2])]; }
    getMaximumPoint() { return [Math.max(this.pos1[0], this.pos2[0]), Math.max(this.pos1[1], this.pos2[1]), Math.max(this.pos1[2], this.pos2[2])]; }
    pos1WithX(x) { return [x, this.pos1[1], this.pos1[2]] }
    pos1WithY(y) { return [this.pos1[0], y, this.pos1[2]] }
    pos1WithZ(z) { return [this.pos1[0], this.pos1[1], z] }
    pos2WithX(x) { return [x, this.pos2[1], this.pos2[2]] }
    pos2WithY(y) { return [this.pos2[0], y, this.pos2[2]] }
    pos2WithZ(z) { return [this.pos2[0], this.pos2[1], z] }
    count() {
        if (this.pos1 == undefined || this.pos2 == undefined) return;
        let x = Math.abs(this.pos1[0] - this.pos2[0]) + 1;
        let y = Math.abs(this.pos1[1] - this.pos2[1]) + 1;
        let z = Math.abs(this.pos1[2] - this.pos2[2]) + 1;
        return x * y * z;
    }
    setPos1(pos = undefined, isWand = false) {
        const player = this.player;
        if (isWand) {
            if (pos == undefined || JSON.stringify(this.pos1) == JSON.stringify([pos.x, pos.y, pos.z])) return;
            this.pos1 = [pos.x, pos.y, pos.z];
            Commands.tell(player, `First position set to (${pos.x}, ${pos.y}, ${pos.z})${this.pos2 == undefined ? "" : ` (${this.count()})`}.`);
        }
        else {
            if (pos == undefined) {
                pos = player.location;
                pos.x = Math.floor(pos.x);
                pos.y = Math.floor(pos.y);
                pos.z = Math.floor(pos.z);
            }
            else {
                pos = pos.split(",");
                for (let i = 0; i < pos.length; i++) {
                    if (pos[i].length == 0 || !Commands.isInteger(pos[i])) {
                        Commands.error(player, `For input string: \\"${pos[i]}\\", acceptable values are any block vector in the form x,y,z`);
                        Commands.usageError(player, "pos1");
                        return;
                    }
                    else {
                        pos[i] = Number(pos[i]);
                    }
                }
                if (pos.length != 3) {
                    Commands.error(player, `Must have exactly 3 vector components, acceptable values are any block vector in the form x,y,z`);
                    Commands.usageError(player, "pos1");
                    return;
                }
                pos = new Location(pos[0], pos[1], pos[2]);
            }
            if (JSON.stringify(this.pos1) == JSON.stringify([pos.x, pos.y, pos.z])) {
                Commands.error(player, `Position already set.`);
            }
            else {
                this.pos1 = [pos.x, pos.y, pos.z];
                Commands.tell(player, `First position set to (${pos.x}, ${pos.y}, ${pos.z})${this.pos2 == undefined ? "" : ` (${this.count()})`}.`);
            }
        }
    }
    setPos2(pos = undefined, isWand = false) {
        const player = this.player;
        if (isWand) {
            if (pos == undefined || JSON.stringify(this.pos2) == JSON.stringify([pos.x, pos.y, pos.z])) return;
            this.pos2 = [pos.x, pos.y, pos.z];
            Commands.tell(player, `Second position set to (${pos.x}, ${pos.y}, ${pos.z})${this.pos1 == undefined ? "" : ` (${this.count()})`}.`);
        }
        else {
            if (pos == undefined) {
                pos = player.location;
                pos.x = Math.floor(pos.x);
                pos.y = Math.floor(pos.y);
                pos.z = Math.floor(pos.z);
            }
            else {
                pos = pos.split(",");
                for (let i = 0; i < pos.length; i++) {
                    if (pos[i].length == 0 || !Commands.isInteger(pos[i])) {
                        Commands.error(player, `For input string: \\"${pos[i]}\\", acceptable values are any block vector in the form x,y,z`);
                        Commands.usageError(player, "pos2");
                        return;
                    }
                    else {
                        pos[i] = Number(pos[i]);
                    }
                }
                if (pos.length != 3) {
                    Commands.error(player, `Must have exactly 3 vector components, acceptable values are any block vector in the form x,y,z`);
                    Commands.usageError(player, "pos2");
                    return;
                }
                pos = new Location(pos[0], pos[1], pos[2]);
            }
            if (JSON.stringify(this.pos2) == JSON.stringify([pos.x, pos.y, pos.z])) {
                Commands.error(player, `Position already set.`);
            }
            else {
                this.pos2 = [pos.x, pos.y, pos.z];
                Commands.tell(player, `Second position set to (${pos.x}, ${pos.y}, ${pos.z})${this.pos1 == undefined ? "" : ` (${this.count()})`}.`);
            }
        }
    }
    sel() {
        this.pos1 = undefined;
        this.pos2 = undefined;
        Commands.tell(this.player, "Selection cleared.");
    }
    set(pattern) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const pos1 = this.pos1;
            const pos2 = this.pos2;
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            try {
                pattern = SetBlocks.pattern(pattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "set");
                return;
            }
            for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                    for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                        if (setBlocks.add({ x: x, y: y, z: z, block: pattern() })) return;
                    }
                }
            }
            Commands.tell(player, `Operation completed (${setBlocks.set()} blocks affected).`);
        }
    }
    replace(from, to = undefined) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const pos1 = this.pos1;
            const pos2 = this.pos2;
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            if (to == undefined) {
                try {
                    from = SetBlocks.pattern(from);
                }
                catch (error) {
                    Commands.error(player, error);
                    Commands.usageError(player, "replace");
                    return;
                }
                for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                    for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                        for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                            if (player.dimension.getBlock(new BlockLocation(x, y, z)).id != "minecraft:air") {
                                if (setBlocks.add({ x: x, y: y, z: z, block: from() })) return;
                            }
                        }
                    }
                }
            }
            else {
                try {
                    from = SetBlocks.pattern(from);
                    from = from(false);
                }
                catch (error) {
                    Commands.error(player, error);
                    Commands.usageError(player, "replace");
                    return;
                }
                try {
                    to = SetBlocks.pattern(to);
                }
                catch (error) {
                    Commands.error(player, error);
                    Commands.usageError(player, "replace");
                    return;
                }
                for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                    for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                        for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                            const block = player.dimension.getBlock(new BlockLocation(x, y, z)).permutation;
                            if (from.some(replace =>
                                replace.type == block.type &&
                                replace.getAllProperties().map(property => property.name).toString() == block.getAllProperties().map(property => property.name).toString() &&
                                replace.getAllProperties().map(property => property.value).toString() == block.getAllProperties().map(property => property.value).toString()
                            )) {
                                if (setBlocks.add({ x: x, y: y, z: z, block: to() })) return;
                            }
                        }
                    }
                }
            }
            Commands.tell(player, `${setBlocks.set()} blocks have been replaced.`);
        }
    }
    overlay(pattern) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const pos1 = this.pos1;
            const pos2 = this.pos2;
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            try {
                pattern = SetBlocks.pattern(pattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "overlay");
                return;
            }
            for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                    let overlay = [];
                    for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                        const block = player.dimension.getBlock(new BlockLocation(x, y, z));
                        const blockup = player.dimension.getBlock(new BlockLocation(x, y + 1, z));
                        if (block.id != "minecraft:air" && blockup.id == "minecraft:air") {
                            overlay.push(y + 1);
                        }
                    }
                    if (overlay.length != 0) {
                        if (setBlocks.add({ x: x, y: overlay[overlay.length - 1], z: z, block: pattern() })) return;
                    }
                }
            }
            Commands.tell(player, `${setBlocks.set()} blocks have been overlaid.`);
        }
    }
    center(pattern) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            let pos = [];
            let pos1 = this.pos1;
            let pos2 = this.pos2;
            pos[0] = (pos1[0] + pos2[0]) / 2;
            pos[1] = (pos1[1] + pos2[1]) / 2;
            pos[2] = (pos1[2] + pos2[2]) / 2;
            pos1 = [Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2])];
            pos2 = [Math.ceil(pos[0]), Math.ceil(pos[1]), Math.ceil(pos[2])];
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            try {
                pattern = SetBlocks.pattern(pattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "center");
                return;
            }
            for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                    for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                        if (setBlocks.add({ x: x, y: y, z: z, block: pattern() })) return;
                    }
                }
            }
            Commands.tell(player, `Center set. (${setBlocks.set()} blocks changed)`);
        }
    }
    walls(pattern) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const min = this.getMinimumPoint();
            const max = this.getMaximumPoint();
            try {
                pattern = SetBlocks.pattern(pattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "walls");
                return;
            }
            const regions = [
                [this.pos1WithX(min[0]), this.pos2WithX(min[0])],
                [this.pos1WithX(max[0]), this.pos2WithX(max[0])],
                [this.pos1WithZ(min[2]), this.pos2WithZ(min[2])],
                [this.pos1WithZ(max[2]), this.pos2WithZ(max[2])]
            ];
            for (const region of regions) {
                const pos1 = region[0];
                const pos2 = region[1];
                const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
                const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
                const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
                const x_test = pos1[0] > pos2[0];
                const y_test = pos1[1] > pos2[1];
                const z_test = pos1[2] > pos2[2];
                for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                    for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                        for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                            if (setBlocks.add({ x: x, y: y, z: z, block: pattern() })) return;
                        }
                    }
                }
            }
            Commands.tell(player, `${setBlocks.set()} blocks have been changed.`);
        }
    }
    faces(pattern) {
        const player = this.player;
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const min = this.getMinimumPoint();
            const max = this.getMaximumPoint();
            try {
                pattern = SetBlocks.pattern(pattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "faces");
                return;
            }
            const regions = [
                [this.pos1WithX(min[0]), this.pos2WithX(min[0])],
                [this.pos1WithX(max[0]), this.pos2WithX(max[0])],
                [this.pos1WithY(min[1]), this.pos2WithY(min[1])],
                [this.pos1WithY(max[1]), this.pos2WithY(max[1])],
                [this.pos1WithZ(min[2]), this.pos2WithZ(min[2])],
                [this.pos1WithZ(max[2]), this.pos2WithZ(max[2])]
            ];
            for (const region of regions) {
                const pos1 = region[0];
                const pos2 = region[1];
                const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
                const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
                const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
                const x_test = pos1[0] > pos2[0];
                const y_test = pos1[1] > pos2[1];
                const z_test = pos1[2] > pos2[2];
                for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                    for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                        for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                            if (setBlocks.add({ x: x, y: y, z: z, block: pattern() })) return;
                        }
                    }
                }
            }
            Commands.tell(player, `${setBlocks.set()} blocks have been changed.`);
        }
    }
    copy(mask = undefined) {
        const player = this.player;
        if (mask != undefined) {
            try {
                mask = SetBlocks.pattern(mask);
                mask = mask(false);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "copy");
                return;
            }
        }
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const pos1 = this.pos1;
            const pos2 = this.pos2;
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                    for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                        if (setBlocks.add({ x: x, y: y, z: z })) return;
                    }
                }
            }
            let location = player.location;
            location = [location.x, location.y, location.z].map(x => Math.floor(x));
            this.clipboard = {
                location: location,
                blocks: setBlocks.copy(mask)
            };
            Commands.tell(player, `${this.clipboard.blocks.length} blocks affected`);
        }
    }
    cut(leavePattern = undefined, mask = undefined) {
        const player = this.player;
        if (leavePattern == undefined) {
            leavePattern = SetBlocks.pattern("minecraft:air");
        }
        else {
            try {
                leavePattern = SetBlocks.pattern(leavePattern);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "cut");
                return;
            }
        }
        if (mask != undefined) {
            try {
                mask = SetBlocks.pattern(mask);
                mask = mask(false);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "cut");
                return;
            }
        }
        if (this.pos1 == undefined || this.pos2 == undefined) {
            Commands.error(player, "Make a region selection first.");
        }
        else {
            const setBlocks = new SetBlocks(player);
            const pos1 = this.pos1;
            const pos2 = this.pos2;
            const x_times = Math.abs(pos1[0] - pos2[0]) + 1;
            const y_times = Math.abs(pos1[1] - pos2[1]) + 1;
            const z_times = Math.abs(pos1[2] - pos2[2]) + 1;
            const x_test = pos1[0] > pos2[0];
            const y_test = pos1[1] > pos2[1];
            const z_test = pos1[2] > pos2[2];
            for (let i = 0, x = pos1[0]; i < x_times; i++, x = x_test ? pos1[0] - i : pos1[0] + i) {
                for (let j = 0, y = pos1[1]; j < y_times; j++, y = y_test ? pos1[1] - j : pos1[1] + j) {
                    for (let k = 0, z = pos1[2]; k < z_times; k++, z = z_test ? pos1[2] - k : pos1[2] + k) {
                        if (setBlocks.add({ x: x, y: y, z: z, block: leavePattern() })) return;
                    }
                }
            }
            let location = player.location;
            location = [location.x, location.y, location.z].map(x => Math.floor(x));
            this.clipboard = {
                location: location,
                blocks: setBlocks.copy(mask)
            };
            setBlocks.set();
            Commands.tell(player, `${this.clipboard.blocks.length} blocks affected`);
        }
    }
    paste(ignoreAirBlocks = false, atOrigin = false, selectPasted = false, onlySelect = false, sourceMask = undefined) {
        const player = this.player;
        if (sourceMask != undefined) {
            try {
                sourceMask = SetBlocks.pattern(sourceMask);
                sourceMask = sourceMask(false);
            }
            catch (error) {
                Commands.error(player, error);
                Commands.usageError(player, "paste");
                return;
            }
        }
        if (this.clipboard == undefined) {
            Commands.error(player, `Your clipboard is empty. Use ${Commands.prefix}copy first.`);
        }
        else {
            const setBlocks = new SetBlocks(player);
            let location = player.location;
            location = [location.x, location.y, location.z].map(x => Math.floor(x));
            if (atOrigin) location = [this.clipboard.location[0], this.clipboard.location[1], this.clipboard.location[2]];
            if (sourceMask == undefined) {
                for (const blocks of this.clipboard.blocks) {
                    const blockLocation = blocks.blockLocation;
                    const blockPermutation = blocks.blockPermutation;
                    const x = location[0] + blockLocation.x;
                    const y = location[1] + blockLocation.y;
                    const z = location[2] + blockLocation.z;
                    if (!(ignoreAirBlocks && blockPermutation.type.id == "minecraft:air")) if (setBlocks.add({ x: x, y: y, z: z, block: blockPermutation })) return;
                }
            }
            else {
                for (const blocks of this.clipboard.blocks) {
                    const blockLocation = blocks.blockLocation;
                    const blockPermutation = blocks.blockPermutation;
                    const x = location[0] + blockLocation.x;
                    const y = location[1] + blockLocation.y;
                    const z = location[2] + blockLocation.z;
                    if (sourceMask.some(m =>
                        m.type == blockPermutation.type &&
                        m.getAllProperties().map(property => property.name).toString() == blockPermutation.getAllProperties().map(property => property.name).toString() &&
                        m.getAllProperties().map(property => property.value).toString() == blockPermutation.getAllProperties().map(property => property.value).toString()
                    )) {
                        if (!(ignoreAirBlocks && blockPermutation.type.id == "minecraft:air")) if (setBlocks.add({ x: x, y: y, z: z, block: blockPermutation })) return;
                    }
                }
            }
            if (selectPasted) {
                const pos1 = this.clipboard.blocks[0].blockLocation;
                this.pos1 = [location[0] + pos1.x, location[1] + pos1.y, location[2] + pos1.z];
                const pos2 = this.clipboard.blocks[this.clipboard.blocks.length - 1].blockLocation;
                this.pos2 = [location[0] + pos2.x, location[1] + pos2.y, location[2] + pos2.z];
            }
            if (onlySelect) {
                Commands.tell(player, `Selected clipboard paste region.`);
            }
            else {
                const count = setBlocks.set();
                Commands.tell(player, `The clipboard has been pasted at (${location[0]}, ${location[1]}, ${location[2]})`);
                Commands.tell(player, `${count} blocks affected`);
            }
        }
    }
    rotate(rotateY, rotateX, rotateZ) {
        if (rotateY == undefined) rotateY = 0;
        if (rotateX == undefined) rotateX = 0;
        if (rotateZ == undefined) rotateZ = 0;
        const player = this.player;
        if (Math.abs(rotateY % 90) > 0.001 || Math.abs(rotateX % 90) > 0.001 || Math.abs(rotateZ % 90) > 0.001) {
            Commands.tell(player, "§7Note: Interpolation is not yet supported, so angles that are multiples of 90 is recommended.");
        }
        if (this.clipboard == undefined) {
            Commands.error(player, `Your clipboard is empty. Use ${Commands.prefix}copy first.`);
        }
        else {
            for (const blocks of this.clipboard.blocks) {
                const blockLocation = blocks.blockLocation;
                const affineTransform = new AffineTransform();
                affineTransform.default();
                affineTransform.rotateY(-rotateY);
                affineTransform.rotateX(-rotateX);
                affineTransform.rotateZ(-rotateZ);
                const pos = affineTransform.apply(blockLocation);
                blockLocation.x = pos.x;
                blockLocation.y = pos.y;
                blockLocation.z = pos.z;
            }
            Commands.tell(player, "The clipboard copy has been rotated.");
        }
    }
    clearclipboard() {
        this.clipboard = undefined;
        Commands.tell(this.player, "Clipboard cleared.");
    }
}