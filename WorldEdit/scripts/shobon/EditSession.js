/*
 *  WorldEdit Addon
 *  Copyright © 2022 SShobon
 *  Repost or redistribution of the contents, text, images, etc. of this addon is strictly prohibited
 *  If you would like to share the WorldEdit Addon, be sure to share one of these pages:
 *  https://mcpedl.com/worldedit-addon-1/
 *  https://link-center.net/351352/worldedit-addon
 */
import { SetBlocks } from "./SetBlocks.js";

function lengthSq2(x, z) {
    return (x * x) + (z * z);
}
function lengthSq3(x, y, z) {
    return (x * x) + (y * y) + (z * z);
}

export class EditSession {
    static players = [];
    static get(player) {
        if (this.players.map(x => x.player == player).indexOf(true) == -1) {
            this.players.push(new EditSession(player));
        }
        return this.players[this.players.map(x => x.player == player).indexOf(true)];
    }
    static exists(player) {
        return this.players.map(x => x.player).includes(player);
    }
    constructor(player) {
        this.player = player;
        this.history = [];
        this.history_index = -1;
        this.history_size = 15;
    }
    size(size) {
        if (this.history_index >= size - 1) {
            this.history.splice(0, this.history_index + 1 - size);
            this.history_index = size - 1;
        }
        this.history_size = size;
    }
    add(block, undo, redo) {
        if (this.history_index >= this.history_size - 1) { this.history.shift(); this.history_index--; }
        this.history_index++;
        this.history.splice(this.history_index);
        this.history.push([]);
        this.history[this.history_index] = [block, undo, redo];
    }
    clear() {
        this.history = [];
        this.history_index = -1;
    }
    undo() {
        if (this.history[this.history_index] == undefined) return false;
        for (let i = 0; i < this.history[this.history_index][0].length; i++) {
            const block = this.history[this.history_index][0][i];
            const permutation = this.history[this.history_index][1][i];
            block.setPermutation(permutation);
        }
        this.history_index--;
        return true;
    }
    redo() {
        if (this.history[this.history_index + 1] == undefined) return false;
        this.history_index++;
        for (let i = 0; i < this.history[this.history_index][0].length; i++) {
            const block = this.history[this.history_index][0][i];
            const permutation = this.history[this.history_index][2][i];
            block.setPermutation(permutation);
        }
        return true;
    }
    static cylinder(sender, pos, block, radius, height, filled) {
        const setBlocks = new SetBlocks(sender);

        let radiusX;
        let radiusZ;
        if (radius.length == undefined) {
            radiusX = radius;
            radiusZ = radius;
        }
        else if (radius.length == 1) {
            radiusX = radius[0];
            radiusZ = radius[0];
        }
        else {
            radiusX = radius[0];
            radiusZ = radius[1];
        }
        let posY = 0;

        radiusX += 0.5;
        radiusZ += 0.5;

        if (height == 0) {
            return 0;
        } else if (height < 0) {
            posY = height
            height = -height;
        }

        let invRadiusX = 1 / radiusX;
        let invRadiusZ = 1 / radiusZ;

        let ceilRadiusX = Math.ceil(radiusX);
        let ceilRadiusZ = Math.ceil(radiusZ);

        pos.x -= 0.5;
        pos.y -= 0.5;
        pos.z -= 0.5;

        pos.x = Math.round(pos.x);
        pos.y = Math.round(pos.y);
        pos.z = Math.round(pos.z);

        let nextXn = 0;
        forX: for (let x = 0; x <= ceilRadiusX; ++x) {
            let xn = nextXn;
            nextXn = (x + 1) * invRadiusX;
            let nextZn = 0;
            forZ: for (let z = 0; z <= ceilRadiusZ; ++z) {
                let zn = nextZn;
                nextZn = (z + 1) * invRadiusZ;

                let distanceSq = lengthSq2(xn, zn);
                if (distanceSq > 1) {
                    if (z == 0) {
                        break forX;
                    }
                    break forZ;
                }

                if (!filled) {
                    if (lengthSq2(nextXn, zn) <= 1 && lengthSq2(xn, nextZn) <= 1) {
                        continue;
                    }
                }

                for (let y = 0; y < height; ++y) {
                    if (setBlocks.add({ x: pos.x + x, y: pos.y + y + posY, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y + y + posY, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x + x, y: pos.y + y + posY, z: pos.z - z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y + y + posY, z: pos.z - z, block: block() })) return;
                }
            }
        }
        return setBlocks.set();
    }
    static sphere(sender, pos, block, radius, filled) {
        const setBlocks = new SetBlocks(sender);

        let radiusX;
        let radiusY;
        let radiusZ;
        if (radius.length == undefined) {
            radiusX = radius;
            radiusY = radius;
            radiusZ = radius;
        }
        else if (radius.length == 1) {
            radiusX = radius[0];
            radiusY = radius[0];
            radiusZ = radius[0];
        }
        else {
            radiusX = radius[0];
            radiusY = radius[1];
            radiusZ = radius[2];
        }

        radiusX += 0.5;
        radiusY += 0.5;
        radiusZ += 0.5;

        let invRadiusX = 1 / radiusX;
        let invRadiusY = 1 / radiusY;
        let invRadiusZ = 1 / radiusZ;

        let ceilRadiusX = Math.ceil(radiusX);
        let ceilRadiusY = Math.ceil(radiusY);
        let ceilRadiusZ = Math.ceil(radiusZ);

        pos.x -= 0.5;
        pos.y -= 0.5;
        pos.z -= 0.5;

        pos.x = Math.round(pos.x);
        pos.y = Math.round(pos.y);
        pos.z = Math.round(pos.z);

        let nextXn = 0;
        forX: for (let x = 0; x <= ceilRadiusX; ++x) {
            let xn = nextXn;
            nextXn = (x + 1) * invRadiusX;
            let nextYn = 0;
            forY: for (let y = 0; y <= ceilRadiusY; ++y) {
                let yn = nextYn;
                nextYn = (y + 1) * invRadiusY;
                let nextZn = 0;
                forZ: for (let z = 0; z <= ceilRadiusZ; ++z) {
                    let zn = nextZn;
                    nextZn = (z + 1) * invRadiusZ;

                    let distanceSq = lengthSq3(xn, yn, zn);
                    if (distanceSq > 1) {
                        if (z == 0) {
                            if (y == 0) {
                                break forX;
                            }
                            break forY;
                        }
                        break forZ;
                    }

                    if (!filled) {
                        if (lengthSq3(nextXn, yn, zn) <= 1 && lengthSq3(xn, nextYn, zn) <= 1 && lengthSq3(xn, yn, nextZn) <= 1) {
                            continue;
                        }
                    }

                    if (setBlocks.add({ x: pos.x + x, y: pos.y + y, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y + y, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x + x, y: pos.y - y, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x + x, y: pos.y + y, z: pos.z - z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y - y, z: pos.z + z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x + x, y: pos.y - y, z: pos.z - z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y + y, z: pos.z - z, block: block() })) return;
                    if (setBlocks.add({ x: pos.x - x, y: pos.y - y, z: pos.z - z, block: block() })) return;
                }
            }
        }
        return setBlocks.set();
    }
    static pyramid(sender, pos, block, size, filled) {
        const setBlocks = new SetBlocks(sender);

        let height = size;

        for (let y = 0; y <= height; ++y) {
            size--;
            for (let x = 0; x <= size; ++x) {
                for (let z = 0; z <= size; ++z) {
                    if ((filled && z <= size && x <= size) || z == size || x == size) {
                        if (setBlocks.add({ x: pos.x + x, y: pos.y + y, z: pos.z + z, block: block() })) return;
                        if (setBlocks.add({ x: pos.x - x, y: pos.y + y, z: pos.z + z, block: block() })) return;
                        if (setBlocks.add({ x: pos.x + x, y: pos.y + y, z: pos.z - z, block: block() })) return;
                        if (setBlocks.add({ x: pos.x - x, y: pos.y + y, z: pos.z - z, block: block() })) return;
                    }
                }
            }
        }
        return setBlocks.set();
    }
}